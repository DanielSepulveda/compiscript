import grammar from './grammar';
import * as symbolTable from './symbolTable';
import { jsonLog } from '../utils/helpers';
import { Var, Types } from '../utils/types';
import { OPERATORS } from '../utils/constants';

const s = grammar.createSemantics().addOperation('applySemantics', {
  string(_1, _2, _3) {
    return { value: this.sourceString, type: 'string' };
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
  identifier(_) {
    return this.sourceString;
  },
  _terminal() {
    return this.primitiveValue;
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Expressions                                */
  /* -------------------------------------------------------------------------- */

  /* --------------------------- Primary expression --------------------------- */
  PrimaryExpression_callExp(callExpression) {
    return;
  },
  PrimaryExpression_id(identifier) {
    const id = identifier.applySemantics();
    symbolTable.pushIdOperand(id);
    return;
  },
  PrimaryExpression_literal(literal) {
    const l = literal.applySemantics() as { value: string; type: Types };

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
  Dimension(_1, dim1, _2, dim2, _3) {
    const d1 = dim1.applySemantics();
    let d2 = null;
    if (dim2.children.length > 0) {
      d2 = dim2.children[0].applySemantics();
    }
    return { d1, d2 };
  },
  VariableExpression(identifier, dimension) {
    const name = identifier.applySemantics();
    const dims = dimension.applySemantics();

    return { name, dims: dims.length ? dims[0] : null };
  },
  AssignExpression(variableExpression, _1, expression) {
    const v = variableExpression.applySemantics() as Omit<Var, 'type'>;

    symbolTable.pushIdOperand(v.name);

    expression.applySemantics();

    symbolTable.performAssign();
    return;
  },
  PrintExpression(expression) {
    expression.applySemantics();

    symbolTable.performPrint();

    return;
  },
  ReadExpression(varExpression) {
    const v = varExpression.applySemantics() as Omit<Var, 'type'>;

    symbolTable.performRead(v.name);
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Statements                                 */
  /* -------------------------------------------------------------------------- */

  VariableStatement(varExprs, _1, type, _2) {
    const vars = varExprs.asIteration().applySemantics() as Omit<Var, 'type'>[];
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
  VarDeclaration(_1, variableStatments) {
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
    return;
  },
  CallStatement(callExpression, _1) {
    return;
  },
  IfElseStatement(_1, block) {
    symbolTable.handleIfElse();
    block.applySemantics();
  },
  IfStatement(_1, _2, expression, _3, block, elseBlock) {
    expression.applySemantics();

    symbolTable.handleIf();

    block.applySemantics();
    elseBlock.applySemantics();

    symbolTable.handleIfEnd();
    return;
  },
  IterationStatement_whileDo(_1, _2, expression, _3, block) {
    return;
  },
  IterationStatement_forDo(_1, assignExpression, _2, expression, block) {
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
  ReturnStatement(_1, _2, expression, _3, _4) {
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
    return;
  },
  MainStatement(_1, _2, _3, block) {
    block.applySemantics();
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
