import * as fs from 'fs';
import * as path from 'path';
import ohm from 'ohm-js';
import semantics from './semantics';
import { logAll } from './logger';
import * as symbolTable from './symbolTable';
import { jsonLog, jsonStringify } from '../utils/helpers';
import { CompilationOutput } from '../types';

// const outputPath = path.join(__dirname, '..', 'out');

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();

  // logAll();

  const output: CompilationOutput = {
    funcDir: symbolTable.internal.funcDir,
    quadruples: symbolTable.internal.quadrupleArr,
    constants: symbolTable.internal.constants,
  };

  // fs.writeFileSync(path.join(outputPath, 'obj.txt'), jsonStringify(output));

  return output;
};

export default compile;
