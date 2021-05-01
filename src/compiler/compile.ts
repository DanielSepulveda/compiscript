import ohm from 'ohm-js';
import semantics from './semantics';
import * as symbolTable from './symbolTable';
import { jsonLog, jsonStringify } from '../utils/helpers';

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();
  // jsonLog(symbolTable.internal.stacks.operandStack.toArray());
  // jsonLog(symbolTable.internal.stacks.operatorStack.toArray());
  symbolTable.internal.quadrupleArr.forEach((quad) =>
    console.log(`${quad.count}: ${jsonStringify(quad)}`)
  );
};

export default compile;
