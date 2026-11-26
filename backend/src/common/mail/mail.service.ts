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
        // Un serveur d'envoi qui ne répond pas ne doit pas bloquer l'inscription ou la demande de code (défauts : 2 min à 10 min).
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
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

  /**
   * Diagnostic pour l'administrateur : ce qui est configuré (sans le moindre secret) et si le serveur d'envoi répond.
   * `reachable` vaut null quand rien n'est configuré.
   */
  async check(): Promise<{ configured: boolean; host: string | null; port: number | null; secure: boolean; from: string | null; authenticated: boolean; reachable: boolean | null; error: string | null }> {
    const configured = this.isConfigured();
    const base = {
      configured,
      host: process.env.SMTP_HOST || null,
      port: configured ? Number(process.env.SMTP_PORT || 587) : null,
      secure: process.env.SMTP_SECURE === 'true',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
      authenticated: !!process.env.SMTP_USER,
    };
    if (!configured) return { ...base, reachable: null, error: null };
    try {
      await this.transport().verify();
      return { ...base, reachable: true, error: null };
    } catch (e: any) {
      return { ...base, reachable: false, error: String(e?.message || e).slice(0, 300) };
    }
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
