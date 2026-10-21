"use client";
import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useResponsive } from "@/hooks/useResponsive";

// ─── Icônes SVG ────────────────────────────────────────────────────────────────

type IconProps = { size?: number; color?: string };
const svgBase = (size: number, color: string, strokeWidth = "2") => ({
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

const IconTarget = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>
);
const IconBarChart = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const IconShield = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const IconUsers = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconArrowRight = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const IconChevronDown = ({ size = 11, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><polyline points="6 9 12 15 18 9" /></svg>
);
const IconCheck = ({ size = 13, color = "currentColor" }: IconProps) => (
  <svg {...svgBase(size, color, "2.5")}><polyline points="20 6 9 17 4 12" /></svg>
);

// ─── Types & constantes ────────────────────────────────────────────────────────

type Lang = "fr" | "en" | "es";

interface HomeText {
  title: string;
  modules: string;
  subtitle: string;
  extra: string;
  previewAlt: string;
  button: string;
  login: string;
  signin: string;
  copyright: string;
  privacy: string;
  terms: string;
  langLabel: string;
  features: { title: string; desc: string }[];
}

const LOGO_FONT = "'Orbitron', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";
const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "fr" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
];
const FEATURE_ICONS = [IconTarget, IconBarChart, IconShield, IconUsers];

// Page réduite de 10 % sur tablette / ordinateur (1 = taille normale)
const PAGE_SCALE = 0.9;
// Image du côté droit selon le thème
const PREVIEW_DARK = "/images/2.png";
const PREVIEW_LIGHT = "/images/1.png";

// Traductions définies une seule fois (et non recréées à chaque rendu)
const TRANSLATIONS: Record<Lang, HomeText> = {
  fr: {
    title: "L'avenir de la gestion d'entreprise commence ici.",
    modules: "Ventes · Stock · Factures · RH · Finance",
    subtitle: "Un ERP clair et rapide pour gérer toute votre activité, en français, anglais et espagnol.",
    extra: "De la commande à la facture, du stock à la paie : toutes vos opérations sont reliées et à jour en temps réel, pour décider plus vite et mieux.",
    previewAlt: "Aperçu du tableau de bord Inovexa ERP",
    button: "Accéder au Dashboard",
    login: "Commencer maintenant",
    signin: "Se connecter",
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
    subtitle: "Un ERP claro y rápido para gestionar toda su actividad, en francés, inglés y español.",
    extra: "Del pedido a la factura, del stock a la nómina: todas sus operaciones conectadas y actualizadas en tiempo real, para decidir más rápido y mejor.",
    previewAlt: "Vista previa del panel de Inovexa ERP",
    button: "Panel de Control",
    login: "Empezar ahora",
    signin: "Iniciar sesión",
    copyright: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    langLabel: "Elegir idioma",
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
    subtitle: "A clear, fast ERP to run your whole business, in French, English and Spanish.",
    extra: "From order to invoice, from stock to payroll: every operation is connected and up to date in real time, so you can decide faster and better.",
    previewAlt: "Inovexa ERP dashboard preview",
    button: "Go to Dashboard",
    login: "Get Started Now",
    signin: "Sign in",
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
  "--hp-right-bg": "#05040a",
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
  "--hp-right-bg": "#f8f7ff",
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
  const scale = isMobile ? 1 : PAGE_SCALE;
  // Avec « zoom », 100vh rapetisse aussi : on compense pour garder toute la hauteur de l'écran
  const fullH = (unit: "vh" | "dvh") => (scale === 1 ? `100${unit}` : `calc(100${unit} / ${scale})`);

  const lang: Lang = (["fr", "en", "es"] as const).includes(language as Lang) ? (language as Lang) : "en";
  const text = TRANSLATIONS[lang];
  const currentLang = LANGS.find((l) => l.code === lang)!;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);

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
        <img src="/images/logo.png" alt="" width={64} height={64} />
      </span>
      <span style={{ fontFamily: LOGO_FONT, fontSize: isMobile ? 16 : 19, letterSpacing: 2, fontWeight: 300, color: "var(--hp-text)", whiteSpace: "nowrap" }}>
        <b style={{ fontWeight: 800 }}>INOV</b>EXA{" "}
        <span style={{ color: "var(--hp-accent-text)", fontWeight: 800, fontSize: isMobile ? 11 : 12.5, letterSpacing: 4 }}>ERP</span>
      </span>
    </Link>
  );

  return (
    <div
      className={"home-page " + (isLight ? "hp-light" : "hp-dark")}
      style={{
        ...themeVars,
        zoom: scale,
        minHeight: fullH("dvh"),
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
      <main
        className="hp-left"
        style={{
          width: isCompact ? "100%" : "44%",
          padding: isMobile ? "100px 20px 28px" : isTablet ? "32px 48px 40px" : "40px 56px 32px",
          minHeight: isMobile ? "100dvh" : isTablet ? "auto" : fullH("vh"),
          justifyContent: isMobile ? "flex-start" : "space-between",
          gap: isMobile ? 0 : 32,
        }}
      >
        {!isMobile && <div className="hp-rise">{brand}</div>}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="hp-rise hp-d1 hp-modules">
            <span className="hp-live-dot" aria-hidden="true" />
            {text.modules}
          </div>

          <h1
            className="hp-rise hp-d2"
            style={{
              fontSize: isMobile ? "clamp(32px, 9vw, 40px)" : isTablet ? 48 : "clamp(40px, 6.2vh, 56px)",
              color: "var(--hp-text)",
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: isMobile ? "-1px" : "-1.6px",
              margin: "0 0 22px",
              maxWidth: 520,
              textWrap: "balance" as any,
            }}
          >
            {text.title}
          </h1>

          <p className="hp-rise hp-d2 hp-subtitle" style={{ fontSize: isMobile ? 15 : 16.5, marginBottom: isMobile ? 26 : "clamp(22px, 3.8vh, 34px)" }}>
            {text.subtitle}
          </p>

          {/* Le lien EST le bouton (pas de <button> dans un <a>) */}
          <div className="hp-rise hp-d3" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: isMobile ? 30 : "clamp(26px, 4.8vh, 44px)" }}>
            <Link href={ctaHref} prefetch className="hp-cta">
              {isLoggedIn ? text.button : text.login}
              <span className="hp-cta-arrow"><IconArrowRight color="currentColor" /></span>
            </Link>
            {!isLoggedIn && <Link href="/auth/login" className="hp-ghost">{text.signin}</Link>}
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

          <p className="hp-rise hp-d4 hp-extra">{text.extra}</p>
        </div>

        <footer className="hp-footer" style={{ marginTop: isMobile ? 32 : 0, flexDirection: isMobile ? "column-reverse" : "row" }}>
          <p style={{ margin: 0 }} suppressHydrationWarning>© {year} Inovexa. {text.copyright}</p>
          <nav aria-label="Legal" style={{ display: "flex", gap: 16 }}>
            <a href="https://inovexa-erp.com/privacy.html" target="_blank" rel="noopener noreferrer">{text.privacy}</a>
            <a href="https://inovexa-erp.com/terms.html" target="_blank" rel="noopener noreferrer">{text.terms}</a>
          </nav>
        </footer>
      </main>

      {/* ── CÔTÉ DROIT — 2.png en sombre, 1.png en clair ── */}
      {!isMobile && (
        <aside
          style={{
            width: isTablet ? "100%" : "56%",
            height: isTablet ? "auto" : fullH("vh"),
            minHeight: isTablet ? 520 : undefined,
            background: "linear-gradient(0deg, rgba(139, 92, 246, 0.06), rgba(139, 92, 246, 0.06)), var(--hp-right-bg)",
            borderLeft: isTablet ? "none" : "1px solid rgba(139, 92, 246, 0.18)",
            borderTop: isTablet ? "1px solid rgba(139, 92, 246, 0.18)" : "none",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: isTablet ? "32px 24px" : "clamp(24px, 5vh, 56px) clamp(28px, 3.4vw, 56px)",
            boxSizing: "border-box",
          }}
        >
          <img
            key={isLight ? "light" : "dark"}
            src={isLight ? PREVIEW_LIGHT : PREVIEW_DARK}
            alt={text.previewAlt}
            className="hp-preview-img"
            draggable={false}
          />
        </aside>
      )}

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .home-page * { -webkit-tap-highlight-color: transparent; }
  .home-page :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }
  .home-page ul { list-style: none; margin: 0; padding: 0; }

  /* ── Panneau gauche ── */
  .hp-left {
    box-sizing: border-box; display: flex; flex-direction: column; position: relative; z-index: 10;
    background-color: var(--hp-left-base);
    background-image:
      radial-gradient(ellipse 80% 60% at 0% 0%, var(--hp-left-glow-1), transparent 60%),
      radial-gradient(ellipse 70% 50% at 100% 100%, var(--hp-left-glow-2), transparent 60%);
  }

  /* ── Marque ── */
  .hp-brand { display: inline-flex; align-items: center; gap: 14px; text-decoration: none; }
  .hp-logo { width: 64px; height: 64px; flex-shrink: 0; border-radius: 50%; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .hp-logo img { width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(138,43,226,0.6)); }

  /* ── En-tête mobile ── */
  @media (max-width: 767px) { .hp-logo { width: 50px; height: 50px; } }
  .mobile-header { position: fixed; top: 0; left: 0; right: 0; height: 72px; background: var(--hp-header-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--hp-glass-line); display: flex; align-items: center; z-index: 150; padding: 0 16px; padding-top: env(safe-area-inset-top); }

  /* ── Pastille modules ── */
  .hp-modules { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; padding: 7px 14px; border-radius: 999px; background: var(--hp-chip-bg); border: 1px solid var(--hp-chip-border); color: var(--hp-text); font-size: 12px; font-weight: 600; margin-bottom: clamp(18px, 3vh, 26px); }
  .hp-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ADE80; animation: livePing 2.4s ease-out infinite; }
  @keyframes livePing { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,.55); } 80%,100% { box-shadow: 0 0 0 7px rgba(74,222,128,0); } }
  .hp-extra { margin: 22px 0 0; max-width: 500px; padding-left: 14px; border-left: 2px solid var(--hp-icon); color: var(--hp-muted); font-size: 14px; line-height: 1.6; font-style: italic; }
  .hp-subtitle { margin: 0; color: var(--hp-muted); line-height: 1.65; max-width: 460px; }

  /* ── Boutons ── */
  .hp-cta { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 54px; padding: 0 28px; border-radius: 999px; background: var(--hp-cta-bg); color: var(--hp-cta-text) !important; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 40px var(--hp-cta-shadow); transition: transform .2s, box-shadow .2s; }
  .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 48px var(--hp-cta-shadow); }
  .hp-cta:active { transform: translateY(0); }
  .hp-cta-arrow { display: inline-flex; transition: transform .2s; }
  .hp-cta:hover .hp-cta-arrow { transform: translateX(3px); }
  .hp-ghost { display: inline-flex; align-items: center; justify-content: center; height: 54px; padding: 0 24px; border-radius: 999px; border: 1px solid var(--hp-ghost-border); color: var(--hp-text) !important; font-size: 15px; font-weight: 600; text-decoration: none; transition: background .2s; }
  .hp-ghost:hover { background: var(--hp-glass); }

  /* ── Liste en verre ── */
  .hp-glass-list { display: flex; flex-direction: column; border-radius: 18px; background: var(--hp-glass); border: 1px solid var(--hp-glass-border); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); max-width: 520px; }
  .hp-glass-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--hp-glass-line); }
  .hp-glass-row:last-child { border-bottom: none; }
  .hp-glass-title { flex: 1; font-size: 14px; font-weight: 600; color: var(--hp-text); }
  .hp-glass-desc { font-size: 12.5px; color: var(--hp-muted); text-align: right; }
  @media (max-width: 420px) {
    .hp-glass-row { flex-wrap: wrap; row-gap: 2px; }
    .hp-glass-desc { flex-basis: 100%; padding-left: 32px; text-align: left; }
  }

  /* ── Image côté droit ── */
  .hp-preview-img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 16px; animation: hpFade .4s ease both; user-select: none; }
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Pied de page ── */
  .hp-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--hp-faint); }
  .hp-footer a { color: var(--hp-link); font-weight: 600; text-decoration: none; padding: 4px 0; }
  .hp-footer a:hover { text-decoration: underline; text-underline-offset: 3px; }

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
    .hp-rise, .hp-live-dot, .hp-lang-menu, .hp-preview-img { animation: none !important; }
    .hp-cta, .hp-cta-arrow, .hp-ghost { transition: none !important; }
  }
`;