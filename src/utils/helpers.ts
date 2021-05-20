import { findKey } from 'lodash';
import {
  CompilationOutput,
  ParseResult,
  VarScope,
  ConstantVarScope,
  GlobalVarScope,
  LocalVarScope,
  VarTypes,
  Scope,
} from '../types';
import { RANGES } from '../utils/constants';

export const jsonStringify = (v: any) => JSON.stringify(v, null, 2);

export const jsonLog = (out: any) => console.log(jsonStringify(out));

export const mapToObj = (m: Map<any, any>) => {
  return Array.from(m).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, any>);
};

export function isValidCompilationData(o: any): o is CompilationOutput {
  return 'funcDir' in o && 'quadruples' in o && 'constants' in o;
}

export const safeJsonParse = <T>(guard: (o: any) => o is T) => (
  text: string
): ParseResult<T> => {
  const parsed = JSON.parse(text);
  return guard(parsed) ? { parsed, hasError: false } : { hasError: true };
};

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
  return 'constant';
};

export const isInt = (scope: VarScope) => {
  return (
    scope === 'globalInt' ||
    scope === 'localInt' ||
    scope === 'localIntTemporal' ||
    scope === 'constantInt'
  );
};

export const isFloat = (scope: VarScope) => {
  return (
    scope === 'globalFloat' ||
    scope === 'localFloat' ||
    scope === 'localFloatTemporal' ||
    scope === 'constantFloat'
  );
};

export const isString = (scope: VarScope) => {
  return (
    scope === 'globalString' ||
    scope === 'localString' ||
    scope === 'localStringTemporal' ||
    scope === 'constantString'
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

export const isNumber = (type: VarTypes): type is 'int' | 'float' => {
  return type === 'int' || type === 'float';
};
