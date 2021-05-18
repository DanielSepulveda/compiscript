import * as fs from 'fs';
import * as path from 'path';
import VmMemory from './vmMemory';
import { safeJsonParse, isValidData, jsonLog } from '../utils/helpers';

const objFilePath = path.join(__dirname, '..', 'out', 'obj.txt');

const globalMemory = new VmMemory('global');
const constantMemory = new VmMemory('constant');

export function load() {
  const rawDataAsString = fs.readFileSync(objFilePath, 'utf8');
  const parsedResult = safeJsonParse(isValidData)(rawDataAsString);

  if (parsedResult.hasError) {
    throw new Error('Internal error: Error loading compilation output file');
  }

  const data = parsedResult.parsed;
}
