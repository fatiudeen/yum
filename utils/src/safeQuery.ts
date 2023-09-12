import { Request } from 'express';

// eslint-disable-next-line no-unused-vars
export default function safeQuery<T extends string>(q: Request): { [k in T]: string } {
  return q.query as any;
}
