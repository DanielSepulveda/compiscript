import * as fs from 'fs';
import * as path from 'path';
import { parse, compile } from './compiler';

const TESTING_DIR = path.join(__dirname, '/test/');
const testFile = fs.readFileSync(TESTING_DIR + 'valid.txt').toString();

try {
  const res = parse(testFile);
  compile(res);
} catch (error) {
  console.log(error.message);
}
