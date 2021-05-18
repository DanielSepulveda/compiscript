import * as fs from 'fs';
import * as path from 'path';
import { findKey, values, isEmpty } from 'lodash';
import VmMemory, { LoadInitialMemory, MemoryValue } from './vmMemory';
import {
  safeJsonParse,
  isValidData,
  getVarScopeFromAddress,
  isConstantScope,
} from '../utils/helpers';
import { CompilationOutput } from '../utils/types';

/* -------------------------------------------------------------------------- */
/*                                  INTERNAL                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- DATA ---------------------------------- */

const objFilePath = path.join(__dirname, '..', 'out', 'obj.txt');
let compilationData: CompilationOutput;

/* --------------------------------- MEMORY --------------------------------- */

const globalMemory = new VmMemory('global');
const constantMemory = new VmMemory('constant');

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
}

function initGlobalMemory() {
  const globalFuncKey = findKey(compilationData.funcDir, (o) => o.isGlobal);

  if (globalFuncKey === undefined) {
    throw new Error(
      'Internal error: No global function found in compilation output'
    );
  }

  const globalFunc = compilationData.funcDir[globalFuncKey];
  if (globalFunc.vars === null || isEmpty(globalFunc.vars)) {
    // No reason to load global memory
    return;
  }

  const globalVars = globalFunc.vars;
  const countVars = {
    int: 0,
    float: 0,
    string: 0,
  };

  values(globalVars).forEach((val) => {
    countVars[val.type]++;
  });

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
  const values: MemoryValue[] = [];

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

    values.push({ addr: String(addr), value });

    if (scope === 'constantInt') countVars['int']++;
    else if (scope === 'constantFloat') countVars['float']++;
    else countVars['string']++;
  });

  constantMemory.initMemory(countVars);
  constantMemory.setValues(values);
}

export function init() {
  loadCompilationData();
  initGlobalMemory();
  initConstantsMemory();
}

/* --------------------------------- LOGGER --------------------------------- */

export function logData() {
  console.log(globalMemory.toJson());
  console.log(constantMemory.toJson());
}
