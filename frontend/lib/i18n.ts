// lib/i18n.ts
// Utilitaires de traduction partagés serveur / client (pas de "use client").

export const SUPPORTED_LANGUAGES = ["fr", "en", "es"] as const;
export type Lang = (typeof SUPPORTED_LANGUAGES)[number];

/** Nom de chaque langue, écrit dans la langue elle-même (menus de choix de la langue). */
export const LANGUAGE_NAMES: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

/** Locale utilisée pour les dates et les nombres (Intl, toLocaleString…). */
export const INTL_LOCALES: Record<Lang, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

/** Nom du cookie qui mémorise la langue (lu par le serveur pour rendre la page déjà traduite) */
export const LANG_COOKIE = "lang";

export function isSupportedLanguage(lang: unknown): lang is Lang {
  return typeof lang === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

/** Locale Intl de la langue de l'interface (français si la langue est inconnue). */
export function intlLocale(lang: unknown): string {
  return isSupportedLanguage(lang) ? INTL_LOCALES[lang] : INTL_LOCALES.fr;
}

/** Choisit la langue à partir du cookie, sinon de l'en-tête Accept-Language, sinon le français. */
export function pickLanguage(cookieValue?: string | null, acceptLanguage?: string | null): Lang {
  if (isSupportedLanguage(cookieValue)) return cookieValue;
  if (acceptLanguage) {
    const prefs = acceptLanguage
      .split(",")
      .map((part) => part.trim().split(";")[0].split("-")[0].toLowerCase());
    for (const p of prefs) if (isSupportedLanguage(p)) return p;
  }
  return "fr";
}

/** Fusion profonde : les clés de `over` remplacent celles de `base` (sert au repli sur l'anglais). */
export function deepMerge(base: any, over: any): any {
  if (!over || typeof over !== "object" || Array.isArray(over)) return over ?? base;
  const out: any = Array.isArray(base) ? [] : { ...(base || {}) };
  for (const key of Object.keys(over)) {
    const b = out[key];
    const o = over[key];
    out[key] =
      o && typeof o === "object" && !Array.isArray(o) && b && typeof b === "object" && !Array.isArray(b)
        ? deepMerge(b, o)
        : o;
  }
  return out;
}

/** Lit une clé « a.b.c » dans un dictionnaire ; renvoie undefined si absente. */
export function lookup(dict: any, key: string): any {
  let value: any = dict;
  for (const k of key.split(".")) {
    if (value && typeof value === "object") value = value[k];
    else return undefined;
  }
  return value;
}
