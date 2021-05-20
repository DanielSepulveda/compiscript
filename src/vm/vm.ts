import * as fs from 'fs';
import * as path from 'path';
import { Stack } from 'mnemonist';
import { findKey, invert, isEmpty, isUndefined, noop } from 'lodash';
import VmMemory, { MemoryMap, MemoryValue } from './vmMemory';
import {
  safeJsonParse,
  isValidCompilationData,
  getVarScopeFromAddress,
  isConstantScope,
  getVarTypeFromVarScope,
  getScopeFromVarScope,
  isNumber,
} from '../utils/helpers';
import {
  CompilationOutput,
  FuncDir,
  Quadruple,
  ExecutionStatus,
  CallFrame,
  VarTypes,
} from '../utils/types';

/* -------------------------------------------------------------------------- */
/*                                  INTERNAL                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- DATA ---------------------------------- */

const objFilePath = path.join(__dirname, '..', 'out', 'obj.txt');

let compilationData: CompilationOutput;
let funcDir: FuncDir;
let quadruples: Quadruple[];

let instructionPointer = 0;
const callStack = new Stack<CallFrame>();
let currentFrame: CallFrame;

/* --------------------------------- MEMORY --------------------------------- */

const globalMemory = new VmMemory('global');
const constantMemory = new VmMemory('constant');

/* ---------------------------------- FLAGS --------------------------------- */

let executionStatus: ExecutionStatus = 'idle';

/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- INIT ---------------------------------- */

function loadCompilationData() {
  const rawDataAsString = fs.readFileSync(objFilePath, 'utf8');
  const parsedResult = safeJsonParse(isValidCompilationData)(rawDataAsString);

  if (parsedResult.hasError) {
    throw new Error('Internal error: Error loading compilation output file');
  }

  compilationData = parsedResult.parsed;
  funcDir = compilationData.funcDir;
  quadruples = compilationData.quadruples;
}

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

function initCallStack() {
  const globalFuncKey = findKey(funcDir, (o) => o.isGlobal);

  if (globalFuncKey === undefined) {
    throw new Error(
      'Internal error: No global function found in compilation output'
    );
  }

  const globalFunc = funcDir[globalFuncKey];

  const countVars = {
    int: globalFunc.size.localIntTemporal,
    float: globalFunc.size.localFloatTemporal,
    string: globalFunc.size.localStringTemporal,
  };

  const temporalMemory = new VmMemory('temporal', countVars);

  const initialFrame: CallFrame = {
    func: globalFunc,
    localMemory: globalMemory,
    temporalMemory,
  };

  currentFrame = initialFrame;
}

export function init() {
  loadCompilationData();
  initGlobalMemory();
  initConstantsMemory();
  initCallStack();
}

/* -------------------------------- EXECUTION ------------------------------- */

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

  if (scope === 'global') {
    return globalMemory;
  }
  if (scope === 'constant') {
    return constantMemory;
  }
  if (scope === 'local') {
    return currentFrame.localMemory;
  }
  return currentFrame.temporalMemory;
}

function getMemoryValue(addr: string) {
  const memory = getMemoryForAddr(addr);

  const val = memory.getValue(addr);
  if (val === null) {
    throw new Error(
      `Memory error: tried to perform an operation on an adress that has no value`
    );
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

  if (!isNumber(varType)) {
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

function executeQuad(quad: Quadruple) {
  const left = quad.left;
  const right = quad.right;
  const res = quad.res;

  let leftVal, rightVal, resVal;
  let leftType, rightType;
  let memory;
  let tempNextIP: number | null = null;

  switch (quad.op) {
    // EXPRESSIONS
    case 'MULT':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal * rightVal;
      currentFrame.temporalMemory.setValue(isValid(res), String(resVal));
      break;
    case 'DIV':
      [leftVal, leftType] = getAddrNumberValue(isValid(left));
      [rightVal, rightType] = getAddrNumberValue(isValid(right));
      if (leftType === 'float' || rightType === 'float') {
        resVal = leftVal / rightVal;
      } else {
        resVal = Math.floor(leftVal / rightVal);
      }
      currentFrame.temporalMemory.setValue(isValid(res), String(resVal));
      break;
    case 'SUM':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal + rightVal;
      currentFrame.temporalMemory.setValue(isValid(res), String(resVal));
      break;
    case 'SUB':
      [leftVal] = getAddrNumberValue(isValid(left));
      [rightVal] = getAddrNumberValue(isValid(right));
      resVal = leftVal - rightVal;
      currentFrame.temporalMemory.setValue(isValid(res), String(resVal));
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
      memory.setValue(res, String(leftVal));
      break;
    case 'PRINT':
      [resVal] = getAddrValueAndType(isValid(res));
      console.log(resVal);
      break;

    // JUMPS
    case 'GOTO':
      tempNextIP = parseInt(isValid(res));
      break;
    case 'GOTOF':
      [leftVal] = getAddrIntValue(isValid(left))
      leftVal = transformIntToBool(leftVal)
      if (!leftVal) {
        tempNextIP = parseInt(isValid(res));
      }
      break;
    case 'GOTOT':
      [leftVal] = getAddrIntValue(isValid(left))
      leftVal = transformIntToBool(leftVal)
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
  }

  if (tempNextIP !== null) {
    instructionPointer = tempNextIP;
  } else {
    instructionPointer++;
  }
}

export function execute() {
  executionStatus = 'executing';

  while (executionStatus === 'executing') {
    try {
      executeQuad(quadruples[instructionPointer]);
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

  console.log('Virtual machine terminated successfully');
}

/* --------------------------------- LOGGER --------------------------------- */

export function logData() {
  console.log(globalMemory.toJson());
  console.log(constantMemory.toJson());
}
