// import * as fs from 'fs';
// import * as path from 'path';
import ohm from 'ohm-js';
import semantics from './semantics';
import { logAll } from './logger';
import * as symbolTable from './symbolTable';
import { jsonStringify } from '../utils/helpers';
import { CompilationOutput } from '../types';

// const outputPath = path.join(__dirname, '..', 'out');

/**
 * The compile function receives a parser output and applies the
 * semantics. When finished, it returns the funcDir, the quadruples list,
 * and the constants table. It can optionally log to a directory.
 * @param input
 * @returns
 */
const compile = (input: ohm.MatchResult) => {
  symbolTable.init();

  semantics(input).applySemantics();

  // optional log
  logAll();

  const st = symbolTable.getSymbolTable();

  const output: CompilationOutput = {
    funcDir: st.funcDir,
    quadruples: st.quadrupleArr,
    constants: st.constants,
  };

  // logOutput(output);

  return output;
};

// const logOutput = (output: CompilationOutput) => {
//   fs.writeFileSync(path.join(outputPath, 'obj.txt'), jsonStringify(output));
// };

export default compile;
