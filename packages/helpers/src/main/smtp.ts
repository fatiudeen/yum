import nodeMailer from 'nodemailer';
// import * as Config from '@config';
// import { UserInterface } from '@interfaces/User.Interface';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type Opts = {
  // smtpService: string;
  smtpHostName: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  domainEmail: string;
};

export interface EmailHelperInterface {
  send(param: { to: string; subject?: string; template: string; variables?: Record<string, string> }): Promise<void>;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'smtp';
  template: Record<string, string | [string, Record<string, string | number>]>;
}

type SendData = {
  to: string;
  from: string;
  subject?: string;
  html?: string;
  template?: string;
  header?: Record<string, any>;
  'h:X-Mailgun-Variables'?: string;
};

export class SMTPMailer implements EmailHelperInterface {
  private transporter: nodeMailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(
    private cred: Opts,
    private config: EmailConfig,
  ) {
    this.transporter = nodeMailer.createTransport(<SMTPTransport.Options>{
      // service: cred.smtpService,
      host: cred.smtpHostName,
      port: cred.smtpPort,
      auth: {
        user: cred.smtpUsername,
        pass: cred.smtpPassword,
      },
    });

    this.transporter.verify();
  }

  getSendGridHeader(templateId: string, dynamicData: Record<string, string | number>) {
    return {
      'X-SMTPAPI': JSON.stringify({
        filters: {
          templates: {
            settings: {
              enable: 1,
              template_id: templateId,
            },
          },
        },
        sub: Object.fromEntries(
          Object.entries(dynamicData).map(([k, v]) => {
            return [`%${k}%`, [v]];
          }),
        ),
      }),
    };
  }

  async send({ to, subject, template }: { to: string; subject?: string; template: string }) {
    if (!template) {
      throw 'provide html template or email template id';
    }

    if (!(template in this.config.template)) {
      throw 'invalid template, template not in config';
    }
    const data: SendData = {
      from: this.cred.domainEmail,
      to,
      subject,
      // html: template,
    };

    const htmlOrTemplate = this.config.template[template];

    switch (this.config.provider) {
      case 'sendgrid':
        typeof htmlOrTemplate === 'string'
          ? (data['html'] = htmlOrTemplate)
          : (data['header'] = this.getSendGridHeader(htmlOrTemplate[0], htmlOrTemplate[1] || {}));
        break;
      case 'mailgun':
        typeof htmlOrTemplate === 'string'
          ? (data['html'] = htmlOrTemplate)
          : ((data['template'] = htmlOrTemplate[0]),
            (data['h:X-Mailgun-Variables'] = JSON.stringify(htmlOrTemplate[1])));
      default:
        break;
    }

    await this.transporter.sendMail(data);
  }
}
