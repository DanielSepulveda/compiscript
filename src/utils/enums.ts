export const operators = [
  'or',
  'and',
  '==',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  '+',
  '-',
  '*',
  '/',
] as const;

export const operatorsLabels = [
  'OR',
  'AND',
  'EQ',
  'NEQ',
  'GT',
  'LT',
  'LTEQ',
  'GTEQ',
  'SUM',
  'SUB',
  'MULT',
  'DIV',
] as const;

export const extraOperators = ['=', 'read', 'print', 'return'] as const;

export const extraOperatorsLabels = [
  'ASSIGN',
  'READ',
  'PRINT',
  'RETURN',
  'GOTO',
  'GOTOT',
  'GOTOF',
] as const;
