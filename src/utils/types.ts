import VmMemory from '../vm/vmMemory';

export type VarTypes = 'int' | 'float' | 'string';

export type Types = VarTypes | 'void';

export type OperandResultTypes = VarTypes | 'error';

export type Scope = 'global' | 'local' | 'temporal' | 'constant';

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
  params: number[];
  size: Record<LocalVarScope | TemporalVarScope | GlobalVarScope, number>;
  beginAddr?: number;
  isGlobal: boolean;
};

export type Quadruple = {
  count: number;
  op: QuadrupleOperationsLabels;
  left: string;
  right: string;
  res: string;
};

export type OperationExpression = {
  left: Types;
  right: Types;
  op: Operators;
};

export type GlobalVarScope = 'globalInt' | 'globalFloat' | 'globalString';
export type LocalVarScope = 'localInt' | 'localFloat' | 'localString';
export type TemporalVarScope =
  | 'localIntTemporal'
  | 'localFloatTemporal'
  | 'localStringTemporal';
export type ConstantVarScope =
  | 'constantInt'
  | 'constantFloat'
  | 'constantString';
export type VarScope =
  | GlobalVarScope
  | LocalVarScope
  | TemporalVarScope
  | ConstantVarScope;

export type CompilationOutput = {
  funcDir: Record<string, Func>;
  quadruples: Quadruple[];
  constants: Record<string, number>;
};

export type ParseResult<T> =
  | { parsed: T; hasError: false; error?: undefined }
  | { parsed?: undefined; hasError: true; error?: unknown };

export type FuncDir = Record<string, Func>;

export type ExecutionStatus = 'idle' | 'executing' | 'success' | 'error';

export type CallFrame = {
  localMemory: VmMemory;
  temporalMemory: VmMemory;
  func: Func;
};
