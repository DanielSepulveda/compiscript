import { Stack } from 'mnemonist';
import {
  Types,
  Func,
  VarDims,
  Operators,
  Quadruple,
  VarTypes,
  OperationExpression,
  MemoryPointers,
} from '../utils/types';
import * as semanticCube from './semanticCube';
import { Memory } from './memory';
import { OPERATORS, QUADRUPLE_OPERATIONS } from '../utils/constants';
import { jsonLog, jsonStringify } from '../utils/helpers';
import * as logger from './logger';

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

const funcDir = {} as Record<string, Func>;

const globalFunc: Func = {
  name: '',
  returnType: 'void',
  vars: {},
  params: [],
  isGlobal: true,
};
const globalMemory = new Memory();

let currentFunc: Func = globalFunc;
let currentMemory: Memory | null = globalMemory;

const constants: Record<string, number> = {};

const operatorStack = new Stack<Operators>();
const operandStack = new Stack<string>();
const typeStack = new Stack<Types>();
const jumpsStack = new Stack<number>();
const addrStack = new Stack<string>();

const stacks = {
  operatorStack,
  operandStack,
  typeStack,
  jumpsStack,
  addrStack,
};

const quadrupleArr: Quadruple[] = [];

let tempCount = 0;
let quadCount = 0;

export const internal = {
  funcDir,
  globalFunc,
  constants,
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
    addQuadruple({
      op: 'GOTO',
      left: '-1',
      right: '-1',
      res: '-1',
    });
    jumpsStack.push(quadCount - 1);
    return;
  }

  const newFunc: Func = {
    name,
    returnType: type,
    vars: {},
    params: [],
    isGlobal: false,
  };

  funcDir[name] = newFunc;
  currentFunc = newFunc;
  currentMemory = new Memory();
  currentFunc.beginAddr = quadCount;

  if (type !== 'void') {
    let pointer: MemoryPointers;
    if (type === 'int') {
      pointer = 'globalInt';
    } else if (type === 'float') {
      pointer = 'globalFloat';
    } else {
      pointer = 'globalString';
    }

    const addr = globalMemory.getNextAddressFor(pointer);
    globalFunc.size![pointer]++;

    globalFunc.vars![name] = {
      name,
      type,
      addr,
    };
  }
}

export function handleFuncEnd() {
  currentFunc.vars = null;
  currentMemory = null;
  tempCount = 0;

  addQuadruple({
    op: 'ENDFUNC',
    left: '-1',
    right: '-1',
    res: '-1',
  });
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

  if (currentVarTable && currentVarTable[name] !== undefined) return true;

  return false;
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
  if (globalVarTable && globalVarTable[name] !== undefined) return true;

  return false;
}

function generateFunctionSize(): Func['size'] {
  return {
    globalInt: 0,
    globalFloat: 0,
    globalString: 0,
    localInt: 0,
    localIntTemporal: 0,
    localFloat: 0,
    localFloatTemporal: 0,
    localString: 0,
    localStringTemporal: 0,
  };
}

/**
 * Adds a var to the current function var table
 * @param name
 * @param type
 * @param dims
 */
export function addVar(name: string, type: VarTypes, dims?: VarDims) {
  const currentVarTable = currentFunc.vars;

  if (!currentVarTable)
    throw new Error(`Internal error: ${currentFunc.name} var table is null`);

  let addr;
  let pointer: MemoryPointers;
  if (currentFunc.isGlobal) {
    if (type === 'int') {
      pointer = 'globalInt';
    } else if (type === 'float') {
      pointer = 'globalFloat';
    } else {
      pointer = 'globalString';
    }
  } else {
    if (type === 'int') {
      pointer = 'localInt';
    } else if (type === 'float') {
      pointer = 'localFloat';
    } else {
      pointer = 'localString';
    }
  }

  if (currentFunc.size === undefined) {
    currentFunc.size = generateFunctionSize();
  }

  addr = currentMemory!.getNextAddressFor(pointer);
  currentFunc.size![pointer]++;

  currentVarTable[name] = {
    name,
    type,
    dims,
    addr,
  };
}

export function addFunctionParam(type: VarTypes) {
  currentFunc.params.push(type);
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

  // Here we are sure that the vars table exists because of the previous
  // check

  if (isInLocalScope) {
    return currentFunc.vars![name];
  }

  return globalFunc.vars![name];
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
  addrStack.push(String(operand.addr));
  typeStack.push(operand.type);
}

export function pushLiteralOperand(name: string, type: VarTypes) {
  // Register operand in constants memory
  let constantAddr: number;
  const isConstantInMemory = constants[name] !== undefined;
  if (!isConstantInMemory) {
    if (type === 'int') {
      constantAddr = globalMemory.getNextAddressFor('constantInt');
    } else if (type === 'float') {
      constantAddr = globalMemory.getNextAddressFor('constantFloat');
    } else {
      constantAddr = globalMemory.getNextAddressFor('constantString');
    }
    constants[name] = constantAddr;
  } else {
    constantAddr = constants[name];
  }

  operandStack.push(name);
  addrStack.push(String(constantAddr));
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
  const rightAddr = safePop(addrStack);

  const leftOperand = safePop(operandStack);
  const leftType = safePop(typeStack);
  const leftAddr = safePop(addrStack);

  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  const newTemp = getNewTemp();
  let resAddr: string;
  if (resType === 'int') {
    resAddr = String(currentMemory!.getNextAddressFor('localIntTemporal'));
  } else if (resType === 'float') {
    resAddr = String(currentMemory!.getNextAddressFor('localFloatTemporal'));
  } else {
    resAddr = String(currentMemory!.getNextAddressFor('localStringTemporal'));
  }

  if (currentFunc.size === undefined) {
    currentFunc.size = generateFunctionSize();
  }

  if (resType === 'int') currentFunc.size!['localIntTemporal']++;
  else if (resType === 'float') currentFunc.size!['localFloatTemporal']++;
  else currentFunc.size!['localStringTemporal']++;

  addQuadruple({
    op: QUADRUPLE_OPERATIONS[operator],
    left: leftOperand,
    leftAddr,
    right: rightOperand,
    rightAddr,
    res: newTemp,
    resAddr,
  });

  operandStack.push(newTemp);
  addrStack.push(resAddr);
  typeStack.push(resType);
}

export function performAssign({ isReturn = false } = {}) {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  const resOperand = safePop(operandStack);
  const resType = safePop(typeStack);
  const resAddr = safePop(addrStack);

  if (valueType !== resType) {
    throw new Error(
      `Can't assign variable '${resOperand}' of type ${resType} value ${valueOperand} of type ${valueType}`
    );
  }

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['='],
    left: valueOperand,
    leftAddr: valueAddr,
    right: '-1',
    res: resOperand,
    resAddr,
  });

  if (isReturn) {
    operandStack.push(resOperand);
    typeStack.push(resType);
    addrStack.push(resAddr);
  }
}

export function performPrint() {
  const valueOperand = safePop(operandStack);
  safePop(typeStack);
  const valueAddr = safePop(addrStack);

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['print'],
    left: '-1',
    right: '-1',
    res: valueOperand,
    resAddr: valueAddr,
  });
}

export function performRead(name: string) {
  const v = getVar(name);

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['read'],
    left: '-1',
    right: '-1',
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
  const condAddr = safePop(addrStack);

  addQuadruple({
    op: 'GOTOF',
    left: condRes,
    leftAddr: condAddr,
    right: '-1',
    res: '-1',
  });

  jumpsStack.push(quadCount - 1);
}

export function handleIfElse() {
  const jumpFalse = safePop(jumpsStack);
  addQuadruple({
    op: 'GOTO',
    left: '-1',
    right: '-1',
    res: '-1',
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
    left: '-1',
    right: '-1',
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(quadCount));
}

export function handleForAssign() {
  const initialValueOperand = safePop(operandStack);
  const initialValueType = safePop(typeStack);
  const initialValueAddr = safePop(addrStack);

  if (initialValueType !== 'int') {
    throw new Error(
      `For statement expects an assigment of type 'int' but got type ${initialValueType}`
    );
  }

  const iteratorOperand = safePop(operandStack);
  const iteratorType = safePop(typeStack);
  const iteratorAddr = safePop(addrStack);

  if (initialValueType !== iteratorType) {
    throw new Error(
      `Can't assign variable '${iteratorOperand}' of type ${iteratorType} value ${initialValueOperand} of type ${initialValueType}`
    );
  }

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['='],
    left: initialValueOperand,
    leftAddr: initialValueAddr,
    right: '-1',
    res: iteratorOperand,
    resAddr: iteratorAddr,
  });

  jumpsStack.push(quadCount);

  return iteratorOperand;
}

export function handleForCompare(iteratorVarName: string) {
  const expressionOperand = safePop(operandStack);
  const expressionType = safePop(typeStack);
  const expressionAddr = safePop(addrStack);

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
  let newTempAddr = String(
    currentMemory!.getNextAddressFor('localIntTemporal')
  );

  if (currentFunc.size === undefined) {
    currentFunc.size = generateFunctionSize();
  }

  currentFunc.size!['localIntTemporal']++;

  addQuadruple({
    op: QUADRUPLE_OPERATIONS['<='],
    left: iteratorVar.name,
    leftAddr: String(iteratorVar.addr),
    right: expressionOperand,
    rightAddr: expressionAddr,
    res: newTemp,
    resAddr: newTempAddr,
  });

  addQuadruple({
    op: 'GOTOF',
    left: newTemp,
    leftAddr: newTempAddr,
    right: '-1',
    res: '-1',
  });

  jumpsStack.push(quadCount - 1);
}

export function handleForEnd() {
  const jumpFalse = safePop(jumpsStack);
  const jumpBegin = safePop(jumpsStack);

  addQuadruple({
    op: 'GOTO',
    left: '-1',
    right: '-1',
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(quadCount));
}

export function handleBeginMain() {
  const jumpMain = safePop(jumpsStack);
  currentFunc = globalFunc;
  currentMemory = globalMemory;

  fillQuadruple(jumpMain, String(quadCount));
}

export function handleFuncCall(funcName: string) {
  const funcToCall = funcDir[funcName];

  if (operandStack.size > funcToCall.params.length) {
    throw new Error(
      `Error: too many arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${operandStack.size}`
    );
  }

  if (operandStack.size < funcToCall.params.length) {
    throw new Error(
      `Error: missing arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${operandStack.size}`
    );
  }

  addQuadruple({
    op: 'ERA',
    left: funcToCall.name,
    right: '-1',
    res: '-1',
  });

  const argsStack = new Stack<[string, Types, string]>();

  while (operandStack.size) {
    const arg = safePop(operandStack);
    const argType = safePop(typeStack);
    const argAddr = safePop(addrStack);

    argsStack.push([arg, argType, argAddr]);
  }

  funcToCall.params.forEach((paramType, paramIndex) => {
    const [arg, argType, argAddr] = safePop(argsStack);

    if (argType !== paramType) {
      throw new Error(
        `Error: param mismatch. '${funcToCall.name}' call sends an argument of type '${argType}' when it expects a '${paramType}' on parameter #${paramIndex}`
      );
    }

    addQuadruple({
      op: 'PARAMETER',
      left: arg,
      leftAddr: argAddr,
      right: '-1',
      res: String(paramIndex),
    });
  });

  addQuadruple({
    op: 'GOSUB',
    left: funcToCall.name,
    right: String(funcToCall.beginAddr),
    res: '-1',
  });

  if (funcToCall.returnType !== 'void') {
    const funcGlobalVar = getVar(funcToCall.name);

    const newTemp = getNewTemp();
    let pointer: MemoryPointers;
    if (funcGlobalVar.type === 'int') {
      pointer = 'localIntTemporal';
    } else if (funcGlobalVar.type === 'float') {
      pointer = 'localFloatTemporal';
    } else {
      pointer = 'localStringTemporal';
    }

    const resAddr = String(currentMemory!.getNextAddressFor(pointer));
    currentFunc.size![pointer]++;

    operandStack.push(newTemp);
    addrStack.push(resAddr);
    typeStack.push(funcGlobalVar.type);

    operandStack.push(funcGlobalVar.name);
    addrStack.push(String(funcGlobalVar.addr));
    typeStack.push(funcGlobalVar.type);

    performAssign({ isReturn: true });
  }
}

export function handleFuncReturn() {
  if (currentFunc.isGlobal) {
    throw new Error(`Error: cannot return from the main function`);
  }

  if (currentFunc.returnType === 'void') {
    throw new Error(
      `Error: cannot return from function '${currentFunc.name}' because it is a void function`
    );
  }

  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  if (valueType !== currentFunc.returnType) {
    throw new Error(
      `Error: return type mismatch. Function '${currentFunc.name}' expects to return a value of type ${currentFunc.returnType} but tried to return a value of type '${valueType}'`
    );
  }

  addQuadruple({
    op: 'RETURN',
    left: '-1',
    right: '-1',
    res: valueOperand,
    resAddr: valueAddr,
  });
}

export function handleEndMain() {
  addQuadruple({
    op: 'END',
    left: '-1',
    right: '-1',
    res: '-1',
  });
}
