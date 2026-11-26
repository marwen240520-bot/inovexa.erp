// components/home/homeTexts.ts
// Textes de la page d'accueil en français, anglais et espagnol.
// {trial} est remplacé par la durée de l'essai gratuit (« 3 jours »), {n} par un nombre.

export type HomeLang = "fr" | "en" | "es";

export interface HomeText {
  badge: string;
  title: string;
  subtitle: string;
  trialCta: string;
  loginCta: string;
  dashboardCta: string;
  pricingCta: string;
  trust: string[];
  header: { home: string; products: string; pricing: string; blog: string; about: string; contact: string; trial: string; login: string; language: string };
  why: { eyebrow: string; title: string; lead: string; ai: { title: string; badge: string; desc: string }; features: { title: string; desc: string }[] };
  modules: { eyebrow: string; title: string; lead: string; cta: string };
  sectors: { eyebrow: string; title: string; lead: string; count: string; cta: string };
  steps: { eyebrow: string; title: string; items: { title: string; desc: string }[] };
  pricing: {
    eyebrow: string; title: string; lead: string; perMonth: string; exclTax: string; users: string; unlimited: string; popular: string;
    choose: string; annual: string; onQuote: string; cta: string; twoMonths: string;
  };
  final: { title: string; lead: string; primary: string; secondary: string };
  footer: { tagline: string; product: string; company: string; account: string; contact: string; signup: string; rights: string; partOf: string; privacy: string; terms: string };
  orbitLabel: string;
  shipments: string;
}

export const HOME_TEXTS: Record<HomeLang, HomeText> = {
  fr: {
    badge: "ERP international · 100 % en ligne · IA intégrée",
    title: "L'avenir de la gestion d'entreprise commence ici.",
    subtitle: "Ventes, stock, factures, comptabilité, paie et caisse dans une seule application. Inovexa ERP s'adapte à votre secteur dès l'inscription.",
    trialCta: "Essayer gratuitement {trial}",
    loginCta: "Se connecter",
    dashboardCta: "Accéder à mon espace",
    pricingCta: "Voir les tarifs",
    trust: ["{trial} d’essai, sans carte bancaire", "Rien à installer", "Votre devise, votre TVA, votre pays"],
    header: { home: "Accueil", products: "Produits", pricing: "Tarifs", blog: "Blog", about: "À propos", contact: "Contact", trial: "Essai gratuit", login: "Se connecter", language: "Choisir la langue" },
    why: {
      eyebrow: "Pourquoi Inovexa ERP",
      title: "Un seul outil pour toute l'entreprise",
      lead: "Fini les tableurs et les logiciels séparés : chaque vente met à jour le stock, la facture, la comptabilité et vos indicateurs.",
      ai: { title: "Système intelligent", badge: "IA intégrée", desc: "Un assistant IA qui répond à vos questions à partir de vos propres données : ventes, stock, clients, impayés." },
      features: [
        { title: "Gestion centralisée", desc: "Tous vos processus métier réunis sur une seule plateforme." },
        { title: "Pilotage en temps réel", desc: "Tableaux de bord, rapports et alertes pour décider avec des chiffres à jour." },
        { title: "Sécurité et travail en équipe", desc: "Droits par rôle, double authentification et journal d'activité." },
        { title: "Adapté à votre pays", desc: "Devise, taux de TVA et identifiant fiscal propres à votre société. En Tunisie : timbre fiscal, retenue à la source, paie CNSS et IRPP, fichier TEIF." },
      ],
    },
    modules: {
      eyebrow: "{n} modules",
      title: "Tout ce dont votre entreprise a besoin",
      lead: "Activez seulement les modules utiles à votre activité : ils partagent les mêmes données.",
      cta: "Découvrir tous les modules",
    },
    sectors: {
      eyebrow: "{n} secteurs d'activité",
      title: "Adapté à votre métier dès l'inscription",
      lead: "Choisissez votre secteur : les bons modules sont activés et un catalogue d'exemples vous aide à démarrer.",
      count: "{n} modules",
      cta: "Voir les modules de chaque secteur",
    },
    steps: {
      eyebrow: "Démarrage",
      title: "Opérationnel en quelques minutes",
      items: [
        { title: "Créez votre compte", desc: "Avec votre email, Google ou Apple. Indiquez votre société et votre secteur." },
        { title: "Essayez {trial} gratuitement", desc: "Tous les modules de votre secteur sont ouverts. Aucune carte bancaire n'est demandée." },
        { title: "Choisissez votre formule", desc: "Réglez par virement, D17, Flouci, chèque ou espèces. Vos données sont conservées." },
      ],
    },
    pricing: {
      eyebrow: "Tarifs",
      title: "Des prix clairs, en dollars",
      lead: "Prix en dollars, hors taxes, par société. Paiement en ligne par carte bancaire.", twoMonths: "Deux mois offerts avec l'abonnement annuel.",
      perMonth: "/ mois", exclTax: "HT", users: "Jusqu’à {n} utilisateurs", unlimited: "Utilisateurs illimités", popular: "Recommandée",
      choose: "Commencer l'essai gratuit", annual: "ou {price} HT par an", onQuote: "Sur devis", cta: "Comparer les formules en détail",
    },
    final: {
      title: "Prêt à essayer Inovexa ERP ?",
      lead: "Créez votre compte en deux minutes : {trial} d'essai gratuit, sans engagement.",
      primary: "Démarrer l'essai gratuit",
      secondary: "Voir les tarifs",
    },
    footer: {
      tagline: "ERP en ligne conçu à Tunis pour les entreprises qui grandissent.",
      product: "Produit", company: "Société", account: "Compte", contact: "Contact", signup: "Créer un compte",
      rights: "Tous droits réservés.", partOf: "Fait partie de", privacy: "Confidentialité", terms: "Conditions",
    },
    orbitLabel: "Modules d'Inovexa ERP",
    shipments: "Expéditions",
  },
  en: {
    badge: "International ERP · 100% online · built-in AI",
    title: "The future of business management starts here.",
    subtitle: "Sales, stock, invoices, accounting, payroll and checkout in one application. Inovexa ERP adapts to your sector from sign-up.",
    trialCta: "Try it free for {trial}",
    loginCta: "Sign in",
    dashboardCta: "Open my workspace",
    pricingCta: "View pricing",
    trust: ["{trial} free trial, no bank card", "Nothing to install", "Your currency, your VAT, your country"],
    header: { home: "Home", products: "Products", pricing: "Pricing", blog: "Blog", about: "About", contact: "Contact", trial: "Free trial", login: "Sign in", language: "Choose language" },
    why: {
      eyebrow: "Why Inovexa ERP",
      title: "One tool for the whole business",
      lead: "No more spreadsheets and separate software: every sale updates stock, the invoice, the accounts and your indicators.",
      ai: { title: "Intelligent system", badge: "Built-in AI", desc: "An AI assistant that answers your questions from your own data: sales, stock, customers, unpaid invoices." },
      features: [
        { title: "Centralized management", desc: "All your business processes on a single platform." },
        { title: "Real-time steering", desc: "Dashboards, reports and alerts to decide with up-to-date figures." },
        { title: "Security and teamwork", desc: "Role-based rights, two-factor authentication and activity log." },
        { title: "Adapted to your country", desc: "Currency, VAT rates and tax ID set for your own company. In Tunisia: stamp duty, withholding tax, CNSS and IRPP payroll, TEIF file." },
      ],
    },
    modules: {
      eyebrow: "{n} modules",
      title: "Everything your business needs",
      lead: "Switch on only the modules your business uses: they all share the same data.",
      cta: "Explore all modules",
    },
    sectors: {
      eyebrow: "{n} business sectors",
      title: "Fitted to your trade from sign-up",
      lead: "Pick your sector: the right modules are switched on and a sample catalogue helps you get started.",
      count: "{n} modules",
      cta: "See each sector's modules",
    },
    steps: {
      eyebrow: "Getting started",
      title: "Up and running in minutes",
      items: [
        { title: "Create your account", desc: "With your email, Google or Apple. Enter your company and your sector." },
        { title: "Try it free for {trial}", desc: "Every module of your sector is open. No bank card is asked." },
        { title: "Choose your plan", desc: "Pay by bank transfer, D17, Flouci, cheque or cash. Your data is kept." },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Clear prices, in US dollars",
      lead: "Prices in US dollars, excluding tax, per company. Pay online by bank card.", twoMonths: "Two months free with the yearly plan.",
      perMonth: "/ month", exclTax: "excl. tax", users: "Up to {n} users", unlimited: "Unlimited users", popular: "Recommended",
      choose: "Start the free trial", annual: "or {price} excl. tax per year", onQuote: "On quote", cta: "Compare plans in detail",
    },
    final: {
      title: "Ready to try Inovexa ERP?",
      lead: "Create your account in two minutes: {trial} free trial, no commitment.",
      primary: "Start the free trial",
      secondary: "See pricing",
    },
    footer: {
      tagline: "Online ERP built in Tunis for growing businesses.",
      product: "Product", company: "Company", account: "Account", contact: "Contact", signup: "Create an account",
      rights: "All rights reserved.", partOf: "Part of", privacy: "Privacy", terms: "Terms",
    },
    orbitLabel: "Inovexa ERP modules",
    shipments: "Shipments",
  },
  es: {
    badge: "ERP internacional · 100 % en línea · IA integrada",
    title: "El futuro de la gestión empresarial comienza aquí.",
    subtitle: "Ventas, stock, facturas, contabilidad, nóminas y caja en una sola aplicación. Inovexa ERP se adapta a su sector desde el registro.",
    trialCta: "Probar gratis {trial}",
    loginCta: "Iniciar sesión",
    dashboardCta: "Abrir mi espacio",
    pricingCta: "Ver precios",
    trust: ["{trial} de prueba, sin tarjeta bancaria", "Nada que instalar", "Su moneda, su IVA, su país"],
    header: { home: "Inicio", products: "Productos", pricing: "Precios", blog: "Blog", about: "Nosotros", contact: "Contacto", trial: "Prueba gratis", login: "Iniciar sesión", language: "Elegir idioma" },
    why: {
      eyebrow: "Por qué Inovexa ERP",
      title: "Una sola herramienta para toda la empresa",
      lead: "Se acabaron las hojas de cálculo y los programas separados: cada venta actualiza el stock, la factura, la contabilidad y sus indicadores.",
      ai: { title: "Sistema inteligente", badge: "IA integrada", desc: "Un asistente de IA que responde a sus preguntas a partir de sus propios datos: ventas, stock, clientes, impagos." },
      features: [
        { title: "Gestión centralizada", desc: "Todos sus procesos de negocio en una sola plataforma." },
        { title: "Dirección en tiempo real", desc: "Paneles, informes y alertas para decidir con cifras al día." },
        { title: "Seguridad y trabajo en equipo", desc: "Permisos por rol, autenticación en dos pasos y registro de actividad." },
        { title: "Adaptado a su país", desc: "Moneda, tipos de IVA e identificación fiscal propios de su empresa. En Túnez: timbre fiscal, retención en la fuente, nóminas CNSS e IRPP, archivo TEIF." },
      ],
    },
    modules: {
      eyebrow: "{n} módulos",
      title: "Todo lo que su empresa necesita",
      lead: "Active solo los módulos útiles para su actividad: comparten los mismos datos.",
      cta: "Descubrir todos los módulos",
    },
    sectors: {
      eyebrow: "{n} sectores de actividad",
      title: "Adaptado a su oficio desde el registro",
      lead: "Elija su sector: se activan los módulos adecuados y un catálogo de ejemplos le ayuda a empezar.",
      count: "{n} módulos",
      cta: "Ver los módulos de cada sector",
    },
    steps: {
      eyebrow: "Puesta en marcha",
      title: "Operativo en unos minutos",
      items: [
        { title: "Cree su cuenta", desc: "Con su correo, Google o Apple. Indique su empresa y su sector." },
        { title: "Pruebe gratis {trial}", desc: "Todos los módulos de su sector están abiertos. No se pide tarjeta bancaria." },
        { title: "Elija su plan", desc: "Pague por transferencia, D17, Flouci, cheque o efectivo. Sus datos se conservan." },
      ],
    },
    pricing: {
      eyebrow: "Precios",
      title: "Precios claros, en dólares",
      lead: "Precios en dólares, sin impuestos, por empresa. Pago en línea con tarjeta bancaria.", twoMonths: "Dos meses gratis con el plan anual.",
      perMonth: "/ mes", exclTax: "sin IVA", users: "Hasta {n} usuarios", unlimited: "Usuarios ilimitados", popular: "Recomendado",
      choose: "Empezar la prueba gratuita", annual: "o {price} sin IVA al año", onQuote: "A consultar", cta: "Comparar los planes en detalle",
    },
    final: {
      title: "¿Listo para probar Inovexa ERP?",
      lead: "Cree su cuenta en dos minutos: {trial} de prueba gratuita, sin compromiso.",
      primary: "Empezar la prueba gratuita",
      secondary: "Ver precios",
    },
    footer: {
      tagline: "ERP en línea creado en Túnez para las empresas que crecen.",
      product: "Producto", company: "Empresa", account: "Cuenta", contact: "Contacto", signup: "Crear una cuenta",
      rights: "Todos los derechos reservados.", partOf: "Forma parte de", privacy: "Privacidad", terms: "Condiciones",
    },
    orbitLabel: "Módulos de Inovexa ERP",
    shipments: "Envíos",
  },
};

/** Remplace {cle} par sa valeur. */
export const fillText = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole));
