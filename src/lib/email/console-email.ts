import "server-only";

import type { EmailMessage, EmailProvider } from "@/lib/email/email";

export interface OutboxEntry {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  createdAt: Date;
}

/** Development-only outbox (in-memory) so emails can be inspected locally. */
const outbox: OutboxEntry[] = [];

export function getOutbox(): OutboxEntry[] {
  return [...outbox].reverse();
}

/**
 * Logs emails to the server console and stores them in a dev outbox.
 * This provider never requires real SMTP credentials — in production set
 * EMAIL_DRIVER=smtp so real emails are delivered.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    outbox.push({
      id: Math.random().toString(36).slice(2),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      createdAt: new Date(),
    });
    // Keep the outbox bounded.
    if (outbox.length > 50) outbox.splice(0, outbox.length - 50);

    console.log("\n──────────────────────────────────────────────");
    console.log(`[email:console] TO: ${message.to}`);
    console.log(`[email:console] SUBJECT: ${message.subject}`);
    console.log("──────────────────────────────────────────────");
    console.log(message.text);
    console.log("──────────────────────────────────────────────\n");
  }
}
