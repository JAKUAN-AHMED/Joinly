import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendOtpEmail(email: string, otpCode: string, purpose: string): Promise<void> {
    const subject = `Senior Connect — ${purpose}`;
    const text = `Your verification code is ${otpCode}. It expires in ${
      process.env.OTP_EXPIRES_IN_MINUTES || 5
    } minutes.`;

    if (!process.env.SMTP_HOST) {
      this.logger.log(`[DEV] OTP for ${email} (${purpose}): ${otpCode}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@seniorconnect.io',
      to: email,
      subject,
      text,
    });
  }
}
