import grammar from '../grammar';
import * as symbolTable from './symbolTable';
import { Var, VarTypes, VarDims } from '../types';
import { OPERATORS } from '../utils/constants';

/**
 * Create a new semantic operation to be applied to a
 * successfully parsed program. Each method defined here
 * corresponds to a gramatic rule, and inside each method
 * there are functions which correspond to neuralgical points.
 */

const s = grammar.createSemantics().addOperation('applySemantics', {
  string(_1, str, _3) {
    return { value: str.sourceString, type: 'string' };
  },
  integer_nonZero(_1, _2) {
    return { value: this.sourceString, type: 'int' };
  },
  integer_zero(_1) {
    return { value: this.sourceString, type: 'int' };
  },
  float_completeFloat(_1, _2, _3) {
    return { value: this.sourceString, type: 'float' };
  },
  float_decimalFloat(_1, _2) {
    return { value: this.sourceString, type: 'float' };
  },
  signedNumber(sign, number) {
    const s = sign.sourceString;
    const n = number.applySemantics() as { value: string; type: VarTypes };

    return { value: `${s}${n.value}`, type: n.type };
  },
  identifier(_) {
    return this.sourceString;
  },
  _terminal() {
    return this.primitiveValue;
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Expressions                                */
  /* -------------------------------------------------------------------------- */

  ArrayExpression(identifier, _1, exp1, _2, _3, exp2, _4) {
    const name = identifier.applySemantics();

    exp1.applySemantics();
    symbolTable.handleArrFirstDim(name);

    if (exp2.sourceString !== '') {
      exp2.applySemantics();
      symbolTable.handleArrSecondDim(name);
    }

    symbolTable.handleSumArrDirBase(name);

    return;
  },
  CallExpression(identifier, _1, args, _2) {
    const id = identifier.applySemantics();

    symbolTable.handleCheckFuncCall(id);

    args.asIteration().applySemantics();

    symbolTable.handleFuncCall(id);

    return;
  },

  /* --------------------------- Primary expression --------------------------- */
  PrimaryExpression_arrExp(arrExp) {
    arrExp.applySemantics();
    return;
  },
  PrimaryExpression_callExp(callExpression) {
    callExpression.applySemantics();
    return;
  },
  PrimaryExpression_id(identifier) {
    const id = identifier.applySemantics();
    symbolTable.pushIdOperand(id);
    return;
  },
  PrimaryExpression_literal(literal) {
    const l = literal.applySemantics() as { value: string; type: VarTypes };

    symbolTable.pushLiteralOperand(l.value, l.type);

    return;
  },
  PrimaryExpression_parenExp(_1, exp, _2) {
    exp.applySemantics();
    return;
  },

  /* ----------------------------- Mult expression ---------------------------- */

  MultExpression(primaryExpression) {
    primaryExpression.applySemantics();
    return;
  },
  MultExpression_mult(multExpression, _, primaryExpression) {
    multExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.MULT);

    primaryExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  MultExpression_div(multExpression, _, primaryExpression) {
    multExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.DIV);

    primaryExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },

  /* ----------------------------- Add expression ----------------------------- */

  AddExpression(multExpression) {
    multExpression.applySemantics();
    return;
  },
  AddExpression_add(addExpression, _, multExpression) {
    addExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.SUM);

    multExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  AddExpression_sub(addExpression, _, multExpression) {
    addExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.SUB);

    multExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },

  /* ----------------------------- Rel expression ----------------------------- */

  RelExpression(addExpression) {
    addExpression.applySemantics();
    return;
  },
  RelExpression_lt(relExpression, _, addExpression) {
    relExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.LT);

    addExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  RelExpression_gt(relExpression, _, addExpression) {
    relExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.GT);

    addExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  RelExpression_lteq(relExpression, _, addExpression) {
    relExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.LTEQ);

    addExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  RelExpression_gteq(relExpression, _, addExpression) {
    relExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.GTEQ);

    addExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },

  /* ------------------------------ Eq expression ----------------------------- */

  EqExpression(relExpression) {
    relExpression.applySemantics();
    return;
  },
  EqExpression_equal(eqExpression, _, relExpression) {
    eqExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.EQ);

    relExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  EqExpression_notEqual(eqExpression, _, relExpression) {
    eqExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.NEQ);

    relExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },

  /* ----------------------------- And Expression ----------------------------- */

  AndExpression(eqExpression) {
    eqExpression.applySemantics();
    return;
  },
  AndExpression_lAnd(andExpression, _, eqExpression) {
    andExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.AND);

    eqExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },

  /* ------------------------------ Or expression ----------------------------- */

  OrExpression(andExpression) {
    andExpression.applySemantics();
    return;
  },
  OrExpression_lOr(orExpression, _, andExpression) {
    orExpression.applySemantics();

    symbolTable.pushOperator(OPERATORS.OR);

    andExpression.applySemantics();

    symbolTable.performOperation();
    return;
  },
  Expression(orExpression) {
    orExpression.applySemantics();
    return;
  },
  VariableExpression_varId(id) {
    const name = id.applySemantics();

    symbolTable.pushIdOperand(name);

    return;
  },
  VariableExpression_varArr(arrExp) {
    arrExp.applySemantics();

    return;
  },
  AssignExpression(variableExpression, _1, expression) {
    variableExpression.applySemantics();

    expression.applySemantics();

    return;
  },
  PrintExpression(expression) {
    expression.applySemantics();

    symbolTable.performPrint();

    return;
  },
  ReadExpression(varExpression) {
    varExpression.applySemantics();

    symbolTable.performRead();

    return;
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Statements                                 */
  /* -------------------------------------------------------------------------- */
  Dimension(_1, dimension1, _2, _3, dimemsion2, _4) {
    const d1 = dimension1.applySemantics();
    const d1Num = parseInt(d1);
    const dim1: VarDims = {
      inf: '0',
      sup: String(d1Num - 1),
      m: '0',
    };

    let dim2: VarDims | null = null;
    if (dimemsion2.children.length > 0) {
      const d2 = dimemsion2.children[0].applySemantics();
      const d2Num = parseInt(d2);
      dim2 = {
        inf: '0',
        sup: String(d2Num - 1),
        m: '0',
      };
      dim1.m = String(d2Num);
    }

    return [dim1, dim2];
  },
  VariableDeclaration(identifier, dimension) {
    const name = identifier.applySemantics();
    const dimensions = dimension.applySemantics();

    const dims = [];
    if (dimensions.length) {
      for (let d of dimensions[0] as Array<VarDims | null>) {
        if (d !== null) dims.push(d);
      }
    }

    return { name, dims: dims.length ? dims : undefined };
  },
  VariableStatement(varDecs, _1, type, _2) {
    const vars = varDecs.asIteration().applySemantics() as Omit<Var, 'type'>[];
    const varType = type.applySemantics();

    vars.forEach((v) => {
      const isVarAlreadyDefined = symbolTable.checkIfVarIsDefined(v.name);
      if (isVarAlreadyDefined) {
        throw new Error(`Variable ${v.name} is already defined`);
      }
      symbolTable.addVar(v.name, varType, v.dims);
    });

    return { vars, type: varType };
  },
  VarBlock(_1, variableStatments) {
    return variableStatments.applySemantics();
  },
  Statement(statement) {
    statement.applySemantics();
    return;
  },
  Block(_1, statement, _2) {
    statement.applySemantics();
    return;
  },
  AssigmentStatement(assignExpression, _1) {
    assignExpression.applySemantics();
    symbolTable.performAssign();
    return;
  },
  CallStatement(callExpression, _1) {
    callExpression.applySemantics();
    return;
  },
  IfElseStatement(_1, block) {
    symbolTable.handleIfElse();
    block.applySemantics();
  },
  IfStatement(_1, _2, expression, _3, block, elseBlock) {
    expression.applySemantics();

    symbolTable.handleCondition();

    block.applySemantics();
    elseBlock.applySemantics();

    symbolTable.handleIfEnd();
    return;
  },
  IterationStatement_whileDo(_1, _2, expression, _3, block) {
    symbolTable.handleLoopStart();
    expression.applySemantics();
    symbolTable.handleCondition();
    block.applySemantics();
    symbolTable.handleLoopEnd();
    return;
  },
  IterationStatement_forDo(
    _1,
    _2,
    assignExpression,
    _3,
    _4,
    _5,
    expression,
    _6,
    block
  ) {
    assignExpression.applySemantics();

    const iteratorOperand = symbolTable.handleForAssign();

    expression.applySemantics();

    symbolTable.handleForCompare(iteratorOperand);

    block.applySemantics();

    symbolTable.handleForEnd();

    return;
  },
  ReadStatement(_1, _2, readExpressions, _3, _4) {
    readExpressions.asIteration().applySemantics();
    return;
  },
  PrintStatement(_1, _2, printExpressions, _3, _4) {
    printExpressions.asIteration().applySemantics();
    return;
  },
  PrintlnStatement(_1, _2, printExpressions, _3, _4) {
    printExpressions.asIteration().applySemantics();
    symbolTable.performPrintLn();
    return;
  },
  ReturnStatement(_1, _2, expression, _3, _4) {
    expression.applySemantics();

    symbolTable.handleFuncReturn();

    return;
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Functions                                 */
  /* -------------------------------------------------------------------------- */

  FunctionParam(id, _1, paramType) {
    const name = id.applySemantics();

    const isVarAlreadyDefined = symbolTable.checkIfVarIsDefined(name);
    if (isVarAlreadyDefined) {
      throw new Error(`Variable ${name} is already defined`);
    }

    const type = paramType.applySemantics();

    symbolTable.addVar(name, type);
    symbolTable.addFunctionParam(name);

    return;
  },
  FunctionParams(functionParams) {
    functionParams.asIteration().applySemantics();
  },
  FunctionDeclaration(type, _1, id, _2, functionParams, _3) {
    const funcType = type.applySemantics();
    const funcName = id.applySemantics();

    const funcAlreadyExists = symbolTable.checkIfFuncExists(funcName);
    if (funcAlreadyExists) {
      throw new Error(`Function ${funcName} is already declared`);
    }

    symbolTable.addFunc(funcName, funcType);

    functionParams.applySemantics();
    return;
  },
  FunctionStatement(functionDeclaration, varDeclaration, block) {
    functionDeclaration.applySemantics();
    varDeclaration.applySemantics();
    block.applySemantics();

    symbolTable.handleFuncEnd();
    return;
  },
  MainStatement(_1, _2, _3, block) {
    symbolTable.handleBeginMain();

    block.applySemantics();

    symbolTable.handleEndMain();
    return;
  },

  /* -------------------------------------------------------------------------- */
  /*                                   Program                                  */
  /* -------------------------------------------------------------------------- */

  Program(
    _program,
    identifier,
    _semiColon,
    varDeclaration,
    functionStatement,
    mainStatement
  ) {
    const id = identifier.applySemantics();
    symbolTable.addFunc(id, 'void', true);
    varDeclaration.applySemantics();
    functionStatement.applySemantics();
    mainStatement.applySemantics();
    return;
  },
});

export default s;
