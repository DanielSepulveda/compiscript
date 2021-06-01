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

/**
 * Returns a boolean indicating if a value of a certain type can
 * be assigned to a variable of another certain type.
 * @param param0 `{ varType, varType }`
 * @returns
 */
export function checkIfCanAssignType({ variable, value }: CanAssignParams) {
  const validTypes = table[variable];
  return validTypes.includes(value);
}
