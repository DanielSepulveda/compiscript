import * as fs from 'fs';
import * as path from 'path';
import ohm from 'ohm-js';

const grammarFile = fs
  .readFileSync(path.join(__dirname, 'grammar.ohm'))
  .toString();

const csGrammar = ohm.grammar(grammarFile);

export default csGrammar;
