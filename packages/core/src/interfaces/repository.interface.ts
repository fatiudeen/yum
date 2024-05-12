import { ClientSession } from 'mongoose';
// import { ClientSession as ORMClientSession } from 'typeorm';

export type TransactionSession = ClientSession; //| ORMClientSession;

export type UpdateData<T> = Partial<T> & {
  load?: { data: Record<keyof T, T[keyof T]>; toSet?: boolean };
  unload?: { data: Record<keyof T, string | number>; field?: string | false };
  increment?: { key: keyof T; value: number };
};

export interface RepositoryInterface<T> {
  find(
    _query?: Partial<T> | Array<string> | { [K in keyof DocType<T>]?: Array<DocType<T>[K]> },
    options?: OptionsParser<T> | undefined,
  ): Promise<DocType<T>[]>;
  findOne(query: string | Partial<T>): Promise<DocType<T> | null>;
  create<D extends Partial<T> | Array<Partial<T>>>(
    data: D,
    session: D extends Array<Partial<T>> ? TransactionSession | undefined : never,
  ): Promise<Array<DocType<T>> | DocType<T>>;
  update(
    query: string | Partial<T>,
    data: UpdateData<T>,
    upsert: boolean,
    many: boolean,
    session: TransactionSession | undefined,
  ): Promise<DocType<T> | null>;
  delete(query: string | Partial<T>): Promise<DocType<T> | null>;
  count(query: Partial<T>): Promise<number>;
}
