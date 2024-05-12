import nodeMailer from 'nodemailer';
// import * as Config from '@config';
// import { UserInterface } from '@interfaces/User.Interface';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type Opts = {
  smtpService: string;
  smtpHostName: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  domainEmail: string;
};

export class SMTPMailer {
  private transporter: nodeMailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private options: Opts) {
    this.transporter = nodeMailer.createTransport(<SMTPTransport.Options>{
      service: options.smtpService,
      host: options.smtpHostName,
      port: options.smtpPort,
      secure: false, // use TLS
      auth: {
        user: this.options.smtpUsername,
        pass: this.options.smtpPassword,
      },
      // tls: {
      //     // do not fail on invalid certs
      //     rejectUnauthorized: false,
      //   }
    });
  }

  async send(to: string | string[], subject: string, template: string) {
    await this.transporter.sendMail({
      from: this.options.domainEmail,
      to,
      subject,
      // text,
      html: template,
    });
  }
  // async verifyEmail(user: UserInterface) {
  //   // eslint-disable-next-line no-useless-catch
  //   try {
  //     await this.send(user.email, 'VERIFY YOUR EMAIL ADDRESS', 'example');
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async sendResetPassword(user: UserInterface) {
  //   // eslint-disable-next-line no-useless-catch
  //   try {
  //     await this.send(user.email, 'PASSWORD RESET TOKEN', 'example');
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
