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
const jumpsStack = new Stack<number>();

const stacks = {
  operatorStack,
  operandStack,
  typeStack,
  jumpsStack,
};

const quadrupleArr: Quadruple[] = [];

let tempCount = 0;
let quadCount = 0;

export const internal = {
  funcDir,
  globalFunc,
  currentFunc,
  stacks,
  quadrupleArr,
  tempCount,
  quadCount,
};

/* -------------------------------------------------------------------------- */
/*                                   Methods                                  */
/* -------------------------------------------------------------------------- */

export function safePop<T>(stack: Stack<T>) {
  const val = stack.pop();

  if (val === undefined) {
    throw new Error(
      `Internal error: Tried to perform 'pop' on a stack and got no value`
    );
  }

  return val;
}

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

export function getNewTemp() {
  return `t${++tempCount}`;
}

/**
 * Adds an operator to the operator stack
 * @param op
 */
export function pushOperator(op: Operators) {
  operatorStack.push(op);
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

export function pushLiteralOperand(name: string, type: Types) {
  operandStack.push(name);
  typeStack.push(type);
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

export function addQuadruple(newQuad: Omit<Quadruple, 'count'>) {
  const newQuadruple: Quadruple = {
    ...newQuad,
    count: quadCount++,
  };

  quadrupleArr.push(newQuadruple);
}

/**
 * Performs an arithmetic operation and generates a new quadruple
 */
export function performOperation() {
  const operator = operatorStack.pop();

  if (operator === undefined) {
    throw new Error('Undefined operator');
  }

  const rightOperand = safePop(operandStack);
  const rightType = safePop(typeStack);

  const leftOperand = safePop(operandStack);
  const leftType = safePop(typeStack);

  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  const newTemp = getNewTemp();

  addQuadruple({
    op: QUADRUPLE_OPERATIONS[operator],
    left: leftOperand,
    right: rightOperand,
    res: newTemp,
  });

  operandStack.push(newTemp);
  typeStack.push(resType);
}

export function performAssign() {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);

  const resOperand = safePop(operandStack);
  const resType = safePop(typeStack);

  if (valueType !== resType) {
    throw new Error(
      `Can't assign variable '${resOperand}' of type ${resType} value ${valueOperand} of type ${valueType}`
    );
  }

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['='],
    left: null,
    right: valueOperand,
    res: resOperand,
  });
}

export function performPrint() {
  const valueOperand = safePop(operandStack);

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['print'],
    left: null,
    right: null,
    res: valueOperand,
  });
}

export function performRead(name: string) {
  const v = getVar(name);

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['read'],
    left: null,
    right: null,
    res: v.name,
  });
}

export function validateConditionExpression() {
  const condType = typeStack.pop();

  if (!condType || condType !== 'int') {
    console.log(
      `Invalid conditional expression type. Expected type 'int' but got '${condType}'`
    );
  }
}

export function fillQuadruple(quad: number, value: string) {
  const quadToFill = quadrupleArr[quad];
  quadToFill.res = value;
  quadrupleArr[quad] = quadToFill;
}

export function handleCondition() {
  validateConditionExpression();

  const condRes = safePop(operandStack);

  addQuadruple({
    op: 'GOTOF',
    left: condRes,
    right: null,
    res: null,
  });

  jumpsStack.push(quadCount - 1);
}

export function handleIfElse() {
  const jumpFalse = safePop(jumpsStack);
  addQuadruple({
    op: 'GOTO',
    left: null,
    right: null,
    res: null,
  });
  jumpsStack.push(quadCount - 1);
  fillQuadruple(jumpFalse, String(quadCount));
}

export function handleIfEnd() {
  const end = safePop(jumpsStack);
  fillQuadruple(end, String(quadCount));
}

export function handleLoopStart() {
  jumpsStack.push(quadCount);
}

export function handleLoopEnd() {
  const jumpFalse = safePop(jumpsStack);
  const jumpBegin = safePop(jumpsStack);

  addQuadruple({
    op: 'GOTO',
    left: null,
    right: null,
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(quadCount));
}

export function handleForAssign() {
  const initialValueOperand = safePop(operandStack);
  const initialValueType = safePop(typeStack);

  if (initialValueType !== 'int') {
    throw new Error(
      `For statement expects an assigment of type 'int' but got type ${initialValueType}`
    );
  }

  const iteratorOperand = safePop(operandStack);
  const iteratorType = safePop(typeStack);

  if (initialValueType !== iteratorType) {
    throw new Error(
      `Can't assign variable '${iteratorOperand}' of type ${iteratorType} value ${initialValueOperand} of type ${initialValueType}`
    );
  }

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['='],
    left: null,
    right: initialValueOperand,
    res: iteratorOperand,
  });

  jumpsStack.push(quadCount);

  return iteratorOperand;
}

export function handleForCompare(iteratorVarName: string) {
  const expressionOperand = safePop(operandStack);
  const expressionType = safePop(typeStack);

  if (expressionType !== 'int') {
    throw new Error(
      `For statement expects an iterable of type 'int' but got type ${expressionType}`
    );
  }

  const iteratorVar = getVar(iteratorVarName);

  if (expressionType !== iteratorVar.type) {
    throw new Error(
      `Can't assign variable '${iteratorVar.name}' of type ${iteratorVar.type} value ${expressionOperand} of type ${expressionType}`
    );
  }

  const newTemp = getNewTemp();

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['<='],
    left: iteratorVar.name,
    right: expressionOperand,
    res: newTemp,
  });

  addQuadruple({
    op: 'GOTOF',
    left: newTemp,
    right: null,
    res: null,
  });

  jumpsStack.push(quadCount - 1);
}

export function handleForEnd() {
  const jumpFalse = safePop(jumpsStack);
  const jumpBegin = safePop(jumpsStack);

  addQuadruple({
    op: 'GOTO',
    left: null,
    right: null,
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(quadCount));
}
