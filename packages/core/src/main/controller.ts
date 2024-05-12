import { Request, Response, NextFunction } from 'express';
import { logger, safeQuery } from '@yumm/utils';
import Service from './service';
import { HttpError, HttpResponse } from '.';
import { Multer } from '@yumm/helpers';
import httpStatus from 'http-status';
import { OPTIONS } from '../config';

export default abstract class Controller<T> {
  protected HttpError = HttpError;
  protected HttpResponse = HttpResponse;
  protected resource: string;
  protected resourceId: string;
  abstract service: Service<T, any>;
  readonly fileProcessor = OPTIONS.USE_MULTER ? Multer : null;
  abstract responseDTO?: Function;
  protected processFile = (req: Request) => {
    if (!this.fileProcessor) return;
    let multerFile!: 'path' | 'location' | 'buffer';
    if (this.fileProcessor.storageType === 'disk') {
      multerFile = 'path';
    } else if (this.fileProcessor.storageType === 'memory') {
      if (req.file) {
        // const base64String = Buffer.from(req.file.buffer).toString('base64');
        multerFile = 'buffer';
      }
    } else {
      multerFile = 'location';
    }
    if (req.file) {
      if (!req.file.fieldname) return;

      req.body[req.file.fieldname] = (<any>req.file)[multerFile];
    }
    if (req.files && Array.isArray(req.files)) {
      if (req.files.length === 0) return;

      // eslint-disable-next-line no-undef
      const data = (<Express.Multer.File[]>req.files).map((file) => {
        return (<any>file)[multerFile];
      });
      const fieldname = req.files[0].fieldname;
      (<any>req.body).$push = {
        [fieldname]: { $each: data },
      };
    } else if (req.files && !Array.isArray(req.files)) {
      Object.entries(req.files).forEach(([key, value]) => {
        const data = value.map((file) => {
          return (<any>file)[multerFile];
        });
        (<any>req.body).$push = {
          [key]: { $each: data },
        };
      });
    }
  };

  protected control =
    (fn: (req: Request) => Promise<any>, responseDTO?: Function) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await fn(req);
        if (result.redirect) {
          return res.redirect(result.redirectUri);
        }
        const status = req.method === 'POST' ? httpStatus.CREATED : httpStatus.OK;
        responseDTO = responseDTO || this.responseDTO;
        this.HttpResponse.send(res, responseDTO ? responseDTO(result) : result, status);
      } catch (error) {
        logger.error([error]);
        next(error);
      }
    };
  constructor(resource: string) {
    this.resource = resource;
    this.resourceId = `${resource}Id`;
  }

  create = this.control((req: Request) => {
    const data = <T>req.body;
    return this.service.create(data);
  });

  get = this.control((req: Request) => {
    return this.service.find(
      <
        Partial<
          T & {
            page?: string | number | undefined;
            limit?: string | number | undefined;
          }
        >
      >safeQuery(req),
    );
  });

  getOne = this.control(async (req: Request) => {
    const result = await this.service.findOne(req.params[this.resourceId]);
    if (!result) throw new this.HttpError(`${this.resource} not found`, 404);
    return result;
  });

  update = this.control(async (req: Request) => {
    this.processFile(req);
    const result = await this.service.update(req.params[this.resourceId], req.body);

    if (!result) throw new this.HttpError(`${this.resource} not found`, 404);
    return result;
  });

  delete = this.control(async (req: Request) => {
    const result = await this.service.delete(req.params[this.resourceId]);
    if (!result) throw new this.HttpError(`${this.resource} not found`, 404);
    return result;
  });
}
