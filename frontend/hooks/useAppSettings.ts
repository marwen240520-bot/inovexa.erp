import { useState, useEffect } from 'react';
import { currencyLabel, useCompanyProfile } from '@/lib/company-profile';

// La devise de l'application est celle de la société (Paramètres › Société) : dinar tunisien pour une société tunisienne,
// euro, dollar, dirham… ailleurs. Elle ne se choisit plus ici (un simple affichage ne doit pas contredire les comptes).
// Le format de date, lui, reste un réglage de l'appareil.

export const useAppSettings = () => {
  const profile = useCompanyProfile();
  const currency = profile.currency.toLowerCase();
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [loading, setLoading] = useState(true);

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();

    // Écouter les changements de paramètres
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dateFormat') {
        setDateFormat(e.newValue || 'dd/mm/yyyy');
      }
    };

    const handleSettingsChange = (event: CustomEvent) => {
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
    const savedDateFormat = localStorage.getItem('dateFormat') || 'dd/mm/yyyy';
    setDateFormat(savedDateFormat);
    setLoading(false);
  };

  // Helper pour convertir en nombre valide
  const toValidNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  // Obtenir le symbole de la devise de la société
  const getCurrencySymbol = (): string => currencyLabel(profile.currency);

  // Formater un nombre avec la devise de la société, aux décimales de cette devise (dinar : 3, euro et dollar : 2, yen : 0)
  const formatCurrency = (amount: number | string | undefined | null): string => {
    const validAmount = toValidNumber(amount);
    return `${validAmount.toLocaleString('fr-FR', { maximumFractionDigits: profile.currencyDecimals })} ${getCurrencySymbol()}`;
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
