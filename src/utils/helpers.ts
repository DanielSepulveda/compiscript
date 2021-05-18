import { CompilationOutput, ParseResult } from '../utils/types';

export const jsonStringify = (v: any) => JSON.stringify(v, null, 2);

export const jsonLog = (out: any) => console.log(jsonStringify(out));

export const mapToObj = (m: Map<any, any>) => {
  return Array.from(m).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, any>);
};

export function isValidData(o: any): o is CompilationOutput {
  return 'funcDir' in o && 'quadruples' in o && 'constants' in o;
}

export const safeJsonParse = <T>(guard: (o: any) => o is T) => (
  text: string
): ParseResult<T> => {
  const parsed = JSON.parse(text);
  return guard(parsed) ? { parsed, hasError: false } : { hasError: true };
};
