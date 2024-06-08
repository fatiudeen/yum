import { Router } from 'express';
import { Controller } from './controller';
import { validator } from './middlewares';
import { ValidationChain } from 'express-validator';
import { authorize } from './middlewares';
import { FileUploader } from '@yumm/helpers';
// import dto from '@dtos/dto';

export abstract class Route<T> {
  abstract path: string;
  readonly router: Router;
  abstract controller: Controller<T>;
  abstract dto: Record<string, ValidationChain[]> | null;
  readonly validator = validator;
  readonly fileProcessor = FileUploader;
  readonly authorize = authorize;
  constructor() {
    // useAuth = false, role: string | undefined = undefined
    this.router = Router();
    // if (useAuth) {
    //   this.router.use(this.authorize(role)); TODO:
    // }
  }

  abstract initRoutes(): Router;
}
