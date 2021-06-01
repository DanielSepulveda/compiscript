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

/**
 * Virtual Machine class used to keep track of internal values. A new
 * Virtual Machine object is created each time a program is going to
 * be executed.
 */
export default class VM {
  /* ---------------------------------- DATA ---------------------------------- */
  compilationData: CompilationOutput;
  funcDir: FuncDir;
  quadruples: Quadruple[];

  instructionPointer = 0;
  callStack = new Stack<CallFrame>();
  jumpsStack = new Stack<number>();

  currentFrame: CallFrame;
  tempNewFrame: CallFrame | null;

  /* --------------------------------- MEMORY --------------------------------- */
  globalMemory = new VmMemory('global');
  constantMemory = new VmMemory('constant');

  /* ---------------------------------- FLAGS --------------------------------- */
  executionStatus: ExecutionStatus = 'idle';

  constructor(compilationOutput: CompilationOutput) {
    this.compilationData = compilationOutput;
    this.funcDir = this.compilationData.funcDir;
    this.quadruples = this.compilationData.quadruples;

    this.initGlobalMemory();
    this.initConstantsMemory();
    this.initCallStack();
  }

  /* --------------------------- LOAD GLOBAL MEMORY --------------------------- */

  private initGlobalMemory() {
    const globalFuncKey = findKey(this.funcDir, (o) => o.isGlobal);

    if (globalFuncKey === undefined) {
      throw new Error(
        'Internal error: No global function found in compilation output'
      );
    }

    const globalFunc = this.funcDir[globalFuncKey];

    const countVars = {
      int: globalFunc.size.globalInt,
      float: globalFunc.size.globalFloat,
      string: globalFunc.size.globalString,
    };

    this.globalMemory.initMemory(countVars);
  }

  /* -------------------------- LOAD CONSTANTS MEMORY ------------------------- */

  private initConstantsMemory() {
    const constants = this.compilationData.constants;

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

    // Loop over the constants table and generate the memory
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

    this.constantMemory.initMemory(countVars);
    this.constantMemory.setMemory(values);
  }

  /* ----------------------------- INIT CALLSTACK ----------------------------- */

  private initCallStack() {
    const globalFuncKey = findKey(this.funcDir, (o) => o.isGlobal);

    if (globalFuncKey === undefined) {
      throw new Error(
        'Internal error: No global function found in compilation output'
      );
    }

    const globalFunc = this.funcDir[globalFuncKey];

    // Generate current temporal memory
    const countTemporals = {
      int: globalFunc.size.localIntTemporal,
      float: globalFunc.size.localFloatTemporal,
      string: globalFunc.size.localStringTemporal,
    };

    const temporalMemory = new VmMemory('temporal', countTemporals);

    // Generate current pointer memory
    const countPointers = {
      int: globalFunc.size.pointerInt,
      float: globalFunc.size.pointerFloat,
      string: globalFunc.size.pointerString,
    };

    const pointerMemory = new VmMemory('pointer', countPointers);

    // Assign first frame to the current frame
    const initialFrame: CallFrame = {
      func: globalFunc,
      localMemory: this.globalMemory,
      temporalMemory,
      pointerMemory,
    };

    this.currentFrame = initialFrame;
  }
}

let vm: VM;

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

export function init(compilationOutput: CompilationOutput) {
  vm = new VM(compilationOutput);
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

/**
 * This function checks each second for an input
 *
 * @returns `Promise<string>`
 */
const waitForInput = () => {
  return new Promise<string>((resolve) => {
    inputInterval = setInterval(() => {
      if (userInput !== null) {
        resolve(userInput);
      }
    }, 1000);
  });
};

/**
 * This function triggers an user input and returns
 * the value
 *
 * @returns `string`
 */
const extractInput = async () => {
  internalOnInput();
  const input = await waitForInput();
  clearInterval(inputInterval);
  userInput = null;
  return input;
};

/**
 * Function used to set the user input to an internal variable
 *
 * @param input `string`
 */
export function sendInput(input: string) {
  userInput = input;
}

/* ---------------------------------- UTILS --------------------------------- */

/**
 * Checks that a quadruple value is valid, that is, it is
 * not equal to '-1'.
 *
 * @param val `string`
 * @returns `string`
 */
function isValid(val: string) {
  if (val === '-1') {
    throw new Error(
      'Vm Error: tried to perform an operation on an undefined value'
    );
  }

  return val;
}

/**
 * Obtains an address variable scope by checking if it
 * falls inside any of the known memory ranges
 *
 * @param addr `string`
 * @returns `VarScope`
 */
function getAddrVarScope(addr: string) {
  const varScope = getVarScopeFromAddress(parseInt(addr));
  if (varScope === null) {
    throw new Error(
      `Memory error: address ${addr} doesn't fall in any known memory ranges`
    );
  }
  return varScope;
}

/**
 * Returns the corresponding memory object for a
 * given address value
 *
 * @param addr `string`
 * @returns `VmMemory`
 */
function getMemoryForAddr(addr: string) {
  const scope = getScopeFromVarScope(getAddrVarScope(addr));

  switch (scope) {
    case 'global':
      return vm.globalMemory;
    case 'local':
      return vm.currentFrame.localMemory;
    case 'temporal':
      return vm.currentFrame.temporalMemory;
    case 'constant':
      return vm.constantMemory;
    case 'pointer':
      return vm.currentFrame.pointerMemory;
    default:
      assertNever(scope);
      throw new Error('Execution error: unknown memory for address');
  }
}

/**
 * Returns the stored memory value for a given
 * address. If the address is a pointer, it looks
 * for the value in the memory that it is pointing
 * to.
 *
 * @param addr `string`
 * @returns `string`
 */
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

/**
 * Returns the variable type (int, float, string) for
 * a given address
 *
 * @param addr `string`
 * @returns `VarTypes`
 */
function getAddrVarType(addr: string) {
  return getVarTypeFromVarScope(getAddrVarScope(addr));
}

/**
 * Returns a tuple with the value and variable type for
 * a given address
 *
 * @param addr `string`
 * @returns `tuple [value, type]`
 */
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

/**
 * This function works the same as the `getAddrValueAndType` function,
 * except that it asserts that the value is a numebr (int, float)
 *
 * @param addr `string`
 * @returns `tuple [number, VarType]`
 */
function getAddrNumberValue(addr: string): [number, VarTypes] {
  const [val, varType] = getAddrValueAndType(addr);

  if (!isNumberType(varType)) {
    throw new Error('Error: value is not of type number (int | float)');
  }

  return [val as number, varType];
}

/**
 * This function works the same as the `getAddrValueAndType` function,
 * except that it asserts that the value is an int
 *
 * @param addr `string`
 * @returns `tuple [int, VarType]`
 */
function getAddrIntValue(addr: string): [number, VarTypes] {
  const [val, varType] = getAddrValueAndType(addr);

  if (varType !== 'int') {
    throw new Error('Error: value is not of type number (int | float)');
  }

  return [val as number, varType];
}

/**
 * This function transforms an internal boolean value to its
 * int representation (0 = false, !false = true)
 *
 * @param val `boolean`
 * @returns `1 | 0`
 */
function transformBoolToInt(val: boolean): '1' | '0' {
  return val ? '1' : '0';
}

/**
 * This function transform an integer representing a boolean value
 * to an internal boolean
 *
 * @param val `numner`
 * @returns `boolean`
 */
function transformIntToBool(val: number): boolean {
  return val !== 0;
}

/* ----------------------------- QUAD EXECUTION ----------------------------- */

/**
 * This function takes a quadruple and performs the specified
 * operation
 *
 * @param quad `Quadruple`
 */
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
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'GT':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal > rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'LTEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal <= rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'GTEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal >= rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'EQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal == rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'NEQ':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = transformBoolToInt(leftVal != rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'AND':
      [leftVal] = getAddrIntValue(isValid(left));
      [rightVal] = getAddrIntValue(isValid(right));
      leftVal = transformIntToBool(leftVal);
      rightVal = transformIntToBool(rightVal);
      resVal = transformBoolToInt(leftVal && rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
      break;
    case 'OR':
      [leftVal] = getAddrIntValue(isValid(left));
      [rightVal] = getAddrIntValue(isValid(right));
      leftVal = transformIntToBool(leftVal);
      rightVal = transformIntToBool(rightVal);
      resVal = transformBoolToInt(leftVal || rightVal);
      vm.currentFrame.temporalMemory.setValue(isValid(res), resVal);
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
      /*
        Here we call the user defined output function with the
        value that is going to be printed
      */
      internalOnOutput(String(resVal));
      break;
    case 'PRINTLN':
      internalOnOutput('\n');
      break;
    case 'READ':
      /*
        Here, we ask the user for input, then we assert the input
        type, and finally assigns the input to memory
      */
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
      /*
        Here we generate the new function memory
        and store it in a temporal frame
      */
      func = vm.funcDir[left];
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
      vm.tempNewFrame = {
        func,
        localMemory: newLocalMemory,
        temporalMemory: newTempMemory,
        pointerMemory: newPointerMemory,
      };
      break;
    case 'PARAMETER':
      [leftVal] = getAddrValueAndType(isValid(left));
      vm.tempNewFrame!.localMemory.setValue(res, String(leftVal));
      break;
    case 'GOSUB':
      /*
        Here we assert that the new function call does not exceeds the
        max call stack. If it doesn't we switch contexts.
      */
      if (vm.callStack.size + 1 > MAX_CALL_STACK) {
        throw new Error('Stack overflow error: too many function calls');
      }
      tempNextIP = parseInt(res);
      vm.jumpsStack.push(vm.instructionPointer + 1);
      vm.callStack.push(vm.currentFrame);
      vm.currentFrame = vm.tempNewFrame!;
      vm.tempNewFrame = null;
      break;
    case 'RETURN':
      /*
        Here we assign the return value to the
        function global variable (parche guadalupano)
      */
      [leftVal] = getAddrValueAndType(isValid(left));
      vm.globalMemory.setValue(res, String(leftVal));
      tempNextIP = safePop(vm.jumpsStack);
      vm.currentFrame = safePop(vm.callStack);
      break;
    case 'ENDFUNC':
      tempNextIP = safePop(vm.jumpsStack);
      vm.currentFrame = safePop(vm.callStack);
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
      vm.executionStatus = 'success';
      break;

    default:
      noop(quad.op);
      break;
  }

  if (tempNextIP !== null) {
    vm.instructionPointer = tempNextIP;
  } else {
    vm.instructionPointer++;
  }
}

type ExecuteParams = {
  onOutput: OnOutputFunc;
  onInput: OnInputFunc;
};

/**
 * This function handles the Virtual Machine execution. It receives 2
 * user defined functions: onOutput and onInput, and iterates all
 * compiled quadruples. If it encounters an error, it stops the execution
 * and throws an error message.
 *
 * @param param0 `{ onOutput, onInput }`
 * @returns
 */
export async function execute({ onOutput, onInput }: ExecuteParams) {
  internalOnOutput = onOutput;
  internalOnInput = onInput;

  vm.executionStatus = 'executing';

  while (vm.executionStatus === 'executing') {
    try {
      await executeQuad(vm.quadruples[vm.instructionPointer]);
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      vm.executionStatus = 'error';
    }
  }

  if (vm.executionStatus === 'error') {
    console.log('Virtual machine terminated with an error');
    return;
  }
}

/* --------------------------------- LOGGER --------------------------------- */

// export function logData() {
//   console.log(globalMemory.toJson());
//   console.log(constantMemory.toJson());
// }
