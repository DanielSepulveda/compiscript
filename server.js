require('regenerator-runtime/runtime');
const fs = require('fs');
const path = require('path');
const { compiler, parser, vm } = require('./dist/cjs');
const prompts = require('prompts');

require('dotenv').config();

const name = 'matrixMult.txt';

const TESTING_DIR = path.join(__dirname, '/test/');
const input = fs.readFileSync(TESTING_DIR + name).toString();

async function test() {
  try {
    const parsed = parser(input);
    const compiled = compiler(parsed);
    vm.init(compiled);
    await vm.execute({
      onOutput: (message) => {
        process.stdout.write(message);
      },
      onInput: async () => {
        const res = await prompts({
          name: 'input',
          type: 'text',
          message: 'Input',
        });

        vm.sendInput(res.input);
      },
    });
    console.log('\n');
  } catch (error) {
    console.log(error.message);
  }
}

test();
