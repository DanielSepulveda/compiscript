import { Stack } from 'mnemonist';
import {
  Types,
  Func,
  VarDims,
  Operators,
  Quadruple,
  VarTypes,
  OperationExpression,
} from '../utils/types';
import * as semanticCube from './semanticCube';
import { OPERATORS, QUADRUPLE_OPERATIONS } from '../utils/constants';
import { jsonLog, jsonStringify } from '../utils/helpers';

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

const funcDir = {} as Record<string, Func>;

const globalFunc: Func = {
  name: '',
  returnType: 'void',
  vars: {},
};
let currentFunc: Func = globalFunc;

const operatorStack = new Stack<Operators>();
const operandStack = new Stack<string>();
const typeStack = new Stack<Types>();

const stacks = {
  operatorStack,
  operandStack,
  typeStack,
};

const quadrupleArr: Quadruple[] = [];

let temp_count = 0;

export const internal = {
  funcDir,
  globalFunc,
  currentFunc,
  stacks,
  quadrupleArr,
  temp_count,
};

/* -------------------------------------------------------------------------- */
/*                                   Methods                                  */
/* -------------------------------------------------------------------------- */

/**
 * Adds a new function
 * @param name
 * @param type
 * @param isGlobal
 */
export function addFunc(name: string, type: Types, isGlobal: boolean = false) {
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
}

/**
 * Checks if a function name is already declared.
 * @param name
 * @returns Returns true if it finds a function
 */
export function checkIfFuncExists(name: string) {
  return funcDir[name] !== undefined;
}

/**
 * Checks if a var is already defined in the current scope
 * @param name
 * @returns
 */
export function checkIfVarIsDefined(name: string) {
  const currentVarTable = currentFunc.vars;
  return currentVarTable[name];
}

/**
 * Checks is a var exists in the local or global scope
 * @param name
 * @returns
 */
export function checkIfVarExists(name: string) {
  const isInScope = checkIfVarIsDefined(name);
  if (isInScope) return true;

  const globalVarTable = globalFunc.vars;
  const isGlobal = globalVarTable[name];
  return isGlobal;
}

/**
 * Adds a var to the current function var table
 * @param name
 * @param type
 * @param dims
 */
export function addVar(name: string, type: VarTypes, dims?: VarDims) {
  const currentVarTable = currentFunc.vars;

  currentVarTable[name] = {
    name,
    type,
    dims,
  };
}

/**
 * Returns a var either in local or global scope. If the var is not found
 * it throws.
 * @param name
 * @returns
 */
export function getVar(name: string) {
  const varExists = checkIfVarExists(name);
  if (!varExists) {
    throw new Error(`${name} is not defined`);
  }

  const isInLocalScope = checkIfVarIsDefined(name);
  if (isInLocalScope) {
    return currentFunc.vars[name];
  }

  return globalFunc.vars[name];
}

/**
 * Adds a var to the operands stack if it exists, otherwise throws an error.
 * @param name
 */
export function pushIdOperand(name: string) {
  const operand = getVar(name);

  operandStack.push(operand.name);
  typeStack.push(operand.type);
}

/**
 * Adds an operator to the operator stack
 * @param op
 */
export function pushOperator(op: Operators) {
  operatorStack.push(op);
}

/**
 * Returns the operation type from the semantic cube. It the result type
 * is `error` it throws.
 * @param exp
 * @returns
 */
export function getOperationResultType(exp: OperationExpression) {
  const res = semanticCube.getOperationResultType(exp);

  if (res === 'error') {
    throw new Error(
      `Invalid use of operator ${exp.op} (${
        QUADRUPLE_OPERATIONS[exp.op]
      }) for the given types '${exp.left.toUpperCase()}' and '${exp.right.toUpperCase()}'`
    );
  }

  return res;
}

/**
 * Performs an arithmetic operation and generates a new quadruple
 */
export function performOperation() {
  const operator = operatorStack.pop();

  if (operator === undefined) {
    throw new Error('Undefined operator');
  }

  const rightOperand = operandStack.pop();
  const rightType = typeStack.pop();

  if (rightOperand === undefined || rightType === undefined) {
    throw new Error(
      `Undefined right operand or type. Operand = ${rightOperand}, Type = ${rightType} `
    );
  }

  const leftOperand = operandStack.pop();
  const leftType = typeStack.pop();

  if (leftOperand === undefined || leftType === undefined) {
    throw new Error('Undefined right operand');
  }

  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  const newTemp = `t${++temp_count}`;

  const newQuadruple: Quadruple = {
    op: QUADRUPLE_OPERATIONS[operator],
    left: leftOperand,
    right: rightOperand,
    res: newTemp,
  };

  console.log(`${quadrupleArr.length + 1}: ${jsonStringify(newQuadruple)}`);

  quadrupleArr.push(newQuadruple);
  operandStack.push(newTemp);
  typeStack.push(resType);
}
