import {
  operators,
  operatorsLabels,
  extraOperators,
  extraOperatorsLabels,
  globalMemoryPointers,
  localMemoryPointers,
  constantMemoryPointers,
} from './enums';

export type VarTypes = 'int' | 'float' | 'string';

export type Types = VarTypes | 'void';

export type OperandResultTypes = VarTypes | 'error';

export type Operators = typeof operators[number];
export type OperatorsLabels = typeof operatorsLabels[number];
export type ExtraOperators = typeof extraOperators[number];
export type ExtraOperatorsLabels = typeof extraOperatorsLabels[number];

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
  size?: Record<LocalMemoryPointers | GlobalMemoryPointers, number>;
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

export type GlobalMemoryPointers = typeof globalMemoryPointers[number];
export type LocalMemoryPointers = typeof localMemoryPointers[number];
export type ConstantMemoryPointers = typeof constantMemoryPointers[number];
export type MemoryPointers =
  | GlobalMemoryPointers
  | LocalMemoryPointers
  | ConstantMemoryPointers;
