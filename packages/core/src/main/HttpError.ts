// import httpStatus from 'http-status';

export class HttpError extends Error {
  statusCode: number;
  data: object | null;

  constructor(message: string, statusCode?: number, data?: object) {
    super(message);
    this.statusCode = statusCode === undefined ? 500 : statusCode;
    this.data = data === undefined ? null : data;
  }
}

export class NotFoundError extends HttpError {
  constructor(item: string | undefined, statusCode?: number, data?: object) {
    const message = item ? `${item} not found` : 'Not found';
    super(message, statusCode || 404, data);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', data?: object) {
    super(message, 401, data);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request', data?: object) {
    super(message, 400, data);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', data?: object) {
    super(message, 403, data);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal Server Error', data?: object) {
    super(message, 500, data);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict', data?: object) {
    super(message, 409, data);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Unprocessable Entity', data?: object) {
    super(message, 422, data);
  }
}
