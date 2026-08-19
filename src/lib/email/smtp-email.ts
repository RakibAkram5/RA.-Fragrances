import "server-only";

import type { EmailMessage, EmailProvider } from "@/lib/email/email";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  from: string;
}

/** Real SMTP delivery via nodemailer (loaded lazily). */
export class SmtpEmailProvider implements EmailProvider {
  constructor(private config: SmtpConfig) {}

  async send(message: EmailMessage): Promise<void> {
    const { default: nodemailer } = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: { user: this.config.user, pass: this.config.pass },
    });
    await transport.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
