export const jsonStringify = (v: any) => JSON.stringify(v, null, 2);

export const jsonLog = (out: any) => console.log(jsonStringify(out));

export const mapToObj = (m: Map<any, any>) => {
  return Array.from(m).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, any>);
};
