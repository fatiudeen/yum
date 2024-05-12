import multer from 'multer';
import * as clientS3 from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { NextFunction } from 'express';
import { logger } from '@yumm/utils';
import fs, { promises as fsAsync } from 'fs';
import { Endpoint } from 'aws-sdk';

type awsConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type digitalOceanConfig = awsConfig & {
  digitaloceanEndpoint: string;
};

type diskConfig = { rootPath: string };

export enum BucketService {
  AWS_S3 = 's3',
  DIGITALOCEAN_SPACE = 'spaces',
  CLOUDINARY = 'cloudinary',
  MEMORY = 'memory',
  DISK = 'disk',
}

export type FileUploadOptions = awsConfig | digitalOceanConfig | diskConfig;
export class FileUploader {
  private s3?: clientS3.S3Client;
  private storage: multer.StorageEngine;
  private s3config?: clientS3.S3ClientConfig;
  private message: string;
  public storageType: BucketService = BucketService.MEMORY;
  private useS3: boolean;

  constructor(
    private service: BucketService,
    private opts: FileUploadOptions,
  ) {
    this.storageType = this.service;
    this.useS3 = this.service === BucketService.AWS_S3 || this.service === BucketService.DIGITALOCEAN_SPACE;
    if (this.useS3) {
      const options = this.opts as digitalOceanConfig;
      this.s3config = {
        credentials: {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey,
        },
      };
      // this.storageType = StorageType.CLOUD;
      if (this.service === BucketService.DIGITALOCEAN_SPACE) {
        this.s3config.endpoint = <any>new Endpoint(options.digitaloceanEndpoint);
        this.message = 'FILE_STORAGE: using digital ocean space';
      } else {
        this.s3config.region = options.region;
        this.message = 'FILE_STORAGE: using aws s3';
      }
      this.s3 = new clientS3.S3Client(this.s3config);
      this.storage = multerS3({
        s3: this.s3!,
        bucket: options.bucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        metadata: function (req: Express.Request, file: Express.Multer.File, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          cb(null, Date.now().toString());
        },
      });
    } else if (this.service === BucketService.DISK) {
      const options = this.opts as diskConfig;
      this.message = `FILE_STORAGE: using disk storage location: ${options.rootPath}`;
      this.storage = multer.diskStorage({
        destination: function (req, file, cb) {
          if (!fs.existsSync(options.rootPath)) {
            fs.mkdirSync(options.rootPath);
          }
          cb(null, options.rootPath);
        },
        filename: function (req, file, cb) {
          // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          // cb(null, `${file.fieldname}-${uniqueSuffix}`);
          cb(null, file.originalname);
        },
      });
    } else {
      this.storage = multer.memoryStorage();
      this.message = 'FILE_STORAGE: using memory storage';
    }
    if (this.message) {
      logger.info([this.message]);
    }
  }

  async getObject(key: string) {
    if (this.useS3) {
      const options = this.opts as digitalOceanConfig;
      const params = {
        Key: key,
        Bucket: options.bucket,
      };
      const command = new clientS3.GetObjectCommand(params);
      return (await this.s3!.send(command)).Body;
    }
  }

  async addObject(body: string, contentType: string) {
    if (this.useS3) {
      const options = this.opts as digitalOceanConfig;
      const key = Date.now().toString();
      const params = {
        Key: key,
        Bucket: options.bucket,
        Body: Buffer.from(body, 'base64'),
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: contentType,
      };
      const command = new clientS3.PutObjectCommand(params);
      await this.s3!.send(command);
      return `url${key}`;
    }
  }

  async deleteObject(key: string | clientS3.ObjectIdentifier[]) {
    if (this.service === BucketService.DISK) {
      const options = this.opts as diskConfig;
      if (typeof key === 'string') {
        return fsAsync.unlink(`${options.rootPath}/${key}`);
      }
      return Promise.all(key.map((k) => fsAsync.unlink(`${options.rootPath}/${k}`)));
    }
    if (this.useS3) {
      const options = this.opts as digitalOceanConfig;
      if (typeof key === 'string') {
        const params = {
          Key: key,
          Bucket: options.bucket,
        };
        const command = new clientS3.DeleteObjectCommand(params);
        return (await this.s3!.send(command)).VersionId;
        // eslint-disable-next-line no-else-return
      } else {
        const params: clientS3.DeleteObjectsRequest = {
          Bucket: options.bucket,
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
    return multer({
      storage: this.storage,
    }).single(<string>fieldname);
  }

  // req.files[0]
  uploadArray<T extends object>(fieldname: keyof Partial<T>) {
    return multer({
      storage: this.storage,
    }).array(<string>fieldname);
  }

  // req.files[name][0]
  uploadField<T extends object>(fieldname: { name: keyof Partial<T>; maxCount: number }[]) {
    return multer({
      storage: this.storage,
    }).fields(<{ name: string; maxCount: number }[]>fieldname);
  }
}
