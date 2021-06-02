import * as fs from 'fs';
import * as path from 'path';
import { compiler, parser, vm } from './src';
import prompts from 'prompts';

require('dotenv').config();

const name = 'testRead.txt';

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
