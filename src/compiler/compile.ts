import ohm from 'ohm-js';
import * as fs from 'fs';
import * as path from 'path';
import semantics from './semantics';
import * as symbolTable from './symbolTable';
import { jsonLog, jsonStringify } from '../utils/helpers';

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();
  // jsonLog(symbolTable.internal.stacks.operandStack.toArray());
  // jsonLog(symbolTable.internal.stacks.operatorStack.toArray());
  fs.writeFileSync(
    path.join(__dirname, 'quadruples.out.txt'),
    jsonStringify(symbolTable.internal.quadrupleArr)
  );
  // symbolTable.internal.quadrupleArr.forEach((quad) =>
  //   console.log(`${quad.count}: ${jsonStringify(quad)}`)
  // );
};

export default compile;
