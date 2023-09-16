export function lazySingleton<T, A extends Array<any>>(obj: new (...args: A) => T) {
  const instance = (...args: A): T => {
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
  return (<{ _instance: null | T; instance: typeof instance } & (new (...args: A) => T)>obj).instance;
}
