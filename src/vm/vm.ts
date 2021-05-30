import { Stack } from 'mnemonist';
import { findKey, invert, isEmpty, noop } from 'lodash';
import VmMemory, { MemoryMap } from './vmMemory';
import {
  getVarScopeFromAddress,
  isConstantScope,
  getVarTypeFromVarScope,
  getScopeFromVarScope,
  isNumberType,
  safePop,
  assertNever,
  isPointerScope,
  assertInputType,
} from '../utils/helpers';
import { MAX_CALL_STACK } from '../utils/constants';
import {
  CompilationOutput,
  FuncDir,
  Quadruple,
  ExecutionStatus,
  CallFrame,
  VarTypes,
} from '../types';

/* -------------------------------------------------------------------------- */
/*                                  INTERNAL                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- DATA ---------------------------------- */

let compilationData: CompilationOutput;
let funcDir: FuncDir;
let quadruples: Quadruple[];

let instructionPointer = 0;
const callStack = new Stack<CallFrame>();
const jumpsStack = new Stack<number>();
let currentFrame: CallFrame;
let tempNewFrame: CallFrame | null;

/* --------------------------------- MEMORY --------------------------------- */

let globalMemory = new VmMemory('global');
let constantMemory = new VmMemory('constant');

/* ---------------------------------- FLAGS --------------------------------- */

let executionStatus: ExecutionStatus = 'idle';

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

/* ------------------------- LOAD COMPILATION OUTPUT ------------------------ */

function loadCompilationData(data: CompilationOutput) {
  compilationData = data;
  funcDir = compilationData.funcDir;
  quadruples = compilationData.quadruples;
}

/* --------------------------- LOAD GLOBAL MEMORY --------------------------- */

function initGlobalMemory() {
  const globalFuncKey = findKey(funcDir, (o) => o.isGlobal);

  if (globalFuncKey === undefined) {
    throw new Error(
      'Internal error: No global function found in compilation output'
    );
  }

  const globalFunc = funcDir[globalFuncKey];

  const countVars = {
    int: globalFunc.size.globalInt,
    float: globalFunc.size.globalFloat,
    string: globalFunc.size.globalString,
  };

  globalMemory.initMemory(countVars);
}

/* -------------------------- LOAD CONSTANTS MEMORY ------------------------- */

function initConstantsMemory() {
  const constants = compilationData.constants;

  if (isEmpty(constants)) {
    // No reason to load constants memory
    return;
  }

  const countVars = {
    int: 0,
    float: 0,
    string: 0,
  };
  let values: MemoryMap = invert(constants);

  Object.entries(constants).forEach(([value, addr]) => {
    const scope = getVarScopeFromAddress(addr);
    if (scope === null) {
      throw new Error(
        'Internal error: constant var has undefined address range'
      );
    }
    if (!isConstantScope(scope)) {
      throw new Error(
        'Internal error: constant var has address not in constant scope'
      );
    }

    if (scope === 'constantInt') countVars['int']++;
    else if (scope === 'constantFloat') countVars['float']++;
    else countVars['string']++;
  });

  constantMemory.initMemory(countVars);
  constantMemory.setMemory(values);
}

/* ----------------------------- INIT CALLSTACK ----------------------------- */

function initCallStack() {
  const globalFuncKey = findKey(funcDir, (o) => o.isGlobal);

  if (globalFuncKey === undefined) {
    throw new Error(
      'Internal error: No global function found in compilation output'
    );
  }

  const globalFunc = funcDir[globalFuncKey];

  const countTemporals = {
    int: globalFunc.size.localIntTemporal,
    float: globalFunc.size.localFloatTemporal,
    string: globalFunc.size.localStringTemporal,
  };

  const temporalMemory = new VmMemory('temporal', countTemporals);

  const countPointers = {
    int: globalFunc.size.pointerInt,
    float: globalFunc.size.pointerFloat,
    string: globalFunc.size.pointerString,
  };

  const pointerMemory = new VmMemory('pointer', countPointers);

  const initialFrame: CallFrame = {
    func: globalFunc,
    localMemory: globalMemory,
    temporalMemory,
    pointerMemory,
  };

  currentFrame = initialFrame;
}

export function init(compilationOutput: CompilationOutput) {
  loadCompilationData(compilationOutput);
  initGlobalMemory();
  initConstantsMemory();
  initCallStack();
}

/* -------------------------------------------------------------------------- */
/*                                  EXECUTION                                 */
/* -------------------------------------------------------------------------- */

/* ----------------------------- OUTPUT HANDLING ---------------------------- */

type OnOutputFunc = (message: string) => void;
let internalOnOutput: OnOutputFunc;

/* ----------------------------- INPUT HANDLING ----------------------------- */

type OnInputFunc = () => void;
let internalOnInput: OnInputFunc;
let userInput: string | null = null;
let inputInterval: NodeJS.Timeout;

const waitForInput = () => {
  return new Promise<string>((resolve) => {
    inputInterval = setInterval(() => {
      if (userInput !== null) {
        resolve(userInput);
      }
    }, 1000);
  });
};

const extractInput = async () => {
  internalOnInput();
  const input = await waitForInput();
  clearInterval(inputInterval);
  userInput = null;
  return input;
};

export function sendInput(input: string) {
  userInput = input;
}

/* ---------------------------------- UTILS --------------------------------- */

function isValid(val: string) {
  if (val === '-1') {
    throw new Error(
      'Vm Error: tried to perform an operation on an undefined value'
    );
  }

  return val;
}

function getAddrVarScope(addr: string) {
  const varScope = getVarScopeFromAddress(parseInt(addr));
  if (varScope === null) {
    throw new Error(
      `Memory error: address ${addr} doesn't fall in any known memory ranges`
    );
  }
  return varScope;
}

function getMemoryForAddr(addr: string) {
  const scope = getScopeFromVarScope(getAddrVarScope(addr));

  switch (scope) {
    case 'global':
      return globalMemory;
    case 'local':
      return currentFrame.localMemory;
    case 'temporal':
      return currentFrame.temporalMemory;
    case 'constant':
      return constantMemory;
    case 'pointer':
      return currentFrame.pointerMemory;
    default:
      assertNever(scope);
      throw new Error('Execution error: unknown memory for address');
  }
}

function getMemoryValue(addr: string) {
  let memory = getMemoryForAddr(addr);

  let val = memory.getValue(addr);
  if (val === null) {
    throw new Error(
      `Memory error: tried to perform an operation on an adress that has no value`
    );
  }

  const isAPointer = isPointerScope(getAddrVarScope(addr));

  if (isAPointer) {
    memory = getMemoryForAddr(val);
    val = memory.getValue(val);
    if (val === null) {
      throw new Error(
        `Memory error: tried to perform an operation on an adress that has no value`
      );
    }
  }

  return val;
}

function getAddrVarType(addr: string) {
  return getVarTypeFromVarScope(getAddrVarScope(addr));
}

function getAddrValueAndType(addr: string): [string | number, VarTypes] {
  const varType = getAddrVarType(addr);
  const memValue = getMemoryValue(addr);

  let val;

  if (varType === 'int') {
    val = parseInt(memValue);
  } else if (varType === 'float') {
    val = parseFloat(memValue);
  } else {
    val = memValue;
  }

  return [val, varType];
}

function getAddrNumberValue(addr: string): [number, VarTypes] {
  const [val, varType] = getAddrValueAndType(addr);

  if (!isNumberType(varType)) {
    throw new Error('Error: value is not of type number (int | float)');
  }

  return [val as number, varType];
}

function getAddrIntValue(addr: string): [number, VarTypes] {
  const [val, varType] = getAddrValueAndType(addr);

  if (varType !== 'int') {
    throw new Error('Error: value is not of type number (int | float)');
  }

  return [val as number, varType];
}

function transformBoolToInt(val: boolean): '1' | '-1' {
  return val ? '1' : '-1';
}

function transformIntToBool(val: number): boolean {
  return val === 1;
}

/* ----------------------------- QUAD EXECUTION ----------------------------- */

async function executeQuad(quad: Quadruple) {
  const left = quad.left;
  const right = quad.right;
  const res = quad.res;

  let leftVal, rightVal, resVal;
  let leftType, rightType, resType;
  let memory;
  let func;
  let input;
  let tempNextIP: number | null = null;

  switch (quad.op) {
    // EXPRESSIONS
    case 'MULT':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal * rightVal;
      memory = getMemoryForAddr(isValid(res));
      memory.setValue(isValid(res), String(resVal));
      break;
    case 'DIV':
      [leftVal, leftType] = getAddrNumberValue(isValid(left));
      [rightVal, rightType] = getAddrNumberValue(isValid(right));
      if (leftType === 'float' || rightType === 'float') {
        resVal = leftVal / rightVal;
      } else {
        resVal = Math.floor(leftVal / rightVal);
      }
      memory = getMemoryForAddr(isValid(res));
      memory.setValue(isValid(res), String(resVal));
      break;
    case 'SUM':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal + rightVal;
      memory = getMemoryForAddr(isValid(res));
      memory.setValue(isValid(res), String(resVal));
      break;
    case 'SUB':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal - rightVal;
      memory = getMemoryForAddr(isValid(res));
      memory.setValue(isValid(res), String(resVal));
      break;
    case 'LT':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal < rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'GT':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal > rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'LTEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal <= rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'GTEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal >= rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'EQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal == rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'NEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal != rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'AND':
      [leftVal] = getAddrIntValue(isValid(left));
      [rightVal] = getAddrIntValue(isValid(right));
      leftVal = transformIntToBool(leftVal);
      rightVal = transformIntToBool(rightVal);
      resVal = transformBoolToInt(leftVal && rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'OR':
      [leftVal] = getAddrIntValue(isValid(left));
      [rightVal] = getAddrIntValue(isValid(right));
      leftVal = transformIntToBool(leftVal);
      rightVal = transformIntToBool(rightVal);
      resVal = transformBoolToInt(leftVal || rightVal);
      currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;

    // STATEMENTS
    case 'ASSIGN':
      [leftVal] = getAddrValueAndType(isValid(left));
      memory = getMemoryForAddr(isValid(res));
      if (isPointerScope(getAddrVarScope(res))) {
        resVal = memory.getValue(res);
        if (resVal === null) {
          throw new Error('Execution erorr: array pointer address is null');
        }
        memory = getMemoryForAddr(isValid(resVal));
        memory.setValue(resVal, String(leftVal));
      } else {
        memory.setValue(res, String(leftVal));
      }
      break;
    case 'PRINT':
      [resVal] = getAddrValueAndType(isValid(res));
      internalOnOutput(String(resVal));
      break;
    case 'PRINTLN':
      internalOnOutput('\n');
      break;
    case 'READ':
      resType = getAddrVarType(res);
      resVal = res;
      input = await extractInput();
      const isInputValid = assertInputType(input, resType);
      if (!isInputValid) {
        throw new Error(
          `Execution error: provided input does not match variable type`
        );
      }
      memory = getMemoryForAddr(isValid(res));
      if (isPointerScope(getAddrVarScope(res))) {
        resVal = memory.getValue(res);
        if (resVal === null) {
          throw new Error('Execution erorr: array pointer address is null');
        }
        memory = getMemoryForAddr(isValid(resVal));
        memory.setValue(resVal, input);
      } else {
        memory.setValue(res, input);
      }
      break;

    // ARRAYS
    case 'VERIFY':
      [leftVal] = getAddrIntValue(isValid(left));
      rightVal = parseInt(isValid(right)); // lower bound
      resVal = parseInt(isValid(res)); // upper bound
      if (leftVal < rightVal || leftVal > resVal) {
        throw new Error(`Error: array index out of bounds`);
      }
      break;

    // FUNCTIONS
    case 'ERA':
      func = funcDir[left];
      let newLocalMemory = new VmMemory('local', {
        int: func.size.localInt,
        float: func.size.localFloat,
        string: func.size.localString,
      });
      let newTempMemory = new VmMemory('temporal', {
        int: func.size.localIntTemporal,
        float: func.size.localFloatTemporal,
        string: func.size.localStringTemporal,
      });
      let newPointerMemory = new VmMemory('pointer', {
        int: func.size.pointerInt,
        float: func.size.pointerFloat,
        string: func.size.pointerString,
      });
      tempNewFrame = {
        func,
        localMemory: newLocalMemory,
        temporalMemory: newTempMemory,
        pointerMemory: newPointerMemory,
      };
      break;
    case 'PARAMETER':
      [leftVal] = getAddrValueAndType(isValid(left));
      tempNewFrame!.localMemory.setValue(res, String(leftVal));
      break;
    case 'GOSUB':
      if (callStack.size + 1 > MAX_CALL_STACK) {
        throw new Error('Stack overflow error: too many function calls');
      }
      tempNextIP = parseInt(res);
      jumpsStack.push(instructionPointer + 1);
      callStack.push(currentFrame);
      currentFrame = tempNewFrame!;
      tempNewFrame = null;
      break;
    case 'RETURN':
      [leftVal] = getAddrValueAndType(isValid(left));
      globalMemory.setValue(res, String(leftVal));
      tempNextIP = safePop(jumpsStack);
      currentFrame = safePop(callStack);
      break;
    case 'ENDFUNC':
      tempNextIP = safePop(jumpsStack);
      currentFrame = safePop(callStack);
      break;

    // JUMPS
    case 'GOTO':
      tempNextIP = parseInt(isValid(res));
      break;
    case 'GOTOF':
      [leftVal] = getAddrIntValue(isValid(left));
      leftVal = transformIntToBool(leftVal);
      if (!leftVal) {
        tempNextIP = parseInt(isValid(res));
      }
      break;
    case 'GOTOT':
      [leftVal] = getAddrIntValue(isValid(left));
      leftVal = transformIntToBool(leftVal);
      if (leftVal) {
        tempNextIP = parseInt(isValid(res));
      }
      break;

    // END
    case 'END':
      executionStatus = 'success';
      break;

    default:
      noop();
      break;
  }

  if (tempNextIP !== null) {
    instructionPointer = tempNextIP;
  } else {
    instructionPointer++;
  }
}

type ExecuteParams = {
  onOutput: OnOutputFunc;
  onInput: OnInputFunc;
};

export async function execute({ onOutput, onInput }: ExecuteParams) {
  internalOnOutput = onOutput;
  internalOnInput = onInput;

  executionStatus = 'executing';

  while (executionStatus === 'executing') {
    try {
      await executeQuad(quadruples[instructionPointer]);
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      executionStatus = 'error';
    }
  }

  if (executionStatus === 'error') {
    console.log('Virtual machine terminated with an error');
    return;
  }

  cleanup();
}

/* --------------------------------- CLEANUP -------------------------------- */

function cleanup() {
  instructionPointer = 0;
  callStack.clear();
  jumpsStack.clear();

  globalMemory = new VmMemory('global');
  constantMemory = new VmMemory('constant');

  executionStatus = 'idle';
}

/* --------------------------------- LOGGER --------------------------------- */

// export function logData() {
//   console.log(globalMemory.toJson());
//   console.log(constantMemory.toJson());
// }
