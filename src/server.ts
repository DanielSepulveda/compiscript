import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import compiscript from './grammar/';

const TESTING_DIR = path.join(__dirname, '/test/');

const printLog = (text: string) => figlet.textSync(text);

const spinner = ora();

spinner.start('Booting...');

spinner.succeed('Ready!');
spinner.start().info('Testing files\n');

fs.readdirSync(TESTING_DIR).forEach((file) => {
  spinner.start(`Testing ${file}...`);

  const testFile = fs.readFileSync(TESTING_DIR + file).toString();

  const result = compiscript.match(testFile);

  spinner.info();
  if (result.succeeded()) {
    console.log(chalk.green(printLog('OK')));
  } else {
    console.log(chalk.red(printLog('NOT OK')));
    console.log(result.message);
  }

  console.log('\n');
});
