import grammar from './grammar';
import * as symbolTable from './symbolTable';
import { jsonLog } from '../utils/helpers';
import { Var } from '../utils/types';

const s = grammar.createSemantics().addOperation('applySemantics', {
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

    const isVarAlreadyDefined = symbolTable.checkIfVarIsDefined(name);
    if (isVarAlreadyDefined) {
      throw new Error(`Variable ${name} is already defined`);
    }

    const dims = dimension.applySemantics();
    return { name, dims: dims.length ? dims[0] : null };
  },
  VariableStatement(varExprs, _1, type, _2) {
    const vars = varExprs.asIteration().applySemantics() as Omit<Var, 'type'>[];
    const varType = type.applySemantics();

    vars.forEach((v) => {
      symbolTable.addVar(v.name, varType, v.dims);
    });

    return { vars, type: varType };
  },
  VarDeclaration(_1, variableStatments) {
    return variableStatments.applySemantics();
  },
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
  identifier(_) {
    return this.sourceString;
  },
  _terminal() {
    return this.primitiveValue;
  },
});

export default s;
