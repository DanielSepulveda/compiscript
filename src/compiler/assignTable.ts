import { VarTypes } from '../types';

const table: Record<VarTypes, VarTypes[]> = {
  int: ['int'],
  float: ['float', 'int'],
  string: ['string'],
};

type CanAssignParams = {
  variable: VarTypes;
  value: VarTypes;
};

export function checkIfCanAssignType({ variable, value }: CanAssignParams) {
  const validTypes = table[variable];
  return validTypes.includes(value);
}
