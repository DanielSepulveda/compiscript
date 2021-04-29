import ohm from 'ohm-js';
import semantics from './semantics';
import * as symbolTable from './symbolTable';
import { jsonLog, mapToObj } from '../utils/helpers';

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();
  // jsonLog(symbolTable.internal.stacks.operandStack.toArray());
  // jsonLog(symbolTable.internal.stacks.operatorStack.toArray());
  // jsonLog(symbolTable.internal.quadrupleArr);
};

export default compile;
