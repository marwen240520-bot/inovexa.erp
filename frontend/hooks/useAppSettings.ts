import { useState, useEffect } from 'react';

// Devise par défaut de l'application : Dinar tunisien (DT)
export const DEFAULT_CURRENCY = 'tnd';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  tnd: 'DT',
  eur: '€',
  usd: '$',
  gbp: '£'
};

// Migration unique : les anciens navigateurs avaient « eur » enregistré par défaut.
// On bascule une seule fois vers DT ; l'utilisateur peut toujours rechoisir l'euro dans Paramètres.
const MIGRATION_KEY = 'currencyDefaultTndMigrated';

export const readStoredCurrency = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  try {
    if (!localStorage.getItem(MIGRATION_KEY)) {
      if (localStorage.getItem('currency') === 'eur') {
        localStorage.setItem('currency', DEFAULT_CURRENCY);
        localStorage.setItem('app_currency', DEFAULT_CURRENCY);
      }
      localStorage.setItem(MIGRATION_KEY, '1');
    }
    return localStorage.getItem('currency') || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

export const useAppSettings = () => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [loading, setLoading] = useState(true);

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();

    // Écouter les changements de paramètres
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currency') {
        setCurrency(e.newValue || DEFAULT_CURRENCY);
      }
      if (e.key === 'dateFormat') {
        setDateFormat(e.newValue || 'dd/mm/yyyy');
      }
    };

    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail?.currency) {
        setCurrency(event.detail.currency);
      }
      if (event.detail?.dateFormat) {
        setDateFormat(event.detail.dateFormat);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  const loadSettings = () => {
    const savedCurrency = readStoredCurrency();
    const savedDateFormat = localStorage.getItem('dateFormat') || 'dd/mm/yyyy';
    setCurrency(savedCurrency);
    setDateFormat(savedDateFormat);
    setLoading(false);
  };

  // Helper pour convertir en nombre valide
  const toValidNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  // Obtenir le symbole de la devise
  const getCurrencySymbol = (): string => {
    return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS[DEFAULT_CURRENCY];
  };

  // Formater un nombre avec la devise (le dinar se compte en millimes : 3 décimales max)
  const formatCurrency = (amount: number | string | undefined | null): string => {
    const validAmount = toValidNumber(amount);
    const maxDecimals = currency === 'tnd' ? 3 : 2;
    return `${validAmount.toLocaleString('fr-FR', { maximumFractionDigits: maxDecimals })} ${getCurrencySymbol()}`;
  };

  // Formater une date selon le format choisi
  const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    if (dateFormat === 'dd/mm/yyyy') {
      return `${day}/${month}/${year}`;
    }
    if (dateFormat === 'mm/dd/yyyy') {
      return `${month}/${day}/${year}`;
    }
    return `${year}-${month}-${day}`;
  };

  // Formater une date avec l'heure
  const formatDateTime = (date: Date | string | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const dateStr = formatDate(d);
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${time}`;
  };

  // Formater un pourcentage
  const formatPercentage = (value: number | string | undefined | null, decimals: number = 1): string => {
    const validValue = toValidNumber(value);
    return `${validValue.toFixed(decimals)}%`;
  };

  // Formater un nombre (sans devise)
  const formatNumber = (value: number | string | undefined | null, decimals: number = 0): string => {
    const validValue = toValidNumber(value);
    return validValue.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return {
    currency,
    dateFormat,
    loading,
    formatCurrency,
    formatDate,
    formatDateTime,
    getCurrencySymbol,
    formatPercentage,
    formatNumber,
    reloadSettings: loadSettings
  };
};
