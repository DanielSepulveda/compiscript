import { Types, Func, VarDims } from '../utils/types';

export const funcDir = {} as Record<string, Func>;

export const globalFunc: Func = {
  name: '',
  returnType: 'void',
  vars: {},
};
export let currentFunc: Func = globalFunc;

/**
 * Adds a new function
 * @param name
 * @param type
 * @param isGlobal
 */
export const addFunc = (
  name: string,
  type: Types,
  isGlobal: boolean = false
) => {
  if (funcDir[name]) {
    throw new Error(`Function ${name} already declared`);
  }

  if (isGlobal) {
    globalFunc.name = name;
    funcDir[name] = globalFunc;
    return;
  }

  const newFunc: Func = {
    name,
    returnType: type,
    vars: {},
  };

  funcDir[name] = newFunc;
  currentFunc = newFunc;
};

/**
 * Checks if a function name is already declared.
 * @param name
 * @returns Returns true if it finds a function
 */
export const checkIfFuncExists = (name: string) => {
  return funcDir[name] !== undefined;
};

/**
 * Checks if a var is already defined in the current scope
 * @param name
 * @returns
 */
export const checkIfVarIsDefined = (name: string) => {
  const currentVarTable = currentFunc.vars;
  return currentVarTable[name];
};

/**
 * Checks is a var exists in the local or global scope
 * @param name
 * @returns
 */
export const checkIfVarExists = (name: string) => {
  const isInScope = checkIfVarIsDefined(name);
  if (isInScope) return true;

  const globalVarTable = globalFunc.vars;
  const isGlobal = globalVarTable[name];
  return isGlobal;
};

/**
 * Adds a var to the current function var table
 * @param name
 * @param type
 * @param dims
 */
export const addVar = (name: string, type: string, dims?: VarDims) => {
  const currentVarTable = currentFunc.vars;

  currentVarTable[name] = {
    name,
    type,
    dims,
  };
};
