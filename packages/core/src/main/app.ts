/* eslint-disable object-curly-newline */
import express, { Application, Request, RequestHandler } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import hpp from 'hpp';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import methodOverride from 'method-override';
import { DB } from './data';
import { logger } from '@yumm/utils';
import { errorHandler } from './middlewares';
// import docs from '@middlewares/docs';
// import UsersRoute from '@routes/user.route';
import * as Config from '../config';
// import { rateLimiter } from '@middlewares/rateLimiter';
import { Route } from './router';
import { BucketService } from '@yumm/helpers';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
// import session from 'express-session';
// import visitCount from '@middlewares/visitCount';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
// const MongoDBStore = require('connect-mongodb-session')(session);

export type AppOptions = { routes?: Array<new (...args: any[]) => Route<any>>; middlewares?: Array<RequestHandler> };

export class App {
  private app: Application;
  static _instance: Application;
  useSocket = Config.OPTIONS.USE_SOCKETS;
  useAnalytics = Config.OPTIONS.USE_ANALYTICS;
  io?: Server;
  private apiVersion = '/api/v1';
  private routes: Array<new (...args: any[]) => Route<any>> = []; // Array<Route<any>> = [];
  private middlewares: Array<RequestHandler> = [];

  httpServer;
  private constructor({ routes, middlewares }: AppOptions = { routes: [], middlewares: [] }) {
    this.app = express();
    if (this.useSocket) {
      this.httpServer = createServer(this.app);
      this.io = new Server(this.httpServer, {
        cors: {
          origin: '*',
        },
      });
    }
    if (middlewares) {
      this.middlewares.push(...middlewares);
    }
    this.initMiddlewares();
    if (routes) {
      this.routes.push(...routes);
    }

    this.initRoutes();
    this.initErrorHandlers();
  }

  private initRoutes() {
    if (Config.OPTIONS.BUCKET_SERVICE === BucketService.DISK) {
      this.app.use(`${this.apiVersion}/${Config.MULTER_STORAGE_PATH}`, express.static(Config.ROOT_PATH));
    }
    this.routes.forEach((route) => {
      const r = new route();
      this.app.use(`${this.apiVersion}/${r.path}`, r.initRoutes());
    });
    // this.app.use('/docs', docs);
    this.app.get('/', (req, res) => {
      res
        .status(200)
        .json({ message: 'We both know you are not supposed to be here, but since you are, have a cup of coffee ☕' });
    });
  }
  private initMiddlewares() {
    this.app.use(
      cors({
        origin: ['*'],
      }),
    );

    this.middlewares.forEach((middleware) => {
      this.app.use(middleware);
    });
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('dev'));
    this.app.use(express.json());
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(xss());
    this.app.use(mongoSanitize());
    this.app.use(compression());
    this.app.use(methodOverride());
    // if (Config.NODE_ENV !== 'development') {
    //   this.app.use(`${this.apiVersion}`, rateLimiter);
    // }
    // if (Config.NODE_ENV !== 'test' && this.useAnalytics) {
    //   this.visitCount(Config.DB_URI);
    // }
    if (this.useSocket) {
      this.app.use((req, res, next) => {
        req.io = this.io!;
        next();
      });
    }
  }

  private initErrorHandlers() {
    this.app.use(errorHandler);
    this.app.use('*', (req, res) => {
      res.status(404).json({ msg: 'Route not found' });
    });
  }

  // private visitCount(connectionString: string) {
  //   const Session: session.SessionOptions = {
  //     secret: Config.JWT_KEY,
  //     resave: false,
  //     store: new MongoDBStore({
  //       uri: connectionString,
  //       collection: 'cookie_sessions',
  //     }),
  //     rolling: true,
  //     saveUninitialized: true,
  //     cookie: {
  //       // path: '/',
  //       httpOnly: false,
  //       sameSite: 'none',
  //       secure: false,
  //       // maxAge: 1000 * 60 * 5, // one minuit
  //     },
  //   };
  // this.app.use(session(Session));
  // this.app.use(visitCount());
  // }

  public listen(port: number, connectionString: string) {
    const server = this.useSocket ? this.httpServer! : this.app;

    DB(connectionString);
    server.listen(port, () => {
      logger.info(`running on port ${port}`);
    });
  }

  static instance(opts: AppOptions = { routes: [], middlewares: [] }) {
    if (!App._instance) {
      App._instance = new App(opts).app;
      return App._instance;
    }
    return App._instance;
  }
}
