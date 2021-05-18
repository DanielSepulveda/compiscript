export type VarTypes = 'int' | 'float' | 'string';

export type Types = VarTypes | 'void';

export type OperandResultTypes = VarTypes | 'error';

export type Operators =
  | 'or'
  | 'and'
  | '=='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | '+'
  | '-'
  | '*'
  | '/';

export type OperatorsLabels =
  | 'OR'
  | 'AND'
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'LT'
  | 'LTEQ'
  | 'GTEQ'
  | 'SUM'
  | 'SUB'
  | 'MULT'
  | 'DIV';

export type ExtraOperators = '=' | 'read' | 'print' | 'return';

export type ExtraOperatorsLabels =
  | 'ASSIGN'
  | 'READ'
  | 'PRINT'
  | 'RETURN'
  | 'GOTO'
  | 'GOTOT'
  | 'GOTOF'
  | 'ENDFUNC'
  | 'ERA'
  | 'PARAMETER'
  | 'GOSUB'
  | 'END';

export type QuadrupleOperations = Operators | ExtraOperators;
export type QuadrupleOperationsLabels = OperatorsLabels | ExtraOperatorsLabels;

export type VarDims = {
  d1: string;
  d2?: string;
};

export type Var = {
  name: string;
  type: VarTypes;
  dims?: VarDims;
  addr: number;
};

export type Func = {
  name: string;
  returnType: Types;
  vars: Record<string, Var> | null;
  params: VarTypes[];
  size?: Record<LocalMemoryCounter | GlobalMemoryCounter, number>;
  beginAddr?: number;
  isGlobal: boolean;
};

export type Quadruple = {
  count: number;
  op: QuadrupleOperationsLabels;
  left: string;
  leftAddr?: string;
  right: string;
  rightAddr?: string;
  res: string;
  resAddr?: string;
};

export type OperationExpression = {
  left: Types;
  right: Types;
  op: Operators;
};

export type GlobalMemoryCounter = 'globalInt' | 'globalFloat' | 'globalString';
export type LocalMemoryCounter =
  | 'localInt'
  | 'localIntTemporal'
  | 'localFloat'
  | 'localFloatTemporal'
  | 'localString'
  | 'localStringTemporal';
export type ConstantMemoryCounter =
  | 'constantInt'
  | 'constantFloat'
  | 'constantString';
export type MemoryCounter =
  | GlobalMemoryCounter
  | LocalMemoryCounter
  | ConstantMemoryCounter;
