import { Stack } from 'mnemonist';
import {
  Types,
  Func,
  VarDims,
  Operators,
  Quadruple,
  VarTypes,
  OperationExpression,
  VarScope,
  FuncDir,
  PointerScope,
} from '../types';
import * as semanticCube from './semanticCube';
import Memory from './compilationMemory';
import { checkIfCanAssignType } from './assignTable';
import { OPERATORS, QUADRUPLE_OPERATIONS } from '../utils/constants';
import {
  jsonLog,
  jsonStringify,
  getVarScopeFromAddress,
  getVarTypeFromVarScope,
  safePop,
  isVariable,
} from '../utils/helpers';
import * as logger from './logger';
import { add } from 'lodash';

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

const funcDir: FuncDir = {};

const globalFunc: Func = {
  name: '',
  returnType: 'void',
  vars: {},
  params: [],
  size: generateFunctionSize(),
  isGlobal: true,
};
const globalMemory = new Memory();

let currentFunc: Func = globalFunc;
let currentMemory: Memory | null = globalMemory;

const constants: Record<string, number> = {};

const operatorStack = new Stack<Operators>();
const operandStack = new Stack<string>();
const typeStack = new Stack<VarTypes>();
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
    size: generateFunctionSize(),
    isGlobal: false,
  };

  funcDir[name] = newFunc;
  currentFunc = newFunc;
  currentMemory = new Memory();
  currentFunc.beginAddr = quadCount;

  if (type !== 'void') {
    let pointer: VarScope;
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
      hasValue: true,
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
    pointerInt: 0,
    pointerFloat: 0,
    pointerString: 0,
  };
}

/**
 * Adds a var to the current function var table
 * @param name
 * @param type
 * @param dims
 */
export function addVar(name: string, type: VarTypes, dims?: VarDims[]) {
  const currentVarTable = currentFunc.vars;

  if (!currentVarTable)
    throw new Error(`Internal error: ${currentFunc.name} var table is null`);

  let addr;
  let scope: VarScope;
  if (currentFunc.isGlobal) {
    if (type === 'int') {
      scope = 'globalInt';
    } else if (type === 'float') {
      scope = 'globalFloat';
    } else {
      scope = 'globalString';
    }
  } else {
    if (type === 'int') {
      scope = 'localInt';
    } else if (type === 'float') {
      scope = 'localFloat';
    } else {
      scope = 'localString';
    }
  }

  addr = currentMemory!.getNextAddressFor(scope);
  currentFunc.size[scope]++;
  if (dims) {
    let size = dims.reduce((prev, curr) => prev * (parseInt(curr.sup) + 1), 1);
    currentMemory!.sumCounterBy(scope, size - 1);
    currentFunc.size[scope] += size - 1;
  }

  currentVarTable[name] = {
    name,
    type,
    dims,
    addr,
    hasValue: false,
  };
}

export function addFunctionParam(name: string) {
  const currentVarTable = currentFunc.vars;

  if (!currentVarTable)
    throw new Error(`Internal error: ${currentFunc.name} var table is null`);

  const paramAddr = currentVarTable[name].addr;

  currentFunc.params.push(paramAddr);
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

function markVarWithValue(name: string) {
  const v = getVar(name);
  v.hasValue = true;
}

function checkIfVarHasValue(name: string) {
  const v = getVar(name);
  return v.hasValue;
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

export function declareConstant(name: string, type: VarTypes) {
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

  return constantAddr;
}

export function pushLiteralOperand(name: string, type: VarTypes) {
  const constantAddr = declareConstant(name, type);

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

export function addQuadruple(
  newQuad: Omit<Quadruple, 'count'>,
  extra?: { leftOp?: string; rightOp?: string; resOp?: string }
) {
  let newQuadruple: Quadruple = {
    ...newQuad,
    count: quadCount++,
  };

  if (process.env.TEST_COMPILER == 'true') {
    if (extra?.leftOp) {
      newQuadruple.left = extra.leftOp;
    }
    if (extra?.rightOp) {
      newQuadruple.right = extra.rightOp;
    }
    if (extra?.resOp) {
      newQuadruple.res = extra.resOp;
    }
  }

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

  // Mejor hacer en vm
  // if (isVariable(parseInt(rightAddr))) {
  //   const hasValue = checkIfVarHasValue(rightOperand);
  //   if (!hasValue) {
  //     throw new Error(
  //       `Error: variable ${rightOperand} was used before it was assigned a value.`
  //     );
  //   }
  // }

  const leftOperand = safePop(operandStack);
  const leftType = safePop(typeStack);
  const leftAddr = safePop(addrStack);

  // if (isVariable(parseInt(leftAddr))) {
  //   const hasValue = checkIfVarHasValue(leftOperand);
  //   if (!hasValue) {
  //     throw new Error(
  //       `Error: variable ${leftOperand} was used before it was assigned a value.`
  //     );
  //   }
  // }

  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  const newTemp = getNewTemp();
  let resAddr: string;

  if (resType === 'int') {
    resAddr = String(currentMemory!.getNextAddressFor('localIntTemporal'));
    currentFunc.size['localIntTemporal']++;
  } else if (resType === 'float') {
    resAddr = String(currentMemory!.getNextAddressFor('localFloatTemporal'));
    currentFunc.size['localFloatTemporal']++;
  } else {
    resAddr = String(currentMemory!.getNextAddressFor('localStringTemporal'));
    currentFunc.size['localStringTemporal']++;
  }

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS[operator],
      left: leftAddr,
      right: rightAddr,
      res: resAddr,
    },
    { leftOp: leftOperand, rightOp: rightOperand, resOp: newTemp }
  );

  operandStack.push(newTemp);
  addrStack.push(resAddr);
  typeStack.push(resType);
}

export function performAssign({ isReturn = false } = {}) {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  // if (isVariable(parseInt(valueAddr))) {
  //   const hasValue = checkIfVarHasValue(valueOperand);
  //   if (!hasValue) {
  //     throw new Error(
  //       `Error: variable ${valueOperand} was used before it was assigned a value.`
  //     );
  //   }
  // }

  const resOperand = safePop(operandStack);
  const resType = safePop(typeStack);
  const resAddr = safePop(addrStack);

  const canAssignType = checkIfCanAssignType({
    variable: resType,
    value: valueType,
  });

  if (!canAssignType) {
    throw new Error(
      `Can't assign variable '${resOperand}' of type ${resType} value of type ${valueType}`
    );
  }

  if (isVariable(parseInt(resAddr))) {
    markVarWithValue(resOperand);
  }

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['='],
      left: valueAddr,
      right: '-1',
      res: resAddr,
    },
    {
      leftOp: valueOperand,
      resOp: resOperand,
    }
  );

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

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['print'],
      left: '-1',
      right: '-1',
      res: valueAddr,
    },
    {
      resOp: valueOperand,
    }
  );
}

export function performPrintLn() {
  addQuadruple({
    op: QUADRUPLE_OPERATIONS['println'],
    left: '-1',
    right: '-1',
    res: '-1',
  });
}

export function performRead(name: string) {
  const v = getVar(name);
  markVarWithValue(name);

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['read'],
      left: '-1',
      right: '-1',
      res: String(v.addr),
    },
    {
      resOp: v.name,
    }
  );
}

export function validateConditionExpression() {
  const condType = typeStack.pop();

  if (!condType || condType !== 'int') {
    throw new Error(
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

  addQuadruple(
    {
      op: 'GOTOF',
      left: condAddr,
      right: '-1',
      res: '-1',
    },
    {
      leftOp: condRes,
    }
  );

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
      `Can't assign variable '${iteratorOperand}' of type ${iteratorType} value of type ${initialValueType}`
    );
  }

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['='],
      left: initialValueAddr,
      right: '-1',
      res: iteratorAddr,
    },
    {
      leftOp: initialValueOperand,
      resOp: iteratorOperand,
    }
  );

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
      `Can't assign variable '${iteratorVar.name}' of type ${iteratorVar.type} value of type ${expressionType}`
    );
  }

  const newTemp = getNewTemp();
  let newTempAddr = String(
    currentMemory!.getNextAddressFor('localIntTemporal')
  );

  currentFunc.size['localIntTemporal']++;

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['<='],
      left: String(iteratorVar.addr),
      right: expressionAddr,
      res: newTempAddr,
    },
    {
      leftOp: iteratorVar.name,
      rightOp: expressionOperand,
      resOp: newTemp,
    }
  );

  addQuadruple(
    {
      op: 'GOTOF',
      left: newTempAddr,
      right: '-1',
      res: '-1',
    },
    {
      leftOp: newTemp,
    }
  );

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

  addQuadruple({
    op: 'ERA',
    left: funcToCall.name,
    right: '-1',
    res: '-1',
  });

  if (funcToCall.params.length) {
    const argsStack = new Stack<[string, Types, string]>();

    while (operandStack.peek() !== 'callFunc') {
      const arg = safePop(operandStack);
      const argType = safePop(typeStack);
      const argAddr = safePop(addrStack);

      argsStack.push([arg, argType, argAddr]);
    }

    if (argsStack.size > funcToCall.params.length) {
      throw new Error(
        `Error: too many arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${operandStack.size}`
      );
    }

    if (argsStack.size < funcToCall.params.length) {
      throw new Error(
        `Error: missing arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${operandStack.size}`
      );
    }

    funcToCall.params.forEach((paramAddr, paramIndex) => {
      const [arg, argType, argAddr] = safePop(argsStack);
      const paramScope = getVarScopeFromAddress(paramAddr);

      if (paramScope === null) {
        throw new Error('Internal error: parameter has undefined paramScope');
      }

      const paramType = getVarTypeFromVarScope(paramScope);

      if (argType !== paramType) {
        throw new Error(
          `Error: param mismatch. '${funcToCall.name}' call sends an argument of type '${argType}' when it expects a '${paramType}' on parameter #${paramIndex}`
        );
      }

      addQuadruple(
        {
          op: 'PARAMETER',
          left: argAddr,
          right: '-1',
          res: String(paramAddr),
        },
        {
          leftOp: arg,
        }
      );
    });
  }

  if (operandStack.peek() === 'callFunc') {
    operandStack.pop();
  }

  addQuadruple({
    op: 'GOSUB',
    left: funcToCall.name,
    right: '-1',
    res: String(funcToCall.beginAddr),
  });

  if (funcToCall.returnType !== 'void') {
    const funcGlobalVar = getVar(funcToCall.name);

    const newTemp = getNewTemp();
    let pointer: VarScope;
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

  if (globalFunc.vars === null) {
    throw new Error('Internal error: global func var table is null');
  }

  const returnOperand = globalFunc.vars[currentFunc.name].name;
  const returnAddr = globalFunc.vars[currentFunc.name].addr;

  addQuadruple(
    {
      op: 'RETURN',
      left: valueAddr,
      right: '-1',
      res: String(returnAddr),
    },
    {
      leftOp: valueOperand,
      resOp: returnOperand,
    }
  );
}

export function handleArrFirstDim(id: string) {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }
  const firstDim = varInfo.dims[0];

  addQuadruple(
    {
      op: 'VERIFY',
      left: valueAddr,
      right: firstDim.inf,
      res: firstDim.sup,
    },
    {
      leftOp: valueOperand,
    }
  );

  if (firstDim.m !== '0') {
    const newTemp = getNewTemp();
    const resAddr = String(
      currentMemory!.getNextAddressFor('localIntTemporal')
    );
    currentFunc.size['localIntTemporal']++;

    const constantAddr = declareConstant(firstDim.m, 'int');

    addQuadruple(
      {
        op: 'MULT',
        left: valueAddr,
        right: String(constantAddr),
        res: resAddr,
      },
      {
        leftOp: valueOperand,
        rightOp: firstDim.m,
        resOp: newTemp,
      }
    );

    operandStack.push(newTemp);
    addrStack.push(resAddr);
    typeStack.push('int');
  } else {
    operandStack.push(valueOperand);
    addrStack.push(valueAddr);
    typeStack.push('int');
  }
}

export function handleArrSecondDim(id: string) {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }
  const secondDim = varInfo.dims[1];

  addQuadruple(
    {
      op: 'VERIFY',
      left: valueAddr,
      right: secondDim.inf,
      res: secondDim.sup,
    },
    {
      leftOp: valueOperand,
    }
  );

  const offsetOperand = safePop(operandStack);
  const offsetType = safePop(typeStack);
  const offsetAddr = safePop(addrStack);

  const newTemp = getNewTemp();
  const resAddr = String(currentMemory!.getNextAddressFor('localIntTemporal'));
  currentFunc.size['localIntTemporal']++;

  addQuadruple(
    {
      op: 'SUM',
      left: offsetAddr,
      right: valueAddr,
      res: resAddr,
    },
    {
      leftOp: offsetOperand,
      rightOp: valueOperand,
      resOp: newTemp,
    }
  );

  operandStack.push(newTemp);
  addrStack.push(resAddr);
  typeStack.push('int');
}

export function handleSumArrDirBase(id: string) {
  const valueOperand = safePop(operandStack);
  const valueType = safePop(typeStack);
  const valueAddr = safePop(addrStack);

  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }

  let scope: PointerScope;
  if (varInfo.type === 'int') {
    scope = 'pointerInt';
  } else if (varInfo.type === 'float') {
    scope = 'pointerFloat';
  } else {
    scope = 'pointerString';
  }

  const constantAddr = declareConstant(String(varInfo.addr), 'int');

  const newTemp = getNewTemp();
  let resAddr = currentMemory!.getNextAddressFor(scope);
  currentFunc.size[scope]++;

  addQuadruple(
    {
      op: 'SUM',
      left: valueAddr,
      right: String(constantAddr),
      res: String(resAddr),
    },
    {
      leftOp: valueOperand,
      rightOp: varInfo.name,
      resOp: newTemp,
    }
  );

  operandStack.push(newTemp);
  addrStack.push(String(resAddr));
  typeStack.push(varInfo.type);
}

export function handleEndMain() {
  // globalFunc.vars = null;

  addQuadruple({
    op: 'END',
    left: '-1',
    right: '-1',
    res: '-1',
  });
}
