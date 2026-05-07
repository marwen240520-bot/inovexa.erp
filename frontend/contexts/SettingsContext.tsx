"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

const defaultSettings = {
  language: "fr",
  dateFormat: "DD/MM/YYYY",
  currency: "EUR",
  itemsPerPage: 10,
  defaultPage: "dashboard",
  notifications: true,
  autoSave: true
};

const currencySymbols = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  TND: "DT"
};

const dateFormats = {
  "DD/MM/YYYY": (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  },
  "MM/DD/YYYY": (date) => {
    const d = new Date(date);
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  },
  "YYYY-MM-DD": (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
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

  const applySettings = (newSettings) => {
    // Appliquer la langue
    document.documentElement.lang = newSettings.language === "fr" ? "fr" : "en";
    localStorage.setItem("language", newSettings.language);
  };

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("app_settings", JSON.stringify(updated));
    applySettings(updated);
    return updated;
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("app_settings", JSON.stringify(defaultSettings));
    applySettings(defaultSettings);
    return defaultSettings;
  };

  const formatCurrency = (amount) => {
    const symbol = currencySymbols[settings.currency] || "€";
    return `${amount.toLocaleString()} ${symbol}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const formatter = dateFormats[settings.dateFormat];
    return formatter ? formatter(date) : new Date(date).toLocaleDateString();
  };

  const translate = (key) => {
    const translations = {
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
    const langTranslations = translations[settings.language] || translations.fr;
    return langTranslations[key] || key;
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      formatCurrency,
      formatDate,
      t: translate,
      currencySymbol: currencySymbols[settings.currency] || "€"
    }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
