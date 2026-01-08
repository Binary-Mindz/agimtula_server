import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class SmtpMailService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      // service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        html,
      });
      return info;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        `Failed to send email`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
