/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './HttpError';
import { AxiosError } from 'axios';
import jwt from 'jsonwebtoken';
import { MESSAGES, JWT_KEY, OPTIONS } from '../config';
import rateLimit from 'express-rate-limit';
import { ValidationChain, validationResult, matchedData } from 'express-validator';

// eslint-disable-next-line import/prefer-default-export
export const errorHandler = (err: HttpError | Error, req: Request, res: Response, next: NextFunction) => {
  let error: any;

  if (typeof err === 'object') error = { ...err };
  else if (typeof err === 'string') error.message = err;
  error.message = err.message;

  let statusCode: number;
  if ('statusCode' in error) {
    statusCode = error.statusCode;
  } else {
    statusCode = 500;
  }

  if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
  }

  // if ((error.code = 11000)) {
  //   const key = Object.keys(error.keyValue)[0];
  //   const value = Object.values(error.keyValue)[0];
  //   statusCode = 400;
  //   error.message = `duplicate ${key}: ${value}`;
  // }

  if (error.name === 'AxiosError') {
    const _error: AxiosError = error;
    let _message;
    if (_error.message) {
      _message = _error.message;
    } else if (_error.response) {
      if (typeof _error.response.data === 'object') {
        const message = <any>_error.response.data;
        _message = message.message;
      } else _message = <string>_error.response.data;
    } else if (_error.request) {
      if (typeof _error.request.data === 'object') {
        const message = <any>_error.request.data;
        _message = message.message;
      } else _message = <string>_error.request.data;
    }
    statusCode = _error.response?.status || 400;
    error = { message: _message };
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    error,
  });
};

export const authorize =
  // eslint-disable-next-line consistent-return


    <T>(getUserFn: (id: string) => Promise<T>, otherVerificationFns?: Array<(user: T) => Promise<boolean>>) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token =
          req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer'
            ? req.headers.authorization.split(' ')[1]
            : null;

        if (!token) {
          return next(new HttpError(MESSAGES.UNAUTHORIZED, 401));
        }

        const decoded = <any>jwt.verify(token, JWT_KEY);

        const user = await getUserFn(<string>decoded.id);

        if (!user) {
          return next(new HttpError(MESSAGES.UNAUTHORIZED, 401));
        }

        if (otherVerificationFns && otherVerificationFns.length > 0) {
          const result: Array<boolean> = [];
          for await (const v of otherVerificationFns) {
            const r = await v(user);
            result.push(r);
          }

          if (result.includes(false)) {
            return next(new HttpError(MESSAGES.UNAUTHORIZED, 401));
          }
        }
        req.user = user;

        return next();
      } catch (error) {
        next(error);
      }
    };

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true,
});

export const validator = (dtos: ValidationChain[], allowExtraFields = true) => [
  ...dtos,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array();
      throw new HttpError('user input validation error', 400, error);
    }

    if (!allowExtraFields) {
      // Fields validation
      // eslint-disable-next-line no-use-before-define
      const extraFields = checkIfExtraFields(req);
      if (extraFields) {
        // eslint-disable-next-line nonblock-statement-body-position
        throw new HttpError('user input validation error', 400, {
          details: 'request contains unspecified input',
        });
      }
    }
    next();
  },
];

function checkIfExtraFields(req: Request) {
  const allowedFields = Object.keys(matchedData(req)).sort();

  // Check for all common request inputs
  const requestInput = { ...req.query, ...req.params, ...req.body };
  const requestFields = Object.keys(requestInput).sort();

  if (JSON.stringify(allowedFields) === JSON.stringify(requestFields)) {
    return false;
  }
  return true;
}
