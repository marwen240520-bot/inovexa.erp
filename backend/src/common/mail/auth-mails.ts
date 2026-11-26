// Emails de compte (code de vérification, réinitialisation du mot de passe, changement d'adresse, test d'envoi),
// en français, anglais et espagnol. Chaque message existe en texte brut ET en HTML (tableaux + styles en ligne : c'est
// ce que lisent tous les logiciels de messagerie). Aucune image externe : rien à bloquer, rien à charger.

export const MAIL_LANGS = ['fr', 'en', 'es'] as const;
export type MailLang = (typeof MAIL_LANGS)[number];

/** Première langue valide de la liste (langue demandée, langue du compte…), sinon le français. */
export function pickMailLang(...candidates: unknown[]): MailLang {
  for (const c of candidates) {
    const v = String(c ?? '').trim().toLowerCase().slice(0, 2);
    if ((MAIL_LANGS as readonly string[]).includes(v)) return v as MailLang;
  }
  return 'fr';
}

export interface RenderedMail { subject: string; text: string; html: string }

const BRAND = 'Inovexa ERP';
const ACCENT = '#6d28d9';

export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** Seuls http(s) sont acceptés dans un lien : jamais de « javascript: » venu d'une variable mal réglée. */
function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : '#';
}

const FOOTER: Record<MailLang, string> = {
  fr: 'Vous recevez ce message parce qu’une action a été demandée sur votre compte Inovexa ERP.',
  en: 'You are receiving this message because an action was requested on your Inovexa ERP account.',
  es: 'Recibe este mensaje porque se solicitó una acción en su cuenta de Inovexa ERP.',
};

export function layout(lang: MailLang, preheader: string, title: string, body: string): string {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>`
    + `<body style="margin:0;padding:0;background:#f4f3fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f2433">`
    + `<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3fb;padding:28px 12px"><tr><td align="center">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e3f5">`
    + `<tr><td style="background:${ACCENT};padding:18px 28px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.4px">${BRAND}</td></tr>`
    + `<tr><td style="padding:28px 28px 22px;font-size:15px;line-height:1.6">${body}</td></tr>`
    + `<tr><td style="padding:16px 28px 22px;border-top:1px solid #eeecf7;color:#7a7f93;font-size:12px;line-height:1.5">${escapeHtml(FOOTER[lang])}<br>${BRAND}</td></tr>`
    + `</table></td></tr></table></body></html>`;
}

export const button = (url: string, label: string) =>
  `<p style="margin:22px 0"><a href="${escapeHtml(safeUrl(url))}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${escapeHtml(label)}</a></p>`;

export const muted = (s: string) => `<p style="color:#667085;font-size:13px;margin:18px 0 0">${s}</p>`;

// ───────────── Code de vérification de l'adresse ─────────────

const CODE_TEXTS = {
  fr: {
    subject: (code: string) => `${code} — votre code de vérification Inovexa ERP`,
    hello: (n: string) => `Bonjour ${n},`,
    welcome: 'Bienvenue sur Inovexa ERP. Votre essai gratuit est ouvert.',
    again: 'Voici votre code de vérification.',
    ask: 'Saisissez ce code pour confirmer votre adresse email :',
    valid: (m: number) => `Il est valable ${m} minutes.`,
    page: 'Ouvrir la page de saisie',
    ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : sans ce code, personne ne peut ouvrir le compte.',
    sign: 'L’équipe Inovexa ERP',
  },
  en: {
    subject: (code: string) => `${code} — your Inovexa ERP verification code`,
    hello: (n: string) => `Hello ${n},`,
    welcome: 'Welcome to Inovexa ERP. Your free trial is open.',
    again: 'Here is your verification code.',
    ask: 'Enter this code to confirm your email address:',
    valid: (m: number) => `It is valid for ${m} minutes.`,
    page: 'Open the code entry page',
    ignore: 'If you did not request this, ignore this message: without the code, nobody can open the account.',
    sign: 'The Inovexa ERP team',
  },
  es: {
    subject: (code: string) => `${code} — su código de verificación de Inovexa ERP`,
    hello: (n: string) => `Hola ${n},`,
    welcome: 'Bienvenido a Inovexa ERP. Su prueba gratuita está abierta.',
    again: 'Este es su código de verificación.',
    ask: 'Introduzca este código para confirmar su correo electrónico:',
    valid: (m: number) => `Es válido durante ${m} minutos.`,
    page: 'Abrir la página para introducirlo',
    ignore: 'Si no ha solicitado esto, ignore este mensaje: sin el código, nadie puede abrir la cuenta.',
    sign: 'El equipo de Inovexa ERP',
  },
} as const;

export function verificationCodeMail(input: { lang: MailLang; name: string; code: string; minutes: number; url: string; welcome: boolean }): RenderedMail {
  const T = CODE_TEXTS[input.lang];
  const intro = input.welcome ? T.welcome : T.again;
  const text = `${T.hello(input.name)}\n\n${intro}\n${T.ask}\n\n    ${input.code}\n\n${T.valid(input.minutes)} ${input.url}\n\n${T.ignore}\n\n${T.sign}`;
  const body = `<p style="margin:0 0 12px">${escapeHtml(T.hello(input.name))}</p><p style="margin:0 0 12px">${escapeHtml(intro)}</p><p style="margin:0 0 6px">${escapeHtml(T.ask)}</p>`
    + `<p style="margin:14px 0 18px;text-align:center"><span style="display:inline-block;background:#f4f3fb;border:1px solid #e0dbf5;border-radius:12px;padding:14px 26px;font-size:32px;font-weight:700;letter-spacing:10px;font-family:Consolas,Menlo,monospace;color:#1f2433">${escapeHtml(input.code)}</span></p>`
    + `<p style="margin:0">${escapeHtml(T.valid(input.minutes))}</p>${button(input.url, T.page)}${muted(escapeHtml(T.ignore))}<p style="margin:18px 0 0">${escapeHtml(T.sign)}</p>`;
  return { subject: T.subject(input.code), text, html: layout(input.lang, `${input.code} — ${T.valid(input.minutes)}`, T.subject(input.code), body) };
}

// ───────────── Réinitialisation du mot de passe ─────────────

const RESET_TEXTS = {
  fr: { subject: 'Réinitialisation de votre mot de passe Inovexa ERP', hello: (n: string) => `Bonjour ${n},`, intro: (m: number) => `Pour choisir un nouveau mot de passe, ouvrez le lien ci-dessous (valable ${m} minutes).`, cta: 'Réinitialiser mon mot de passe', ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.', sign: 'L’équipe Inovexa ERP' },
  en: { subject: 'Reset your Inovexa ERP password', hello: (n: string) => `Hello ${n},`, intro: (m: number) => `To choose a new password, open the link below (valid for ${m} minutes).`, cta: 'Reset my password', ignore: 'If you did not request this, ignore this message: your current password stays valid.', sign: 'The Inovexa ERP team' },
  es: { subject: 'Restablezca su contraseña de Inovexa ERP', hello: (n: string) => `Hola ${n},`, intro: (m: number) => `Para elegir una nueva contraseña, abra el enlace siguiente (válido durante ${m} minutos).`, cta: 'Restablecer mi contraseña', ignore: 'Si no ha solicitado esto, ignore este mensaje: su contraseña actual sigue siendo válida.', sign: 'El equipo de Inovexa ERP' },
} as const;

export function passwordResetMail(input: { lang: MailLang; name: string; link: string; minutes: number }): RenderedMail {
  const T = RESET_TEXTS[input.lang];
  const text = `${T.hello(input.name)}\n\n${T.intro(input.minutes)}\n${input.link}\n\n${T.ignore}\n\n${T.sign}`;
  const body = `<p style="margin:0 0 12px">${escapeHtml(T.hello(input.name))}</p><p style="margin:0">${escapeHtml(T.intro(input.minutes))}</p>${button(input.link, T.cta)}`
    + `<p style="color:#667085;font-size:12px;word-break:break-all;margin:0 0 6px">${escapeHtml(input.link)}</p>${muted(escapeHtml(T.ignore))}<p style="margin:18px 0 0">${escapeHtml(T.sign)}</p>`;
  return { subject: T.subject, text, html: layout(input.lang, T.subject, T.subject, body) };
}

// ───────────── Adresse modifiée (message envoyé à l'ANCIENNE adresse) ─────────────

const CHANGED_TEXTS = {
  fr: { subject: 'L’adresse email de votre compte Inovexa ERP a changé', hello: (n: string) => `Bonjour ${n},`, body: (to: string) => `L’adresse email de votre compte a été remplacée par ${to}.`, warn: 'Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe tout de suite et contactez le support.', sign: 'L’équipe Inovexa ERP' },
  en: { subject: 'The email address of your Inovexa ERP account was changed', hello: (n: string) => `Hello ${n},`, body: (to: string) => `The email address of your account was replaced by ${to}.`, warn: 'If you did not make this change, reset your password right away and contact support.', sign: 'The Inovexa ERP team' },
  es: { subject: 'Se cambió el correo electrónico de su cuenta de Inovexa ERP', hello: (n: string) => `Hola ${n},`, body: (to: string) => `El correo electrónico de su cuenta se sustituyó por ${to}.`, warn: 'Si usted no hizo este cambio, restablezca su contraseña de inmediato y contacte con el soporte.', sign: 'El equipo de Inovexa ERP' },
} as const;

export function emailChangedMail(input: { lang: MailLang; name: string; newEmail: string }): RenderedMail {
  const T = CHANGED_TEXTS[input.lang];
  const text = `${T.hello(input.name)}\n\n${T.body(input.newEmail)}\n${T.warn}\n\n${T.sign}`;
  const body = `<p style="margin:0 0 12px">${escapeHtml(T.hello(input.name))}</p><p style="margin:0 0 12px">${escapeHtml(T.body(input.newEmail))}</p><p style="margin:0;color:#b42318;font-weight:600">${escapeHtml(T.warn)}</p><p style="margin:18px 0 0">${escapeHtml(T.sign)}</p>`;
  return { subject: T.subject, text, html: layout(input.lang, T.subject, T.subject, body) };
}

// ───────────── Alertes de sécurité (mot de passe, double authentification) ─────────────

export type SecurityNotice = 'password_changed' | 'two_factor_enabled' | 'two_factor_disabled' | 'two_factor_reset';

const NOTICE_TEXTS = {
  fr: {
    hello: (n: string) => `Bonjour ${n},`,
    password_changed: { subject: 'Le mot de passe de votre compte Inovexa ERP a été modifié', body: 'Le mot de passe de votre compte vient d’être modifié. Vos autres sessions ont été fermées.' },
    two_factor_enabled: { subject: 'Double authentification activée sur votre compte Inovexa ERP', body: 'La double authentification vient d’être activée sur votre compte : un code de votre application d’authentification sera demandé à chaque connexion.' },
    two_factor_disabled: { subject: 'Double authentification désactivée sur votre compte Inovexa ERP', body: 'La double authentification vient d’être désactivée sur votre compte.' },
    two_factor_reset: { subject: 'Double authentification réinitialisée sur votre compte Inovexa ERP', body: 'Le support a réinitialisé la double authentification de votre compte. Vos sessions ont été fermées ; vous pouvez la réactiver depuis Profil › Sécurité.' },
    warn: 'Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe tout de suite (« Mot de passe oublié ») et contactez le support.',
    sign: 'Inovexa ERP',
  },
  en: {
    hello: (n: string) => `Hello ${n},`,
    password_changed: { subject: 'The password of your Inovexa ERP account was changed', body: 'The password of your account was just changed. Your other sessions were closed.' },
    two_factor_enabled: { subject: 'Two-factor authentication enabled on your Inovexa ERP account', body: 'Two-factor authentication was just enabled on your account: a code from your authenticator app will be required at every sign-in.' },
    two_factor_disabled: { subject: 'Two-factor authentication disabled on your Inovexa ERP account', body: 'Two-factor authentication was just disabled on your account.' },
    two_factor_reset: { subject: 'Two-factor authentication reset on your Inovexa ERP account', body: 'Support reset the two-factor authentication of your account. Your sessions were closed; you can enable it again from Profile › Security.' },
    warn: 'If you did not make this change, reset your password right away (“Forgot password”) and contact support.',
    sign: 'Inovexa ERP',
  },
  es: {
    hello: (n: string) => `Hola ${n},`,
    password_changed: { subject: 'Se cambió la contraseña de su cuenta de Inovexa ERP', body: 'La contraseña de su cuenta acaba de cambiarse. Sus otras sesiones se cerraron.' },
    two_factor_enabled: { subject: 'Autenticación en dos pasos activada en su cuenta de Inovexa ERP', body: 'La autenticación en dos pasos acaba de activarse en su cuenta: se pedirá un código de su aplicación de autenticación en cada inicio de sesión.' },
    two_factor_disabled: { subject: 'Autenticación en dos pasos desactivada en su cuenta de Inovexa ERP', body: 'La autenticación en dos pasos acaba de desactivarse en su cuenta.' },
    two_factor_reset: { subject: 'Autenticación en dos pasos restablecida en su cuenta de Inovexa ERP', body: 'El soporte restableció la autenticación en dos pasos de su cuenta. Sus sesiones se cerraron; puede volver a activarla desde Perfil › Seguridad.' },
    warn: 'Si usted no hizo este cambio, restablezca su contraseña de inmediato («Olvidé mi contraseña») y contacte con el soporte.',
    sign: 'Inovexa ERP',
  },
} as const;

export function securityNoticeMail(input: { lang: MailLang; name: string; kind: SecurityNotice }): RenderedMail {
  const T = NOTICE_TEXTS[input.lang];
  const K = T[input.kind];
  const text = `${T.hello(input.name)}\n\n${K.body}\n${T.warn}\n\n${T.sign}`;
  const body = `<p style="margin:0 0 12px">${escapeHtml(T.hello(input.name))}</p><p style="margin:0 0 12px">${escapeHtml(K.body)}</p><p style="margin:0;color:#b42318;font-weight:600">${escapeHtml(T.warn)}</p><p style="margin:18px 0 0">${escapeHtml(T.sign)}</p>`;
  return { subject: K.subject, text, html: layout(input.lang, K.subject, K.subject, body) };
}

// ───────────── Test d'envoi (administration) ─────────────

const TEST_TEXTS = {
  fr: { subject: 'Test d’envoi — Inovexa ERP', body: 'Ce message confirme que le serveur d’envoi d’emails de la plateforme fonctionne.', sign: 'Inovexa ERP' },
  en: { subject: 'Delivery test — Inovexa ERP', body: 'This message confirms that the platform’s email server works.', sign: 'Inovexa ERP' },
  es: { subject: 'Prueba de envío — Inovexa ERP', body: 'Este mensaje confirma que el servidor de correo de la plataforma funciona.', sign: 'Inovexa ERP' },
} as const;

export function testMail(lang: MailLang): RenderedMail {
  const T = TEST_TEXTS[lang];
  return { subject: T.subject, text: `${T.body}\n\n${T.sign}`, html: layout(lang, T.subject, T.subject, `<p style="margin:0 0 12px">${escapeHtml(T.body)}</p><p style="margin:0">${escapeHtml(T.sign)}</p>`) };
}
