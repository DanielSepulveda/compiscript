import * as fs from 'fs';
import * as path from 'path';
import compile from './src/compiler';
import { logAll } from './src/compiler/logger';
import parse from './src/parser';
import * as vm from './src/vm';

require('dotenv').config();

const name = 'testVm.txt';

const TESTING_DIR = path.join(__dirname, '/test/');
const input = fs.readFileSync(TESTING_DIR + name).toString();

try {
  const parsed = parse(input);
  const compiled = compile(parsed);
  vm.init(compiled);
  vm.execute();
  console.log('\n');
} catch (error) {
  logAll();
  console.log(error.message);
}
