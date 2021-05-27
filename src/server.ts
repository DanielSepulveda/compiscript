import * as fs from 'fs';
import * as path from 'path';
import compile from './compiler';
import { logAll } from './compiler/logger';
import parse from './parser';
import * as vm from './vm/vm';

require('dotenv').config();

const name = 'testArr.txt';

const TESTING_DIR = path.join(__dirname, '/test/');
const testFile = fs.readFileSync(TESTING_DIR + name).toString();

try {
  const parsed = parse(testFile);
  compile(parsed);
  // if (process.env.TEST_COMPILER != 'true') {
  //   vm.init();
  //   vm.execute();
  // }
} catch (error) {
  logAll();
  console.log(error.message);
}
