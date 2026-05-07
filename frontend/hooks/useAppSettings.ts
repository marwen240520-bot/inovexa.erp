import { useState, useEffect } from 'react';

export const useAppSettings = () => {
  const [currency, setCurrency] = useState('eur');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [loading, setLoading] = useState(true);

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();
    
    // Écouter les changements de paramètres
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currency') {
        setCurrency(e.newValue || 'eur');
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
    const savedCurrency = localStorage.getItem('currency') || 'eur';
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

  // Formater un nombre avec la devise (version corrigée)
  const formatCurrency = (amount: number | string | undefined | null): string => {
    const symbols: Record<string, string> = {
      eur: '€',
      usd: '$',
      gbp: '£',
      tnd: 'DT'
    };
    const symbol = symbols[currency] || '€';
    
    // Convertir en nombre valide
    const validAmount = toValidNumber(amount);
    
    // Formater avec la locale française pour les séparateurs
    return `${validAmount.toLocaleString('fr-FR')} ${symbol}`;
  };

  // Formater une date selon le format choisi (version corrigée)
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

  // Formater une date avec l'heure (version corrigée)
  const formatDateTime = (date: Date | string | undefined | null): string => {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const dateStr = formatDate(d);
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${time}`;
  };

  // Obtenir le symbole de la devise
  const getCurrencySymbol = (): string => {
    const symbols: Record<string, string> = {
      eur: '€',
      usd: '$',
      gbp: '£',
      tnd: 'DT'
    };
    return symbols[currency] || '€';
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