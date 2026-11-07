import { Global, Injectable, Logger, Module, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  replyTo?: string;
}

/**
 * Envoi d'emails (factures, relances, réinitialisation de mot de passe).
 * Configuration : SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE ("true" pour le port 465).
 * Sans configuration, `send` échoue clairement et `trySend` se contente de journaliser.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private transporter: nodemailer.Transporter | null = null;

  isConfigured(): boolean {
    return !!process.env.SMTP_HOST && !!(process.env.SMTP_FROM || process.env.SMTP_USER);
  }

  private transport(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
    }
    return this.transporter;
  }

  async send(input: MailInput): Promise<{ messageId: string }> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException("L'envoi d'emails n'est pas configuré (variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).");
    }
    const info = await this.transport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
      replyTo: input.replyTo,
    });
    return { messageId: String(info.messageId) };
  }

  /** N'échoue jamais : renvoie false si l'email n'a pas pu partir. */
  async trySend(input: MailInput): Promise<boolean> {
    try {
      await this.send(input);
      return true;
    } catch (e: any) {
      this.logger.warn(`Email non envoyé (${input.subject}) : ${e?.message || e}`);
      return false;
    }
  }
}

@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
