/* eslint-disable indent */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import { HttpError, Service } from '.';
import * as Config from '../config';
import {} from './service';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Repository } from './data';
import Emitter from 'events';

// otp has to auto generate code

// const exampleSchema = new mongoose.Schema({
//   data: String,  // Other fields in your document
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     expires: 300 // TTL index in seconds (5 minutes)
//   }
// });

interface UserEntity {
  email: string;
  password: string;
  role: string;
  avatar: string;
  verified: {
    email: Boolean;
  };
}

interface AuthSessionEntity {
  userId: string;
  expired: boolean;
  isLoggedIn: boolean;
  lastLoggedIn: string;
  token: string;
}

interface OTPEntity {
  userId: string;
  otp?: string;
  expires?: string;
}

interface AuthEventInterface {
  'login.user': (data: DocType<UserEntity>) => void;
  'create.user': (data: { email: string; otp?: string | number }) => void;
  'mail.verified': (data: DocType<UserEntity>) => void;
  'resend.token': (data: { email: string; otp?: string | number }) => void;
  'reset.token': (data: { email: string; otp?: string | number }) => void;
  'password.updated': (data: DocType<UserEntity>) => void;
  'login.oauth': (data: DocType<UserEntity>) => void;
}

class AuthEmitter extends Emitter {
  on<K extends keyof AuthEventInterface>(eventName: K, listener: AuthEventInterface[K]): this {
    return super.on(eventName, listener);
  }

  emit<K extends keyof AuthEventInterface>(eventName: K, ...args: Parameters<AuthEventInterface[K]>): boolean {
    return super.emit(eventName, ...args);
  }
}

export abstract class BaseAuthService<
  T extends AuthSessionEntity,
  R extends Repository<T>,
  U extends UserEntity,
  O extends OTPEntity,
> extends Service<T, R> {
  protected abstract repository: R;
  protected abstract defaultRole: string;
  protected abstract readonly _userService: () => Service<U, Repository<U>>;
  protected abstract readonly _otpService: () => Service<O, Repository<O>>;
  // protected abstract emailConfig: EmailConfig;
  // private emailCred = {
  //   smtpHostName: Config.SMTP_HOST,
  //   smtpPort: +Config.SMTP_PORT,
  //   smtpUsername: Config.SMTP_USERNAME,
  //   smtpPassword: Config.SMTP_PASSWORD,
  //   domainEmail: Config.SMTP_SENDER_EMAIL,
  // };
  useSessions = Config.OPTIONS.USE_AUTH_SESSIONS;
  userRefreshToken = Config.OPTIONS.USE_REFRESH_TOKEN;
  useGoogle = Config.OPTIONS.USE_OAUTH_GOOGLE;
  oAuth2Client = this.useGoogle
    ? new google.auth.OAuth2(
        Config.GOOGLE_API_CLIENT_ID,
        Config.GOOGLE_API_CLIENT_SECRET,
        `${Config.API_HOST}/api/v1/google`,
      )
    : null;
  oauth2 = this.useGoogle ? google.oauth2('v2') : null;

  protected authEvents = new AuthEmitter();

  async login(data: { email: string; password: string }) {
    try {
      const loginData = { email: data.email } as Partial<U>;
      const user = await this._userService().findOne(loginData);
      if (!user) throw new HttpError(Config.MESSAGES.INVALID_CREDENTIALS, 401);
      const isMatch = await this.comparePasswords(data.password, user);
      if (!isMatch) throw new HttpError(Config.MESSAGES.INVALID_CREDENTIALS, 401);
      // if (!user.verifiedEmail) throw new HttpError('Email not verified', 400);
      const token = this.getSignedToken(user);

      // create a session
      const refreshToken = await this.createSession(user.id, token);
      this.authEvents.emit('login.user', user);

      return { token, user, refreshToken };
    } catch (error) {
      throw error;
    }
  }

  async createSession(userId: string, token: string) {
    let sessionData = { userId: userId } as Partial<T>;
    let session = await this.findOne(sessionData);
    const expSession = { expired: true } as Partial<T>;
    if (session) this.update(session.id, expSession);
    sessionData = {
      userId: userId,
      token,
      isLoggedIn: true,
      lastLoggedIn: new Date().toISOString(),
    } as Partial<T>;
    session = await this.create(sessionData);
    if (this.userRefreshToken) {
      return this.getRefreshToken(session);
    } else return null;
  }

  async createUser(data: Partial<U>, role = this.defaultRole) {
    try {
      const userData = { email: <string>data.email } as Partial<U>;
      const user = await this._userService().findOne(userData);
      if (user) throw new HttpError(Config.MESSAGES.USER_EXISTS, 406);

      data.role = role;
      data.password = await this.toHash(data.password!);
      const result = await this._userService().create(data);
      const otpData = { userId: result.id } as Partial<O>;
      const token = (await this._otpService().create(otpData)).otp;
      this.authEvents.emit('create.user', { email: user!.email, otp: token });

      const accessToken = this.getSignedToken(result);
      return { ...result, token: accessToken };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(token: string, email: string) {
    try {
      let userData = {
        email,
      } as Partial<U>;
      const user = await this._userService().findOne(userData);
      if (!user) throw new HttpError(Config.MESSAGES.INVALID_CREDENTIALS, 406);
      if (user.verified.email) throw new HttpError('User is Already Verified', 404);
      user.verified.email = true;
      await this._userService().save(user);
      this.authEvents.emit('mail.verified', user);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async ResendVerificationEmail(data: Partial<U>) {
    try {
      let userData = {
        email: data.email,
      } as Partial<U>;
      const user = await this._userService().findOne(userData);
      if (!user) throw new HttpError('User Not Found', 404);
      if (user.verified.email) throw new HttpError('User is Already Verified', 404);
      const otpData = { userId: user.id } as Partial<O>;

      const token = (await this._otpService().create(otpData)).otp;
      this.authEvents.emit('resend.token', { email: user!.email, otp: token });

      const result = { info: 'Email Sent' };
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getResetToken(email: string) {
    try {
      let userData = {
        email,
      } as Partial<U>;
      const user = await this._userService().findOne(userData);
      if (!user) throw new HttpError(Config.MESSAGES.INVALID_CREDENTIALS, 404);
      const otpData = { userId: user.id } as Partial<O>;
      const otp = await this._otpService().findOne(otpData);
      if (otp) this._otpService().delete(otp.id);
      const token = (await this._otpService().create(otpData)).otp;
      this.authEvents.emit('reset.token', { email: user!.email, otp: token });
    } catch (error) {
      throw error;
    }
  }
  async resetPassword(email: string, token: string, password: string) {
    try {
      const userData = { email } as Partial<U>;
      const user = await this._userService().findOne(userData);
      if (!user) throw new HttpError(Config.MESSAGES.INVALID_CREDENTIALS, 404);
      const otpData = { otp: token, userId: user.id } as Partial<O>;

      const otp = await this._otpService().findOne(otpData);
      if (!otp) throw new HttpError('invalid otp code', 403);

      userData.password = await this.toHash(password);
      delete userData.email;

      await this._userService().update(user.id, userData);
      this.authEvents.emit('password.updated', user);
      return;
    } catch (error) {
      throw error;
    }
  }
  oAuthUrls(state: string) {
    let googleLoginUrl;
    if (this.useGoogle) {
      googleLoginUrl = this.oAuth2Client!.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
        state,
      });
    }

    return { googleLoginUrl };
  }

  async googleLogin(code: string, state: string) {
    try {
      if (!this.oAuth2Client || !this.oauth2) return null;
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.credentials = tokens;

      const {
        // eslint-disable-next-line no-unused-vars, camelcase, object-curly-newline
        data: { email, id, given_name, family_name, picture },
      } = await this.oauth2.userinfo.v2.me.get({
        auth: this.oAuth2Client,
      });
      const userData = { email: <string>email } as Partial<U>;
      const firstName = given_name!;
      const lastName = family_name!;
      const fullName = firstName + ' ' + lastName;
      const updateData = {
        firstName,
        lastName,
        fullName,
        $setOnInsert: {
          fromOauth: false,
          'verified.email': true,
          avatar: picture || '',
          role: this.defaultRole,
          email: <string>email,
        },
      } as any;

      const user = await this._userService().update(userData, updateData, true);
      const token = this.getSignedToken(user!);
      this.authEvents.emit('login.oauth', user!);
      return `${state}?token=${token}`;
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      if (!this.userRefreshToken) throw new Error(Config.MESSAGES.INVALID_SESSION);
      const id = (<{ id: string }>jwt.verify(refreshToken, Config.REFRESH_JWT_KEY)).id;
      const session = await this.findOne(id);
      if (!session) throw new Error(Config.MESSAGES.INVALID_SESSION);
      const user = await this._userService().findOne(<string>session.userId);
      const token = this.getSignedToken(user!);
      const authData = { token } as Partial<T>;
      await this.update(session.id, authData);
      return { token };
    } catch (error) {
      throw error;
    }
  }

  getSignedToken(user: DocType<U>) {
    return jwt.sign({ id: user.id }, Config.JWT_KEY, { expiresIn: Config.JWT_TIMEOUT });
  }

  async newSession(user: U & { id: string; token: string }) {
    const authData = { userId: user.id } as Partial<T>;
    let session = await this.findOne(authData);
    if (session) this.delete(session.id);
    authData.token = user.token;
    authData.isLoggedIn = true;
    session = await this.create(authData);
  }
  getRefreshToken = (session: DocType<T>) => {
    return jwt.sign({ id: session.id }, Config.REFRESH_JWT_KEY, { expiresIn: Config.REFRESH_JWT_TIMEOUT });
  };

  toHash = async (password: string) => {
    const salt = randomBytes(8).toString('hex');
    const buf = <Buffer>await promisify(scrypt)(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
  };

  comparePasswords = async (password: string, user: U) => {
    const [hashPassword, salt] = user.password.split('.');
    const buf = <Buffer>await promisify(scrypt)(password, salt, 64);
    return buf.toString('hex') === hashPassword;
  };

  static toHash = async (password: string) => {
    const salt = randomBytes(8).toString('hex');
    const buf = <Buffer>await promisify(scrypt)(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
  };

  static comparePasswords = async (password: string, user: UserEntity) => {
    const [hashPassword, salt] = user.password.split('.');
    const buf = <Buffer>await promisify(scrypt)(password, salt, 64);
    return buf.toString('hex') === hashPassword;
  };
}
