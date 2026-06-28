// contexts/LanguageContext.tsx
"use client";
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import Spinner from "@/components/ui/Spinner";

// Pour charger les fichiers depuis public, utilisez fetch
// Ne pas importer directement depuis public

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<string, any> = {
  fr: {},
  en: {},
  es: {}
};

let translationsLoaded = false;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<string>('fr');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les traductions depuis le dossier public
  const loadTranslations = useCallback(async () => {
    if (translationsLoaded) return;
    
    try {
      const [frRes, enRes, esRes] = await Promise.all([
        fetch('/locales/fr.json'),
        fetch('/locales/en.json'),
        fetch('/locales/es.json')
      ]);
      
      translations.fr = await frRes.json();
      translations.en = await enRes.json();
      translations.es = await esRes.json();
      translationsLoaded = true;
    } catch (error) {
      console.error("Erreur chargement traductions:", error);
    }
    setIsLoading(false);
  }, []);

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['fr', 'en', 'es'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (['fr', 'en', 'es'].includes(browserLang)) {
        setLanguage(browserLang);
      } else {
        setLanguage('fr');
      }
    }
    loadTranslations();
    setIsInitialized(true);
  }, [loadTranslations]);

  // Sauvegarder la langue quand elle change
  useEffect(() => {
    if (isInitialized && !isLoading) {
      localStorage.setItem('language', language);
    }
  }, [language, isInitialized, isLoading]);

  const changeLanguage = useCallback(async (lang: string) => {
    if (['fr', 'en', 'es'].includes(lang)) {
      setLanguage(lang);
      return Promise.resolve();
    }
    return Promise.reject(new Error('Langue non supportée'));
  }, []);

  // Fonction de traduction
  const t = useCallback((key: string): string => {
    if (isLoading) return key;
    
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    if (value === undefined || value === null) {
      // Fallback vers l'anglais
      let fallbackValue: any = translations['en'];
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object') {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      return fallbackValue || key;
    }
    
    return value;
  }, [language, isLoading]);

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}