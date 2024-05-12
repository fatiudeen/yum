/* eslint-disable import/no-dynamic-require */
import { config } from 'dotenv';
import { yummConfig } from './getYummConfig';
import { BucketService, FileUploadOptions } from '@yumm/helpers';

if (process.env.NODE_ENV === 'development') {
  config({ path: '.env.dev' });
  console.log(yummConfig);
} else if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
  console.log(yummConfig);
} else config();

export const MESSAGES = {
  DB_CONNECTED: 'database connected',
  ADMIN_SEEDED: 'admin seeded',
  INTERNAL_SERVER_ERROR: 'Internal Server Error. Please try again!',
  INVALID_CREDENTIALS: 'Invalid Credentials',
  LOGIN_SUCCESS: 'Login Success',
  UNAUTHORIZED: 'Unauthorized access',
  INPUT_VALIDATION_ERROR: 'Input Validation Error',
  INVALID_REQUEST: 'Invalid Request',
  ROUTE_DOES_NOT_EXIST: 'Sorry Route does not exists',
  SERVER_STARTED: 'Server running on port',
  MONGODB_CONNECTED: 'DB Connected',
  MIN_PASSWORD_ERROR: 'password cannot be less than six',
  PASSWORD_MATCH_ERROR: 'password does not match',
  SEED_ACCOUNT_CREATED: 'Seeded',
  INVALID_EMAIL: 'invalid email',
  SHORT_PASSWORD: 'password must be at least 8 characters',
  USER_EXISTS: 'user exists',
  INVALID_RECORD: 'record does not exist',
  INVALID_SESSION: 'user does not have an active session',
  ACTIVE_SESSION: 'user session is active on another device. login again to reclaim session',
  DOC_NOT_FOUND: 'documentation url not found',
  PAYSTACK_NOT_INITIALIZED: 'paystack not initialized',
};

export const {
  PORT,
  DB_URI,
  JWT_KEY,
  JWT_TIMEOUT,
  REFRESH_JWT_KEY,
  REFRESH_JWT_TIMEOUT,
  GOOGLE_API_CLIENT_ID,
  GOOGLE_API_CLIENT_SECRET,
  GOOGLE_API_REDIRECT,
  API_HOST,
  FRONTEND_GOOGLE_LOGIN_URI,
  MAIL_SENDER_NAME,
  MAIL_SENDER_EMAIL,
  MAIL_TOKEN,
  SEEDER_EMAIL,
  SEEDER_PASSWORD,
  DOCS_URL,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  PAYSTACK_SECRET,
  MULTER_STORAGE_PATH,
  NODE_ENV,
  REDIS_URI,
  DIGITALOCEAN_SPACE_ENDPOINT,
} = <Record<string, string>>process.env;

export const OPTIONS: {
  USE_ADMIN_SEED: boolean;
  USE_SMTP: boolean;
  USE_SOCKETS: boolean;
  USE_AUTH_SESSIONS: boolean; // one user can log in at a time
  USE_REFRESH_TOKEN: boolean;
  USE_FILE_UPLOADER: boolean; // using multer without s3 or disk storage set default storage to memoryStorage
  // USE_S3: boolean;
  // USE_DIGITALOCEAN_SPACE: boolean; // s3 must be true to use this
  // USE_MULTER_DISK_STORAGE: boolean; // s3 and USE_DIGITALOCEAN_SPACE  must be false to use this
  USE_OAUTH_GOOGLE: boolean;
  USE_OAUTH_FACEBOOK: boolean;
  USE_OAUTH_APPLE: boolean;
  USE_PAYSTACK: boolean;
  USE_ANALYTICS: boolean;
  // USE_REDIS: boolean;
  USE_DATABASE: 'mongodb' | 'postgresql' | 'sqlite';
  DIGITALOCEAN_SPACE_ENDPOINT: 'nyc3.digitaloceanspaces.com';
  BUCKET_SERVICE: BucketService | undefined;
  // eslint-disable-next-line global-require
} = yummConfig;

export var BUCKET_CONFIG: FileUploadOptions | undefined;

export function optionsValidation() {
  if (!PORT || !DB_URI || !JWT_KEY || !JWT_TIMEOUT) {
    throw new Error('missing env config options: PORT, DB_URI, JWT_TIMEOUT, JWT_KEY');
  }
  if (OPTIONS.USE_ADMIN_SEED) {
    if (!SEEDER_EMAIL || !SEEDER_PASSWORD) {
      throw Error('missing env config options: SEEDER_EMAIL, SEEDER_PASSWORD');
    }
  }

  if (OPTIONS.USE_SMTP) {
    if (!MAIL_SENDER_NAME || !MAIL_SENDER_EMAIL || !MAIL_TOKEN) {
      throw Error('missing env config options: MAIL_SENDER_NAME, MAIL_SENDER_EMAIL, MAIL_TOKEN');
    }
  }

  // if (OPTIONS.USE_REDIS) {
  //   if (!REDIS_URI) {
  //     throw Error('missing env config options: REDIS_URI');
  //   }
  // }

  if (OPTIONS.USE_PAYSTACK) {
    if (!PAYSTACK_SECRET) {
      throw Error('missing env config options: PAYSTACK_SECRET');
    }
  }
  if (OPTIONS.USE_FILE_UPLOADER) {
    if (OPTIONS.BUCKET_SERVICE) {
      const result = (function (val: BucketService) {
        let res: FileUploadOptions | undefined;
        switch (val) {
          case BucketService.AWS_S3:
            if (!AWS_BUCKET_NAME || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
              throw new Error(
                'missing env config options: AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY',
              );
            }
            res = {
              bucket: AWS_BUCKET_NAME,
              region: AWS_REGION,
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            };
            break;
          // case BucketService.CLOUDINARY:
          //   res = {};
          //   break
          case BucketService.DIGITALOCEAN_SPACE:
            if (
              !AWS_BUCKET_NAME ||
              !AWS_REGION ||
              !AWS_ACCESS_KEY_ID ||
              !AWS_SECRET_ACCESS_KEY ||
              !DIGITALOCEAN_SPACE_ENDPOINT
            ) {
              throw new Error(
                'missing env config options: AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY',
              );
            }
            res = {
              bucket: AWS_BUCKET_NAME,
              region: AWS_REGION,
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
              digitaloceanEndpoint: DIGITALOCEAN_SPACE_ENDPOINT,
            };
            break;

          case BucketService.DISK:
            if (!MULTER_STORAGE_PATH) {
              throw new Error(
                `MULTER_STORAGE_PATH option must be set to use USE_FILE_UPLOADER ${BucketService.DISK} option`,
              );
            }
            res = { rootPath: MULTER_STORAGE_PATH };
            break;
          case BucketService.MEMORY:
            res = undefined;
            break;
          default:
            res = undefined;
        }
        return res;
      })(OPTIONS.BUCKET_SERVICE);
      BUCKET_CONFIG = result;
    } else {
      throw new Error(
        `BUCKET_SERVICE option must be set to one of ${Object.values(BucketService)} to use USE_FILE_UPLOADER`,
      );
    }
  }

  if (OPTIONS.USE_REFRESH_TOKEN) {
    if (!REFRESH_JWT_KEY || !REFRESH_JWT_TIMEOUT) {
      throw Error('missing env config options: REFRESH_JWT_KEY, REFRESH_JWT_TIMEOUT');
    }
  }

  if (OPTIONS.USE_OAUTH_GOOGLE) {
    if (
      !API_HOST ||
      !GOOGLE_API_CLIENT_ID ||
      !GOOGLE_API_CLIENT_SECRET ||
      !GOOGLE_API_REDIRECT ||
      !FRONTEND_GOOGLE_LOGIN_URI
    ) {
      throw new Error(
        'missing env config options: API_HOST, GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT, FRONTEND_GOOGLE_LOGIN_URI',
      );
    }
  }
}
