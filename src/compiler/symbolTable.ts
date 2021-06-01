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
import Avail from './avail';
import { checkIfCanAssignType } from './assignTable';
import { QUADRUPLE_OPERATIONS } from '../utils/constants';
import {
  getVarScopeFromAddress,
  getVarTypeFromVarScope,
  safePop,
} from '../utils/helpers';

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

export class SymbolTable {
  funcDir: FuncDir;
  globalFunc: Func;
  currentFunc: Func;

  globalMemory: Avail;
  currentMemory: Avail | null;

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

    this.globalMemory = new Avail();
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
 * Adds a new function to the symbolTable. It also performs validations,
 * and if the function returns a value, it defines a global variable with
 * the same name.
 *
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
  symbolTable.currentMemory = new Avail();
  symbolTable.currentFunc.beginAddr = symbolTable.quadCount;

  // If function has return, define global variable (parche guadalupano)
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
    };
  }
}

/**
 * Perform cleanup when a function compilation
 * has finished and push quadruple.
 */
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
 *
 * @param name
 * @returns Returns true if it finds a function
 */
export function checkIfFuncExists(name: string) {
  return symbolTable.funcDir[name] !== undefined;
}

/**
 * Checks if a var is already defined in the current scope
 *
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
 *
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

/**
 * Generates a new function size map
 *
 * @returns `function size`
 */
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
 *
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

  // If var is an array, take into account its size
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
  };
}

/**
 * Adds the address of a function parameter to that function's
 * paramter list.
 *
 * @param name `string`
 */
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
 *
 * @param name
 * @returns
 */
export function getVar(name: string) {
  const varExists = checkIfVarExists(name);

  if (!varExists) {
    throw new Error(`${name} is not defined`);
  }

  // If the var exists it must be either in local
  // or global scope

  const isInLocalScope = checkIfVarIsDefined(name);

  if (isInLocalScope) {
    return symbolTable.currentFunc.vars![name];
  }

  return symbolTable.globalFunc.vars![name];
}

/**
 * Returns a new temporal operand
 *
 * @returns `string`
 */
export function getNewTemp() {
  return `t${++symbolTable.tempCount}`;
}

/**
 * Adds an operator to the operator stack
 *
 * @param op
 */
export function pushOperator(op: Operators) {
  symbolTable.operatorStack.push(op);
}

/**
 * Adds a var to the operands stack if it exists, otherwise throws an error.
 *
 * @param name
 */
export function pushIdOperand(name: string) {
  const operand = getVar(name);

  symbolTable.operandStack.push(operand.name);
  symbolTable.addrStack.push(String(operand.addr));
  symbolTable.typeStack.push(operand.type);
}

/**
 * Declares a value as a constant. If the value was already declared, it
 * skipts the declaration. Returns the constant assigned address.
 *
 * @param name `string`
 * @param type `VarTypes`
 * @returns `string`
 */
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

/**
 * Pushes a literal operand to the operands stack after declaring
 * it as a constant.
 *
 * @param name `string`
 * @param type `VarTypes`
 */
export function pushLiteralOperand(name: string, type: VarTypes) {
  const constantAddr = declareConstant(name, type);

  symbolTable.operandStack.push(name);
  symbolTable.addrStack.push(String(constantAddr));
  symbolTable.typeStack.push(type);
}

/**
 * Returns the operation type from the semantic cube. If the result type
 * is `error` it throws.
 *
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
 * Given the necessary information for a quadruple, this function
 * registers this new quadruple in the quadruples list. Optionally
 * it can receive extra information that can be displayed when
 * debugging the compiler.
 *
 * @param newQuad `Quadruple`
 * @param extra
 */
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

  // Obtain right operand information
  const rightOperand = safePop(symbolTable.operandStack);
  const rightType = safePop(symbolTable.typeStack);
  const rightAddr = safePop(symbolTable.addrStack);

  // Obtain left operand information
  const leftOperand = safePop(symbolTable.operandStack);
  const leftType = safePop(symbolTable.typeStack);
  const leftAddr = safePop(symbolTable.addrStack);

  // Obtain result type
  const resType = getOperationResultType({
    left: leftType,
    right: rightType,
    op: operator,
  });

  // Handle temporal result memory
  const newTemp = getNewTemp();

  let scope: VarScope;
  if (resType === 'int') {
    scope = 'localIntTemporal';
  } else if (resType === 'float') {
    scope = 'localFloatTemporal';
  } else {
    scope = 'localStringTemporal';
  }

  const resAddr = String(symbolTable.currentMemory!.getNextAddressFor(scope));
  symbolTable.currentFunc.size[scope]++;

  addQuadruple(
    {
      op: QUADRUPLE_OPERATIONS[operator],
      left: leftAddr,
      right: rightAddr,
      res: resAddr,
    },
    { leftOp: leftOperand, rightOp: rightOperand, resOp: newTemp }
  );

  /*
    Push result back into stacks, these is needed for operations
    such as an assign.
  */
  symbolTable.operandStack.push(newTemp);
  symbolTable.addrStack.push(resAddr);
  symbolTable.typeStack.push(resType);
}

/**
 * This function works the same as the `performOperation` function
 * but it asserts if a value can be assigned to a variable, and
 * also handles a special case for when a function returns a value
 *
 * @param param0 `{ isReturn: boolean }`
 */
export function performAssign({ isReturn = false } = {}) {
  // Obtain value operand information
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // Obtain result operand information
  const resOperand = safePop(symbolTable.operandStack);
  const resType = safePop(symbolTable.typeStack);
  const resAddr = safePop(symbolTable.addrStack);

  // Assert that value can be assigned
  const canAssignType = checkIfCanAssignType({
    variable: resType,
    value: valueType,
  });

  if (!canAssignType) {
    throw new Error(
      `Can't assign variable '${resOperand}' of type ${resType} value of type ${valueType}`
    );
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

  /*
    If the assignation is part of a function return (parche guadalupano)
    push the result back so that it can be used in other operations
    Ex: i = y + foo(x);
  */
  if (isReturn) {
    symbolTable.operandStack.push(resOperand);
    symbolTable.typeStack.push(resType);
    symbolTable.addrStack.push(resAddr);
  }
}

/**
 * Generates a quadruple that handles the printing
 * of an operand
 */
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

/**
 * Generates a quadruple for printing a new line
 */
export function performPrintLn() {
  addQuadruple({
    op: QUADRUPLE_OPERATIONS['println'],
    left: '-1',
    right: '-1',
    res: '-1',
  });
}

/**
 * Generates a quadruple for reading a value from user
 * input
 */
export function performRead() {
  const operand = safePop(symbolTable.operandStack);
  safePop(symbolTable.typeStack);
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

/**
 * Validates that a condition expression is of type
 * `int`. This is because we use integers instead of
 * booleans.
 */
export function validateConditionExpression() {
  const condType = symbolTable.typeStack.pop();

  if (!condType || condType !== 'int') {
    throw new Error(
      `Invalid conditional expression type. Expected type 'int' but got '${condType}'`
    );
  }
}

/**
 * Fills a quadruple with a value. Usefull for when we know
 * the result of a certain IP jump (GOTO, GOTOF, etc)
 *
 * @param quad `number`
 * @param value `string`
 */
export function fillQuadruple(quad: number, value: string) {
  const quadToFill = symbolTable.quadrupleArr[quad];
  quadToFill.res = value;
  symbolTable.quadrupleArr[quad] = quadToFill;
}

/**
 * This function validates a condition expression and generates
 * quadruple for jumping out of the condition if the epxression is
 * false
 */
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

/**
 * This function handles the `else` statement on `if`
 * statements by generating a GOTO quadruple and filling
 * the previous jump quadruple
 */
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

/**
 * This function handles the end of a `if`
 * statement by filling the previous jump
 */
export function handleIfEnd() {
  const end = safePop(symbolTable.jumpsStack);
  fillQuadruple(end, String(symbolTable.quadCount));
}

/**
 * This function pushes the current quadruple count to the
 * jump stack. This is usefull for when we want to jump back
 * to the start of a loop
 */
export function handleLoopStart() {
  symbolTable.jumpsStack.push(symbolTable.quadCount);
}

/**
 * This function handles jumping back to the beginning
 * of a loop condition and also fills the quadruple for
 * jumping if the condition fails
 */
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

/**
 * This function handles the assignation of a variable that will
 * work as an iterator for a `for` statement loop.
 * @returns `string`
 */
export function handleForAssign() {
  // Optain initial value operand information
  const initialValueOperand = safePop(symbolTable.operandStack);
  const initialValueType = safePop(symbolTable.typeStack);
  const initialValueAddr = safePop(symbolTable.addrStack);

  // Only `int` values can work as iterators
  if (initialValueType !== 'int') {
    throw new Error(
      `For statement expects an assigment of type 'int' but got type ${initialValueType}`
    );
  }

  // Obtain iterator operand information
  const iteratorOperand = safePop(symbolTable.operandStack);
  const iteratorType = safePop(symbolTable.typeStack);
  const iteratorAddr = safePop(symbolTable.addrStack);

  // Assert type
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

  // Push current quad count for jumping back
  symbolTable.jumpsStack.push(symbolTable.quadCount);

  return iteratorOperand;
}

/**
 * This function handles the condition expression for a `for` statement
 * loop
 *
 * @param iteratorVarName `string`
 */
export function handleForCompare(iteratorVarName: string) {
  // Obtain result expression information
  const expressionOperand = safePop(symbolTable.operandStack);
  const expressionType = safePop(symbolTable.typeStack);
  const expressionAddr = safePop(symbolTable.addrStack);

  // Assert type
  if (expressionType !== 'int') {
    throw new Error(
      `For statement expects an iterable of type 'int' but got type ${expressionType}`
    );
  }

  const iteratorVar = getVar(iteratorVarName);

  // Assert type assignation to iterator
  if (expressionType !== iteratorVar.type) {
    throw new Error(
      `Can't assign variable '${iteratorVar.name}' of type ${iteratorVar.type} value of type ${expressionType}`
    );
  }

  /*
    Generate a new operation that will work as the condition
    validation for the `for` statement loop
  */
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

  // Jump if the condition is false
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

/**
 * This function handles the end of a `for` statement loop.
 * It generates a GOTO to the beginning of the loop and fills
 * the previous jump for the GOTOF jump
 */
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

/**
 * This function handles jumping to the `main`
 * function by filling the first jump quadruple
 */
export function handleBeginMain() {
  const jumpMain = safePop(symbolTable.jumpsStack);
  symbolTable.currentFunc = symbolTable.globalFunc;
  symbolTable.currentMemory = symbolTable.globalMemory;

  fillQuadruple(jumpMain, String(symbolTable.quadCount));
}

/**
 * Asserts that a function call can be performed by checking
 * if the function exists. Also pushes a 'fake bottom' to the
 * operands stack so that the function call arguments can be
 * correctly handled.
 *
 * @param funcName `string`
 */
export function handleCheckFuncCall(funcName: string) {
  if (symbolTable.funcDir[funcName] === undefined) {
    throw new Error(
      `Error: function call on an undefined function '${funcName}'`
    );
  }

  symbolTable.operandStack.push('callFunc');
}

/**
 * Handles the necessary operations for a function call.
 * This involves generating the functions memory,
 * validating and assigning parameters, performing the
 * function call, and finally if the function has a return, it
 * assigns the return value to a new temporal.
 *
 * @param funcName `string`
 */
export function handleFuncCall(funcName: string) {
  const funcToCall = symbolTable.funcDir[funcName];

  addQuadruple({
    op: 'ERA',
    left: funcToCall.name,
    right: '-1',
    res: '-1',
  });

  if (funcToCall.params.length) {
    // Utility stack for storing the arguments information
    const argsStack = new Stack<[string, Types, string]>();

    // Obtain arguments
    while (symbolTable.operandStack.peek() !== 'callFunc') {
      const arg = safePop(symbolTable.operandStack);
      const argType = safePop(symbolTable.typeStack);
      const argAddr = safePop(symbolTable.addrStack);

      argsStack.push([arg, argType, argAddr]);
    }

    // Validate correct number of arguments and parameters
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

    // Assign each argument to its corresponding parameter
    funcToCall.params.forEach((paramAddr, paramIndex) => {
      const [arg, argType, argAddr] = safePop(argsStack);
      const paramScope = getVarScopeFromAddress(paramAddr);

      if (paramScope === null) {
        throw new Error('Internal error: parameter has undefined paramScope');
      }

      const paramType = getVarTypeFromVarScope(paramScope);

      // Assert type
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

  /*
    If function returns a value, it assigns that return (which is going to
    be stored in a global variable) to a new temporal. (parche guadalupano)
  */
  if (funcToCall.returnType !== 'void') {
    const funcGlobalVar = getVar(funcToCall.name);

    // New temporal
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

    // Return value is stored in global variable
    symbolTable.operandStack.push(funcGlobalVar.name);
    symbolTable.addrStack.push(String(funcGlobalVar.addr));
    symbolTable.typeStack.push(funcGlobalVar.type);

    performAssign({ isReturn: true });
  }
}

/**
 * This function handles the return statement of a function by asserting
 * that the function can return, and that its return type is correct, and
 * at the end generates the corresponding quadruple.
 */
export function handleFuncReturn() {
  // Main function can't return
  if (symbolTable.currentFunc.isGlobal) {
    throw new Error(`Error: cannot return from the main function`);
  }

  // Void functions can't return
  if (symbolTable.currentFunc.returnType === 'void') {
    throw new Error(
      `Error: cannot return from function '${symbolTable.currentFunc.name}' because it is a void function`
    );
  }

  // Obtain return operand information
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // Assert return type
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

/**
 * This function performs the necessary operations for indexing an array
 * by its first dimension.
 *
 * @param id `string`
 */
export function handleArrFirstDim(id: string) {
  // Obtain index operand information
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // Assert index type
  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }
  const firstDim = varInfo.dims[0];

  // Verify bounds
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

  /*
    If the array has 2 dimensions, it multiples the first dimension by the
    array 'm' value.
  */
  if (firstDim.m !== '0') {
    const newTemp = getNewTemp();
    const resAddr = String(
      symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
    );
    symbolTable.currentFunc.size['localIntTemporal']++;

    const constantAddr = declareConstant(firstDim.m, 'int');

    // s1 * m1
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

/**
 * This function performs the necessary operations for indexing an array
 * by its second dimension.
 *
 * @param id `string`
 */
export function handleArrSecondDim(id: string) {
  // Obtain index operand information
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // Assert index type
  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }
  const secondDim = varInfo.dims[1];

  // Verify bounds
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
  safePop(symbolTable.typeStack);
  const offsetAddr = safePop(symbolTable.addrStack);

  const newTemp = getNewTemp();
  const resAddr = String(
    symbolTable.currentMemory!.getNextAddressFor('localIntTemporal')
  );
  symbolTable.currentFunc.size['localIntTemporal']++;

  // s2 + (s1 * m1)
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

/**
 * This function handles adding the array base direction to the
 * previously calculated index value, this will result in a new
 * pointer temporal.
 *
 * @param id `string`
 */
export function handleSumArrDirBase(id: string) {
  // Obtain index operand information
  const valueOperand = safePop(symbolTable.operandStack);
  const valueType = safePop(symbolTable.typeStack);
  const valueAddr = safePop(symbolTable.addrStack);

  // Assert type
  if (valueType !== 'int') {
    throw new Error(`Error: arrays must be indexed using only 'int' values`);
  }

  const varInfo = getVar(id);
  if (!varInfo.dims?.length) {
    throw new Error(`Error: tried to index a variable that is not an array`);
  }

  // Declare new pointer temporal
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

/**
 * Handle end of program
 */
export function handleEndMain() {
  symbolTable.globalFunc.vars = null;

  addQuadruple({
    op: 'END',
    left: '-1',
    right: '-1',
    res: '-1',
  });
}
