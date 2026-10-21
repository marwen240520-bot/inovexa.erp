// contexts/LanguageContext.tsx
"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LANG_COOKIE, deepMerge, isSupportedLanguage, lookup } from "@/lib/i18n";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Dictionnaires déjà chargés côté client (fusionnés avec l'anglais pour le repli)
const messagesCache: Record<string, any> = {};
let englishPromise: Promise<any> | null = null;

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.json();
}

async function loadMessages(lang: string): Promise<any> {
  if (messagesCache[lang]) return messagesCache[lang];
  if (!englishPromise) englishPromise = fetchJson("/locales/en.json").catch(() => ({}));
  const [en, own] = await Promise.all([
    englishPromise,
    lang === "en" ? englishPromise : fetchJson(`/locales/${lang}.json`),
  ]);
  const merged = lang === "en" ? en : deepMerge(en, own);
  messagesCache[lang] = merged;
  return merged;
}

function persistLanguage(lang: string) {
  try { localStorage.setItem("language", lang); } catch { /* stockage indisponible */ }
  try { document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignoré */ }
  try { document.documentElement.lang = lang; } catch { /* ignoré */ }
}

/**
 * Les traductions de la langue courante sont fournies par le serveur (app/layout.tsx) :
 * la page est rendue directement traduite, sans spinner ni téléchargement des 3 fichiers
 * fr/en/es au démarrage. Les autres langues ne sont chargées qu'au moment du changement.
 */
export function LanguageProvider({
  children,
  initialLanguage = "fr",
  initialMessages = {},
}: {
  children: React.ReactNode;
  initialLanguage?: string;
  initialMessages?: Record<string, any>;
}) {
  const [state, setState] = useState(() => {
    const lang = isSupportedLanguage(initialLanguage) ? initialLanguage : "fr";
    if (!messagesCache[lang]) messagesCache[lang] = initialMessages;
    return { language: lang as string, messages: initialMessages };
  });
  const requested = useRef(state.language);

  const changeLanguage = useCallback(async (lang: string) => {
    if (!isSupportedLanguage(lang)) throw new Error("Langue non supportée");
    requested.current = lang;
    persistLanguage(lang);
    try {
      const messages = await loadMessages(lang);
      // Ignore une réponse arrivée après un autre changement de langue
      if (requested.current === lang) setState({ language: lang, messages });
    } catch (error) {
      console.error("Erreur chargement traductions:", error);
    }
  }, []);

  // Migration : langue choisie avant l'existence du cookie (stockée seulement dans localStorage)
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("language"); } catch { /* ignoré */ }
    const hasCookie = typeof document !== "undefined" && document.cookie.includes(`${LANG_COOKIE}=`);
    if (!hasCookie && isSupportedLanguage(saved) && saved !== state.language) {
      changeLanguage(saved);
    } else {
      persistLanguage(state.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { language, messages } = state;

  const t = useCallback(
    (key: string): string => {
      const value = lookup(messages, key);
      return value === undefined || value === null ? key : value;
    },
    [messages]
  );

  const setLanguage = useCallback((lang: string) => { void changeLanguage(lang); }, [changeLanguage]);

  const value = useMemo(
    () => ({ language, setLanguage, changeLanguage, t }),
    [language, setLanguage, changeLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
