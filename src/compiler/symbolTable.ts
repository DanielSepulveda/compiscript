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
import { QUADRUPLE_OPERATIONS } from '../utils/constants';
import {
  getVarScopeFromAddress,
  getVarTypeFromVarScope,
  safePop,
  isVariable,
} from '../utils/helpers';

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

export class SymbolTable {
  funcDir: FuncDir;
  globalFunc: Func;
  currentFunc: Func;

  globalMemory: Memory;
  currentMemory: Memory | null;

  constants: Record<string, number>;

  operatorStack: Stack<Operators>;
  operandStack: Stack<string>;
  typeStack: Stack<VarTypes>;
  jumpsStack: Stack<number>;
  addrStack: Stack<string>;

  quadrupleArr: Quadruple[];

  tempCount: number;
  quadCount: number;

  constructor() {
    this.funcDir = {};
    this.globalFunc = {
      name: '',
      returnType: 'void',
      vars: {},
      params: [],
      size: generateFunctionSize(),
      isGlobal: true,
    };
    this.currentFunc = this.globalFunc;

    this.globalMemory = new Memory();
    this.currentMemory = this.globalMemory;

    this.constants = {};

    this.operatorStack = new Stack();
    this.operandStack = new Stack();
    this.typeStack = new Stack();
    this.jumpsStack = new Stack();
    this.addrStack = new Stack();

    this.quadrupleArr = [];

    this.tempCount = 0;
    this.quadCount = 0;
  }
}

let symbolTable: SymbolTable;

export function init() {
  symbolTable = new SymbolTable();
}

export function getSymbolTable() {
  return symbolTable;
}

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
  if (symbolTable.funcDir[name]) {
    throw new Error(`Function ${name} already declared`);
  }

  if (isGlobal) {
    symbolTable.globalFunc.name = name;
    symbolTable.funcDir[name] = symbolTable.globalFunc;

    addQuadruple({
      op: 'GOTO',
      left: '-1',
      right: '-1',
      res: '-1',
    });

    symbolTable.jumpsStack.push(symbolTable.quadCount - 1);
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

  symbolTable.funcDir[name] = newFunc;
  symbolTable.currentFunc = newFunc;
  symbolTable.currentMemory = new Memory();
  symbolTable.currentFunc.beginAddr = symbolTable.quadCount;

  if (type !== 'void') {
    let pointer: VarScope;
    if (type === 'int') {
      pointer = 'globalInt';
    } else if (type === 'float') {
      pointer = 'globalFloat';
    } else {
      pointer = 'globalString';
    }

    const addr = symbolTable.globalMemory.getNextAddressFor(pointer);
    symbolTable.globalFunc.size![pointer]++;

    symbolTable.globalFunc.vars![name] = {
      name,
      type,
      addr,
      hasValue: true,
    };
  }
}

export function handleFuncEnd() {
  symbolTable.currentFunc.vars = null;
  symbolTable.currentMemory = null;
  symbolTable.tempCount = 0;

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
  return symbolTable.funcDir[name] !== undefined;
}

/**
 * Checks if a var is already defined in the current scope
 * @param name
 * @returns
 */
export function checkIfVarIsDefined(name: string) {
  const currentVarTable = symbolTable.currentFunc.vars;

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

  const globalVarTable = symbolTable.globalFunc.vars;
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
  const currentVarTable = symbolTable.currentFunc.vars;

  if (!currentVarTable)
    throw new Error(
      `Internal error: ${symbolTable.currentFunc.name} var table is null`
    );

  let addr;
  let scope: VarScope;
  if (symbolTable.currentFunc.isGlobal) {
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

  addr = symbolTable.currentMemory!.getNextAddressFor(scope);
  symbolTable.currentFunc.size[scope]++;
  if (dims) {
    let size = dims.reduce((prev, curr) => prev * (parseInt(curr.sup) + 1), 1);
    symbolTable.currentMemory!.sumCounterBy(scope, size - 1);
    symbolTable.currentFunc.size[scope] += size - 1;
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
  const currentVarTable = symbolTable.currentFunc.vars;

  if (!currentVarTable)
    throw new Error(
      `Internal error: ${symbolTable.currentFunc.name} var table is null`
    );

  const paramAddr = currentVarTable[name].addr;

  symbolTable.currentFunc.params.push(paramAddr);
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
    return symbolTable.currentFunc.vars![name];
  }

  return symbolTable.globalFunc.vars![name];
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
  return `t${++symbolTable.tempCount}`;
}

/**
 * Adds an operator to the operator stack
 * @param op
 */
export function pushOperator(op: Operators) {
  symbolTable.operatorStack.push(op);
}

/**
 * Adds a var to the operands stack if it exists, otherwise throws an error.
 * @param name
 */
export function pushIdOperand(name: string) {
  const operand = getVar(name);

  symbolTable.operandStack.push(operand.name);
  symbolTable.addrStack.push(String(operand.addr));
  symbolTable.typeStack.push(operand.type);
}

export function declareConstant(name: string, type: VarTypes) {
  let constantAddr: number;

  const isConstantInMemory = symbolTable.constants[name] !== undefined;
  if (!isConstantInMemory) {
    if (type === 'int') {
      constantAddr = symbolTable.globalMemory.getNextAddressFor('constantInt');
    } else if (type === 'float') {
      constantAddr = symbolTable.globalMemory.getNextAddressFor(
        'constantFloat'
      );
    } else {
      constantAddr = symbolTable.globalMemory.getNextAddressFor(
        'constantString'
      );
    }
    symbolTable.constants[name] = constantAddr;
  } else {
    constantAddr = symbolTable.constants[name];
  }

  return constantAddr;
}

export function pushLiteralOperand(name: string, type: VarTypes) {
  const constantAddr = declareConstant(name, type);

  symbolTable.operandStack.push(name);
  symbolTable.addrStack.push(String(constantAddr));
  symbolTable.typeStack.push(type);
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
    count: symbolTable.quadCount++,
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

  symbolTable.quadrupleArr.push(newQuadruple);
}

/**
 * Performs an arithmetic operation and generates a new quadruple
 */
export function performOperation() {
  const operator = symbolTable.operatorStack.pop();

  if (operator === undefined) {
    throw new Error('Undefined operator');
  }

  const rightOperand = safePop(symbolTable.operandStack);
  const rightType = safePop(symbolTable.typeStack);
  const rightAddr = safePop(symbolTable.addrStack);

  const leftOperand = safePop(symbolTable.operandStack);
  const leftType = safePop(symbolTable.typeStack);
  const leftAddr = safePop(symbolTable.addrStack);

  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  const newTemp = getNewTemp();
  let resAddr: string;

  if (resType === 'int') {
    resAddr = String(
      symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
    );
    symbolTable.currentFunc.size['localIntTemporal']++;
  } else if (resType === 'float') {
    resAddr = String(
      symbolTable.currentMemory!.getNextAddressFor('localFloatTemporal')
    );
    symbolTable.currentFunc.size['localFloatTemporal']++;
  } else {
    resAddr = String(
      symbolTable.currentMemory!.getNextAddressFor('localStringTemporal')
    );
    symbolTable.currentFunc.size['localStringTemporal']++;
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

  symbolTable.operandStack.push(newTemp);
  symbolTable.addrStack.push(resAddr);
  symbolTable.typeStack.push(resType);
}

export function performAssign({ isReturn = false } = {}) {
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // if (isVariable(parseInt(valueAddr))) {
  //   const hasValue = checkIfVarHasValue(valueOperand);
  //   if (!hasValue) {
  //     throw new Error(
  //       `Error: variable ${valueOperand} was used before it was assigned a value.`
  //     );
  //   }
  // }

  const resOperand = safePop(symbolTable.operandStack);
  const resType = safePop(symbolTable.typeStack);
  const resAddr = safePop(symbolTable.addrStack);

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
    symbolTable.operandStack.push(resOperand);
    symbolTable.typeStack.push(resType);
    symbolTable.addrStack.push(resAddr);
  }
}

export function performPrint() {
  const valueOperand = safePop(symbolTable.operandStack);
  safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

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

export function performRead() {
  const operand = safePop(symbolTable.operandStack);
  const operandType = safePop(symbolTable.typeStack);
  const operandAddr = safePop(symbolTable.addrStack);

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS['read'],
      left: '-1',
      right: '-1',
      res: operandAddr,
    },
    {
      resOp: operand,
    }
  );
}

export function validateConditionExpression() {
  const condType = symbolTable.typeStack.pop();

  if (!condType || condType !== 'int') {
    throw new Error(
      `Invalid conditional expression type. Expected type 'int' but got '${condType}'`
    );
  }
}

export function fillQuadruple(quad: number, value: string) {
  const quadToFill = symbolTable.quadrupleArr[quad];
  quadToFill.res = value;
  symbolTable.quadrupleArr[quad] = quadToFill;
}

export function handleCondition() {
  validateConditionExpression();

  const condRes = safePop(symbolTable.operandStack);
  const condAddr = safePop(symbolTable.addrStack);

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

  symbolTable.jumpsStack.push(symbolTable.quadCount - 1);
}

export function handleIfElse() {
  const jumpFalse = safePop(symbolTable.jumpsStack);
  addQuadruple({
    op: 'GOTO',
    left: '-1',
    right: '-1',
    res: '-1',
  });
  symbolTable.jumpsStack.push(symbolTable.quadCount - 1);
  fillQuadruple(jumpFalse, String(symbolTable.quadCount));
}

export function handleIfEnd() {
  const end = safePop(symbolTable.jumpsStack);
  fillQuadruple(end, String(symbolTable.quadCount));
}

export function handleLoopStart() {
  symbolTable.jumpsStack.push(symbolTable.quadCount);
}

export function handleLoopEnd() {
  const jumpFalse = safePop(symbolTable.jumpsStack);
  const jumpBegin = safePop(symbolTable.jumpsStack);

  addQuadruple({
    op: 'GOTO',
    left: '-1',
    right: '-1',
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(symbolTable.quadCount));
}

export function handleForAssign() {
  const initialValueOperand = safePop(symbolTable.operandStack);
  const initialValueType = safePop(symbolTable.typeStack);
  const initialValueAddr = safePop(symbolTable.addrStack);

  if (initialValueType !== 'int') {
    throw new Error(
      `For statement expects an assigment of type 'int' but got type ${initialValueType}`
    );
  }

  const iteratorOperand = safePop(symbolTable.operandStack);
  const iteratorType = safePop(symbolTable.typeStack);
  const iteratorAddr = safePop(symbolTable.addrStack);

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

  symbolTable.jumpsStack.push(symbolTable.quadCount);

  return iteratorOperand;
}

export function handleForCompare(iteratorVarName: string) {
  const expressionOperand = safePop(symbolTable.operandStack);
  const expressionType = safePop(symbolTable.typeStack);
  const expressionAddr = safePop(symbolTable.addrStack);

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
    symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
  );

  symbolTable.currentFunc.size['localIntTemporal']++;

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

  symbolTable.jumpsStack.push(symbolTable.quadCount - 1);
}

export function handleForEnd() {
  const jumpFalse = safePop(symbolTable.jumpsStack);
  const jumpBegin = safePop(symbolTable.jumpsStack);

  addQuadruple({
    op: 'GOTO',
    left: '-1',
    right: '-1',
    res: String(jumpBegin),
  });

  fillQuadruple(jumpFalse, String(symbolTable.quadCount));
}

export function handleBeginMain() {
  const jumpMain = safePop(symbolTable.jumpsStack);
  symbolTable.currentFunc = symbolTable.globalFunc;
  symbolTable.currentMemory = symbolTable.globalMemory;

  fillQuadruple(jumpMain, String(symbolTable.quadCount));
}

export function handleCheckFuncCall(funcName: string) {
  if (symbolTable.funcDir[funcName] === undefined) {
    throw new Error(
      `Error: function call on an undefined function '${funcName}'`
    );
  }

  symbolTable.operandStack.push('callFunc');
}

export function handleFuncCall(funcName: string) {
  const funcToCall = symbolTable.funcDir[funcName];

  addQuadruple({
    op: 'ERA',
    left: funcToCall.name,
    right: '-1',
    res: '-1',
  });

  if (funcToCall.params.length) {
    const argsStack = new Stack<[string, Types, string]>();

    while (symbolTable.operandStack.peek() !== 'callFunc') {
      const arg = safePop(symbolTable.operandStack);
      const argType = safePop(symbolTable.typeStack);
      const argAddr = safePop(symbolTable.addrStack);

      argsStack.push([arg, argType, argAddr]);
    }

    if (argsStack.size > funcToCall.params.length) {
      throw new Error(
        `Error: too many arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${symbolTable.operandStack.size}`
      );
    }

    if (argsStack.size < funcToCall.params.length) {
      throw new Error(
        `Error: missing arguments passed to function '${funcToCall.name}' call. Expected ${funcToCall.params.length} but received ${symbolTable.operandStack.size}`
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

  if (symbolTable.operandStack.peek() === 'callFunc') {
    symbolTable.operandStack.pop();
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

    const resAddr = String(
      symbolTable.currentMemory!.getNextAddressFor(pointer)
    );
    symbolTable.currentFunc.size![pointer]++;

    symbolTable.operandStack.push(newTemp);
    symbolTable.addrStack.push(resAddr);
    symbolTable.typeStack.push(funcGlobalVar.type);

    symbolTable.operandStack.push(funcGlobalVar.name);
    symbolTable.addrStack.push(String(funcGlobalVar.addr));
    symbolTable.typeStack.push(funcGlobalVar.type);

    performAssign({ isReturn: true });
  }
}

export function handleFuncReturn() {
  if (symbolTable.currentFunc.isGlobal) {
    throw new Error(`Error: cannot return from the main function`);
  }

  if (symbolTable.currentFunc.returnType === 'void') {
    throw new Error(
      `Error: cannot return from function '${symbolTable.currentFunc.name}' because it is a void function`
    );
  }

  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  if (valueType !== symbolTable.currentFunc.returnType) {
    throw new Error(
      `Error: return type mismatch. Function '${symbolTable.currentFunc.name}' expects to return a value of type ${symbolTable.currentFunc.returnType} but tried to return a value of type '${valueType}'`
    );
  }

  if (symbolTable.globalFunc.vars === null) {
    throw new Error('Internal error: global func var table is null');
  }

  const returnOperand =
    symbolTable.globalFunc.vars[symbolTable.currentFunc.name].name;
  const returnAddr =
    symbolTable.globalFunc.vars[symbolTable.currentFunc.name].addr;

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
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

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
      symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
    );
    symbolTable.currentFunc.size['localIntTemporal']++;

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

    symbolTable.operandStack.push(newTemp);
    symbolTable.addrStack.push(resAddr);
    symbolTable.typeStack.push('int');
  } else {
    symbolTable.operandStack.push(valueOperand);
    symbolTable.addrStack.push(valueAddr);
    symbolTable.typeStack.push('int');
  }
}

export function handleArrSecondDim(id: string) {
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

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

  const offsetOperand = safePop(symbolTable.operandStack);
  const offsetType = safePop(symbolTable.typeStack);
  const offsetAddr = safePop(symbolTable.addrStack);

  const newTemp = getNewTemp();
  const resAddr = String(
    symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
  );
  symbolTable.currentFunc.size['localIntTemporal']++;

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

  symbolTable.operandStack.push(newTemp);
  symbolTable.addrStack.push(resAddr);
  symbolTable.typeStack.push('int');
}

export function handleSumArrDirBase(id: string) {
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

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
  let resAddr = symbolTable.currentMemory!.getNextAddressFor(scope);
  symbolTable.currentFunc.size[scope]++;

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

  symbolTable.operandStack.push(newTemp);
  symbolTable.addrStack.push(String(resAddr));
  symbolTable.typeStack.push(varInfo.type);
}

export function handleEndMain() {
  symbolTable.globalFunc.vars = null;

  addQuadruple({
    op: 'END',
    left: '-1',
    right: '-1',
    res: '-1',
  });
}
