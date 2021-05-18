import * as fs from 'fs';
import * as path from 'path';
import compile from './compiler';
import parse from './parser';
import * as vm from './vm/vm';

require('dotenv').config();

const name = 'patito.txt';

const TESTING_DIR = path.join(__dirname, '/test/');
const testFile = fs.readFileSync(TESTING_DIR + name).toString();

try {
  const parsed = parse(testFile);
  compile(parsed);
  vm.load();
} catch (error) {
  console.log(error.message);
}
