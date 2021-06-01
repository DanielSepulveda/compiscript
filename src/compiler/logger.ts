import * as fs from 'fs';
import * as path from 'path';
import { getSymbolTable, SymbolTable } from './symbolTable';
import { jsonLog, jsonStringify } from '../utils/helpers';

const logPath = path.join(__dirname, '..', '..', 'logs');

export const logFuncDir = (st: SymbolTable) => {
  fs.writeFileSync(
    path.join(logPath, 'funcDir.out.txt'),
    jsonStringify(st.funcDir)
  );
};

export const logQuadruples = (st: SymbolTable) => {
  fs.writeFileSync(
    path.join(logPath, 'quadruples.out.txt'),
    jsonStringify(st.quadrupleArr)
  );
};

export const logStacks = (st: SymbolTable) => {
  const stacksWriter = fs.createWriteStream(
    path.join(logPath, 'stacks.out.txt')
  );

  stacksWriter.write('=== OPERAND STACK ===\n');
  stacksWriter.write(jsonStringify(st.operandStack.toArray()));
  stacksWriter.write('\n\n');

  stacksWriter.write('=== ADDRESS STACK ===\n');
  stacksWriter.write(jsonStringify(st.addrStack.toArray()));
  stacksWriter.write('\n\n');

  stacksWriter.write('=== TYPE STACK ===\n');
  stacksWriter.write(jsonStringify(st.typeStack.toArray()));
  stacksWriter.write('\n\n');

  stacksWriter.write('=== JUMP STACK ===\n');
  stacksWriter.write(jsonStringify(st.jumpsStack.toArray()));

  stacksWriter.close();
};

export const logConstants = (st: SymbolTable) => {
  fs.writeFileSync(
    path.join(logPath, 'constants.out.txt'),
    jsonStringify(st.constants)
  );
};

export const logAll = () => {
  const st = getSymbolTable();
  logFuncDir(st);
  logQuadruples(st);
  logStacks(st);
  logConstants(st);
};
