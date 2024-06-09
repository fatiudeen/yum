/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
/* eslint-disable indent */
// import { OPTIONS } from '@config';
import { HttpError } from '../../main/HttpError';
import { Model, Types } from 'mongoose';

// import shortUUID from 'short-uuid';

export abstract class Repository<T> {
  protected abstract model: Model<T>;

  find(_query?: Partial<T> | Array<string> | { [K in keyof DocType<T>]?: Array<DocType<T>[K]> }) {
    return new Promise<DocType<T>[]>((resolve, reject) => {
      let query: Record<string, any> = _query || {};
      // query = this.normalizeId(query);

      if (Array.isArray(_query) && _query.length > 0) {
        query = { _id: { $in: _query.map((val) => val) } };
      } else
        for (const [felid, value] of Object.entries(query)) {
          Array.isArray(value) ? (query[felid] = { $in: value }) : false;
        }

      const q = this.model.find(query);
      q.lean()
        .then((r) => {
          resolve(<DocType<T>[]>r);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  PaginatedFind(_query: Partial<T>, sort: any, startIndex: number, limit: number) {
    return new Promise<DocType<T>[]>((resolve, reject) => {
      const query: Record<string, any> = _query || {};

      const q = this.model.find(query).sort(sort).skip(startIndex).limit(limit);
      q.lean()
        .then((r) => {
          resolve(<DocType<T>[]>r);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  findOne(_query: string | Partial<T>) {
    return new Promise<DocType<T> | null>((resolve, reject) => {
      const query = _query;
      const q = typeof query === 'object' ? this.model.findOne(query) : this.model.findById(query);
      q.then((r) => {
        if (!r) {
          resolve(null);
        } else resolve(<DocType<T>>r.toObject());
      }).catch((e) => {
        reject(e);
      });
    });
  }

  findOneWithException = (_query: string | Partial<T>): Promise<DocType<T>> => {
    return new Promise<DocType<T>>((resolve, reject) => {
      const query = _query;
      const q = typeof query === 'object' ? this.model.findOne(query) : this.model.findById(query);
      q.then((r) => {
        if (!r) {
          reject(new HttpError(`${this.model.modelName} not found`, 404));
        } else resolve(<DocType<T>>r.toObject());
      }).catch((e) => {
        reject(e);
      });
    });
  };

  /**
   *  NOTE: update many will always return null
   * @param _query
   * @param data
   * @param upsert
   * @param many
   * @returns
   */
  update(_query: string | Partial<T>, data: Partial<T>, upsert = false, many = false) {
    return new Promise<DocType<T> | null>((resolve, reject) => {
      const query = _query;
      const options = { new: true, upsert: false };
      if (upsert) {
        options.upsert = true;
      }

      const q =
        typeof query === 'object'
          ? many
            ? this.model.updateMany(query, data, options)
            : this.model.findOneAndUpdate(query, data, options)
          : this.model.findByIdAndUpdate(query, data, options);
      q.then((r) => {
        if (!r || 'acknowledged' in r) {
          resolve(null);
        } else resolve(<DocType<T>>r.toObject());
      }).catch((e) => {
        reject(e);
      });
    });
  }

  create(data: Partial<T>) {
    return new Promise<DocType<T>>((resolve, reject) => {
      this.model
        .create(data)
        .then((user) => {
          resolve(user.toObject());
        })
        .catch((e) => reject(e));
    });
  }

  delete(_query: string | Partial<T>) {
    return new Promise<DocType<T> | null>((resolve, reject) => {
      const query = _query;
      const options = { new: true };

      const q =
        typeof query === 'object'
          ? this.model.findOneAndDelete(query, options)
          : this.model.findByIdAndDelete(query, options);
      q.then((r) => {
        if (!r) {
          resolve(null);
        }
        resolve(<DocType<T>>r!.toObject());
      }).catch((e) => {
        reject(e);
      });
    });
  }

  count(query: Partial<T> = {}) {
    return this.model.countDocuments(query);
  }

  // eslint-disable-next-line no-unused-vars
  increment(_query: string | Partial<T>, data: { [key in keyof Partial<DocType<T>>]: number }) {
    return new Promise<DocType<T> | null>((resolve, reject) => {
      const query = _query;
      const options = { new: true };

      const q =
        typeof query === 'object'
          ? this.model.findOneAndUpdate(query, { $inc: data }, options)
          : this.model.findByIdAndUpdate(query, { $inc: data }, options);
      q.then((r) => {
        if (!r) {
          resolve(null);
        }
        resolve(<DocType<T>>r!.toObject());
      }).catch((e) => {
        reject(e);
      });
    });
  }
}
