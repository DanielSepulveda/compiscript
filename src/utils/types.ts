import {
  operators,
  operatorsLabels,
  extraOperators,
  extraOperatorsLabels,
} from './enums';

export type VarTypes = 'int' | 'float' | 'string';

export type Types = VarTypes | 'void';

export type OperandResultTypes = Types | 'error';

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
};

export type Func = {
  name: string;
  returnType: Types;
  vars: Record<string, Var>;
};

export type Quadruple = {
  op: QuadrupleOperationsLabels;
  left: string | null;
  right: string | null;
  res: string;
};

export type OperationExpression = {
  left: Types;
  right: Types;
  op: Operators;
};
