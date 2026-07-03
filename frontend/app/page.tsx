"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";

// ─── Icônes SVG ────────────────────────────────────────────────────────────────

const icon = (path: React.ReactNode, size = 22) => {
  const IconComponent: React.FC = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  );
  IconComponent.displayName = "Icon";
  return IconComponent;
};

const IconTarget = icon(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>);
const IconBarChart = icon(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>);
const IconShield = icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />);
const IconUsers = icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
const IconArrowRight = icon(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>, 17);
const IconSparkles = icon(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.9 2.4L22.3 18.3l-2.4.9L19 21.6l-.9-2.4-2.4-.9 2.4-.9z" /></>, 14);
const IconChevronDown = icon(<polyline points="6 9 12 15 18 9" />, 12);
const IconLock = icon(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, 10);
const IconFileText = icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>, 10);

const featureIcons = [IconTarget, IconBarChart, IconShield, IconUsers];

// ─── Traductions ────────────────────────────────────────────────────────────────

const translations: Record<string, any> = {
  fr: {
    badge: "ERP Cloud · IA intégrée",
    titleBefore: "L'avenir de la ",
    titleGlow: "gestion d'entreprise",
    titleAfter: " commence ici.",
    subtitle:
      "Ventes, stock, clients, factures, RH — pilotez toute votre PME depuis une seule plateforme, avec un assistant IA qui analyse vos données en temps réel.",
    button: "Accéder au Dashboard",
    login: "Commencer maintenant",
    secondary: "Découvrir les modules",
    copyright: "Tous droits réservés",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    previewAlt: "Aperçu du dashboard Inovexa",
    stats: [
      { value: "10+", label: "Modules intégrés" },
      { value: "IA", label: "Assistant intelligent" },
      { value: "3", label: "Langues" },
      { value: "100%", label: "Cloud sécurisé" },
    ],
    features: [
      { title: "SOLUTIONS INTÉGRÉES", desc: "Ventes, achats, stock, factures et RH réunis dans un seul outil." },
      { title: "ANALYSES TEMPS RÉEL", desc: "Tableaux de bord, prévisions et alertes générés par l'IA." },
      { title: "SÉCURISÉ & FIABLE", desc: "Chiffrement, sauvegardes et contrôle d'accès par rôle." },
      { title: "VOTRE ÉQUIPE", desc: "Multi-utilisateurs, rôles dédiés et collaboration fluide." },
    ],
  },
  en: {
    badge: "Cloud ERP · Built-in AI",
    titleBefore: "The future of ",
    titleGlow: "business management",
    titleAfter: " starts here.",
    subtitle:
      "Sales, inventory, clients, invoices, HR — run your entire SME from one platform, with an AI assistant analyzing your data in real time.",
    button: "Go to Dashboard",
    login: "Get Started Now",
    secondary: "Explore the modules",
    copyright: "All rights reserved",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    previewAlt: "Inovexa dashboard preview",
    stats: [
      { value: "10+", label: "Integrated modules" },
      { value: "AI", label: "Smart assistant" },
      { value: "3", label: "Languages" },
      { value: "100%", label: "Secure cloud" },
    ],
    features: [
      { title: "INTEGRATED SOLUTIONS", desc: "Sales, purchasing, stock, invoices and HR in one tool." },
      { title: "REAL-TIME INSIGHTS", desc: "AI-powered dashboards, forecasts and alerts." },
      { title: "SECURE & RELIABLE", desc: "Encryption, backups and role-based access control." },
      { title: "EMPOWER YOUR TEAM", desc: "Multi-user, dedicated roles and smooth collaboration." },
    ],
  },
  es: {
    badge: "ERP en la nube · IA integrada",
    titleBefore: "El futuro de la ",
    titleGlow: "gestión empresarial",
    titleAfter: " comienza aquí.",
    subtitle:
      "Ventas, inventario, clientes, facturas, RRHH — gestione toda su PYME desde una sola plataforma, con un asistente de IA que analiza sus datos en tiempo real.",
    button: "Panel de Control",
    login: "Empezar ahora",
    secondary: "Descubrir los módulos",
    copyright: "Todos los derechos reservados",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    previewAlt: "Vista previa del panel Inovexa",
    stats: [
      { value: "10+", label: "Módulos integrados" },
      { value: "IA", label: "Asistente inteligente" },
      { value: "3", label: "Idiomas" },
      { value: "100%", label: "Nube segura" },
    ],
    features: [
      { title: "SOLUCIONES INTEGRADAS", desc: "Ventas, compras, stock, facturas y RRHH en una sola herramienta." },
      { title: "ANÁLISIS EN TIEMPO REAL", desc: "Paneles, previsiones y alertas generados por IA." },
      { title: "SEGURO & CONFIABLE", desc: "Cifrado, copias de seguridad y control de acceso por rol." },
      { title: "SU EQUIPO", desc: "Multiusuario, roles dedicados y colaboración fluida." },
    ],
  },
};

const flagCodes: Record<string, string> = { fr: "fr", en: "gb", es: "es" };
const langNames: Record<string, string> = { fr: "Français", en: "English", es: "Español" };

interface Particle { id: number; left: string; top: string; duration: string; delay: string; size: string; }

// ─── Composant principal ────────────────────────────────────────────────────────

export default function HomePage(): React.ReactElement {
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isCompact = isMobile || isTablet;
  const t = translations[language] || translations.fr;

  const particles: Particle[] = useMemo(() => {
    const count = isMobile ? 8 : 18;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 15}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 3}px`,
    }));
  }, [isMobile]);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    setIsLoading(false);
    const id = requestAnimationFrame(() => setTimeout(() => setRevealed(true), 60));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!showLanguageMenu) return;
    const handler = () => setShowLanguageMenu(false);
    const id = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("click", handler); };
  }, [showLanguageMenu]);

  if (isLoading) return <div style={{ minHeight: "100dvh", background: "#000" }} />;

  const reveal = (order: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(22px)",
    transition: `opacity .65s cubic-bezier(.22,1,.36,1) ${order * 110}ms, transform .65s cubic-bezier(.22,1,.36,1) ${order * 110}ms`,
  });

  return (
    <div className="home-root" style={{
      minHeight: "100dvh",
      background: "#000",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: isCompact ? "column" : "row",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Particules + halo d'ambiance */}
      {particles.map(p => (
        <div key={p.id} className="particle" aria-hidden="true" style={{
          position: "absolute", left: p.left, top: p.top, width: p.size, height: p.size,
          background: "rgba(168,85,247,.55)", borderRadius: "50%",
          boxShadow: "0 0 8px rgba(168,85,247,.8)",
          animation: `floatParticle ${p.duration} linear infinite`, animationDelay: p.delay, zIndex: 1,
        }} />
      ))}
      <div className="ambient-glow" aria-hidden="true" />

      {/* Sélecteur de langue */}
      <div style={{
        position: "absolute",
        top: "max(env(safe-area-inset-top, 16px), 16px)",
        right: "max(env(safe-area-inset-right, 20px), 20px)",
        zIndex: 50,
      }}>
        <button
          aria-haspopup="listbox"
          aria-expanded={showLanguageMenu}
          aria-label="Change language"
          onClick={(e) => { e.stopPropagation(); setShowLanguageMenu(v => !v); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(168,85,247,.25)",
            borderRadius: 12, padding: "10px 14px", color: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, minHeight: 44, backdropFilter: "blur(10px)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w20/${flagCodes[language] || "fr"}.png`} width={16} height={12} alt="" style={{ borderRadius: 2 }} />
          {(language || "fr").toUpperCase()}
          <IconChevronDown />
        </button>
        {showLanguageMenu && (
          <div role="listbox" style={{
            position: "absolute", right: 0, marginTop: 8, minWidth: 160,
            background: "rgba(12,12,18,.96)", border: "1px solid rgba(168,85,247,.25)",
            borderRadius: 14, padding: 6, backdropFilter: "blur(14px)",
            boxShadow: "0 18px 50px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", gap: 2,
          }}>
            {(["fr", "en", "es"] as const).map(lang => (
              <button
                key={lang}
                role="option"
                aria-selected={language === lang}
                onClick={() => { changeLanguage(lang); setShowLanguageMenu(false); }}
                style={{
                  background: language === lang ? "rgba(168,85,247,.2)" : "transparent",
                  border: "none", color: language === lang ? "#C084FC" : "rgba(255,255,255,.85)",
                  padding: "11px 12px", borderRadius: 9, cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: language === lang ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 10, minHeight: 44,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w20/${flagCodes[lang]}.png`} width={16} height={12} alt="" style={{ borderRadius: 2 }} />
                {langNames[lang]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── COLONNE GAUCHE : contenu ── */}
      <main style={{
        width: isCompact ? "100%" : "48%",
        padding: isMobile
          ? "calc(max(env(safe-area-inset-top, 16px), 16px) + 64px) 24px 40px"
          : isTablet
            ? "calc(max(env(safe-area-inset-top, 16px), 16px) + 72px) 48px 48px"
            : "0 0 0 64px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        zIndex: 10, position: "relative",
        minHeight: isCompact ? "auto" : "100vh",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, ...reveal(0) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Inovexa" style={{ width: isMobile ? 84 : 105, height: "auto", filter: "drop-shadow(0 0 18px rgba(138,43,226,.7))" }} />
          <div>
            <h2 style={{ color: "#fff", fontSize: isMobile ? 22 : 27, fontWeight: 300, margin: 0, letterSpacing: 2, textTransform: "uppercase" }}>
              <span style={{ fontWeight: 800 }}>INOV</span>EXA
            </h2>
            <div className="erp-text-glow" style={{
              background: "linear-gradient(90deg,#A855F7,#6366F1)", WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent", fontSize: 12, fontWeight: 700, letterSpacing: 7,
              marginTop: 2, textTransform: "uppercase",
            }}>ERP</div>
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
          padding: "7px 14px", borderRadius: 999, marginBottom: 20,
          background: "rgba(168,85,247,.1)", border: "1px solid rgba(168,85,247,.3)",
          color: "#C084FC", fontSize: 11, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase",
          ...reveal(1),
        }}>
          <IconSparkles /> {t.badge}
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: "clamp(30px, 5vw, 54px)",
          fontWeight: 900, lineHeight: 1.12, marginBottom: 18, letterSpacing: "-1.2px",
          textShadow: "0 0 30px rgba(168,85,247,.15)", ...reveal(2),
        }}>
          {t.titleBefore}
          <span className="hero-word-glow">{t.titleGlow}</span>
          {t.titleAfter}
        </h1>

        {/* Sous-titre descriptif */}
        <p style={{
          color: "rgba(255,255,255,.62)", fontSize: "clamp(14px, 1.6vw, 17px)",
          lineHeight: 1.65, maxWidth: 520, marginBottom: 30, ...reveal(3),
        }}>
          {t.subtitle}
        </p>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 36, ...reveal(4) }}>
          <Link href={isLoggedIn ? "/dashboard" : "/auth/login"} style={{ textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
            <button className="cta-button-shimmer" style={{
              width: isMobile ? "100%" : "auto",
              padding: isMobile ? "16px 32px" : "17px 44px",
              fontSize: 15, borderRadius: 14, border: "none", cursor: "pointer",
              color: "#fff", fontWeight: 700, position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              letterSpacing: ".3px", minHeight: 52,
            }}>
              <span style={{ position: "relative", zIndex: 2 }}>{isLoggedIn ? t.button : t.login}</span>
              <span style={{ position: "relative", zIndex: 2, display: "flex" }}><IconArrowRight /></span>
              <div className="shimmer-effect" aria-hidden="true" />
            </button>
          </Link>
          <a href="#features" className="cta-secondary" style={{
            padding: isMobile ? "15px 28px" : "16px 32px",
            width: isMobile ? "100%" : "auto", boxSizing: "border-box",
            fontSize: 14, borderRadius: 14, textDecoration: "none",
            color: "rgba(255,255,255,.85)", fontWeight: 600, minHeight: 52,
            border: "1px solid rgba(168,85,247,.35)", background: "rgba(168,85,247,.06)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {t.secondary}
          </a>
        </div>

        {/* Aperçu du dashboard — visible aussi sur MOBILE */}
        {isCompact && (
          <div style={{
            marginBottom: 34, borderRadius: 18, overflow: "hidden",
            border: "1px solid rgba(168,85,247,.25)",
            boxShadow: "0 20px 60px rgba(138,43,226,.25)", ...reveal(5),
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/1.png" alt={t.previewAlt} loading="lazy" style={{ width: "100%", height: "auto", display: "block", filter: "brightness(.92) contrast(1.05)" }} />
          </div>
        )}

        {/* Cartes features avec descriptions */}
        <div id="features" style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: isMobile ? 10 : 12, marginBottom: 32, maxWidth: 520,
        }}>
          {t.features.map((f: { title: string; desc: string }, i: number) => {
            const Ico = featureIcons[i];
            return (
              <div key={i} className="feature-card" style={{
                display: "flex", flexDirection: "column", gap: 8,
                padding: isMobile ? 14 : 16,
                background: "rgba(168,85,247,.06)", border: "1px solid rgba(168,85,247,.18)",
                borderRadius: 14, backdropFilter: "blur(8px)", ...reveal(6 + i),
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(168,85,247,.12)", border: "1px solid rgba(168,85,247,.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#A855F7",
                  }}><Ico /></div>
                  <span style={{ color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 800, letterSpacing: ".6px", lineHeight: 1.3 }}>{f.title}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Bandeau de stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
          maxWidth: 520, marginBottom: 40,
          padding: "16px 8px", borderRadius: 14,
          background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
          ...reveal(10),
        }}>
          {t.stats.map((s: { value: string; label: string }, i: number) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: isMobile ? 17 : 20, fontWeight: 900,
                background: "linear-gradient(135deg,#C084FC,#818CF8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 8.5 : 10, color: "rgba(255,255,255,.45)", fontWeight: 600, letterSpacing: ".4px", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)", ...reveal(11) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a href="https://inovexa-erp.com/privacy.html" target="_blank" rel="noopener noreferrer" className="footer-link">
              <IconLock /> {t.privacy}
            </a>
            <span style={{ color: "rgba(255,255,255,.15)", fontSize: 10 }}>•</span>
            <a href="https://inovexa-erp.com/terms.html" target="_blank" rel="noopener noreferrer" className="footer-link">
              <IconFileText /> {t.terms}
            </a>
          </div>
          <p style={{ color: "rgba(255,255,255,.22)", fontSize: 9, fontWeight: 600, margin: 0, letterSpacing: ".5px" }}>
            © 2026 INOVEXA. {t.copyright.toUpperCase()}
          </p>
        </footer>
      </main>

      {/* ── COLONNE DROITE : visuel (desktop uniquement) ── */}
      {!isCompact && (
        <div aria-hidden="true" style={{ width: "52%", position: "relative", height: "100vh", background: "#000", flexShrink: 0 }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: "80%", height: "80%",
            background: "radial-gradient(circle, rgba(138,43,226,.22) 0%, transparent 70%)",
            filter: "blur(60px)", zIndex: 1, pointerEvents: "none",
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/1.png" alt="" style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(.88) contrast(1.06)",
            maskImage: "linear-gradient(to right, transparent 0%, black 18%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%)",
            zIndex: 2, position: "relative",
          }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: "100%", background: "linear-gradient(90deg,#000 0%,transparent 100%)", zIndex: 3, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 80, background: "linear-gradient(0deg,#000 0%,transparent 100%)", zIndex: 3, pointerEvents: "none" }} />
        </div>
      )}

      {/* Styles globaux */}
      <style dangerouslySetInnerHTML={{ __html: `
        * { -webkit-tap-highlight-color: transparent; }
        html { scroll-behavior: smooth; }
        .erp-text-glow { animation: textPulse 3s ease-in-out infinite; }
        @keyframes textPulse { 0%,100% { opacity:.7; filter:drop-shadow(0 0 2px rgba(168,85,247,.3)); } 50% { opacity:1; filter:drop-shadow(0 0 8px rgba(168,85,247,.7)); } }
        .cta-button-shimmer { background: linear-gradient(135deg,#A855F7 0%,#6366F1 100%); box-shadow: 0 8px 32px rgba(168,85,247,.35); animation: buttonPulse 2.5s infinite; transition: transform .2s, filter .2s; }
        .cta-button-shimmer:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .cta-button-shimmer:active { transform: translateY(0); filter: brightness(.95); }
        @keyframes buttonPulse { 0% { box-shadow: 0 0 0 0 rgba(168,85,247,.5); } 70% { box-shadow: 0 0 0 16px rgba(168,85,247,0); } 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); } }
        .shimmer-effect { position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation:shimmer 2.8s infinite; pointer-events:none; }
        @keyframes shimmer { 0% { left:-100%; } 100% { left:100%; } }
        .ambient-glow { position:absolute; inset:0; background:radial-gradient(circle at 18% 28%, rgba(138,43,226,.09), transparent 42%); z-index:0; pointer-events:none; }
        @keyframes floatParticle { 0% { transform:translateY(0) translateX(0); opacity:0; } 12% { opacity:1; } 100% { transform:translateY(-85vh) translateX(25px); opacity:0; } }
        .hero-word-glow { display:inline-block; background:linear-gradient(135deg,#C084FC 0%,#818CF8 50%,#A855F7 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; background-size:200% 200%; animation:wordGlow 3.5s ease-in-out infinite, gradientShift 4s ease infinite; }
        @keyframes wordGlow { 0%,100% { filter:drop-shadow(0 0 8px rgba(168,85,247,.4)); } 50% { filter:drop-shadow(0 0 22px rgba(168,85,247,.85)) drop-shadow(0 0 40px rgba(99,102,241,.4)); } }
        @keyframes gradientShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        .cta-secondary { transition: background .2s, border-color .2s, transform .2s; }
        .cta-secondary:hover { background: rgba(168,85,247,.14); border-color: rgba(168,85,247,.6); transform: translateY(-1px); }
        .feature-card { transition: border-color .25s, background .25s, transform .25s; }
        .feature-card:hover { border-color: rgba(168,85,247,.45); background: rgba(168,85,247,.1); transform: translateY(-2px); }
        .footer-link { color: rgba(168,85,247,.7); font-size: 10px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; min-height: 32px; }
        .footer-link:hover { color: #C084FC; }
        a:focus-visible, button:focus-visible { outline: 2px solid #A855F7; outline-offset: 3px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
          html { scroll-behavior: auto; }
        }
      ` }} />
    </div>
  );
}
