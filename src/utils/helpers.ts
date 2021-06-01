import { findKey, noop, isInteger, isFinite } from 'lodash';
import { Stack } from 'mnemonist';
import {
  CompilationOutput,
  ParseResult,
  VarScope,
  ConstantVarScope,
  GlobalVarScope,
  LocalVarScope,
  VarTypes,
  Scope,
  PointerScope,
} from '../types';
import { RANGES } from '../utils/constants';

export const jsonStringify = (v: any) => JSON.stringify(v, null, 2);

export const jsonLog = (out: any) => console.log(jsonStringify(out));

export const getVarScopeFromAddress = (address: number): VarScope | null => {
  const res = findKey(RANGES, (o) => {
    const min = o[0];
    const max = o[1];
    const isInRange = address >= min && address <= max;
    return isInRange;
  });

  if (res === undefined) {
    return null;
  }

  return res as VarScope;
};

export const isConstantScope = (scope: VarScope): scope is ConstantVarScope => {
  return (
    scope === 'constantFloat' ||
    scope === 'constantInt' ||
    scope === 'constantString'
  );
};

export const isGlobalScope = (scope: VarScope): scope is GlobalVarScope => {
  return (
    scope === 'globalInt' || scope === 'globalFloat' || scope === 'globalString'
  );
};

export const isLocalScope = (scope: VarScope): scope is LocalVarScope => {
  return (
    scope === 'localInt' || scope === 'localFloat' || scope === 'localString'
  );
};

export const isTemporalScope = (scope: VarScope): scope is LocalVarScope => {
  return (
    scope === 'localIntTemporal' ||
    scope === 'localFloatTemporal' ||
    scope === 'localStringTemporal'
  );
};

export const isPointerScope = (scope: VarScope): scope is PointerScope => {
  return (
    scope === 'pointerInt' ||
    scope === 'pointerFloat' ||
    scope === 'pointerString'
  );
};

export const getScopeFromVarScope = (scope: VarScope): Scope => {
  if (isGlobalScope(scope)) {
    return 'global';
  }
  if (isLocalScope(scope)) {
    return 'local';
  }
  if (isTemporalScope(scope)) {
    return 'temporal';
  }
  if (isConstantScope(scope)) {
    return 'constant';
  }
  return 'pointer';
};

export const isInt = (scope: VarScope) => {
  return (
    scope === 'globalInt' ||
    scope === 'localInt' ||
    scope === 'localIntTemporal' ||
    scope === 'constantInt' ||
    scope === 'pointerInt'
  );
};

export const isFloat = (scope: VarScope) => {
  return (
    scope === 'globalFloat' ||
    scope === 'localFloat' ||
    scope === 'localFloatTemporal' ||
    scope === 'constantFloat' ||
    scope === 'pointerFloat'
  );
};

export const isString = (scope: VarScope) => {
  return (
    scope === 'globalString' ||
    scope === 'localString' ||
    scope === 'localStringTemporal' ||
    scope === 'constantString' ||
    scope === 'pointerString'
  );
};

export const getVarTypeFromVarScope = (scope: VarScope): VarTypes => {
  if (isInt(scope)) {
    return 'int';
  }
  if (isFloat(scope)) {
    return 'float';
  }
  return 'string';
};

export const isNumberType = (type: VarTypes): type is 'int' | 'float' => {
  return type === 'int' || type === 'float';
};

export function safePop<T>(stack: Stack<T>) {
  const val = stack.pop();

  if (val === undefined) {
    throw new Error(
      `Internal error: Tried to perform 'pop' on a stack and got no value`
    );
  }

  return val;
}

export function isVariable(addr: number) {
  const scope = getVarScopeFromAddress(addr);

  if (scope === null) {
    throw new Error(`Internal error: scope is null in 'isVariable' function`);
  }

  return isGlobalScope(scope) || isLocalScope(scope);
}

export function assertNever(v: never) {
  noop();
}

export function assertInputType(value: any, type: VarTypes) {
  if (type === 'int') {
    return isInteger(parseFloat(value));
  }
  if (type === 'float') {
    return isFinite(parseFloat(value));
  }
  return true;
}
