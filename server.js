const fs = require('fs');
const path = require('path');
const { compiler, parser, vm } = require('./dist/cjs');

require('dotenv').config();

const name = 'testVm.txt';

const TESTING_DIR = path.join(__dirname, '/test/');
const input = fs.readFileSync(TESTING_DIR + name).toString();

try {
  const parsed = parser(input);
  const compiled = compiler(parsed);
  vm.init(compiled);
  vm.execute();
  console.log('\n');
} catch (error) {
  console.log(error.message);
}
