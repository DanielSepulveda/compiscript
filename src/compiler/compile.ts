import ohm from 'ohm-js';
import semantics from './semantics';
import { logAll } from './logger';

const compile = (input: ohm.MatchResult) => {
  semantics(input).applySemantics();
  logAll();
};

export default compile;
