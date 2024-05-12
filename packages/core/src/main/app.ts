/* eslint-disable object-curly-newline */
import express, { Application, Request } from 'express';
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
import AuthRoute from '@routes/auth.route';
import db from '@helpers/db';
import { logger } from '@utils/logger';
import { errorHandler } from '@middlewares/errorHandler';
import docs from '@middlewares/docs';
import UsersRoute from '@routes/user.route';
import * as Config from '@config';
import { rateLimiter } from '@middlewares/rateLimiter';
import Route from '@routes/route';
import session from 'express-session';
// import visitCount from '@middlewares/visitCount';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const MongoDBStore = require('connect-mongodb-session')(session);

class App {
  private app: Application;
  useSocket = Config.OPTIONS.USE_SOCKETS;
  useAnalytics = Config.OPTIONS.USE_ANALYTICS;
  io?: Server;
  private apiVersion = '/api/v1';
  private routes: Record<string, Route<any>> = {
    '': new AuthRoute(),
    users: new UsersRoute(true),
  };
  httpServer;
  constructor(routes?: Record<string, Route<any>>) {
    this.app = express();
    if (this.useSocket) {
      this.httpServer = createServer(this.app);
      this.io = new Server(this.httpServer, {
        cors: {
          origin: '*',
        },
      });
    }
    this.initMiddlewares();
    if (routes) {
      Object.assign(this.routes, routes);
    }
    this.initRoutes();
    this.initErrorHandlers();
  }

  private initRoutes() {
    if (Config.OPTIONS.USE_MULTER_DISK_STORAGE) {
      this.app.use(`${this.apiVersion}/${Config.MULTER_STORAGE_PATH}`, express.static(Config.CONSTANTS.ROOT_PATH));
    }
    Object.entries(this.routes).forEach(([url, route]) => {
      this.app.use(`${this.apiVersion}/${url}`, route.initRoutes());
    });
    this.app.use('/docs', docs);
    this.app.get('/', (req, res) => {
      res.status(200).json({ message: 'WELCOME' });
    });
  }
  private initMiddlewares() {
    this.app.use(
      cors({
        origin: ['*'],
      }),
    );
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('dev'));
    this.app.use(express.json());
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(xss());
    this.app.use(mongoSanitize());
    this.app.use(compression());
    this.app.use(methodOverride());
    if (Config.NODE_ENV !== 'development') {
      this.app.use(`${this.apiVersion}`, rateLimiter);
    }
    if (Config.NODE_ENV !== 'test' && this.useAnalytics) {
      this.visitCount(Config.DB_URI);
    }
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

  private visitCount(connectionString: string) {
    const Session: session.SessionOptions = {
      secret: Config.JWT_KEY,
      resave: false,
      store: new MongoDBStore({
        uri: connectionString,
        collection: 'cookie_sessions',
      }),
      rolling: true,
      saveUninitialized: true,
      cookie: {
        // path: '/',
        httpOnly: false,
        sameSite: 'none',
        secure: false,
        // maxAge: 1000 * 60 * 5, // one minuit
      },
    };
    this.app.use(session(Session));
    // this.app.use(visitCount());
  }

  public listen(port: number, connectionString: string) {
    const server = this.useSocket ? this.httpServer! : this.app;

    db(connectionString);
    server.listen(port, () => {
      logger.info(`running on port ${port}`);
    });
  }

  public instance() {
    return this.app;
  }
}

export default App;
