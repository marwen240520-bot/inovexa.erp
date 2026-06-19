"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface Settings {
  language: string;
  dateFormat: string;
  currency: string;
  itemsPerPage: number;
  defaultPage: string;
  notifications: boolean;
  autoSave: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Settings;
  resetSettings: () => Settings;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  t: (key: string) => string;
  currencySymbol: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  language: "fr",
  dateFormat: "DD/MM/YYYY",
  currency: "EUR",
  itemsPerPage: 10,
  defaultPage: "dashboard",
  notifications: true,
  autoSave: true
};

const currencySymbols: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  TND: "DT"
};

const dateFormats: Record<string, (date: Date) => string> = {
  "DD/MM/YYYY": (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  },
  "MM/DD/YYYY": (date: Date) => {
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
  },
  "YYYY-MM-DD": (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }
};

const translations: Record<string, Record<string, string>> = {
  fr: {
    "common.dashboard": "Tableau de bord",
    "common.products": "Produits",
    "common.categories": "Catégories",
    "common.stock": "Stock",
    "common.sales": "Ventes",
    "common.purchases": "Achats",
    "common.orders": "Commandes",
    "common.clients": "Clients",
    "common.suppliers": "Fournisseurs",
    "common.invoices": "Factures",
    "common.hr": "Ressources Humaines",
    "common.finance": "Finance",
    "common.logistics": "Logistique",
    "common.production": "Production",
    "common.ai": "Assistant IA",
    "common.reports": "Rapports",
    "common.analytics": "Analytiques",
    "common.profile": "Mon Profil",
    "common.settings": "Paramètres",
    "common.logout": "Déconnexion",
    "common.search": "Rechercher",
    "common.add": "Ajouter",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.export": "Exporter",
    "common.import": "Importer",
    "common.filter": "Filtrer",
    "common.selectAll": "Tout sélectionner",
    "common.clearAll": "Tout désélectionner",
    "common.actions": "Actions",
    "common.status": "Statut",
    "common.date": "Date",
    "common.total": "Total",
    "common.name": "Nom",
    "common.email": "Email",
    "common.phone": "Téléphone",
    "common.address": "Adresse",
    "common.quantity": "Quantité",
    "common.price": "Prix",
    "common.amount": "Montant"
  },
  en: {
    "common.dashboard": "Dashboard",
    "common.products": "Products",
    "common.categories": "Categories",
    "common.stock": "Stock",
    "common.sales": "Sales",
    "common.purchases": "Purchases",
    "common.orders": "Orders",
    "common.clients": "Clients",
    "common.suppliers": "Suppliers",
    "common.invoices": "Invoices",
    "common.hr": "HR",
    "common.finance": "Finance",
    "common.logistics": "Logistics",
    "common.production": "Production",
    "common.ai": "AI Assistant",
    "common.reports": "Reports",
    "common.analytics": "Analytics",
    "common.profile": "My Profile",
    "common.settings": "Settings",
    "common.logout": "Logout",
    "common.search": "Search",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.export": "Export",
    "common.import": "Import",
    "common.filter": "Filter",
    "common.selectAll": "Select All",
    "common.clearAll": "Clear All",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.date": "Date",
    "common.total": "Total",
    "common.name": "Name",
    "common.email": "Email",
    "common.phone": "Phone",
    "common.address": "Address",
    "common.quantity": "Quantity",
    "common.price": "Price",
    "common.amount": "Amount"
  }
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSettings = localStorage.getItem("app_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
        applySettings({ ...defaultSettings, ...parsed });
      } catch(e) {}
    } else {
      applySettings(defaultSettings);
    }
    setLoading(false);
  }, []);

  const applySettings = (newSettings: Settings) => {
    document.documentElement.lang = newSettings.language === "fr" ? "fr" : "en";
    localStorage.setItem("language", newSettings.language);
  };

  const updateSettings = (newSettings: Partial<Settings>): Settings => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("app_settings", JSON.stringify(updated));
    applySettings(updated);
    return updated;
  };

  const resetSettings = (): Settings => {
    setSettings(defaultSettings);
    localStorage.setItem("app_settings", JSON.stringify(defaultSettings));
    applySettings(defaultSettings);
    return defaultSettings;
  };

  const formatCurrency = (amount: number): string => {
    const symbol = currencySymbols[settings.currency] || "€";
    return `${amount.toLocaleString()} ${symbol}`;
  };

  const formatDate = (date: string | Date): string => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    const formatter = dateFormats[settings.dateFormat];
    return formatter ? formatter(d) : d.toLocaleDateString();
  };

  const t = (key: string): string => {
    const langTranslations = translations[settings.language] || translations.fr;
    return langTranslations[key] || key;
  };

  if (loading) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      formatCurrency,
      formatDate,
      t,
      currencySymbol: currencySymbols[settings.currency] || "€"
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}