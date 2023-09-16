export function lazySingleton<T, C extends new (...args: any[]) => T>(obj: C) {
  const instance = (...args: ConstructorParameters<C>): T => {
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
  return (<{ _instance: null | T; instance: typeof instance } & (new (...args: ConstructorParameters<C>) => T)>(
    (<unknown>obj)
  )).instance;
}
