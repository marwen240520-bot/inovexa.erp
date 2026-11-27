// Emails d'abonnement et de paiement (reçu, fin d'essai, échéance, suspension, remboursement…), en français, anglais et
// espagnol : la langue est celle de l'interface choisie par le client à l'inscription (users.language).
import { button, escapeHtml, layout, muted, type MailLang, type RenderedMail } from './auth-mails';

const LOCALES: Record<MailLang, string> = { fr: 'fr-TN', en: 'en-GB', es: 'es-ES' };

/** 12 mars 2027 à 14:30, heure de Tunis, dans la langue du client. */
export function mailDate(lang: MailLang, d: Date | string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Tunis' }).format(new Date(d));
  } catch {
    return String(d);
  }
}

/** « 34,51 USD » / « 34.51 USD » selon la langue ; le code de la devise reste affiché tel quel. */
export function mailMoney(lang: MailLang, amount: number, currency: string): string {
  try {
    const digits = currency === 'TND' ? 3 : 2;
    return `${new Intl.NumberFormat(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(amount))} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

interface Shell { hello: (n: string) => string; sign: string }
const SHELL: Record<MailLang, Shell> = {
  fr: { hello: (n) => `Bonjour ${n},`, sign: 'L’équipe Inovexa ERP' },
  en: { hello: (n) => `Hello ${n},`, sign: 'The Inovexa ERP team' },
  es: { hello: (n) => `Hola ${n},`, sign: 'El equipo de Inovexa ERP' },
};

/** Message simple : salutation, paragraphes, bouton facultatif, signature — en texte brut ET en HTML. */
function compose(lang: MailLang, subject: string, paragraphs: string[], cta?: { url: string; label: string }, name = '', note?: string): RenderedMail {
  const S = SHELL[lang];
  const text = [S.hello(name), '', ...paragraphs.flatMap((p) => [p, '']), ...(cta ? [`${cta.label} : ${cta.url}`, ''] : []), ...(note ? [note, ''] : []), S.sign].join('\n');
  const body = `<p style="margin:0 0 12px">${escapeHtml(S.hello(name))}</p>`
    + paragraphs.map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join('')
    + (cta ? button(cta.url, cta.label) : '')
    + (note ? muted(escapeHtml(note)) : '')
    + `<p style="margin:18px 0 0">${escapeHtml(S.sign)}</p>`;
  return { subject, text, html: layout(lang, paragraphs[0] || subject, subject, body) };
}

// ───────────── Paiement reçu ─────────────

export function receiptMail(input: {
  lang: MailLang; name: string; online: boolean; amount: number; currency: string; planName: string; periodEnd: Date | null; receiptNumber: string; url: string;
  /** Montant réellement débité par le prestataire quand il diffère de la devise des formules (Flouci : en dinars). */
  charged?: { amount: number; currency: string } | null;
}): RenderedMail {
  const { lang } = input;
  const paid = mailMoney(lang, input.amount, input.currency);
  const end = mailDate(lang, input.periodEnd);
  const charged = input.charged && input.charged.currency !== input.currency ? mailMoney(lang, input.charged.amount, input.charged.currency) : null;
  const T = {
    fr: {
      subject: `${input.online ? 'Paiement reçu' : 'Paiement validé'} — reçu ${input.receiptNumber}`,
      lines: [input.online ? `Nous avons bien reçu votre paiement en ligne de ${paid} TTC.` : `Votre paiement de ${paid} TTC est validé.`, ...(charged ? [`Montant débité par Flouci : ${charged}.`] : []), `Formule ${input.planName} : accès jusqu’au ${end}.`, `Reçu n° ${input.receiptNumber}.`],
      cta: 'Voir mon abonnement et mon reçu', note: 'Merci pour votre confiance.',
    },
    en: {
      subject: `${input.online ? 'Payment received' : 'Payment confirmed'} — receipt ${input.receiptNumber}`,
      lines: [input.online ? `We have received your online payment of ${paid} incl. VAT.` : `Your payment of ${paid} incl. VAT is confirmed.`, ...(charged ? [`Amount charged by Flouci: ${charged}.`] : []), `${input.planName} plan: access until ${end}.`, `Receipt no. ${input.receiptNumber}.`],
      cta: 'View my subscription and receipt', note: 'Thank you for your trust.',
    },
    es: {
      subject: `${input.online ? 'Pago recibido' : 'Pago validado'} — recibo ${input.receiptNumber}`,
      lines: [input.online ? `Hemos recibido su pago en línea de ${paid} IVA incluido.` : `Su pago de ${paid} IVA incluido está validado.`, ...(charged ? [`Importe cobrado por Flouci: ${charged}.`] : []), `Plan ${input.planName}: acceso hasta el ${end}.`, `Recibo n.º ${input.receiptNumber}.`],
      cta: 'Ver mi suscripción y mi recibo', note: 'Gracias por su confianza.',
    },
  }[lang];
  return compose(lang, T.subject, T.lines, { url: input.url, label: T.cta }, input.name, T.note);
}

// ───────────── Fin de l'essai ou de l'abonnement ─────────────

export function expiredMail(input: { lang: MailLang; name: string; reason: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED'; url: string }): RenderedMail {
  const trial = input.reason === 'TRIAL_EXPIRED';
  const T = {
    fr: { subject: trial ? 'Votre essai gratuit Inovexa ERP est terminé' : 'Votre abonnement Inovexa ERP est arrivé à échéance', body: trial ? 'Votre essai gratuit est terminé. Choisissez une formule pour continuer : vos données sont conservées.' : 'Votre abonnement est arrivé à échéance. Renouvelez-le pour retrouver l’accès : vos données sont conservées.', cta: trial ? 'Choisir une formule' : 'Renouveler mon abonnement' },
    en: { subject: trial ? 'Your Inovexa ERP free trial has ended' : 'Your Inovexa ERP subscription has expired', body: trial ? 'Your free trial has ended. Choose a plan to continue: your data is kept.' : 'Your subscription has expired. Renew it to get your access back: your data is kept.', cta: trial ? 'Choose a plan' : 'Renew my subscription' },
    es: { subject: trial ? 'Su prueba gratuita de Inovexa ERP ha terminado' : 'Su suscripción de Inovexa ERP ha vencido', body: trial ? 'Su prueba gratuita ha terminado. Elija un plan para continuar: sus datos se conservan.' : 'Su suscripción ha vencido. Renuévela para recuperar el acceso: sus datos se conservan.', cta: trial ? 'Elegir un plan' : 'Renovar mi suscripción' },
  }[input.lang];
  return compose(input.lang, T.subject, [T.body], { url: input.url, label: T.cta }, input.name);
}

export function trialReminderMail(input: { lang: MailLang; name: string; endsAt: Date | null; url: string }): RenderedMail {
  const end = mailDate(input.lang, input.endsAt);
  const T = {
    fr: { subject: 'Votre essai gratuit Inovexa ERP se termine bientôt', lines: [`Votre essai gratuit se termine le ${end}.`, 'Pour continuer sans interruption, choisissez une formule. Vos données sont conservées dans tous les cas.'], cta: 'Choisir une formule' },
    en: { subject: 'Your Inovexa ERP free trial is ending soon', lines: [`Your free trial ends on ${end}.`, 'To continue without interruption, choose a plan. Your data is kept in every case.'], cta: 'Choose a plan' },
    es: { subject: 'Su prueba gratuita de Inovexa ERP termina pronto', lines: [`Su prueba gratuita termina el ${end}.`, 'Para continuar sin interrupción, elija un plan. Sus datos se conservan en todos los casos.'], cta: 'Elegir un plan' },
  }[input.lang];
  return compose(input.lang, T.subject, T.lines, { url: input.url, label: T.cta }, input.name);
}

export function renewalReminderMail(input: { lang: MailLang; name: string; endsAt: Date | null; url: string }): RenderedMail {
  const end = mailDate(input.lang, input.endsAt);
  const T = {
    fr: { subject: 'Votre abonnement Inovexa ERP arrive à échéance', lines: [`Votre abonnement arrive à échéance le ${end}.`, 'Renouvelez-le dès maintenant en ligne : la nouvelle période s’ajoute à la suite, aucun jour payé n’est perdu.'], cta: 'Renouveler mon abonnement' },
    en: { subject: 'Your Inovexa ERP subscription is about to expire', lines: [`Your subscription expires on ${end}.`, 'Renew it now online: the new period is added after the current one, no paid day is lost.'], cta: 'Renew my subscription' },
    es: { subject: 'Su suscripción de Inovexa ERP está por vencer', lines: [`Su suscripción vence el ${end}.`, 'Renuévela ahora en línea: el nuevo periodo se añade a continuación, no se pierde ningún día pagado.'], cta: 'Renovar mi suscripción' },
  }[input.lang];
  return compose(input.lang, T.subject, T.lines, { url: input.url, label: T.cta }, input.name);
}

// ───────────── Suspension, refus d'un paiement, remboursement ─────────────

export function suspendedMail(input: { lang: MailLang; name: string; reason: string | null; url: string }): RenderedMail {
  const T = {
    fr: { subject: 'Votre compte Inovexa ERP est suspendu', body: 'Votre compte est suspendu. Contactez le support pour le réactiver : vos données sont conservées.', why: (r: string) => `Motif : ${r}`, cta: 'Contacter le support' },
    en: { subject: 'Your Inovexa ERP account is suspended', body: 'Your account is suspended. Contact support to reactivate it: your data is kept.', why: (r: string) => `Reason: ${r}`, cta: 'Contact support' },
    es: { subject: 'Su cuenta de Inovexa ERP está suspendida', body: 'Su cuenta está suspendida. Póngase en contacto con el soporte para reactivarla: sus datos se conservan.', why: (r: string) => `Motivo: ${r}`, cta: 'Contactar con el soporte' },
  }[input.lang];
  return compose(input.lang, T.subject, [T.body, ...(input.reason ? [T.why(input.reason)] : [])], { url: input.url, label: T.cta }, input.name);
}

export function paymentRejectedMail(input: { lang: MailLang; name: string; amount: number; currency: string; reason: string | null; url: string }): RenderedMail {
  const paid = mailMoney(input.lang, input.amount, input.currency);
  const T = {
    fr: { subject: 'Votre paiement n’a pas pu être validé', body: `Votre déclaration de paiement (${paid}) n’a pas pu être validée.`, why: (r: string) => `Motif : ${r}`, more: 'Vous pouvez payer en ligne par carte, l’accès s’ouvre alors tout de suite.', cta: 'Payer par carte' },
    en: { subject: 'Your payment could not be validated', body: `Your payment declaration (${paid}) could not be validated.`, why: (r: string) => `Reason: ${r}`, more: 'You can pay online by card: your access then opens immediately.', cta: 'Pay by card' },
    es: { subject: 'No se pudo validar su pago', body: `Su declaración de pago (${paid}) no se pudo validar.`, why: (r: string) => `Motivo: ${r}`, more: 'Puede pagar en línea con tarjeta: el acceso se abre de inmediato.', cta: 'Pagar con tarjeta' },
  }[input.lang];
  return compose(input.lang, T.subject, [T.body, ...(input.reason ? [T.why(input.reason)] : []), T.more], { url: input.url, label: T.cta }, input.name);
}

export function refundMail(input: { lang: MailLang; name: string; amount: number; currency: string; receiptNumber: string | null; reason: string | null; url: string }): RenderedMail {
  const paid = mailMoney(input.lang, input.amount, input.currency);
  const ref = input.receiptNumber ? ` (${input.receiptNumber})` : '';
  const T = {
    fr: { subject: 'Votre paiement a été remboursé', body: `Votre paiement de ${paid} TTC${ref} a été remboursé.`, why: (r: string) => `Motif : ${r}`, more: 'Selon votre banque, le montant réapparaît sur votre carte sous quelques jours.', cta: 'Voir mon abonnement' },
    en: { subject: 'Your payment has been refunded', body: `Your payment of ${paid} incl. VAT${ref} has been refunded.`, why: (r: string) => `Reason: ${r}`, more: 'Depending on your bank, the amount shows up again on your card within a few days.', cta: 'View my subscription' },
    es: { subject: 'Su pago ha sido reembolsado', body: `Su pago de ${paid} IVA incluido${ref} ha sido reembolsado.`, why: (r: string) => `Motivo: ${r}`, more: 'Según su banco, el importe vuelve a aparecer en su tarjeta en pocos días.', cta: 'Ver mi suscripción' },
  }[input.lang];
  return compose(input.lang, T.subject, [T.body, ...(input.reason ? [T.why(input.reason)] : []), T.more], { url: input.url, label: T.cta }, input.name);
}
