"use client";
// components/auth/AuthShell.tsx
// Cadre commun des écrans d'accès construits après la page de connexion (inscription, mot de passe oublié, nouveau
// mot de passe, confirmation de l'email) : même fond « horizon », même barre du haut, même carte, mêmes champs.
// On y trouve aussi ce que ces pages partagent : icônes, champs, messages, textes et contrôles de saisie.
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageMenu from "@/components/ui/LanguageMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import { fill, useSaasTexts, type SaasTexts } from "@/lib/saasTexts";
import { AUTH_STYLES, buildLgVars } from "./authStyles";

// ─── Textes propres à ces écrans (le reste vient de lib/saasTexts.ts) ──────────

const UI_FR = {
  showPassword: "Afficher le mot de passe",
  hidePassword: "Masquer le mot de passe",
  capsLock: "Verr. Maj activée",
  ruleLength: "8 caractères au moins",
  ruleLetter: "Une lettre",
  ruleDigit: "Un chiffre",
  fixFields: "Vérifiez les champs signalés.",
  nameRequired: "Indiquez votre nom complet.",
  companyRequired: "Indiquez le nom de votre société.",
  emailInvalid: "Indiquez une adresse email valide.",
  phoneInvalid: "Numéro invalide : 8 chiffres pour la Tunisie, ou l’indicatif du pays (ex. +33…).",
  passwordWeak: "Mot de passe trop faible : 8 caractères au moins, avec une lettre et un chiffre.",
  sectorRequired: "Choisissez votre secteur d’activité.",
  termsRequired: "Vous devez accepter les conditions d’utilisation.",
  taxIdInvalid: "Matricule fiscal invalide : 7 chiffres + 1 lettre (ex. 1234567X ou 1234567X/A/M/000).",
  otpFormat: "Saisissez le code à 6 chiffres.",
  tooMany: "Trop de tentatives. Réessayez plus tard.",
  tooManyMinutes: "Trop de tentatives. Réessayez dans {minutes} min.",
  genericError: "La demande n’a pas abouti. Réessayez.",
  retry: "Réessayer",
  loading: "Chargement…",
  sending: "Envoi…",
  saving: "Enregistrement…",
  trialNeutral: "Essai gratuit, sans carte bancaire. Toutes vos données restent à vous.",
  trialFor: "Essai gratuit de {duration}, sans carte bancaire. Toutes vos données restent à vous.",
  googleUnavailable: "La connexion avec Google n’est pas disponible pour le moment.",
  googleTwoFactor: "Ce compte existe déjà et il est protégé par la double authentification. Connectez-vous pour continuer.",
  otherMethod: "Utiliser une autre méthode",
  alreadyVerified: "Cette adresse email est déjà confirmée.",
  verifyHelp: "Connectez-vous pour demander un nouveau lien de confirmation.",
  accountLabel: "Compte :",
};

export type AuthUi = typeof UI_FR;

const UI_EN: AuthUi = {
  showPassword: "Show password",
  hidePassword: "Hide password",
  capsLock: "Caps Lock is on",
  ruleLength: "At least 8 characters",
  ruleLetter: "One letter",
  ruleDigit: "One digit",
  fixFields: "Check the highlighted fields.",
  nameRequired: "Enter your full name.",
  companyRequired: "Enter your company name.",
  emailInvalid: "Enter a valid email address.",
  phoneInvalid: "Invalid number: 8 digits for Tunisia, or the country code (e.g. +33…).",
  passwordWeak: "Password too weak: at least 8 characters, with a letter and a digit.",
  sectorRequired: "Choose your business sector.",
  termsRequired: "You must accept the terms of service.",
  taxIdInvalid: "Invalid tax ID: 7 digits + 1 letter (e.g. 1234567X or 1234567X/A/M/000).",
  otpFormat: "Enter the 6-digit code.",
  tooMany: "Too many attempts. Please try again later.",
  tooManyMinutes: "Too many attempts. Try again in {minutes} min.",
  genericError: "The request did not go through. Try again.",
  retry: "Try again",
  loading: "Loading…",
  sending: "Sending…",
  saving: "Saving…",
  trialNeutral: "Free trial, no bank card. Your data stays yours.",
  trialFor: "{duration} free trial, no bank card. Your data stays yours.",
  googleUnavailable: "Google sign-in is not available right now.",
  googleTwoFactor: "This account already exists and is protected by two-factor authentication. Sign in to continue.",
  otherMethod: "Use another method",
  alreadyVerified: "This email address is already confirmed.",
  verifyHelp: "Sign in to request a new confirmation link.",
  accountLabel: "Account:",
};

const UI_ES: AuthUi = {
  showPassword: "Mostrar la contraseña",
  hidePassword: "Ocultar la contraseña",
  capsLock: "Bloq Mayús activado",
  ruleLength: "8 caracteres como mínimo",
  ruleLetter: "Una letra",
  ruleDigit: "Una cifra",
  fixFields: "Revise los campos señalados.",
  nameRequired: "Indique su nombre completo.",
  companyRequired: "Indique el nombre de su empresa.",
  emailInvalid: "Indique un correo electrónico válido.",
  phoneInvalid: "Número no válido: 8 cifras para Túnez, o el prefijo del país (p. ej. +33…).",
  passwordWeak: "Contraseña demasiado débil: 8 caracteres como mínimo, con una letra y una cifra.",
  sectorRequired: "Elija su sector de actividad.",
  termsRequired: "Debe aceptar las condiciones de uso.",
  taxIdInvalid: "Identificación fiscal no válida: 7 cifras + 1 letra (p. ej. 1234567X o 1234567X/A/M/000).",
  otpFormat: "Introduzca el código de 6 cifras.",
  tooMany: "Demasiados intentos. Inténtelo más tarde.",
  tooManyMinutes: "Demasiados intentos. Inténtelo de nuevo en {minutes} min.",
  genericError: "La solicitud no se ha completado. Inténtelo de nuevo.",
  retry: "Reintentar",
  loading: "Cargando…",
  sending: "Enviando…",
  saving: "Guardando…",
  trialNeutral: "Prueba gratuita, sin tarjeta bancaria. Sus datos siguen siendo suyos.",
  trialFor: "Prueba gratuita de {duration}, sin tarjeta bancaria. Sus datos siguen siendo suyos.",
  googleUnavailable: "El acceso con Google no está disponible por el momento.",
  googleTwoFactor: "Esta cuenta ya existe y está protegida con la autenticación en dos pasos. Inicie sesión para continuar.",
  otherMethod: "Usar otro método",
  alreadyVerified: "Este correo electrónico ya está confirmado.",
  verifyHelp: "Inicie sesión para solicitar un nuevo enlace de confirmación.",
  accountLabel: "Cuenta:",
};

const UI_AR: AuthUi = {
  showPassword: "إظهار كلمة المرور",
  hidePassword: "إخفاء كلمة المرور",
  capsLock: "مفتاح Caps Lock مفعّل",
  ruleLength: "8 أحرف على الأقل",
  ruleLetter: "حرف واحد",
  ruleDigit: "رقم واحد",
  fixFields: "راجع الحقول المشار إليها.",
  nameRequired: "أدخل اسمك الكامل.",
  companyRequired: "أدخل اسم شركتك.",
  emailInvalid: "أدخل بريدًا إلكترونيًا صحيحًا.",
  phoneInvalid: "رقم غير صحيح: 8 أرقام لتونس، أو رمز البلد (مثال: ‎+33…).",
  passwordWeak: "كلمة المرور ضعيفة: 8 أحرف على الأقل، مع حرف ورقم.",
  sectorRequired: "اختر قطاع نشاطك.",
  termsRequired: "يجب أن توافق على شروط الاستخدام.",
  taxIdInvalid: "المعرّف الجبائي غير صحيح: 7 أرقام + حرف واحد (مثال: 1234567X أو 1234567X/A/M/000).",
  otpFormat: "أدخل الرمز المكوّن من 6 أرقام.",
  tooMany: "محاولات كثيرة. أعد المحاولة لاحقًا.",
  tooManyMinutes: "محاولات كثيرة. أعد المحاولة بعد {minutes} د.",
  genericError: "تعذّر إتمام الطلب. أعد المحاولة.",
  retry: "إعادة المحاولة",
  loading: "جارٍ التحميل…",
  sending: "جارٍ الإرسال…",
  saving: "جارٍ الحفظ…",
  trialNeutral: "تجربة مجانية، دون بطاقة بنكية. بياناتك تبقى ملكك.",
  trialFor: "تجربة مجانية لمدة {duration}، دون بطاقة بنكية. بياناتك تبقى ملكك.",
  googleUnavailable: "تسجيل الدخول بحساب Google غير متاح حاليًا.",
  googleTwoFactor: "هذا الحساب موجود ومحمي بالمصادقة الثنائية. سجّل دخولك للمتابعة.",
  otherMethod: "استخدام طريقة أخرى",
  alreadyVerified: "هذا البريد الإلكتروني مؤكَّد من قبل.",
  verifyHelp: "سجّل دخولك لطلب رابط تأكيد جديد.",
  accountLabel: "الحساب:",
};

const AUTH_UI: Record<string, AuthUi> = { fr: UI_FR, en: UI_EN, es: UI_ES, ar: UI_AR };

// ─── Messages du serveur ───────────────────────────────────────────────────────

/**
 * L'API répond en français. Les messages que la saisie ne peut pas éviter (mauvais mot de passe, email déjà
 * utilisé, lien expiré, compte Google…) sont repris ici dans les autres langues ; tout autre message est affiché
 * tel que le serveur l'a écrit.
 */
const SERVER_TEXTS: Record<string, { en: string; es: string; ar: string }> = {
  "Email ou mot de passe incorrect": {
    en: "Invalid email or password",
    es: "Correo o contraseña incorrectos",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  },
  "Compte désactivé": { en: "This account is disabled", es: "Cuenta desactivada", ar: "هذا الحساب معطَّل" },
  "Le compte de la société est désactivé": {
    en: "The company account is disabled",
    es: "La cuenta de la empresa está desactivada",
    ar: "حساب الشركة معطَّل",
  },
  "Code de vérification requis": { en: "Verification code required", es: "Se requiere el código de verificación", ar: "رمز التحقق مطلوب" },
  "Code de vérification invalide": { en: "Invalid verification code", es: "Código de verificación no válido", ar: "رمز التحقق غير صحيح" },
  "Un compte existe déjà avec cet email. Connectez-vous, ou réinitialisez votre mot de passe.": {
    en: "An account already exists with this email. Sign in, or reset your password.",
    es: "Ya existe una cuenta con este correo. Inicie sesión o restablezca su contraseña.",
    ar: "يوجد حساب بهذا البريد الإلكتروني. سجّل دخولك أو أعد تعيين كلمة المرور.",
  },
  "Lien invalide ou expiré. Refaites une demande de réinitialisation.": {
    en: "Invalid or expired link. Request a new reset link.",
    es: "Enlace no válido o caducado. Solicite un nuevo enlace.",
    ar: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
  },
  "Lien invalide ou expiré. Demandez un nouveau lien depuis votre espace.": {
    en: "Invalid or expired link. Request a new link from your workspace.",
    es: "Enlace no válido o caducado. Solicite un nuevo enlace desde su espacio.",
    ar: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من فضائك.",
  },
  "Jeton Google invalide ou expiré. Réessayez.": {
    en: "Invalid or expired Google sign-in. Try again.",
    es: "Acceso con Google no válido o caducado. Inténtelo de nuevo.",
    ar: "تسجيل الدخول بحساب Google غير صالح أو انتهت صلاحيته. أعد المحاولة.",
  },
  "Cette adresse Google n'est pas vérifiée.": {
    en: "This Google address is not verified.",
    es: "Esta dirección de Google no está verificada.",
    ar: "عنوان Google هذا غير موثَّق.",
  },
  "Ce compte se connecte avec son mot de passe.": {
    en: "This account signs in with its password.",
    es: "Esta cuenta inicia sesión con su contraseña.",
    ar: "هذا الحساب يسجّل الدخول بكلمة المرور.",
  },
  "Ce compte est relié à un autre compte Google.": {
    en: "This account is linked to another Google account.",
    es: "Esta cuenta está vinculada a otra cuenta de Google.",
    ar: "هذا الحساب مرتبط بحساب Google آخر.",
  },
};

/** Apostrophes typographiques et espaces ramenés à une forme unique avant de chercher un message connu. */
const normalizeText = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

/** Message du serveur dans la langue de l'interface s'il est connu, sinon tel quel. */
export function serverText(message: string, language: string): string {
  if (!message || language === "fr") return message;
  const known = SERVER_TEXTS[normalizeText(message)];
  return (known && known[language as "en" | "es" | "ar"]) || message;
}

// ─── Problèmes à afficher ──────────────────────────────────────────────────────

/**
 * Ce qu'une page garde en mémoire après un échec : la cause, pas la phrase. Le texte est calculé à l'affichage,
 * donc il suit la langue si la personne en change alors que le message est à l'écran.
 */
export type AuthProblem =
  | { kind: "failure"; status: number; message: string }
  | { kind: "ui"; key: keyof AuthUi }
  | { kind: "tx"; key: keyof SaasTexts["auth"] };

/** Réponse en échec de publicPost → problème à afficher. */
export const failed = (res: { status: number; message: string }): AuthProblem => ({ kind: "failure", status: res.status, message: res.message });

export interface ExplainOptions {
  /** Texte pour « serveur injoignable » (la page de connexion a le sien). */
  serverError?: string;
  /** Texte quand le serveur refuse sans dire pourquoi. */
  fallback?: string;
}

/** Textes de ces écrans dans la langue de l'interface, et traduction d'un problème en phrase. */
export function useAuthTexts() {
  const { language } = useLanguage();
  const saas = useSaasTexts();
  const ui = AUTH_UI[language] || UI_FR;
  const tx = saas.auth;

  const explain = useCallback(
    (problem: AuthProblem, options: ExplainOptions = {}): string => {
      if (problem.kind === "ui") return ui[problem.key];
      if (problem.kind === "tx") return tx[problem.key];
      // Statut 0 : la requête n'est pas partie ou n'a pas eu de réponse.
      if (problem.status === 0 || problem.status >= 500) return options.serverError || tx.serverError;
      if (problem.status === 429) {
        // Le limiteur par email annonce un délai (« Réessayez dans 12 min. ») ; le limiteur de débit, lui, ne dit rien d'utile.
        const minutes = /(\d+)\s*min/.exec(problem.message);
        return minutes ? fill(ui.tooManyMinutes, { minutes: minutes[1] }) : ui.tooMany;
      }
      return serverText(problem.message, language) || options.fallback || ui.genericError;
    },
    [ui, tx, language],
  );

  return { language, tx, time: saas.time, ui, explain };
}

// ─── Contrôles de saisie (mêmes règles que l'API, pour répondre avant l'envoi) ─

export const isEmail = (value: string) => value.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export function passwordChecks(password: string) {
  const length = password.length >= 8 && password.length <= 128;
  const letter = /[A-Za-z]/.test(password);
  const digit = /\d/.test(password);
  return { length, letter, digit, ok: length && letter && digit };
}

/** Numéro tunisien à 8 chiffres, ou numéro avec indicatif (backend/src/common/phone.ts). */
export function isValidPhone(value: string): boolean {
  const raw = value.trim();
  if (raw.length > 30 || !/^[+\d][\d\s().-]*$/.test(raw)) return false;
  let digits = raw.replace(/\D/g, "");
  const international = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!international) return /^[2-9]\d{7}$/.test(digits);
  if (digits.startsWith("216")) return /^[2-9]\d{7}$/.test(digits.slice(3));
  return digits.length >= 8 && digits.length <= 15;
}

/** Matricule fiscal tunisien, ou numéro de CIN à 8 chiffres (backend/src/common/fiscal.ts). Vide = accepté. */
export function isValidTaxId(value: string): boolean {
  const compact = value.trim().toUpperCase().replace(/[\s/\\.-]/g, "");
  if (!compact) return true;
  return /^\d{8}$/.test(compact) || /^\d{7}[A-Z](?:[ABDNP](?:[MNPCE](?:\d{3})?)?)?$/.test(compact);
}

// ─── Icônes (même trait que la page de connexion) ──────────────────────────────

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const IconMail = () => <svg width="18" height="18" {...svgProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
export const IconLock = () => <svg width="18" height="18" {...svgProps}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const IconUser = () => <svg width="18" height="18" {...svgProps}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconBuilding = () => <svg width="18" height="18" {...svgProps}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h1M14 8h1M9 12h1M14 12h1M10 21v-4h4v4" /></svg>;
export const IconPhone = () => <svg width="18" height="18" {...svgProps}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>;
export const IconBriefcase = () => <svg width="18" height="18" {...svgProps}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></svg>;
export const IconPin = () => <svg width="18" height="18" {...svgProps}><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;
export const IconHome = () => <svg width="18" height="18" {...svgProps}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
export const IconFile = () => <svg width="18" height="18" {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
export const IconHash = () => <svg width="18" height="18" {...svgProps}><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></svg>;
export const IconKey = () => <svg width="18" height="18" {...svgProps}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></svg>;
export const IconEye = () => <svg width="20" height="20" {...svgProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconEyeOff = () => <svg width="20" height="20" {...svgProps}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
export const IconArrowLeft = () => <svg width="16" height="16" {...svgProps} strokeWidth={2.2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
export const IconArrowRight = () => <svg width="17" height="17" {...svgProps} strokeWidth={2.5}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
export const IconAlert = () => <svg width="16" height="16" {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
export const IconCheckCircle = () => <svg width="16" height="16" {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.7 2.7L16 9.8" /></svg>;
export const IconInfo = () => <svg width="16" height="16" {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
export const IconChevronDown = () => <svg width="16" height="16" {...svgProps} strokeWidth={2.2}><polyline points="6 9 12 15 18 9" /></svg>;
const IconRuleDone = () => <svg width="13" height="13" {...svgProps} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const IconRuleTodo = () => <svg width="13" height="13" {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="7" /></svg>;

// ─── Cadre ─────────────────────────────────────────────────────────────────────

interface AuthShellProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Carte élargie (formulaire d'inscription sur deux colonnes). */
  wide?: boolean;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, wide = false, children }: AuthShellProps) {
  const { theme, themeId } = useTheme();
  const { tx } = useAuthTexts();
  const isLight = isLightTheme(theme);
  const themeVars = useMemo(() => buildLgVars(themeId, theme) as React.CSSProperties, [themeId, theme]);
  const year = new Date().getFullYear();

  return (
    <div className={"lg-root lg-shell " + (isLight ? "lg-light" : "lg-dark")} style={themeVars}>
      <div className="lg-fx lg-fx-horizon" aria-hidden="true"><span /></div>

      <div className="lg-topbar">
        {/* Sur téléphone le texte est masqué : le nom accessible reste porté par le lien. */}
        <Link href="/" className="lg-back" aria-label={tx.backToHome}>
          <IconArrowLeft />
          <span>{tx.backToHome}</span>
        </Link>
        <div className="lg-controls">
          <ThemeToggle size={40} />
          <LanguageMenu />
        </div>
      </div>

      <main className="lg-center">
        <div className={"lg-card lg-anim" + (wide ? " lg-card-wide" : "")}>
          <Link href="/" aria-label="Inovexa ERP" className="lg-brand">
            <span className="lg-logo">
              <img src="/images/logo.png" alt="" width={64} height={64} />
            </span>
            <span className="lg-brand-name" lang="en" dir="ltr">
              INOVEXA <span className="lg-brand-erp">ERP</span>
            </span>
          </Link>
          <h1 className="lg-title">{title}</h1>
          {subtitle ? <p className="lg-welcome">{subtitle}</p> : null}
          {children}
        </div>
      </main>

      <p className="lg-footer" suppressHydrationWarning>© {year} Inovexa. {tx.rights}</p>

      <style dangerouslySetInnerHTML={{ __html: AUTH_STYLES }} />
    </div>
  );
}

// ─── Briques ───────────────────────────────────────────────────────────────────

interface AuthMessageProps {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  /** Action liée au message (réessayer, continuer…), affichée sous le texte. */
  action?: React.ReactNode;
  boxRef?: React.Ref<HTMLDivElement>;
}

/** Message d'état annoncé aux lecteurs d'écran : erreur (alerte), réussite ou information. */
export function AuthMessage({ tone, children, action, boxRef }: AuthMessageProps) {
  const className = tone === "error" ? "lg-error" : tone === "success" ? "lg-success" : "lg-info";
  return (
    <div ref={boxRef} className={className} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}>
      {tone === "error" ? <IconAlert /> : tone === "success" ? <IconCheckCircle /> : <IconInfo />}
      <div className="lg-box-body">
        {children}
        {action ? <span className="lg-box-action">{action}</span> : null}
      </div>
    </div>
  );
}

/** Séparateur « ou » entre le formulaire et le bouton Google. */
export function AuthDivider({ label }: { label: string }) {
  return <div className="lg-divider"><span>{label}</span></div>;
}

interface AuthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  /** Contenu toujours lu de gauche à droite, même en arabe (téléphone, code, matricule). */
  ltr?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Champ de saisie avec son libellé, son icône, son aide et son message d'erreur. */
export function AuthField({ id, label, icon, hint, error, ltr = false, inputRef, ...input }: AuthFieldProps) {
  const describedBy = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="lg-field">
      <label htmlFor={id} className="lg-label">{label}</label>
      <div className="lg-input-wrap">
        {icon ? <span className="lg-input-icon">{icon}</span> : null}
        <input
          {...input}
          id={id}
          ref={inputRef}
          className={"lg-input" + (icon ? "" : " lg-input-plain") + (ltr ? " lg-input-ltr" : "")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </div>
      {error ? <p id={`${id}-err`} className="lg-field-error">{error}</p> : null}
      {hint ? <p id={`${id}-hint`} className="lg-hint">{hint}</p> : null}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  error?: string;
  /** Affiche les trois règles, cochées au fil de la saisie. */
  rules?: boolean;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Champ mot de passe : afficher / masquer, alerte « Verr. Maj », règles vérifiées en direct. */
export function PasswordField({ id, label, value, onChange, autoComplete, error, rules = false, disabled, inputRef }: PasswordFieldProps) {
  const { tx, ui } = useAuthTexts();
  const [visible, setVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const checks = passwordChecks(value);
  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") setCapsLockOn(e.getModifierState("CapsLock"));
  };
  const describedBy = [error ? `${id}-err` : "", rules ? `${id}-rules` : ""].filter(Boolean).join(" ") || undefined;
  const ruleList: Array<[boolean, string]> = [[checks.length, ui.ruleLength], [checks.letter, ui.ruleLetter], [checks.digit, ui.ruleDigit]];

  return (
    <div className="lg-field">
      <label htmlFor={id} className="lg-label">{label}</label>
      <div className="lg-input-wrap">
        <span className="lg-input-icon"><IconLock /></span>
        <input
          id={id}
          ref={inputRef}
          className="lg-input lg-input-pass"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={128}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onKeyDown={detectCapsLock}
          onKeyUp={detectCapsLock}
        />
        <button
          type="button"
          className="lg-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? ui.hidePassword : ui.showPassword}
          aria-pressed={visible}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {capsLockOn ? <p role="status" className="lg-caps"><span aria-hidden="true">⇪</span> {ui.capsLock}</p> : null}
      {error ? <p id={`${id}-err`} className="lg-field-error">{error}</p> : null}
      {rules ? (
        <ul id={`${id}-rules`} className="lg-rules" aria-label={tx.passwordHint}>
          {ruleList.map(([ok, text]) => (
            <li key={text} data-ok={ok}>
              {ok ? <IconRuleDone /> : <IconRuleTodo />}
              {text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled?: boolean;
}

/** Bouton principal d'un formulaire : désactivé et animé pendant l'envoi. */
export function SubmitButton({ label, loadingLabel, loading, disabled = false }: SubmitButtonProps) {
  return (
    <button className="lg-btn" type="submit" disabled={loading || disabled} aria-busy={loading}>
      {loading ? <span className="lg-spinner" aria-hidden="true" /> : null}
      <span>{loading ? loadingLabel : label}</span>
      {loading ? null : <IconArrowRight />}
    </button>
  );
}
