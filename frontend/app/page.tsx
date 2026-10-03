"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";

// ─── Icônes ────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };
const svgProps = (size: number, color: string, sw = 1.75) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color,
  strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

const IconTarget = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
const IconBarChart = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color)}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
);
const IconShield = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
);
const IconUsers = ({ size = 22, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconArrowRight = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color, 2.5)}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const IconChevronDown = ({ size = 12, color = "currentColor" }: IconProps) => (
  <svg {...svgProps(size, color, 2.5)}><polyline points="6 9 12 15 18 9" /></svg>
);

const LOGO_FONT = "'Orbitron', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";
const FEATURE_ICONS = [IconTarget, IconBarChart, IconShield, IconUsers];
const FLAGS: Record<string, string> = { en: "gb", fr: "fr", es: "es" };
const LANG_LABELS: Record<string, string> = { fr: "Français", en: "English", es: "Español" };

const TEXTS: Record<string, any> = {
  fr: {
    badge: "ERP nouvelle génération",
    before: "L'avenir de la ", glow: "gestion d'entreprise", after: " commence ici.",
    desc: "Ventes, stock, achats, finance et RH réunis dans une seule plateforme simple et sécurisée.",
    button: "Accéder au Dashboard", login: "Commencer maintenant",
    copyright: "Tous droits réservés", privacy: "Politique de confidentialité", terms: "Conditions d'utilisation",
    features: ["Solutions intégrées", "Analyses temps réel", "Sécurisé & fiable", "Votre équipe"],
  },
  es: {
    badge: "ERP de nueva generación",
    before: "El futuro de la ", glow: "gestión empresarial", after: " comienza aquí.",
    desc: "Ventas, inventario, compras, finanzas y RR. HH. en una sola plataforma simple y segura.",
    button: "Panel de Control", login: "Empezar ahora",
    copyright: "Todos los derechos reservados", privacy: "Política de privacidad", terms: "Términos de uso",
    features: ["Soluciones integradas", "Análisis en tiempo real", "Seguro y confiable", "Su equipo"],
  },
  en: {
    badge: "Next-generation ERP",
    before: "The future of ", glow: "business management", after: " starts here.",
    desc: "Sales, inventory, purchasing, finance and HR together in one simple, secure platform.",
    button: "Go to Dashboard", login: "Get Started Now",
    copyright: "All rights reserved", privacy: "Privacy Policy", terms: "Terms of Use",
    features: ["Integrated solutions", "Real-time insights", "Secure & reliable", "Empower your team"],
  },
};

export default function HomePage(): React.ReactElement {
  const pathname = usePathname();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsExiting(false);
    setIsLoggedIn(!!localStorage.getItem("token"));
    const t1 = setTimeout(() => setIsExiting(true), 1200);
    const t2 = setTimeout(() => setIsLoading(false), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  useEffect(() => {
    if (!showLanguageMenu) return;
    const handler = () => setShowLanguageMenu(false);
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", handler); };
  }, [showLanguageMenu]);

  const text = TEXTS[language] || TEXTS.en;
  const ctaHref = isLoggedIn ? "/dashboard" : "/auth/login";

  // ─── Écran de chargement ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={"hp-loader" + (isExiting ? " hp-loader-exit" : "")}>
        <div className="hp-loader-tile">
          <img src="/images/logo.png" alt="Inovexa" />
        </div>
        <div className="hp-loader-brand" style={{ fontFamily: LOGO_FONT }}>
          <b>INOV</b>EXA <span>ERP</span>
        </div>
        <div className="hp-loader-bar"><div /></div>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      </div>
    );
  }

  // ─── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="hp-root">
      <div className="hp-blob hp-blob-1" />
      <div className="hp-blob hp-blob-2" />

      {/* En-tête */}
      <header className="hp-header">
        <div className="hp-brand">
          <div className="hp-logo-tile"><img src="/images/logo.png" alt="Inovexa" /></div>
          <div className="hp-brand-text" style={{ fontFamily: LOGO_FONT }}>
            <span className="hp-brand-name"><b>INOV</b>EXA</span>
            <span className="hp-brand-erp">ERP</span>
          </div>
        </div>

        <div className="hp-lang">
          <button
            className="hp-lang-btn"
            onClick={(e) => { e.stopPropagation(); setShowLanguageMenu(!showLanguageMenu); }}
            aria-haspopup="listbox"
            aria-expanded={showLanguageMenu}
          >
            <img src={`https://flagcdn.com/w20/${FLAGS[language] || "gb"}.png`} width={18} height={13} alt="" />
            <span>{(language || "en").toUpperCase()}</span>
            <IconChevronDown />
          </button>
          {showLanguageMenu && (
            <div className="hp-lang-menu" onClick={(e) => e.stopPropagation()}>
              {Object.keys(FLAGS).map((lang) => (
                <button
                  key={lang}
                  className={"hp-lang-item" + (lang === language ? " active" : "")}
                  onClick={() => { changeLanguage(lang); setShowLanguageMenu(false); }}
                >
                  <img src={`https://flagcdn.com/w20/${FLAGS[lang]}.png`} width={18} height={13} alt="" />
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Contenu */}
      <main className={"hp-main" + (isCompact ? " compact" : "")}>
        <section className="hp-hero">
          <span className="hp-badge"><i /> {text.badge}</span>
          <h1 className="hp-title">
            {text.before}<span className="hp-title-grad">{text.glow}</span>{text.after}
          </h1>
          <p className="hp-desc">{text.desc}</p>

          <div className="hp-features">
            {text.features.map((title: string, i: number) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div className="hp-feature" key={i}>
                  <span className="hp-feature-icon"><Icon size={20} color="#4f46e5" /></span>
                  <span className="hp-feature-title">{title}</span>
                </div>
              );
            })}
          </div>

          <Link href={ctaHref} className="hp-cta">
            {isLoggedIn ? text.button : text.login}
            <IconArrowRight />
          </Link>
        </section>

        <section className="hp-visual">
          <div className="hp-visual-frame">
            <img src="/images/1.png" alt="Inovexa Dashboard" />
          </div>
        </section>
      </main>

      <footer className="hp-footer">
        <div className="hp-footer-links">
          <a href="https://inovexa-erp.com/privacy.html" target="_blank" rel="noopener noreferrer">{text.privacy}</a>
          <span>·</span>
          <a href="https://inovexa-erp.com/terms.html" target="_blank" rel="noopener noreferrer">{text.terms}</a>
        </div>
        <div className="hp-copy">© {new Date().getFullYear()} INOVEXA. {text.copyright}</div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

const STYLES = `
  .hp-root, .hp-loader {
    --hp-primary: #4f46e5; --hp-secondary: #7c3aed;
    --hp-bg: var(--theme-background, #f3f4f6); --hp-surface: var(--theme-surface, #ffffff);
    --hp-text: var(--theme-text, #111827); --hp-muted: var(--theme-text-secondary, #6b7280);
    --hp-border: var(--theme-border, #e5e7eb);
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .hp-root {
    position: relative; min-height: 100vh; overflow-x: hidden;
    background: linear-gradient(180deg, var(--hp-surface) 0%, var(--hp-bg) 100%);
    color: var(--hp-text); display: flex; flex-direction: column;
    animation: hpIn .7s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes hpIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .hp-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
  .hp-blob-1 { width: 520px; height: 520px; top: -160px; left: -140px; background: rgba(99,102,241,.18); }
  .hp-blob-2 { width: 460px; height: 460px; bottom: -120px; right: -100px; background: rgba(168,85,247,.16); }

  /* Header */
  .hp-header { position: relative; z-index: 5; display: flex; align-items: center; justify-content: space-between; padding: 22px clamp(20px, 5vw, 64px); }
  .hp-brand { display: flex; align-items: center; gap: 14px; }
  .hp-logo-tile { width: 56px; height: 56px; border-radius: 16px; padding: 4px; background: linear-gradient(135deg, #1e1b4b, #4338ca); box-shadow: 0 8px 22px rgba(67,56,202,.28); flex-shrink: 0; }
  .hp-logo-tile img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .hp-brand-text { display: flex; flex-direction: column; line-height: 1.1; }
  .hp-brand-name { font-size: 22px; letter-spacing: 3px; font-weight: 300; color: var(--hp-text); }
  .hp-brand-name b { font-weight: 800; }
  .hp-brand-erp { font-size: 11px; letter-spacing: 7px; font-weight: 700; margin-top: 4px; background: linear-gradient(90deg, var(--hp-secondary), var(--hp-primary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

  /* Langue */
  .hp-lang { position: relative; }
  .hp-lang-btn { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px; cursor: pointer; font: 600 13px 'Poppins', sans-serif; color: var(--hp-text); background: var(--hp-surface); border: 1px solid var(--hp-border); box-shadow: 0 1px 3px rgba(17,24,39,.06); transition: border-color .2s, box-shadow .2s; }
  .hp-lang-btn:hover { border-color: #c7d2fe; box-shadow: 0 4px 14px rgba(79,70,229,.12); }
  .hp-lang-btn img, .hp-lang-item img { border-radius: 2px; object-fit: cover; }
  .hp-lang-menu { position: absolute; right: 0; top: calc(100% + 8px); min-width: 160px; padding: 6px; background: var(--hp-surface); border: 1px solid var(--hp-border); border-radius: 14px; box-shadow: 0 16px 40px rgba(17,24,39,.14); z-index: 20; }
  .hp-lang-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; border-radius: 10px; background: transparent; cursor: pointer; font: 500 13px 'Poppins', sans-serif; color: var(--hp-text); text-align: left; }
  .hp-lang-item:hover { background: #eef2ff; }
  .hp-lang-item.active { background: #eef2ff; color: var(--hp-primary); font-weight: 600; }

  /* Main */
  .hp-main { position: relative; z-index: 2; flex: 1; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); align-items: center; gap: clamp(24px, 4vw, 64px); padding: 12px clamp(20px, 5vw, 64px) 24px; max-width: 1400px; width: 100%; margin: 0 auto; }
  .hp-main.compact { grid-template-columns: 1fr; padding-top: 0; }

  .hp-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--hp-primary); background: #eef2ff; border: 1px solid #e0e7ff; }
  .hp-badge i { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.2); }

  .hp-title { margin: 18px 0 14px; font-size: clamp(32px, 4.4vw, 56px); line-height: 1.12; font-weight: 800; letter-spacing: -1px; color: var(--hp-text); }
  .hp-title-grad { background: linear-gradient(135deg, var(--hp-primary) 0%, var(--hp-secondary) 55%, #c026d3 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .hp-desc { margin: 0 0 28px; max-width: 520px; font-size: 16px; line-height: 1.65; color: var(--hp-muted); }

  .hp-features { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; max-width: 520px; margin-bottom: 32px; }
  .hp-feature { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--hp-surface); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: 0 1px 3px rgba(17,24,39,.04); transition: transform .2s, box-shadow .2s, border-color .2s; }
  .hp-feature:hover { transform: translateY(-2px); border-color: #c7d2fe; box-shadow: 0 10px 24px rgba(79,70,229,.12); }
  .hp-feature-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; background: #eef2ff; flex-shrink: 0; }
  .hp-feature-title { font-size: 13px; font-weight: 600; color: var(--hp-text); line-height: 1.3; }

  .hp-cta { display: inline-flex; align-items: center; gap: 10px; padding: 16px 34px; border-radius: 14px; font-size: 15px; font-weight: 600; text-decoration: none; color: #fff; background: linear-gradient(135deg, var(--hp-primary), var(--hp-secondary)); box-shadow: 0 10px 28px rgba(79,70,229,.32); transition: transform .2s, box-shadow .2s, filter .2s; }
  .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(79,70,229,.42); filter: brightness(1.05); }
  .hp-cta:active { transform: translateY(0); }
  .hp-cta svg { transition: transform .2s; }
  .hp-cta:hover svg { transform: translateX(4px); }

  /* Visuel */
  .hp-visual { display: flex; justify-content: center; }
  .hp-visual-frame { position: relative; width: 100%; max-width: 620px; aspect-ratio: 1044 / 935; border-radius: 28px; overflow: hidden; padding: 10px; background: linear-gradient(135deg, #c7d2fe, #e9d5ff); box-shadow: 0 30px 70px rgba(79,70,229,.25), 0 6px 18px rgba(17,24,39,.08); }
  .hp-visual-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; display: block; }

  /* Footer */
  .hp-footer { position: relative; z-index: 2; padding: 20px clamp(20px, 5vw, 64px) 26px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--hp-border); background: rgba(255,255,255,.5); backdrop-filter: blur(6px); }
  .hp-footer-links { display: flex; gap: 10px; align-items: center; font-size: 12px; color: var(--hp-muted); }
  .hp-footer-links a { color: var(--hp-primary); text-decoration: none; font-weight: 500; }
  .hp-footer-links a:hover { text-decoration: underline; }
  .hp-copy { font-size: 12px; color: var(--hp-muted); }

  /* Loader */
  .hp-loader { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 40%, #ffffff 0%, #eef2ff 100%); transition: opacity .5s ease, transform .5s ease; }
  .hp-loader-exit { opacity: 0; transform: scale(1.03); }
  .hp-loader-tile { width: 120px; height: 120px; padding: 8px; border-radius: 30px; background: linear-gradient(135deg, #1e1b4b, #4338ca); box-shadow: 0 18px 50px rgba(67,56,202,.35); animation: hpFloat 2.4s ease-in-out infinite; }
  .hp-loader-tile img { width: 100%; height: 100%; object-fit: contain; }
  @keyframes hpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .hp-loader-brand { margin-top: 26px; font-size: 24px; letter-spacing: 3px; font-weight: 300; color: #111827; }
  .hp-loader-brand b { font-weight: 800; }
  .hp-loader-brand span { font-size: 12px; letter-spacing: 7px; font-weight: 700; margin-left: 8px; color: #4f46e5; }
  .hp-loader-bar { margin-top: 30px; width: 200px; height: 4px; border-radius: 999px; background: #e0e7ff; overflow: hidden; }
  .hp-loader-bar div { height: 100%; width: 40%; border-radius: 999px; background: linear-gradient(90deg, #4f46e5, #7c3aed); animation: hpBar 1.2s ease-in-out infinite; }
  @keyframes hpBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }

  @media (max-width: 640px) {
    .hp-logo-tile { width: 46px; height: 46px; border-radius: 13px; }
    .hp-brand-name { font-size: 18px; }
    .hp-features { grid-template-columns: 1fr; }
    .hp-cta { width: 100%; justify-content: center; }
    .hp-visual-frame { border-radius: 22px; padding: 8px; }
    .hp-footer { flex-direction: column; align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hp-root, .hp-loader-tile, .hp-loader-bar div { animation: none !important; }
  }
`;
