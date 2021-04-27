export type Types = 'int' | 'double' | 'string' | 'void';

export type VarTypes = Omit<Types, 'void'>;

export type OperandResultTypes = Types | 'error';

export type Operators =
  | '+'
  | '-'
  | '*'
  | '/'
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | '!=';

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
