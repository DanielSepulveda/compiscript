import {
  Operators,
  OperatorsLabels,
  QuadrupleOperations,
  QuadrupleOperationsLabels,
} from './types';

export const OPERAND_TYPES_COUNT = 5;

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
