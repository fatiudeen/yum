export function lazySingleton<T>(obj: new () => T) {
  const instance = <T>(obj: { _instance: null | T } & (new () => T)): T => {
    if (obj._instance) {
      return obj._instance;
    }
    obj._instance = new obj();
    return obj._instance;
  };
  if (!('_instance' in obj)) {
    Object.assign(obj, { _instance: null, instance });
  }
  return (<{ _instance: null | T; instance: typeof instance } & (new () => T)>obj).instance;
}
