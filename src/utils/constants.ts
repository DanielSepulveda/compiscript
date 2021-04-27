import { Operators } from './types';

export const OPERAND_TYPES_COUNT = 5;

const OP = {
  PLUS: '+',
  MINUS: '-',
  MULT: '*',
  DIV: '/',
  GT: '>',
  LT: '<',
  GTEQ: '>=',
  LTEQ: '<=',
  EQ: '==',
  NEQ: '!=',
};

export const OPERATORS = OP as Record<keyof typeof OP, Operators>;
