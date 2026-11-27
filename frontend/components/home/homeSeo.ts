// components/home/homeSeo.ts
// Titre et description de la page d'accueil pour les moteurs de recherche et les aperçus de partage, par langue.
// Le titre reste sous ~60 caractères et la description sous ~160 pour ne pas être coupés dans les résultats.

import type { HomeLang } from "./homeTexts";

export interface HomeSeo {
  title: string;
  description: string;
  /** Code de langue des balises Open Graph (og:locale). */
  locale: string;
}

export const HOME_SEO: Record<HomeLang, HomeSeo> = {
  fr: {
    title: "Inovexa ERP – Logiciel de gestion en ligne pour PME",
    description:
      "Ventes, stock, factures, comptabilité, paie et caisse dans une seule application en ligne. Adapté à votre secteur dès l'inscription. Essai gratuit, sans carte bancaire.",
    locale: "fr_FR",
  },
  en: {
    title: "Inovexa ERP – Cloud ERP Software for Growing Businesses",
    description:
      "Sales, inventory, invoicing, accounting, payroll and point of sale in one online app. Tailored to your industry from sign-up. Free trial, no credit card required.",
    locale: "en_US",
  },
  es: {
    title: "Inovexa ERP – Software ERP en la nube para empresas",
    description:
      "Ventas, inventario, facturas, contabilidad, nómina y caja en una sola aplicación en línea. Adaptada a tu sector desde el registro. Prueba gratis, sin tarjeta.",
    locale: "es_ES",
  },
};
