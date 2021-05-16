import * as fs from 'fs';
import * as path from 'path';
import * as symbolTable from './symbolTable';
import { jsonLog, jsonStringify } from '../utils/helpers';

const logPath = path.join(__dirname, '..', 'logs');

export const logFuncDir = () => {
  fs.writeFileSync(
    path.join(logPath, 'funcDir.out.txt'),
    jsonStringify(symbolTable.internal.funcDir)
  );
};

export const logQuadruples = () => {
  fs.writeFileSync(
    path.join(logPath, 'quadruples.out.txt'),
    jsonStringify(symbolTable.internal.quadrupleArr)
  );
};

export const logStacks = () => {
  const stacksWriter = fs.createWriteStream(
    path.join(logPath, 'stacks.out.txt')
  );

  stacksWriter.write('=== OPERAND STACK ===\n');
  stacksWriter.write(
    jsonStringify(symbolTable.internal.stacks.operandStack.toArray())
  );
  stacksWriter.write('\n\n');

  stacksWriter.write('=== ADDRESS STACK ===\n');
  stacksWriter.write(
    jsonStringify(symbolTable.internal.stacks.addrStack.toArray())
  );
  stacksWriter.write('\n\n');

  stacksWriter.write('=== TYPE STACK ===\n');
  stacksWriter.write(
    jsonStringify(symbolTable.internal.stacks.typeStack.toArray())
  );
  stacksWriter.write('\n\n');

  stacksWriter.write('=== JUMP STACK ===\n');
  stacksWriter.write(
    jsonStringify(symbolTable.internal.stacks.jumpsStack.toArray())
  );

  stacksWriter.close();
};

export const logConstants = () => {
  fs.writeFileSync(
    path.join(logPath, 'constants.out.txt'),
    jsonStringify(symbolTable.internal.constants)
  );
};

export const logAll = () => {
  logFuncDir();
  logQuadruples();
  logStacks();
  logConstants();
};
