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
  'ENDFUNC',
  'ERA',
  'PARAMETER',
  'GOSUB',
  'END',
] as const;

export const globalMemoryPointers = [
  'globalInt',
  'globalFloat',
  'globalString',
] as const;

export const localMemoryPointers = [
  'localInt',
  'localIntTemporal',
  'localFloat',
  'localFloatTemporal',
  'localString',
  'localStringTemporal',
] as const;

export const constantMemoryPointers = [
  'constantInt',
  'constantFloat',
  'constantString',
] as const;

export const memoryPointers = [
  ...globalMemoryPointers,
  ...localMemoryPointers,
  ...constantMemoryPointers,
] as const;
