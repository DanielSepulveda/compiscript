import ohm from 'ohm-js';
import semantics from './semantics';
import * as symbolTable from './symbolTable';
import { jsonLog, mapToObj } from '../utils/helpers';

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();
  jsonLog(symbolTable.funcDir);
};

export default compile;
