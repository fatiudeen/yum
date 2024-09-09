import { Repository } from './data/mongooseRepository';
// single model methods
export abstract class Service<T, R extends Repository<T>> {
  protected abstract repository: R;
  protected observables?: Record<string, Function>;
  // protected observer = observer();

  constructor() {
    // if (this.observables) {
    //   Object.entries(this.observables).forEach(([key, value]) => {
    //     this.observer.add(key, value.call(this));
    //   });
    // }
  }

  find(
    query?:
      | Partial<
          T & {
            page?: string | number | undefined;
            limit?: string | number | undefined;
          }
        >
      | undefined,
  ): Promise<DocType<T>[]> {
    return this.repository.find(query);
  }
  findOne(query: string | Partial<T>) {
    return this.repository.findOne(query);
  }
  create(data: Partial<T>) {
    return this.repository.create(data);
  }

  update(
    query: string | Partial<T>,
    data: Partial<T> & {
      load?: { key: string; value: any; toSet?: boolean | undefined } | undefined;
      unload?: { key: string; value: string | string[]; field?: string | undefined } | undefined;
      increment?: { key: keyof T; value: number } | undefined;
    } & { $setOnInsert?: Partial<T> },
    upsert = false,
    many = false,
  ) {
    return this.repository.update(query, data, upsert, many);
  }

  delete(query: string | Partial<T>) {
    return this.repository.delete(query);
  }

  count(query?: Partial<T>) {
    return this.repository.count(query);
  }

  save(query: Partial<DocType<T>>) {
    return this.repository.update(query.id!, query);
  }

  protected paginatedFind(query?: Partial<T & { page?: number | string; limit?: number | string }>) {
    return new Promise<{
      data: DocType<T>[];
      limit: number;
      totalDocs: number;
      page: number;
      totalPages: number;
    }>((resolve, reject) => {
      query = query || {};
      let page: number = 1;
      let limit: number = 10;
      if (query?.page) {
        typeof query.page === 'string'
          ? ((page = parseInt(query.page, 10)), delete query.page)
          : (query.page, delete query.page);
      }
      if (query?.limit) {
        typeof query.limit === 'string'
          ? ((limit = parseInt(query.limit, 10)), delete query.limit)
          : (query.limit, delete query.limit);
      }
      query = Object.entries(query).length > 1 ? query : {};
      const startIndex = limit * (page - 1);
      let totalDocs = 0;
      this.count()
        .then((_totalDocs) => {
          totalDocs = _totalDocs;
          return this.find(query); // TODO: { sort: { createdAt: -1 }, skip: startIndex, limit }
        })
        .then((data) => {
          const totalPages = Math.floor(totalDocs / limit) + 1;
          const result = {
            data: <DocType<T>[]>data,
            limit,
            totalDocs,
            page,
            totalPages,
          };
          resolve(result);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  static instance<T, A extends Array<any>>(obj: new (...args: A) => T) {
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
}
