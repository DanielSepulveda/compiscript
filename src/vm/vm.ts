import * as fs from 'fs';
import * as path from 'path';
import { Stack } from 'mnemonist';
import { findKey, invert, isEmpty, noop } from 'lodash';
import VmMemory, { MemoryMap, MemoryValue } from './vmMemory';
import {
  safeJsonParse,
  isValidData,
  getVarScopeFromAddress,
  isConstantScope,
  isGlobalScope,
  isLocalScope,
  isTemporalScope,
  jsonLog,
} from '../utils/helpers';
import {
  CompilationOutput,
  FuncDir,
  Quadruple,
  ExecutionStatus,
  CallFrame,
  VarScope,
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
  const parsedResult = safeJsonParse(isValidData)(rawDataAsString);

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

function getMemoryFromScope(scope: VarScope) {
  if (isGlobalScope(scope)) {
    return globalMemory;
  }
  if (isConstantScope(scope)) {
    return constantMemory;
  }
  if (isLocalScope(scope)) {
    return currentFrame.localMemory;
  }
  return currentFrame.temporalMemory;
}

function getMemoryValue(addr: string) {
  const varScope = getVarScopeFromAddress(parseInt(addr, 10));
  if (varScope === null) {
    throw new Error(
      `Memory error: address ${addr} doesn't fall in any known memory ranges`
    );
  }

  const memory = getMemoryFromScope(varScope);
  return memory.getValue(addr);
}

function getAddressValue(addr: string) {
  const val = getMemoryValue(addr);

  if (val === null) {
    throw new Error(
      `Memory error: tried to perform an operation on an adress that has no value`
    );
  }

  return val;
}

function checkAddr(addr: string | undefined) {
  if (addr === undefined) {
    throw new Error('Memory error: tried to access undefined memory address');
  }

  return addr;
}

function executeQuad(quad: Quadruple) {
  const left = quad.leftAddr;
  const right = quad.rightAddr;
  const res = quad.resAddr;

  let leftVal, rightVal, resVal;

  let tempNextIP: number | null = null;

  switch (quad.op) {
    // EXPRESSIONS
    case 'MULT':
      leftVal = parseInt(getAddressValue(checkAddr(left)), 10);
      rightVal = parseInt(getAddressValue(checkAddr(right)), 10);
      resVal = leftVal * rightVal;
      currentFrame.temporalMemory.setValue(checkAddr(res), String(resVal));
      break;

    // STATEMENTS
    case 'PRINT':
      console.log(getAddressValue(checkAddr(res)));
      break;

    // JUMPS
    case 'GOTO':
      tempNextIP = parseInt(checkAddr(res), 10);
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
