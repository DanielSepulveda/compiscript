export const jsonLog = (out: any) => console.log(JSON.stringify(out, null, 2));

export const mapToObj = (m: Map<any, any>) => {
  return Array.from(m).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, any>);
};
