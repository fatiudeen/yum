export function lazySingleton<T>(obj: new (...args: any[]) => T) {
  // obj:
  const instance = (...args: any[]): T => {
    const _obj = obj as unknown as { _instance: null | T } & (new () => T);
    if (_obj._instance) {
      return _obj._instance;
    }
    _obj._instance = new obj(...args);
    return _obj._instance;
  };
  if (!('_instance' in obj)) {
    Object.assign(obj, { _instance: null, instance });
  }
  return (<{ _instance: null | T; instance: typeof instance } & (new (...args: any[]) => T)>obj).instance;
}
