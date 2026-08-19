import "server-only";

import { ApiError } from "@/lib/route-helpers";
import { ConsoleEmailProvider } from "@/lib/email/console-email";
import { SmtpEmailProvider } from "@/lib/email/smtp-email";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export function getEmailProvider(): EmailProvider {
  const driver = process.env.EMAIL_DRIVER || "console";
  if (driver === "smtp") {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new ApiError(
        503,
        "Email is not configured. Set SMTP_* environment variables or use EMAIL_DRIVER=console.",
      );
    }
    return new SmtpEmailProvider({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      secure: process.env.SMTP_SECURE === "true",
      from: process.env.EMAIL_FROM || "RA Fragrances <no-reply@ra-fragrances.pk>",
    });
  }
  return new ConsoleEmailProvider();
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await getEmailProvider().send(message);
}
