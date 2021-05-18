import {
  Operators,
  OperatorsLabels,
  QuadrupleOperations,
  QuadrupleOperationsLabels,
  MemoryCounter,
} from './types';

export const OPERATORS: Record<OperatorsLabels, Operators> = {
  SUM: '+',
  SUB: '-',
  MULT: '*',
  DIV: '/',
  GT: '>',
  LT: '<',
  GTEQ: '>=',
  LTEQ: '<=',
  EQ: '==',
  NEQ: '!=',
  AND: 'and',
  OR: 'or',
};

export const QUADRUPLE_OPERATIONS: Record<
  QuadrupleOperations,
  QuadrupleOperationsLabels
> = {
  '*': 'MULT',
  '/': 'DIV',
  '+': 'SUM',
  '-': 'SUB',
  '<': 'LT',
  '>': 'GT',
  '<=': 'LTEQ',
  '>=': 'GTEQ',
  '==': 'EQ',
  '!=': 'NEQ',
  and: 'AND',
  or: 'OR',
  '=': 'ASSIGN',
  print: 'PRINT',
  read: 'READ',
  return: 'RETURN',
};

export const RANGES: Record<MemoryCounter, [number, number]> = {
  globalInt: [1000, 1999],
  globalFloat: [2000, 2999],
  globalString: [3000, 3999],
  localInt: [4000, 4999],
  localIntTemporal: [5000, 5999],
  localFloat: [6000, 6999],
  localFloatTemporal: [7000, 7999],
  localString: [8000, 8999],
  localStringTemporal: [9000, 9999],
  constantInt: [10_000, 10_999],
  constantFloat: [11_000, 11_999],
  constantString: [12_000, 12_999],
};
