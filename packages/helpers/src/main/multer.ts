/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-nested-ternary */
/* eslint-disable indent */
/* eslint-disable no-undef */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */
import multer from 'multer';
import * as clientS3 from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import * as Config from '@config';
import { NextFunction } from 'express';
import { logger } from '@utils/logger';
import fs, { promises as fsAsync } from 'fs';
import { Endpoint } from 'aws-sdk';

class Multer {
  private bucket = Config.AWS_BUCKET_NAME;
  private region = Config.AWS_REGION;
  private accessKeyId = Config.AWS_ACCESS_KEY_ID;
  private secretAccessKey = Config.AWS_SECRET_ACCESS_KEY;
  private s3;
  private storage;
  private useMulter = Config.OPTIONS.USE_MULTER;
  private useS3 = Config.OPTIONS.USE_S3;
  private useDigitalOceanSpaces = Config.OPTIONS.USE_DIGITALOCEAN_SPACE;
  private useDiskStorage = Config.OPTIONS.USE_MULTER_DISK_STORAGE;
  private s3config: clientS3.S3ClientConfig = {
    credentials: {
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    },
  };
  private message;
  public storageType: 's3' | 'memory' | 'disk' = 'memory';

  constructor() {
    if (this.useS3) {
      this.storageType = 's3';
      if (this.useDigitalOceanSpaces) {
        this.s3config.endpoint = <any>new Endpoint(Config.CONSTANTS.DIGITALOCEAN_SPACE_ENDPOINT);
        this.message = 'FILE_STORAGE: using digital ocean space';
      } else {
        this.s3config.region = this.region;
        this.message = 'FILE_STORAGE: using aws s3';
      }
      this.s3 = new clientS3.S3Client(this.s3config);
    }
    if (this.useDiskStorage) {
      this.storageType = 'disk';
      this.message = `FILE_STORAGE: using disk storage location: ${Config.CONSTANTS.ROOT_PATH}`;
    }
    this.storage = this.useS3
      ? multerS3({
          s3: this.s3!,
          bucket: this.bucket,
          contentType: multerS3.AUTO_CONTENT_TYPE,
          acl: 'public-read',
          metadata: function (req: Express.Request, file: Express.Multer.File, cb) {
            cb(null, { fieldName: file.fieldname });
          },
          key: function (req, file, cb) {
            cb(null, Date.now().toString());
          },
        })
      : this.useDiskStorage
      ? multer.diskStorage({
          destination: function (req, file, cb) {
            if (!fs.existsSync(Config.CONSTANTS.ROOT_PATH)) {
              fs.mkdirSync(Config.CONSTANTS.ROOT_PATH);
            }
            cb(null, Config.CONSTANTS.ROOT_PATH);
          },
          filename: function (req, file, cb) {
            // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            // cb(null, `${file.fieldname}-${uniqueSuffix}`);
            cb(null, file.originalname);
          },
        })
      : multer.memoryStorage();
    if (this.message) {
      logger.info([this.message]);
    } else if (this.useMulter) logger.info('FILE_STORAGE: using memory storage');
  }

  async getObject(key: string) {
    const params = {
      Key: key,
      Bucket: this.bucket,
    };
    const command = new clientS3.GetObjectCommand(params);
    return (await this.s3!.send(command)).Body;
  }

  async addObject(body: string, contentType: string) {
    const key = Date.now().toString();
    const params = {
      Key: key,
      Bucket: this.bucket,
      Body: Buffer.from(body, 'base64'),
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: contentType,
    };
    const command = new clientS3.PutObjectCommand(params);
    await this.s3!.send(command);
    return `url${key}`;
  }

  async deleteObject(key: string | clientS3.ObjectIdentifier[]) {
    if (this.useDiskStorage) {
      if (typeof key === 'string') {
        return fsAsync.unlink(`${Config.CONSTANTS.ROOT_PATH}/${key}`);
      }
      return Promise.all(key.map((k) => fsAsync.unlink(`${Config.CONSTANTS.ROOT_PATH}/${k}`)));
    }
    if (this.useS3) {
      if (typeof key === 'string') {
        const params = {
          Key: key,
          Bucket: this.bucket,
        };
        const command = new clientS3.DeleteObjectCommand(params);
        return (await this.s3!.send(command)).VersionId;
        // eslint-disable-next-line no-else-return
      } else {
        const params: clientS3.DeleteObjectsRequest = {
          Bucket: this.bucket,
          Delete: {
            Objects: key,
            Quiet: true,
          },
        };
        const command = new clientS3.DeleteObjectsCommand(params);
        return (await this.s3!.send(command)).Deleted;
      }
    }
    logger.info('delete memory storage unimplemented');
    return null;
  }
  // req.file
  uploadOne<T extends object>(fieldname: keyof Partial<T>) {
    if (!this.useMulter) {
      return (req: Express.Request, res: Express.Response, next: NextFunction) => {
        return next();
      };
    }
    return multer({
      storage: this.storage,
    }).single(<string>fieldname);
  }

  // req.files[0]
  uploadArray<T extends object>(fieldname: keyof Partial<T>) {
    if (!this.useMulter) {
      return (req: Express.Request, res: Express.Response, next: NextFunction) => {
        return next();
      };
    }
    return multer({
      storage: this.storage,
    }).array(<string>fieldname);
  }

  // req.files[name][0]
  uploadField<T extends object>(fieldname: { name: keyof Partial<T>; maxCount: number }[]) {
    if (!this.useMulter) {
      return (req: Express.Request, res: Express.Response, next: NextFunction) => {
        return next();
      };
    }
    return multer({
      storage: this.storage,
    }).fields(<{ name: string; maxCount: number }[]>fieldname);
  }
}

export default new Multer();
