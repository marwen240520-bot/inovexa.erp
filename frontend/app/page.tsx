"use client";
import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useResponsive } from "@/hooks/useResponsive";
import { Caveat } from "next/font/google";

// Police manuscrite (effet « écrit au stylo ») pour le texte sous l'écran
const handwriting = Caveat({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });

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

const IconTarget = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>
);
const IconBarChart = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const IconShield = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const IconUsers = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
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
const IconMonitor = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><rect x="2" y="4" width="20" height="13" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);
const IconPhone = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
);
const IconGlobe = ({ size = "1.15em", color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z" /></svg>
);

// ─── Types & constantes ────────────────────────────────────────────────────────

type Lang = "fr" | "en" | "es";

interface HomeText {
  title: string;
  modules: string;
  subtitle: string;
  button: string;
  login: string;
  aboutBtn: string;
  aboutClose: string;
  aboutBadge: string;
  aboutHeadline: string;
  aboutIntro: [string, string];
  aboutWhyTitle: string;
  aboutWhy: string[];
  aboutOutro: string;
  aboutLink: string;
  copyright: string;
  privacy: string;
  terms: string;
  langLabel: string;
  previewAlt: string;
  previewTitle: string;
  previewText: string;
  devices: [string, string, string];
  features: { title: string; desc: string }[];
}

const LOGO_FONT = "'Orbitron', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";
const WEBSITE_URL = "https://www.inovexa-erp.com";
const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "fr" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
];
const FEATURE_ICONS = [IconTarget, IconBarChart, IconShield, IconUsers];
const DEVICE_ICONS = [IconMonitor, IconPhone, IconGlobe];

// Largeurs des deux colonnes sur ordinateur
const LEFT_WIDTH = "40%";
const RIGHT_WIDTH = "60%";
// Image du côté droit selon le thème
const PREVIEW_DARK = "/images/2.png";
const PREVIEW_LIGHT = "/images/1.png";

// Traductions définies une seule fois (et non recréées à chaque rendu)
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
    aboutHeadline: "La gestion de votre entreprise, 100 % en ligne.",
    aboutIntro: [
      "Inovexa ERP est une solution de gestion d’entreprise basée sur le modèle SaaS, conçue pour centraliser, simplifier et optimiser vos opérations quotidiennes.",
      "Grâce à une plateforme unique accessible via Internet, gérez vos stocks, ventes, achats, facturation, finances, ressources humaines et bien plus encore.",
    ],
    aboutWhyTitle: "Pourquoi choisir Inovexa ERP ?",
    aboutWhy: [
      "Solution SaaS 100 % en ligne",
      "Accès à distance depuis vos appareils compatibles",
      "Gestion centralisée de votre entreprise",
      "Intelligence artificielle intégrée",
      "Tableaux de bord et indicateurs de performance",
      "Gestion des utilisateurs et des autorisations",
      "Modules adaptés à vos besoins",
      "Automatisation et optimisation des processus",
      "Solution évolutive pour accompagner votre croissance",
    ],
    aboutOutro: "Inovexa ERP : une gestion centralisée, une vision claire et une entreprise prête pour le digital.",
    aboutLink: "Découvrir notre solution",
    copyright: "Tous droits réservés.",
    privacy: "Confidentialité",
    terms: "Conditions",
    langLabel: "Choisir la langue",
    previewAlt: "Aperçu du tableau de bord Inovexa ERP",
    previewTitle: "Votre ERP, partout avec vous.",
    previewText: "Au bureau, en déplacement ou sur le terrain : accédez à vos données depuis n'importe quel appareil.",
    devices: ["Ordinateur", "Mobile", "FR · EN · ES"],
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
    aboutHeadline: "La gestión de su empresa, 100 % en línea.",
    aboutIntro: [
      "Inovexa ERP es una solución de gestión empresarial basada en el modelo SaaS, diseñada para centralizar, simplificar y optimizar sus operaciones diarias.",
      "Gracias a una plataforma única accesible a través de Internet, gestione sus existencias, ventas, compras, facturación, finanzas, recursos humanos y mucho más.",
    ],
    aboutWhyTitle: "¿Por qué elegir Inovexa ERP?",
    aboutWhy: [
      "Solución SaaS 100 % en línea",
      "Acceso remoto desde sus dispositivos compatibles",
      "Gestión centralizada de su empresa",
      "Inteligencia artificial integrada",
      "Paneles de control e indicadores de rendimiento",
      "Gestión de usuarios y permisos",
      "Módulos adaptados a sus necesidades",
      "Automatización y optimización de procesos",
      "Solución escalable para acompañar su crecimiento",
    ],
    aboutOutro: "Inovexa ERP: una gestión centralizada, una visión clara y una empresa preparada para lo digital.",
    aboutLink: "Descubra nuestra solución",
    copyright: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    langLabel: "Elegir idioma",
    previewAlt: "Vista previa del panel de Inovexa ERP",
    previewTitle: "Su ERP, siempre con usted.",
    previewText: "En la oficina, de viaje o sobre el terreno: acceda a sus datos desde cualquier dispositivo.",
    devices: ["Ordenador", "Móvil", "FR · EN · ES"],
    features: [
      { title: "Soluciones integradas", desc: "Ventas, compras, stock" },
      { title: "Análisis en tiempo real", desc: "Paneles en vivo" },
      { title: "Seguro & confiable", desc: "Datos protegidos" },
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
    aboutHeadline: "Your business management, 100% online.",
    aboutIntro: [
      "Inovexa ERP is a SaaS-based business management solution designed to centralize, simplify and optimize your daily operations.",
      "With a single platform accessible over the Internet, manage your stock, sales, purchases, invoicing, finance, human resources and much more.",
    ],
    aboutWhyTitle: "Why choose Inovexa ERP?",
    aboutWhy: [
      "100% online SaaS solution",
      "Remote access from your compatible devices",
      "Centralized management of your business",
      "Built-in artificial intelligence",
      "Dashboards and performance indicators",
      "User and permission management",
      "Modules tailored to your needs",
      "Process automation and optimization",
      "Scalable solution to support your growth",
    ],
    aboutOutro: "Inovexa ERP: centralized management, a clear vision and a business ready for the digital age.",
    aboutLink: "Discover our solution",
    copyright: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    langLabel: "Choose language",
    previewAlt: "Inovexa ERP dashboard preview",
    previewTitle: "Your ERP, wherever you are.",
    previewText: "At the office, on the road or in the field: reach your data from any device.",
    devices: ["Desktop", "Mobile", "FR · EN · ES"],
    features: [
      { title: "Integrated solutions", desc: "Sales, purchases, stock" },
      { title: "Real-time insights", desc: "Live dashboards" },
      { title: "Secure & reliable", desc: "Protected data" },
      { title: "Empower your team", desc: "HR, finance, logistics" },
    ],
  },
};

// Couleurs de la page. Le panneau gauche « violet immersif » a sa propre variante claire.
const HP_DARK: Record<string, string> = {
  "--hp-bg": "#000000",
  "--hp-text": "#ffffff",
  "--hp-muted": "rgba(233,227,255,0.75)",
  "--hp-faint": "rgba(233,227,255,0.6)",
  "--hp-left-base": "#0A0614",
  "--hp-left-glow-1": "rgba(124,58,237,0.55)",
  "--hp-left-glow-2": "rgba(79,70,229,0.4)",
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
  "--hp-right-bg": "#05040a",
  "--hp-right-glow": "rgba(124,58,237,0.28)",
  "--hp-laptop-body": "linear-gradient(180deg, #2a2733, #16141d)",
  "--hp-laptop-base": "linear-gradient(180deg, #3a3646, #1c1a24)",
  "--hp-laptop-edge": "rgba(255,255,255,0.14)",
  "--hp-laptop-cam": "#3a3646",
  "--hp-laptop-notch": "#14121a",
  "--hp-laptop-floor": "rgba(0,0,0,0.6)",
};
const HP_LIGHT: Record<string, string> = {
  "--hp-bg": "#f8f7ff",
  "--hp-text": "#1E1035",
  "--hp-muted": "#4B4466",
  "--hp-faint": "#6B6485",
  "--hp-left-base": "#F5F3FF",
  "--hp-left-glow-1": "rgba(167,139,250,0.45)",
  "--hp-left-glow-2": "rgba(129,140,248,0.3)",
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
  "--hp-right-bg": "#f8f7ff",
  "--hp-right-glow": "rgba(167,139,250,0.3)",
  "--hp-laptop-body": "linear-gradient(180deg, #e9e6f2, #d6d2e2)",
  "--hp-laptop-base": "linear-gradient(180deg, #dcd8e8, #bdb7cf)",
  "--hp-laptop-edge": "rgba(46,16,101,0.18)",
  "--hp-laptop-cam": "#a9a3bd",
  "--hp-laptop-notch": "#b1abc6",
  "--hp-laptop-floor": "rgba(46,16,101,0.25)",
};

/** Variables de couleur pour n'importe quel thème */
function buildHpVars(themeId: string, theme: any): Record<string, string> {
  if (themeId === "dark") return HP_DARK;
  if (themeId === "light") return HP_LIGHT;
  const light = isLightTheme(theme);
  return {
    ...(light ? HP_LIGHT : HP_DARK),
    "--hp-bg": theme.background,
    "--hp-right-bg": theme.background,
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
  // Format réel de la capture (largeur / hauteur), lu au chargement de l'image :
  // l'écran du PC prend exactement ce format, l'image n'est ni coupée ni déformée.
  const [shotRatio, setShotRatio] = useState(16 / 10);
  const shotRef = useRef<HTMLImageElement>(null);
  const readShotRatio = useCallback(() => {
    const img = shotRef.current;
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) setShotRatio(img.naturalWidth / img.naturalHeight);
  }, []);
  // L'image peut être déjà en cache (chargée avant React) : on lit aussi son format au montage
  useEffect(() => { if (shotRef.current?.complete) readShotRatio(); }, [isLight, readShotRatio]);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const aboutBtnRef = useRef<HTMLButtonElement>(null);
  const aboutCloseRef = useRef<HTMLButtonElement>(null);

  // Session + préchargement de la page suivante pour un clic instantané
  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem("token"); } catch { /* stockage indisponible */ }
    setIsLoggedIn(!!token);
    const full = { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1];
    try { router.prefetch(token ? "/dashboard" : "/auth/login", full); } catch { /* ignoré */ }
  }, [pathname, router]);

  // Fermeture du menu de langue : clic à l'extérieur ou touche Échap
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

  // Fenêtre « À propos » : Échap pour fermer, blocage du défilement, focus sur la croix
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
      className={"home-page " + (isLight ? "hp-light" : "hp-dark") + (isCompact ? " is-compact" : "") + (isMobile ? " is-mobile" : "")}
      style={{
        ...themeVars,
        minHeight: "100dvh",
        background: "var(--hp-bg)",
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        overflow: "hidden",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
      }}
    >
      {/* ── MOBILE : en-tête fixe ── */}
      {isMobile && <header className="mobile-header">{brand}</header>}

      {/* ── Thème + langue ── */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", alignItems: "center", gap: 10 }}>
        <ThemeToggle variant="home" size={40} />
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

      {/* ── CÔTÉ GAUCHE — violet immersif ── */}
      <main className="hp-left" style={{ width: isCompact ? "100%" : LEFT_WIDTH }}>
        {!isMobile && <div className="hp-rise">{brand}</div>}

        <div className="hp-left-body">
          <div className="hp-rise hp-d1 hp-modules">
            <span className="hp-live-dot" aria-hidden="true" />
            {text.modules}
          </div>

          <h1 className="hp-rise hp-d2 hp-title">{text.title}</h1>
          <p className="hp-rise hp-d2 hp-subtitle">{text.subtitle}</p>

          {/* Le lien EST le bouton (pas de <button> dans un <a>) */}
          <div className="hp-rise hp-d3 hp-actions">
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

          {/* Fonctionnalités — liste en verre */}
          <ul className="hp-glass-list hp-rise hp-d4">
            {text.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <li key={f.title} className="hp-glass-row">
                  <Icon color="var(--hp-icon)" />
                  <span className="hp-glass-title">{f.title}</span>
                  <span className="hp-glass-desc">{f.desc}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="hp-footer">
          <p style={{ margin: 0 }} suppressHydrationWarning>© {year} Inovexa ERP. {text.copyright}</p>
          <nav aria-label="Legal" style={{ display: "flex", gap: 16 }}>
            <a href="https://inovexa-erp.com/privacy.html" target="_blank" rel="noopener noreferrer">{text.privacy}</a>
            <a href="https://inovexa-erp.com/terms.html" target="_blank" rel="noopener noreferrer">{text.terms}</a>
          </nav>
        </footer>
      </main>

      {/* ── CÔTÉ DROIT — image (2.png sombre / 1.png clair) puis texte ── */}
      {!isMobile && (
        <aside className="hp-right" style={{ width: isTablet ? "100%" : RIGHT_WIDTH }}>
          {/* Écran d'ordinateur : bord fin, l'image remplit tout l'écran (2.png sombre / 1.png clair) */}
          <div className="hp-pc" style={{ ["--shot-ratio" as any]: shotRatio }}>
            <div className="hp-pc-screen">
              <img
                key={isLight ? "light" : "dark"}
                src={isLight ? PREVIEW_LIGHT : PREVIEW_DARK}
                alt={text.previewAlt}
                draggable={false}
                ref={shotRef}
                onLoad={readShotRatio}
                decoding="async"
              />
            </div>
            <div className="hp-pc-stand" aria-hidden="true" />
            <div className="hp-pc-shadow" aria-hidden="true" />
          </div>
          <div className={"hp-right-text " + handwriting.className}>
            <h2 className="hp-right-title hp-pen hp-pen-1">{text.previewTitle}</h2>
            {/* Trait souligné tracé comme au stylo */}
            <svg className="hp-pen-underline" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 9 C 60 3, 110 12, 160 7 S 250 3, 297 8" />
            </svg>
            <p className="hp-right-sub hp-pen hp-pen-2">{text.previewText}</p>
            <ul className="hp-devices">
              {text.devices.map((d, i) => {
                const Icon = DEVICE_ICONS[i];
                return <li key={d}><Icon color="var(--hp-icon)" />{d}</li>;
              })}
            </ul>
          </div>
        </aside>
      )}

      {/* ── Fenêtre « À propos » ── */}
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
            <h2 id="hp-about-title" className="hp-modal-title">{text.aboutHeadline}</h2>
            {text.aboutIntro.map((p) => (
              <p key={p} className="hp-modal-p">{p}</p>
            ))}

            <h3 className="hp-modal-sub">{text.aboutWhyTitle}</h3>
            <ul className="hp-modal-list">
              {text.aboutWhy.map((item) => (
                <li key={item}>
                  <span className="hp-modal-check"><IconCheck color="var(--hp-accent-text)" /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="hp-modal-outro">{text.aboutOutro}</p>

            <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="hp-cta hp-modal-link">
              {text.aboutLink}
              <span className="hp-cta-arrow"><IconArrowRight /></span>
            </a>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Toutes les tailles sont fluides (clamp) : la page tient dans l'écran à 100 % de zoom,
// de 1280×720 jusqu'à 1920×1080 et plus, sans débordement ni zoom CSS.

const STYLES = `
  .home-page * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .home-page :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }
  .home-page ul { list-style: none; margin: 0; padding: 0; }

  /* ── Panneau gauche ── */
  .hp-left {
    display: flex; flex-direction: column; justify-content: space-between; gap: clamp(16px, 3vh, 32px);
    position: relative; z-index: 10; min-height: 100vh;
    padding: clamp(22px, 4vh, 44px) clamp(28px, 3.4vw, 64px) clamp(18px, 3vh, 32px);
    background-color: var(--hp-left-base);
    background-image:
      radial-gradient(ellipse 80% 60% at 0% 0%, var(--hp-left-glow-1), transparent 60%),
      radial-gradient(ellipse 70% 50% at 100% 100%, var(--hp-left-glow-2), transparent 60%);
  }
  .hp-left-body { display: flex; flex-direction: column; max-width: 560px; }

  /* ── Marque ── */
  .hp-brand { display: inline-flex; align-items: center; gap: clamp(10px, 1vw, 14px); text-decoration: none; }
  .hp-logo { width: clamp(60px, 8.6vh, 88px); height: clamp(60px, 8.6vh, 88px); flex-shrink: 0; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .hp-logo img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(138,43,226,0.6)); }
  .hp-brand-name { font-family: ${LOGO_FONT}; font-size: clamp(17px, 1.45vw, 23px); letter-spacing: 2px; font-weight: 800; color: var(--hp-text); white-space: nowrap; }
  .hp-brand-name b { font-weight: 800; }
  .hp-brand-erp { color: var(--hp-accent-text); font-weight: 800; font-size: 0.72em; letter-spacing: 4px; }

  /* ── En-tête mobile ── */
  .mobile-header { position: fixed; top: 0; left: 0; right: 0; height: 72px; background: var(--hp-header-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--hp-glass-line); display: flex; align-items: center; z-index: 150; padding: 0 16px; padding-top: env(safe-area-inset-top); }
  .mobile-header .hp-logo { width: 56px; height: 56px; }
  .mobile-header .hp-brand-name { font-size: 17px; }

  /* ── Textes ── */
  .hp-modules { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; padding: 0.55em 1.1em; border-radius: 999px; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-text); font-size: clamp(11px, 0.85vw, 13px); font-weight: 600; margin-bottom: clamp(14px, 2.6vh, 26px); }
  .hp-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ADE80; flex-shrink: 0; animation: livePing 2.4s ease-out infinite; }
  @keyframes livePing { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,.55); } 80%,100% { box-shadow: 0 0 0 7px rgba(74,222,128,0); } }
  .hp-title { margin: 0 0 clamp(12px, 2.2vh, 22px); color: var(--hp-text); font-size: clamp(28px, min(3.15vw, 5.8vh), 56px); font-weight: 700; line-height: 1.07; letter-spacing: -0.03em; text-wrap: balance; }
  .hp-subtitle { margin: 0 0 clamp(18px, 3.4vh, 34px); color: var(--hp-muted); font-size: clamp(14px, min(1.1vw, 1.95vh), 17px); line-height: 1.6; max-width: 480px; }

  /* ── Boutons ── */
  .hp-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: clamp(16px, 3.6vh, 40px); }
  .hp-cta, .hp-ghost { display: inline-flex; align-items: center; justify-content: center; height: clamp(46px, 6vh, 56px); padding: 0 clamp(20px, 1.8vw, 30px); border-radius: 999px; font-size: clamp(14px, 1vw, 16px); text-decoration: none; white-space: nowrap; }
  .hp-cta { gap: 10px; background: var(--hp-cta-bg); color: var(--hp-cta-text) !important; font-weight: 700; box-shadow: 0 10px 40px var(--hp-cta-shadow); transition: transform .2s, box-shadow .2s; }
  .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 48px var(--hp-cta-shadow); }
  .hp-cta:active { transform: translateY(0); }
  .hp-cta-arrow { display: inline-flex; transition: transform .2s; }
  .hp-cta:hover .hp-cta-arrow { transform: translateX(3px); }
  .hp-ghost { background: transparent; border: 1px solid var(--hp-ghost-border); color: var(--hp-text) !important; font-weight: 600; font-family: inherit; cursor: pointer; transition: background .2s; }
  .hp-ghost:hover { background: var(--hp-glass); }

  /* ── Liste en verre ── */
  .hp-glass-list { display: flex; flex-direction: column; border-radius: 16px; background: var(--hp-glass); border: 1px solid var(--hp-glass-border); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); max-width: 540px; font-size: clamp(13px, 0.95vw, 15px); }
  .hp-glass-row { display: flex; align-items: center; gap: 0.9em; padding: clamp(8px, 1.35vh, 15px) 1.2em; border-bottom: 1px solid var(--hp-glass-line); }
  .hp-glass-row:last-child { border-bottom: none; }
  .hp-glass-row svg { flex-shrink: 0; }
  .hp-glass-title { flex: 1; font-weight: 600; color: var(--hp-text); }
  .hp-glass-desc { font-size: 0.88em; color: var(--hp-muted); text-align: right; }

  /* ── Pied de page ── */
  .hp-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: var(--hp-faint); }
  .hp-footer a { color: var(--hp-link); font-weight: 600; text-decoration: none; padding: 4px 0; }
  .hp-footer a:hover { text-decoration: underline; text-underline-offset: 3px; }

  /* ── Côté droit ── */
  .hp-right {
    flex-shrink: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: clamp(18px, 3.2vh, 32px); padding: clamp(72px, 10vh, 100px) clamp(28px, 3.6vw, 64px) clamp(24px, 5vh, 56px);
    border-left: 1px solid rgba(139,92,246,0.18);
    background-color: var(--hp-right-bg);
    background-image: radial-gradient(ellipse 70% 40% at 50% 0%, var(--hp-right-glow), transparent 70%);
  }
  /* ── Écran d'ordinateur ── */
  .hp-pc { width: min(100%, calc(50vh * var(--shot-ratio, 1.6))); display: flex; flex-direction: column; align-items: center; flex-shrink: 1; min-height: 0; }
  /* Bord fin : l'image touche presque le bord, aucune bande dessus ni dessous */
  .hp-pc-screen { width: 100%; padding: clamp(10px, 1.1vw, 18px); border-radius: clamp(16px, 1.4vw, 22px); background: var(--hp-laptop-body); border: 1px solid var(--hp-laptop-edge); box-shadow: 0 40px 90px -30px var(--hp-cta-shadow); line-height: 0; }
  .hp-pc-screen img { display: block; width: 100%; height: auto; border-radius: 10px; user-select: none; -webkit-user-drag: none; }
  /* Pied d'un seul bloc (trapèze), au lieu de deux barres */
  .hp-pc-stand { width: 26%; height: clamp(34px, 6.5vh, 70px); margin-top: -1px; background: var(--hp-laptop-base); clip-path: polygon(38% 0, 62% 0, 76% 82%, 100% 92%, 100% 100%, 0 100%, 0 92%, 24% 82%); }
  .hp-pc-shadow { width: 40%; height: 18px; margin-top: 2px; border-radius: 50%; background: radial-gradient(ellipse, var(--hp-laptop-floor), transparent 70%); }
  .hp-right-text { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 640px; flex-shrink: 0; }
  .hp-right-title { margin: 0; color: var(--hp-text); font-size: clamp(30px, min(3vw, 5vh), 46px); font-weight: 700; line-height: 1.1; text-wrap: balance; transform: rotate(-1.2deg); }
  .hp-right-sub { margin: 0 0 clamp(12px, 2vh, 20px); color: var(--hp-muted); font-size: clamp(19px, min(1.5vw, 2.6vh), 24px); font-weight: 500; line-height: 1.35; max-width: 600px; transform: rotate(-0.6deg); }
  .hp-devices { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; }

  /* Effet « écrit au stylo » : le texte apparaît de gauche à droite, puis le trait se dessine */
  .hp-pen { clip-path: inset(0 100% 0 0); animation: hpWrite 1.6s cubic-bezier(.45,.05,.35,1) forwards; }
  .hp-pen-1 { animation-delay: .35s; }
  .hp-pen-2 { animation-delay: 1.9s; animation-duration: 2.4s; }
  @keyframes hpWrite { to { clip-path: inset(0 -2% 0 0); } }
  .hp-pen-underline { width: min(70%, 360px); height: 14px; margin: 2px 0 10px; overflow: visible; }
  .hp-pen-underline path { fill: none; stroke: var(--hp-icon); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 320; stroke-dashoffset: 320; animation: hpDraw .9s ease-out 1.75s forwards; }
  @keyframes hpDraw { to { stroke-dashoffset: 0; } }
  .hp-devices { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 22px; font-size: clamp(12.5px, 0.9vw, 14px); font-weight: 600; color: var(--hp-text); }
  .hp-devices li { display: inline-flex; align-items: center; gap: 7px; }

  /* ── Fenêtre « À propos » ── */
  .hp-overlay { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--hp-overlay); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: overlayIn .2s ease-out; }
  .hp-modal { position: relative; width: 100%; max-width: 620px; max-height: min(88dvh, 780px); overflow-y: auto; padding: clamp(24px, 4vw, 40px); border-radius: 24px; background: var(--hp-modal-bg); border: 1px solid var(--hp-chip-border); box-shadow: 0 30px 80px var(--hp-shadow); color: var(--hp-text); animation: modalIn .25s cubic-bezier(0.22,1,0.36,1); }
  .hp-modal-close { position: absolute; top: 14px; right: 14px; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-text); cursor: pointer; transition: background .2s; }
  .hp-modal-close:hover { background: var(--hp-glass); }
  .hp-modal-badge { display: inline-block; padding: 0.45em 1em; margin-bottom: 16px; border-radius: 999px; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-accent-text); font-size: 12px; font-weight: 700; letter-spacing: 0.4px; }
  .hp-modal-title { margin: 0 0 14px; padding-right: 36px; font-size: clamp(22px, 3.2vw, 30px); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; text-wrap: balance; }
  .hp-modal-p { margin: 0 0 12px; color: var(--hp-muted); font-size: 15px; line-height: 1.65; }
  .hp-modal-sub { margin: 22px 0 12px; font-size: 17px; font-weight: 700; }
  .hp-modal-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 20px; }
  .hp-modal-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; line-height: 1.5; color: var(--hp-text); }
  .hp-modal-check { display: inline-flex; flex-shrink: 0; margin-top: 3px; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); }
  .hp-modal-outro { margin: 0 0 22px; padding: 14px 16px; border-radius: 14px; background: var(--hp-glass); border: 1px solid var(--hp-glass-border); font-size: 14.5px; font-weight: 600; line-height: 1.55; }
  .hp-modal-link { align-self: flex-start; }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }

  /* ── Tablette / mobile ── */
  .is-compact .hp-left { min-height: auto; }
  .is-compact .hp-right { height: auto; border-left: none; border-top: 1px solid rgba(139,92,246,0.18); padding: 40px 24px; }
  .is-compact .hp-pc { width: min(100%, 720px, calc(60vh * var(--shot-ratio, 1.6))); }
  .is-mobile .hp-left { min-height: 100dvh; justify-content: flex-start; gap: 0; padding: 100px 20px 28px; }
  .is-mobile .hp-title { font-size: clamp(30px, 8.6vw, 40px); }
  .is-mobile .hp-subtitle { font-size: 15px; }
  .is-mobile .hp-actions { flex-direction: column; align-items: stretch; }
  .is-mobile .hp-cta, .is-mobile .hp-ghost { height: 52px; font-size: 15px; }
  .is-mobile .hp-footer { margin-top: 32px; flex-direction: column-reverse; align-items: flex-start; }
  .is-mobile .hp-overlay { padding: 12px; align-items: flex-end; }
  .is-mobile .hp-modal { max-height: 90dvh; border-radius: 22px; }
  @media (max-width: 420px) {
    .hp-glass-row { flex-wrap: wrap; row-gap: 2px; }
    .hp-glass-desc { flex-basis: 100%; padding-left: 2em; text-align: left; }
  }

  /* ── Sélecteur de langue ── */
  .hp-chip-btn { background: var(--hp-chip-bg); backdrop-filter: blur(12px); border: 1px solid var(--hp-chip-border); border-radius: 36px; color: var(--hp-text); height: 40px; padding: 0 14px; cursor: pointer; font-size: 12px; font-family: inherit; display: flex; align-items: center; gap: 8px; }
  .hp-chevron { display: inline-flex; transition: transform .2s; }
  .hp-chevron.open { transform: rotate(180deg); }
  .hp-lang-menu { position: absolute; top: 48px; right: 0; background: var(--hp-menu-bg); backdrop-filter: blur(20px); border: 1px solid var(--hp-chip-border); border-radius: 14px; padding: 6px !important; min-width: 150px; box-shadow: 0 20px 40px var(--hp-shadow); z-index: 201; animation: menuIn .16s ease-out; }
  .hp-lang-item { width: 100%; background: transparent; border: none; color: var(--hp-menu-text); padding: 11px 12px; min-height: 44px; border-radius: 9px; cursor: pointer; text-align: left; font-size: 13px; font-family: inherit; display: flex; align-items: center; gap: 10px; }
  .hp-lang-item:hover { background: rgba(167,139,250,0.12); }
  .hp-lang-item.active { background: rgba(167,139,250,0.2); color: var(--hp-accent-text); font-weight: 700; }
  @keyframes menuIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  /* ── Apparition sans JavaScript ── */
  .hp-rise { animation: hpRise .55s cubic-bezier(0.22,1,0.36,1) both; }
  .hp-d1 { animation-delay: 60ms; } .hp-d2 { animation-delay: 120ms; } .hp-d3 { animation-delay: 220ms; } .hp-d4 { animation-delay: 320ms; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-live-dot, .hp-lang-menu, .hp-overlay, .hp-modal { animation: none !important; }
    .hp-pen { animation: none !important; clip-path: none !important; }
    .hp-pen-underline path { animation: none !important; stroke-dashoffset: 0 !important; }
    .hp-cta, .hp-cta-arrow, .hp-ghost { transition: none !important; }
  }
`;