"use client";
import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useResponsive } from "@/hooks/useResponsive";
import { Poppins, Orbitron } from "next/font/google";

// ─── Polices ──────────────────────────────────────────────────────────────────
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
  variable: "--font-orbitron",
});

// ─── Icônes SVG ────────────────────────────────────────────────────────────────
type IconProps = { size?: number | string; color?: string };
const svgBase = (size: number | string, color: string, strokeWidth = "2") => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
});

const IconTarget = ({ size = "1.35em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>
);
const IconBarChart = ({ size = "1.35em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const IconShield = ({ size = "1.35em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const IconUsers = ({ size = "1.35em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconArrowRight = ({ size = "1.1em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const IconChevronDown = ({ size = 11, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><polyline points="6 9 12 15 18 9" /></svg>
);
const IconCheck = ({ size = 13, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><polyline points="20 6 9 17 4 12" /></svg>
);
const IconClose = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

// ─── Types & constantes ────────────────────────────────────────────────────────
type Lang = "fr" | "en" | "es";

interface AboutSection {
  title: string;
  body: string;
  items?: string[];
}

interface AboutContent {
  headline: string;
  intro: string[];
  sections: AboutSection[];
  ctaLabel: string;
  ctaHref: string;
  emailLabel: string;
  email: string;
}

interface HomeText {
  title: string;
  modules: string;
  subtitle: string;
  button: string;
  login: string;
  aboutBtn: string;
  aboutClose: string;
  aboutBadge: string;
  aboutContent: AboutContent;
  copyright: string;
  privacy: string;
  terms: string;
  langLabel: string;
  features: { title: string; desc: string }[];
}

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "fr" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
];
const FEATURE_ICONS = [IconTarget, IconBarChart, IconShield, IconUsers];

const BG_IMAGE = "/images/3.png";

const TRANSLATIONS: Record<Lang, HomeText> = {
  fr: {
    title: "L'avenir de la gestion d'entreprise commence ici.",
    modules: "Ventes · Stock · Factures · RH · Finance",
    subtitle: "Avec Inovexa ERP, gérez toute votre entreprise depuis une seule plateforme",
    button: "Accéder au Dashboard",
    login: "Commencer maintenant",
    aboutBtn: "À propos",
    aboutClose: "Fermer",
    aboutBadge: "Inovexa ERP — Next Generation ERP",
    aboutContent: {
      headline: "La gestion de votre entreprise, 100 % en ligne.",
      intro: [
        "Inovexa ERP est une solution de gestion d’entreprise basée sur le modèle SaaS, conçue pour centraliser, simplifier et optimiser vos opérations quotidiennes.",
        "Grâce à une plateforme unique accessible via Internet, gérez vos stocks, ventes, achats, facturation, finances, ressources humaines et bien plus encore.",
      ],
      sections: [
        {
          title: "Notre mission",
          body: "Accompagner les entreprises dans la digitalisation de leur gestion en proposant un environnement numérique qui facilite l’organisation des opérations et l’accès aux informations essentielles. Notre démarche vise une gestion plus structurée, favorisant la centralisation des données et la visibilité sur les activités.",
        },
        {
          title: "Notre vision",
          body: "Un environnement professionnel où les entreprises accèdent facilement à leurs données, organisent leurs processus et suivent leurs activités depuis un système de gestion intégré.",
          items: [
            "Digitalisation des processus métiers",
            "Intégration des fonctions de gestion",
            "Évolution technologique progressive",
          ],
        },
        {
          title: "Une solution ERP reposant sur le modèle SaaS",
          body: "Inovexa ERP propose un environnement de gestion accessible via Internet depuis des appareils compatibles, selon les conditions d’accès applicables.",
          items: [
            "Accessibilité en ligne",
            "Environnement de gestion centralisé",
            "Approche modulaire",
            "Évolution des besoins",
            "Accès selon les autorisations",
          ],
        },
        {
          title: "Catalogue fonctionnel",
          body: "Les modules couvrent l’ensemble des besoins opérationnels de l’entreprise :",
          items: [
            "Pilotage & tableau de bord",
            "Produits, catégories et inventaire",
            "Ventes, achats, commandes, caisse rapide",
            "Clients, fournisseurs, factures",
            "Finances et ressources humaines",
            "Logistique, rapports et analytique",
            "Assistant IA intégré",
            "Profil et paramètres",
          ],
        },
        {
          title: "Les principes fondamentaux",
          body: "Une approche structurée autour de la centralisation, de l’organisation et de la visibilité opérationnelle.",
          items: [
            "Centralisation des informations",
            "Organisation des processus",
            "Visibilité opérationnelle",
            "Accessibilité en ligne",
            "Assistance intelligente (IA)",
            "Approche évolutive",
          ],
        },
        {
          title: "Secteurs d’activité",
          body: "Inovexa ERP s’adresse notamment aux :",
          items: [
            "Commerces et distributeurs",
            "Entreprises de services",
            "Industries",
            "Acteurs de la logistique",
            "Entreprises en développement",
          ],
        },
        {
          title: "Sécurité & gestion des données",
          body: "La protection repose sur la gestion des accès, l’authentification, la sécurisation des échanges et les procédures de maintenance. Les engagements précis sont présentés selon les dispositifs réellement déployés.",
        },
        {
          title: "Notre engagement",
          body: "Une approche orientée besoins, structurée autour de la clarté, l’organisation, l’accessibilité, l’adaptation, l’évolution et la transparence.",
        },
      ],
      ctaLabel: "Découvrir notre solution",
      ctaHref: "https://www.inovexa-erp.com/",
      emailLabel: "Nous contacter",
      email: "contact@inovexa.com",
    },
    copyright: "Tous droits réservés.",
    privacy: "Confidentialité",
    terms: "Conditions",
    langLabel: "Choisir la langue",
    features: [
      { title: "Solutions intégrées", desc: "Ventes, achats, stock" },
      { title: "Analyses temps réel", desc: "Tableaux de bord en direct" },
      { title: "Sécurisé & fiable", desc: "Données protégées" },
      { title: "Votre équipe", desc: "RH, finance, logistique" },
    ],
  },
  es: {
    title: "El futuro de la gestión empresarial comienza aquí.",
    modules: "Ventas · Stock · Facturas · RR. HH. · Finanzas",
    subtitle: "Con Inovexa ERP, gestione toda su empresa desde una sola plataforma",
    button: "Panel de Control",
    login: "Empezar ahora",
    aboutBtn: "Acerca de",
    aboutClose: "Cerrar",
    aboutBadge: "Inovexa ERP — Next Generation ERP",
    aboutContent: {
      headline: "La gestión de su empresa, 100 % en línea.",
      intro: [
        "Inovexa ERP es una solución de gestión empresarial basada en el modelo SaaS, diseñada para centralizar, simplificar y optimizar sus operaciones diarias.",
        "Gracias a una plataforma única accesible a través de Internet, gestione sus existencias, ventas, compras, facturación, finanzas, recursos humanos y mucho más.",
      ],
      sections: [
        {
          title: "Nuestra misión",
          body: "Acompañar a las empresas en la digitalización de su gestión ofreciendo un entorno digital que facilite la organización de las operaciones y el acceso a la información esencial.",
        },
        {
          title: "Nuestra visión",
          body: "Un entorno profesional donde las empresas accedan fácilmente a sus datos, organicen sus procesos y sigan sus actividades desde un sistema de gestión integrado.",
          items: [
            "Digitalización de los procesos de negocio",
            "Integración de las funciones de gestión",
            "Evolución tecnológica progresiva",
          ],
        },
        {
          title: "Una solución ERP basada en el modelo SaaS",
          body: "Inovexa ERP ofrece un entorno de gestión accesible a través de Internet desde dispositivos compatibles, según las condiciones de acceso aplicables.",
          items: [
            "Accesibilidad en línea",
            "Entorno de gestión centralizado",
            "Enfoque modular",
            "Evolución de las necesidades",
            "Acceso según los permisos",
          ],
        },
        {
          title: "Catálogo funcional",
          body: "Los módulos cubren todas las necesidades operativas de la empresa:",
          items: [
            "Pilotaje y panel de control",
            "Productos, categorías e inventario",
            "Ventas, compras, pedidos, caja rápida",
            "Clientes, proveedores, facturas",
            "Finanzas y recursos humanos",
            "Logística, informes y analítica",
            "Asistente de IA integrado",
            "Perfil y parámetros",
          ],
        },
        {
          title: "Los principios fundamentales",
          body: "Un enfoque estructurado en torno a la centralización, la organización y la visibilidad operativa.",
          items: [
            "Centralización de la información",
            "Organización de los procesos",
            "Visibilidad operativa",
            "Accesibilidad en línea",
            "Asistencia inteligente (IA)",
            "Enfoque evolutivo",
          ],
        },
        {
          title: "Sectores de actividad",
          body: "Inovexa ERP está dirigido en particular a:",
          items: [
            "Comercios y distribuidores",
            "Empresas de servicios",
            "Industrias",
            "Actores de la logística",
            "Empresas en desarrollo",
          ],
        },
        {
          title: "Seguridad y gestión de datos",
          body: "La protección se basa en la gestión de accesos, la autenticación, la seguridad de los intercambios y los procedimientos de mantenimiento. Los compromisos precisos se presentan según los dispositivos realmente implementados.",
        },
        {
          title: "Nuestro compromiso",
          body: "Un enfoque orientado a las necesidades, estructurado en torno a la claridad, la organización, la accesibilidad, la adaptación, la evolución y la transparencia.",
        },
      ],
      ctaLabel: "Descubra nuestra solución",
      ctaHref: "https://www.inovexa-erp.com/",
      emailLabel: "Contáctenos",
      email: "contact@inovexa.com",
    },
    copyright: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    langLabel: "Elegir idioma",
    features: [
      { title: "Soluciones integradas", desc: "Ventas, compras, stock" },
      { title: "Análisis en tiempo real", desc: "Paneles en vivo" },
      { title: "Seguro y confiable", desc: "Datos protegidos" },
      { title: "Su equipo", desc: "RR. HH., finanzas, logística" },
    ],
  },
  en: {
    title: "The future of business management starts here.",
    modules: "Sales · Stock · Invoices · HR · Finance",
    subtitle: "With Inovexa ERP, run your entire business from a single platform",
    button: "Go to Dashboard",
    login: "Get Started Now",
    aboutBtn: "About",
    aboutClose: "Close",
    aboutBadge: "Inovexa ERP — Next Generation ERP",
    aboutContent: {
      headline: "Your business management, 100% online.",
      intro: [
        "Inovexa ERP is a SaaS-based business management solution designed to centralize, simplify and optimize your daily operations.",
        "With a single platform accessible over the Internet, manage your stock, sales, purchases, invoicing, finance, human resources and much more.",
      ],
      sections: [
        {
          title: "Our mission",
          body: "Support companies in the digitalization of their management by providing a digital environment that facilitates the organization of operations and access to essential information.",
        },
        {
          title: "Our vision",
          body: "A professional environment where companies can easily access their data, organize their processes and track their activities through an integrated management system.",
          items: [
            "Digitalization of business processes",
            "Integration of management functions",
            "Progressive technological evolution",
          ],
        },
        {
          title: "An ERP solution based on the SaaS model",
          body: "Inovexa ERP provides a management environment accessible over the Internet from compatible devices, subject to applicable access conditions.",
          items: [
            "Online accessibility",
            "Centralized management environment",
            "Modular approach",
            "Evolving needs",
            "Access based on permissions",
          ],
        },
        {
          title: "Functional catalog",
          body: "The modules cover all the operational needs of the company:",
          items: [
            "Steering & dashboard",
            "Products, categories and inventory",
            "Sales, purchases, orders, quick checkout",
            "Customers, suppliers, invoices",
            "Finance and human resources",
            "Logistics, reports and analytics",
            "Built-in AI assistant",
            "Profile and settings",
          ],
        },
        {
          title: "Fundamental principles",
          body: "A structured approach around centralization, organization and operational visibility.",
          items: [
            "Information centralization",
            "Process organization",
            "Operational visibility",
            "Online accessibility",
            "Intelligent assistance (AI)",
            "Scalable approach",
          ],
        },
        {
          title: "Industries",
          body: "Inovexa ERP is particularly aimed at:",
          items: [
            "Retail and distribution",
            "Service companies",
            "Industry",
            "Logistics players",
            "Growing businesses",
          ],
        },
        {
          title: "Security & data management",
          body: "Protection relies on access management, authentication, secure exchanges and maintenance procedures. Specific commitments are presented according to the measures actually implemented.",
        },
        {
          title: "Our commitment",
          body: "A needs-oriented approach structured around clarity, organization, accessibility, adaptation, evolution and transparency.",
        },
      ],
      ctaLabel: "Discover our solution",
      ctaHref: "https://www.inovexa-erp.com/",
      emailLabel: "Contact us",
      email: "contact@inovexa.com",
    },
    copyright: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    langLabel: "Choose language",
    features: [
      { title: "Integrated solutions", desc: "Sales, purchases, stock" },
      { title: "Real-time insights", desc: "Live dashboards" },
      { title: "Secure & reliable", desc: "Protected data" },
      { title: "Empower your team", desc: "HR, finance, logistics" },
    ],
  },
};

// Couleurs de la page
const HP_DARK: Record<string, string> = {
  "--hp-bg": "#000000",
  "--hp-text": "#ffffff",
  "--hp-muted": "rgba(233,227,255,0.75)",
  "--hp-faint": "rgba(233,227,255,0.6)",
  "--hp-glass": "rgba(255,255,255,0.06)",
  "--hp-glass-border": "rgba(255,255,255,0.12)",
  "--hp-glass-line": "rgba(255,255,255,0.08)",
  "--hp-chip-bg": "rgba(255,255,255,0.08)",
  "--hp-chip-border": "rgba(255,255,255,0.16)",
  "--hp-icon": "#C4B5FD",
  "--hp-accent-text": "#C4B5FD",
  "--hp-cta-bg": "#ffffff",
  "--hp-cta-text": "#2E1065",
  "--hp-cta-shadow": "rgba(167,139,250,0.45)",
  "--hp-ghost-border": "rgba(255,255,255,0.3)",
  "--hp-link": "#DDD6FE",
  "--hp-header-bg": "rgba(10,6,20,0.85)",
  "--hp-menu-bg": "rgba(16,10,30,0.97)",
  "--hp-menu-text": "rgba(255,255,255,0.88)",
  "--hp-shadow": "rgba(0,0,0,0.7)",
  "--hp-modal-bg": "rgba(16,10,30,0.97)",
  "--hp-overlay": "rgba(0,0,0,0.65)",
  "--hp-hero-overlay": "linear-gradient(90deg, rgba(10,6,20,0.95) 0%, rgba(30,12,70,0.82) 45%, rgba(10,6,20,0.25) 100%)",
  "--hp-hero-overlay-compact": "linear-gradient(180deg, rgba(10,6,20,0.9) 0%, rgba(30,12,70,0.8) 55%, rgba(10,6,20,0.6) 100%)",
};
const HP_LIGHT: Record<string, string> = {
  "--hp-bg": "#f8f7ff",
  "--hp-text": "#1E1035",
  "--hp-muted": "#352C55",
  "--hp-faint": "#4B4466",
  "--hp-glass": "rgba(255,255,255,0.7)",
  "--hp-glass-border": "rgba(109,40,217,0.14)",
  "--hp-glass-line": "rgba(109,40,217,0.1)",
  "--hp-chip-bg": "rgba(255,255,255,0.8)",
  "--hp-chip-border": "rgba(109,40,217,0.18)",
  "--hp-icon": "#6D28D9",
  "--hp-accent-text": "#6D28D9",
  "--hp-cta-bg": "#2E1065",
  "--hp-cta-text": "#ffffff",
  "--hp-cta-shadow": "rgba(109,40,217,0.35)",
  "--hp-ghost-border": "rgba(46,16,101,0.25)",
  "--hp-link": "#6D28D9",
  "--hp-header-bg": "rgba(245,243,255,0.9)",
  "--hp-menu-bg": "rgba(255,255,255,0.98)",
  "--hp-menu-text": "#374151",
  "--hp-shadow": "rgba(17,24,39,0.18)",
  "--hp-modal-bg": "rgba(255,255,255,0.99)",
  "--hp-overlay": "rgba(30,16,53,0.45)",
  "--hp-hero-overlay": "linear-gradient(90deg, rgba(248,247,255,0.88) 0%, rgba(245,243,255,0.55) 34%, rgba(245,243,255,0.08) 62%, rgba(245,243,255,0) 100%)",
  "--hp-hero-overlay-compact": "linear-gradient(180deg, rgba(248,247,255,0.86) 0%, rgba(245,243,255,0.6) 50%, rgba(245,243,255,0.25) 100%)",
};

function buildHpVars(themeId: string, theme: any): Record<string, string> {
  if (themeId === "dark") return HP_DARK;
  if (themeId === "light") return HP_LIGHT;
  const light = isLightTheme(theme);
  return {
    ...(light ? HP_LIGHT : HP_DARK),
    "--hp-bg": theme.background,
  };
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const { theme, themeId } = useTheme();

  const isLight = isLightTheme(theme);
  const themeVars = useMemo(() => buildHpVars(themeId, theme) as React.CSSProperties, [themeId, theme]);
  const isCompact = isMobile || isTablet;

  const lang: Lang = (["fr", "en", "es"] as const).includes(language as Lang) ? (language as Lang) : "en";
  const text = TRANSLATIONS[lang];
  const currentLang = LANGS.find((l) => l.code === lang)!;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const aboutBtnRef = useRef<HTMLButtonElement>(null);
  const aboutCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem("token"); } catch { /* stockage indisponible */ }
    setIsLoggedIn(!!token);
    const full = { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1];
    try { router.prefetch(token ? "/dashboard" : "/auth/login", full); } catch { /* ignoré */ }
  }, [pathname, router]);

  useEffect(() => {
    if (!showLanguageMenu) return;
    const onPointer = (e: PointerEvent) => {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) setShowLanguageMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowLanguageMenu(false); langButtonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [showLanguageMenu]);

  const closeAbout = useCallback(() => {
    setShowAbout(false);
    aboutBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showAbout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAbout();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    aboutCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [showAbout, closeAbout]);

  const handleLanguageChange = useCallback((code: Lang) => {
    changeLanguage(code);
    setShowLanguageMenu(false);
    langButtonRef.current?.focus();
  }, [changeLanguage]);

  const year = new Date().getFullYear();
  const ctaHref = isLoggedIn ? "/dashboard" : "/auth/login";

  const brand = (
    <Link href="/" aria-label="Inovexa ERP" className="hp-brand">
      <span className="hp-logo">
        <img src="/images/logo.png" alt="" width={88} height={88} />
      </span>
      <span className="hp-brand-name">
        <b>INOV</b>EXA <span className="hp-brand-erp">ERP</span>
      </span>
    </Link>
  );

  return (
    <div
      className={
        "home-page " +
        (isLight ? "hp-light" : "hp-dark") +
        (isCompact ? " is-compact" : "") +
        (isMobile ? " is-mobile" : "") +
        " " +
        `${poppins.variable} ${orbitron.variable}`
      }
      style={{
        ...themeVars,
        minHeight: "100dvh",
        background: "var(--hp-bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "var(--font-poppins), -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
      }}
    >
      {/* Image de fond + dégradé de lisibilité */}
      <img className="hp-bg-img" src={BG_IMAGE} alt="" aria-hidden="true" draggable={false} decoding="async" />
      <div className="hp-bg-overlay" aria-hidden="true" />

      {/* En-tête : logo + contrôles thème & langue */}
      <header className="hp-header">
        <div className="hp-rise">{brand}</div>

        {/* Thème + langue — dans le header, défilent avec la page */}
        <div className="hp-top-controls">
          <ThemeToggle variant="home" size={isMobile ? 36 : 40} />
          <div ref={langWrapRef} style={{ position: "relative" }}>
            <button
              ref={langButtonRef}
              type="button"
              className="hp-chip-btn"
              aria-haspopup="listbox"
              aria-expanded={showLanguageMenu}
              aria-label={`${text.langLabel} — ${currentLang.label}`}
              onClick={() => setShowLanguageMenu((v) => !v)}
            >
              <img src={`https://flagcdn.com/w20/${currentLang.flag}.png`} width={16} height={12} alt="" style={{ borderRadius: 2 }} />
              <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>{lang.toUpperCase()}</span>
              <span className={"hp-chevron" + (showLanguageMenu ? " open" : "")}><IconChevronDown color="var(--hp-muted)" /></span>
            </button>

            {showLanguageMenu && (
              <ul role="listbox" aria-label={text.langLabel} className="hp-lang-menu">
                {LANGS.map((l) => {
                  const active = l.code === lang;
                  return (
                    <li key={l.code} role="option" aria-selected={active}>
                      <button type="button" lang={l.code} className={"hp-lang-item" + (active ? " active" : "")} onClick={() => handleLanguageChange(l.code)}>
                        <img src={`https://flagcdn.com/w20/${l.flag}.png`} width={16} height={12} alt="" style={{ borderRadius: 2 }} />
                        <span style={{ flex: 1 }}>{l.label}</span>
                        {active && <IconCheck color="var(--hp-accent-text)" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="hp-main">
        <div className="hp-content">
          <div className="hp-rise hp-d1 hp-modules">
            <span className="hp-live-dot" aria-hidden="true" />
            {text.modules}
          </div>

          {/* Espacement renforcé entre badge modules et titre */}
          <h1 className="hp-rise hp-d2 hp-title">{text.title}</h1>
          <p className="hp-rise hp-d2 hp-subtitle">{text.subtitle}</p>
        </div>

        <ul className="hp-cards hp-rise hp-d4">
          {text.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <li key={f.title} className="hp-card">
                <span className="hp-card-icon"><Icon color="var(--hp-icon)" /></span>
                <div className="hp-card-text">
                  <h3 className="hp-card-title">{f.title}</h3>
                  <p className="hp-card-desc">{f.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Actions — désormais SOUS les cards sur tous les écrans */}
        <div className="hp-rise hp-d3 hp-actions hp-actions-below">
          <Link href={ctaHref} prefetch className="hp-cta">
            {isLoggedIn ? text.button : text.login}
            <span className="hp-cta-arrow"><IconArrowRight /></span>
          </Link>
          <button
            ref={aboutBtnRef}
            type="button"
            className="hp-ghost"
            aria-haspopup="dialog"
            aria-expanded={showAbout}
            onClick={() => setShowAbout(true)}
          >
            {text.aboutBtn}
          </button>
        </div>
      </main>

      <footer className="hp-footer">
        <p style={{ margin: 0 }} suppressHydrationWarning>© {year} Inovexa ERP. {text.copyright}</p>
        <nav aria-label="Legal" style={{ display: "flex", gap: 16 }}>
          <a href="https://inovexa-erp.com/privacy.html" target="_blank" rel="noopener noreferrer">{text.privacy}</a>
          <a href="https://inovexa-erp.com/terms.html" target="_blank" rel="noopener noreferrer">{text.terms}</a>
        </nav>
      </footer>

      {showAbout && (
        <div className="hp-overlay" onClick={closeAbout}>
          <div
            className="hp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hp-about-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={aboutCloseRef}
              type="button"
              className="hp-modal-close"
              aria-label={text.aboutClose}
              onClick={closeAbout}
            >
              <IconClose />
            </button>

            <span className="hp-modal-badge">{text.aboutBadge}</span>
            <h2 id="hp-about-title" className="hp-modal-title">{text.aboutContent.headline}</h2>
            {text.aboutContent.intro.map((p) => (
              <p key={p} className="hp-modal-p">{p}</p>
            ))}

            {text.aboutContent.sections.map((section) => (
              <section key={section.title} className="hp-modal-section">
                <h3 className="hp-modal-sub">{section.title}</h3>
                <p className="hp-modal-p">{section.body}</p>
                {section.items && section.items.length > 0 && (
                  <ul className="hp-modal-list">
                    {section.items.map((item) => (
                      <li key={item}>
                        <span className="hp-modal-check"><IconCheck color="var(--hp-accent-text)" /></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="hp-modal-actions">
              <a
                href={text.aboutContent.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hp-cta"
              >
                {text.aboutContent.ctaLabel}
                <span className="hp-cta-arrow"><IconArrowRight /></span>
              </a>
              <a href={`mailto:${text.aboutContent.email}`} className="hp-ghost">
                {text.aboutContent.emailLabel}
              </a>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .home-page * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .home-page :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }
  .home-page ul { list-style: none; margin: 0; padding: 0; }

  /* ── En-tête ── */
  .hp-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: clamp(12px, 2.4vh, 26px) clamp(20px, 4vw, 56px) 0;
  }

  /* ── Contrôles thème + langue (dans le header) ── */
  .hp-top-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  /* ── Fond : image alignée à GAUCHE ── */
  .hp-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 0% center;
    transform: scale(1.06) translateX(-4%);
    transform-origin: left center;
    user-select: none;
    -webkit-user-drag: none;
    z-index: 0;
  }
  .hp-bg-overlay { position: absolute; inset: 0; z-index: 1; background: var(--hp-hero-overlay); }

  /* ── Structure ── */
  .hp-main {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: clamp(14px, 3vh, 32px);
    padding: clamp(6px, 1.5vh, 18px) clamp(20px, 4vw, 56px);
  }
  .hp-content { display: flex; flex-direction: column; width: 100%; max-width: 920px; }
  .hp-footer { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 16px; padding: clamp(8px, 1.6vh, 18px) clamp(20px, 4vw, 56px); font-size: 14px; color: var(--hp-faint); }
  .hp-footer a { color: var(--hp-link); font-weight: 600; text-decoration: none; padding: 4px 0; }
  .hp-footer a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .hp-light .hp-footer a { color: #000000; }

  /* ── Cartes ── */
  .hp-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; width: 100%; max-width: 800px; }
  .hp-card { display: flex; flex-direction: row; align-items: center; gap: 14px; padding: clamp(12px, 2vh, 20px) clamp(14px, 1.4vw, 22px); border-radius: 18px; background: var(--hp-glass); border: 1px solid var(--hp-glass-border); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: transform .2s, border-color .2s; }
  .hp-card:hover { transform: translateY(-3px); border-color: var(--hp-chip-border); }
  .hp-card-icon { width: clamp(40px, 6vh, 52px); height: clamp(40px, 6vh, 52px); flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); }
  .hp-card-title { margin: 0 0 2px; font-size: clamp(15px, min(1.25vw, 2.5vh), 20px); font-weight: 700; color: var(--hp-text); line-height: 1.2; }
  .hp-card-desc { margin: 0; font-size: clamp(13px, min(1vw, 2.1vh), 16px); color: var(--hp-muted); line-height: 1.35; }

  /* ── Marque ── */
  .hp-brand { display: inline-flex; align-items: center; gap: clamp(10px, 1vw, 14px); text-decoration: none; }
  .hp-logo { width: clamp(52px, 7.8vh, 80px); height: clamp(52px, 7.8vh, 80px); flex-shrink: 0; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .hp-logo img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(138,43,226,0.6)); }
  .hp-brand-name { font-family: var(--font-orbitron), var(--font-poppins), sans-serif; font-size: clamp(18px, min(1.7vw, 3vh), 28px); letter-spacing: 2px; font-weight: 800; color: var(--hp-text); white-space: nowrap; }
  .hp-brand-name b { font-weight: 800; }
  .hp-brand-erp { color: var(--hp-accent-text); font-weight: 800; font-size: 0.72em; letter-spacing: 4px; }

  /* ── Textes ── */
  .hp-modules {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: 0.5em 1.05em;
    border-radius: 999px;
    background: var(--hp-chip-bg);
    border: 1px solid var(--hp-chip-border);
    color: var(--hp-text);
    font-size: clamp(13px, min(1.1vw, 2.3vh), 18px);
    font-weight: 600;
    margin-bottom: clamp(12px, 2.4vh, 26px);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .hp-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ADE80; flex-shrink: 0; animation: livePing 2.4s ease-out infinite; }
  @keyframes livePing { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,.55); } 80%,100% { box-shadow: 0 0 0 7px rgba(74,222,128,0); } }
  .hp-title { margin: 0 0 clamp(10px, 1.8vh, 20px); color: var(--hp-text); font-size: clamp(30px, min(4.7vw, 7.2vh), 76px); font-weight: 700; line-height: 1.06; letter-spacing: -0.03em; text-wrap: balance; }
  .hp-subtitle { margin: 0 0 clamp(14px, 2.6vh, 28px); color: var(--hp-muted); font-size: clamp(16px, min(1.5vw, 2.9vh), 24px); line-height: 1.5; max-width: 680px; }

  /* ── Boutons ── */
  .hp-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; width: 100%; }
  .hp-actions-below { margin-top: clamp(18px, 3.5vh, 36px); }

  .hp-cta, .hp-ghost { display: inline-flex; align-items: center; justify-content: center; height: clamp(48px, 6.6vh, 62px); padding: 0 clamp(22px, 2vw, 34px); border-radius: 999px; font-size: clamp(15px, min(1.2vw, 2.4vh), 20px); text-decoration: none; white-space: nowrap; }
  .hp-cta { gap: 10px; background: var(--hp-cta-bg); color: var(--hp-cta-text) !important; font-weight: 700; box-shadow: 0 10px 40px var(--hp-cta-shadow); transition: transform .2s, box-shadow .2s; }
  .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 48px var(--hp-cta-shadow); }
  .hp-cta:active { transform: translateY(0); }
  .hp-cta-arrow { display: inline-flex; transition: transform .2s; }
  .hp-cta:hover .hp-cta-arrow { transform: translateX(3px); }
  .hp-ghost { background: transparent; border: 1px solid var(--hp-ghost-border); color: var(--hp-text) !important; font-weight: 600; font-family: inherit; cursor: pointer; transition: background .2s; }
  .hp-ghost:hover { background: var(--hp-glass); }

  /* ── Fenêtre « À propos » ── */
  .hp-overlay { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--hp-overlay); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: overlayIn .2s ease-out; }
  .hp-modal { position: relative; width: 100%; max-width: 720px; max-height: min(88dvh, 820px); overflow-y: auto; padding: clamp(24px, 4vw, 40px); border-radius: 24px; background: var(--hp-modal-bg); border: 1px solid var(--hp-chip-border); box-shadow: 0 30px 80px var(--hp-shadow); color: var(--hp-text); animation: modalIn .25s cubic-bezier(0.22,1,0.36,1); }
  .hp-modal-close { position: absolute; top: 14px; right: 14px; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-text); cursor: pointer; transition: background .2s; }
  .hp-modal-close:hover { background: var(--hp-glass); }
  .hp-modal-badge { display: inline-block; padding: 0.45em 1em; margin-bottom: 16px; border-radius: 999px; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-accent-text); font-size: 12px; font-weight: 700; letter-spacing: 0.4px; }
  .hp-modal-title { margin: 0 0 14px; padding-right: 36px; font-size: clamp(22px, 3.2vw, 30px); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; text-wrap: balance; }
  .hp-modal-p { margin: 0 0 12px; color: var(--hp-muted); font-size: 15.5px; line-height: 1.65; }
  .hp-modal-section { margin-bottom: 22px; }
  .hp-modal-section:last-of-type { margin-bottom: 8px; }
  .hp-modal-sub { margin: 22px 0 10px; font-size: 18px; font-weight: 700; color: var(--hp-text); }
  .hp-modal-section .hp-modal-sub { margin-top: 0; }
  .home-page .hp-modal-list { display: flex; flex-direction: column; gap: 9px; margin: 0 0 6px; }
  .hp-modal-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; line-height: 1.5; color: var(--hp-text); }
  .hp-modal-check { display: inline-flex; flex-shrink: 0; margin-top: 3px; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); }
  .hp-modal-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--hp-glass-line); }
  .hp-modal .hp-cta, .hp-modal .hp-ghost { height: 48px; padding: 0 22px; }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }

  /* ── Tablette / mobile ── */
  .is-compact .hp-bg-overlay { background: var(--hp-hero-overlay-compact); }
  .is-compact .hp-bg-img { object-position: 0% center; transform: none; }
  .is-mobile .hp-header { padding-top: calc(16px + env(safe-area-inset-top)); padding-left: 18px; padding-right: 18px; }
  .is-mobile .hp-logo { width: 50px; height: 50px; }
  .is-mobile .hp-brand-name { font-size: 16px; letter-spacing: 1px; }
  .is-mobile .hp-brand-erp { letter-spacing: 2px; }
  .is-mobile .hp-title { font-size: clamp(32px, 9vw, 44px); }
  .is-mobile .hp-subtitle { font-size: 17px; }
  .is-mobile .hp-footer { flex-direction: column-reverse; align-items: flex-start; }
  .is-mobile .hp-overlay { padding: 12px; align-items: flex-end; }
  .is-mobile .hp-modal { max-height: 90dvh; border-radius: 22px; }

  /* ── Mobile : aérer sans trop espacer ── */
  .is-mobile .hp-main {
    gap: 10px;            /* espace global réduit entre blocs */
    padding-top: 10px;
    padding-bottom: 16px;
    padding-left: 18px;
    padding-right: 18px;
  }
  .is-mobile .hp-modules {
    font-size: 12px;
    padding: 0.4em 0.9em;
    margin-bottom: 8px;
  }
  .is-mobile .hp-title {
    font-size: clamp(26px, 8vw, 36px);
    margin-bottom: 6px;   /* ← marge réduite sous le titre */
  }
  .is-mobile .hp-subtitle {
    font-size: 15px;
    line-height: 1.45;
    margin-bottom: 0;     /* ← marge supprimée sous le sous-titre */
  }
  .is-mobile .hp-cards {
    gap: 10px;
    margin-top: 0;        /* ← pas de marge parasite au-dessus des cards */
  }
  .is-mobile .hp-card {
    padding: 12px 14px;
    gap: 12px;
    border-radius: 14px;
  }
  .is-mobile .hp-card-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .is-mobile .hp-card-icon svg { width: 1.15em; height: 1.15em; }
  .is-mobile .hp-card-title { font-size: 14px; }
  .is-mobile .hp-card-desc  { font-size: 12.5px; }

  /* Actions sous les cards — pleine largeur et bien espacées */
  .is-mobile .hp-actions-below {
    flex-direction: column;
    align-items: stretch;
    margin-top: 20px;
    gap: 10px;
  }
  .is-mobile .hp-actions-below .hp-cta,
  .is-mobile .hp-actions-below .hp-ghost {
    height: 46px;
    font-size: 15px;
    width: 100%;
  }

  /* ── Image de fond mobile : cadrage corrigé ── */
  .is-mobile .hp-bg-img {
    object-fit: cover;
    object-position: 0% center;
    transform: none;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  @media (max-height: 640px) and (min-width: 901px) { .hp-card-desc { display: none; } .hp-subtitle { margin-bottom: 12px; } }

  /* Cartes : 2 × 2 ; 1 colonne sur petit mobile */
  @media (max-width: 540px) { .hp-cards { grid-template-columns: 1fr; gap: 8px; } }

  /* Remonte légèrement tout le bloc sur ordinateur */
  @media (min-width: 901px) { .hp-main { padding-bottom: clamp(24px, 8vh, 90px); } }

  /* ── Desktop : image plus à gauche + tailles réduites ── */
  @media (min-width: 901px) {
    .hp-bg-img {
      transform: scale(1.08) translateX(-8%);
    }
    .hp-modules {
      font-size: clamp(12px, min(0.95vw, 2vh), 15px);
      padding: 0.42em 0.95em;
      margin-bottom: clamp(14px, 2.6vh, 26px);
    }
    .hp-title {
      font-size: clamp(28px, min(4vw, 6.2vh), 60px);
      margin-bottom: clamp(8px, 1.5vh, 16px);
    }
    .hp-subtitle {
      font-size: clamp(15px, min(1.25vw, 2.4vh), 19px);
      max-width: 620px;
      margin-bottom: clamp(12px, 2.2vh, 24px);
    }
    .hp-actions-below {
      margin-top: clamp(20px, 4vh, 40px);
    }
  }

  /* ── Sélecteur de langue ── */
  .hp-chip-btn { background: var(--hp-chip-bg); backdrop-filter: blur(12px); border: 1px solid var(--hp-chip-border); border-radius: 36px; color: var(--hp-text); height: 40px; padding: 0 14px; cursor: pointer; font-size: 13px; font-family: inherit; display: flex; align-items: center; gap: 8px; }
  .is-mobile .hp-chip-btn { height: 36px; padding: 0 10px; font-size: 12px; }
  .hp-chevron { display: inline-flex; transition: transform .2s; }
  .hp-chevron.open { transform: rotate(180deg); }
  .hp-lang-menu { position: absolute; top: 48px; right: 0; background: var(--hp-menu-bg); backdrop-filter: blur(20px); border: 1px solid var(--hp-chip-border); border-radius: 14px; padding: 6px !important; min-width: 150px; box-shadow: 0 20px 40px var(--hp-shadow); z-index: 201; animation: menuIn .16s ease-out; }
  .hp-lang-item { width: 100%; background: transparent; border: none; color: var(--hp-menu-text); padding: 11px 12px; min-height: 44px; border-radius: 9px; cursor: pointer; text-align: left; font-size: 14px; font-family: inherit; display: flex; align-items: center; gap: 10px; }
  .hp-lang-item:hover { background: rgba(167,139,250,0.12); }
  .hp-lang-item.active { background: rgba(167,139,250,0.2); color: var(--hp-accent-text); font-weight: 700; }
  @keyframes menuIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  /* ── Apparition sans JavaScript ── */
  .hp-rise { animation: hpRise .55s cubic-bezier(0.22,1,0.36,1) both; }
  .hp-d1 { animation-delay: 60ms; } .hp-d2 { animation-delay: 120ms; } .hp-d3 { animation-delay: 220ms; } .hp-d4 { animation-delay: 320ms; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-live-dot, .hp-lang-menu, .hp-overlay, .hp-modal { animation: none !important; }
    .hp-cta, .hp-cta-arrow, .hp-ghost, .hp-card { transition: none !important; }
  }
`;