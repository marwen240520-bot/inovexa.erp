"use client";
import React from 'react';
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";

// ─── Pro SVG Icons ─────────────────────────────────────────────────────────────

const IconTarget = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconBarChart = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconShield = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconUsers = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconArrowRight = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);


const IconChevronDown = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconLock = ({ size = 11, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconFileText = ({ size = 11, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ─── Interface pour les particules ─────────────────────────────────────────────
interface Particle {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
  size: string;
}

// ─── Feature icons list ─────────────────────────────────────────────────────────

const featureIcons: React.ReactElement[] = [
  React.createElement(IconTarget, { size: 22, color: "#A855F7", key: "icon-target" }),
  React.createElement(IconBarChart, { size: 22, color: "#A855F7", key: "icon-barchart" }),
  React.createElement(IconShield, { size: 22, color: "#A855F7", key: "icon-shield" }),
  React.createElement(IconUsers, { size: 22, color: "#A855F7", key: "icon-users" })
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLanguageMenu, setShowLanguageMenu] = useState<boolean>(false);
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false, false]);
  const [heroVisible, setHeroVisible] = useState<boolean>(false);
  const [subtitleVisible, setSubtitleVisible] = useState<boolean>(false);
  const [badgeVisible, setBadgeVisible] = useState<boolean>(false);

  const isCompact: boolean = isMobile || isTablet;

  const particles: Particle[] = useMemo((): Particle[] => {
    const count: number = isMobile ? 10 : 20;
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
        duration: 8 + Math.random() * 15 + "s",
        delay: Math.random() * 5 + "s",
        size: 1 + Math.random() * 3 + "px"
      });
    }
    return result;
  }, [isMobile]);

  useEffect((): void => {
    const token: string | null = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  useEffect((): (() => void) | undefined => {
    if (!showLanguageMenu) return;
    const handler = (): void => { setShowLanguageMenu(false); };
    setTimeout((): void => { document.addEventListener("click", handler); }, 0);
    return (): void => { document.removeEventListener("click", handler); };
  }, [showLanguageMenu]);

  // ─── Text animation triggers ────────────────────────────────────────────────
  useEffect((): (() => void) | undefined => {
    if (isLoading) return;
    const t1 = setTimeout(() => setBadgeVisible(true), 100);
    const t2 = setTimeout(() => setHeroVisible(true), 300);
    const t3 = setTimeout(() => setSubtitleVisible(true), 600);
    const cardTimers = [0, 1, 2, 3].map((i) =>
      setTimeout(() => setVisibleCards((prev) => { const next = [...prev]; next[i] = true; return next; }), 800 + i * 120)
    );
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); cardTimers.forEach(clearTimeout); };
  }, [isLoading]);

  const handleLanguageChange = (lang: string): void => {
    changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  const getTranslations = (): any => {
    const translations: any = {
      fr: {
        title: React.createElement(React.Fragment, null, "L'avenir de la ", React.createElement("span", { className: "hero-word-glow" }, "gestion d'entreprise"), " commence ici."),
        subtitle: "INOVEXA",
        button: "Accéder au Dashboard",
        login: "Commencer maintenant",
        copyright: "Tous droits réservés",
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
        features: [
          { title: "SOLUTIONS INTÉGRÉES" },
          { title: "ANALYSES TEMPS RÉEL" },
          { title: "SÉCURISÉ & FIABLE" },
          { title: "VOTRE ÉQUIPE" }
        ]
      },
      es: {
        title: React.createElement(React.Fragment, null, "El futuro de la ", React.createElement("span", { className: "hero-word-glow" }, "gestión empresarial"), " comienza aquí."),
        subtitle: "INOVEXA",
        button: "Panel de Control",
        login: "Empezar ahora",
        copyright: "Todos los derechos reservados",
        privacy: "Política de privacidad",
        terms: "Términos de uso",
        features: [
          { title: "SOLUCIONES INTEGRADAS" },
          { title: "ANÁLISIS EN TIEMPO REAL" },
          { title: "SEGURO & CONFIABLE" },
          { title: "SU EQUIPO" }
        ]
      },
      en: {
        title: React.createElement(React.Fragment, null, "The future of ", React.createElement("span", { className: "hero-word-glow" }, "business management"), " starts here."),
        subtitle: "INOVEXA",
        button: "Go to Dashboard",
        login: "Get Started Now",
        copyright: "All rights reserved",
        privacy: "Privacy Policy",
        terms: "Terms of Use",
        features: [
          { title: "INTEGRATED SOLUTIONS" },
          { title: "REAL-TIME INSIGHTS" },
          { title: "SECURE & RELIABLE" },
          { title: "EMPOWER YOUR TEAM" }
        ]
      }
    };
    return translations[language] || translations.en;
  };

  const text: any = getTranslations();
  const flagCodes: Record<string, string> = { en: "gb", fr: "fr", es: "es" };

  if (isLoading) {
    return React.createElement("div", { style: { background: "#000000", minHeight: "100vh" } });
  }

  return React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#000000",
      display: "flex",
      flexDirection: isCompact ? "column" : "row",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative"
    }
  },
    // Particles
    particles.map((p: Particle) => {
      return React.createElement("div", {
        key: p.id,
        style: {
          position: "absolute", left: p.left, top: p.top,
          width: p.size, height: p.size,
          background: "rgba(168, 85, 247, 0.6)",
          borderRadius: "50%",
          boxShadow: "0 0 8px rgba(168, 85, 247, 0.8)",
          animation: "floatParticle " + p.duration + " linear infinite",
          animationDelay: p.delay,
          zIndex: 1, pointerEvents: "none"
        }
      });
    }),
    React.createElement("div", { className: "ambient-glow" }),
    
    // Language Selector
    React.createElement("div", { style: { position: "fixed", top: "16px", right: "16px", zIndex: 200 } },
      React.createElement("button", {
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowLanguageMenu(!showLanguageMenu); },
        style: {
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          borderRadius: "36px",
          color: "white",
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: "11px",
          display: "flex", alignItems: "center", gap: "8px"
        }
      },
        
        React.createElement("img", { src: "https://flagcdn.com/w20/" + flagCodes[language] + ".png", width: "15", alt: language, style: { borderRadius: "2px" } }),
        React.createElement("span", { style: { fontWeight: "700", letterSpacing: "0.5px" } }, language.toUpperCase()),
        React.createElement(IconChevronDown, { size: 11, color: "rgba(255,255,255,0.5)" })
      ),
      showLanguageMenu && React.createElement("div", {
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); },
        style: {
          position: "absolute", top: "46px", right: "0",
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          borderRadius: "14px", padding: "6px",
          display: "flex", flexDirection: "column",
          minWidth: "120px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(168,85,247,0.1)",
          zIndex: 201
        }
      },
        ["fr", "en", "es"].map((lang: string) => {
          return React.createElement("button", {
            key: lang,
            onClick: () => handleLanguageChange(lang),
            style: {
              background: language === lang ? "rgba(168, 85, 247, 0.2)" : "transparent",
              border: "none",
              color: language === lang ? "#A855F7" : "rgba(255,255,255,0.8)",
              padding: "10px 12px",
              borderRadius: "9px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              fontWeight: language === lang ? "700" : "400",
              display: "flex", alignItems: "center", gap: "10px"
            }
          },
            React.createElement("img", { src: "https://flagcdn.com/w20/" + flagCodes[lang] + ".png", width: "15", alt: lang, style: { borderRadius: "2px" } }),
            lang === "fr" ? "Français" : lang === "en" ? "English" : "Español"
          );
        })
      )
    ),
    
    // LEFT SIDE
    React.createElement("div", {
      style: {
        width: isCompact ? "100%" : "48%",
        padding: isMobile ? "72px 24px 40px" : isTablet ? "80px 48px 48px" : "0 0 0 64px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        zIndex: 10, position: "relative",
        minHeight: isMobile ? "100vh" : "auto"
      }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", opacity: badgeVisible ? 1 : 0, transform: badgeVisible ? "translateY(0)" : "translateY(-18px)", transition: "opacity 0.6s ease, transform 0.6s ease" } },
        React.createElement("div", { className: "logo3d-scene", style: { width: isMobile ? "90px" : "105px", height: isMobile ? "90px" : "105px", position: "relative", flexShrink: 0 } },
          React.createElement("div", { className: "logo3d", style: { width: "100%", height: "100%", position: "relative" } },
            React.createElement("div", { className: "logo3d-halo" }),
            React.createElement("div", { className: "logo3d-ring logo3d-ring-1" }),
            React.createElement("div", { className: "logo3d-ring logo3d-ring-2" }),
            React.createElement("img", {
              src: "/images/logo.png",
              alt: "Inovexa Logo",
              style: { width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 2, filter: "drop-shadow(0 0 18px rgba(138,43,226,0.7))", transform: "translateZ(26px)" }
            })
          )
        ),
        React.createElement("div", null,
          React.createElement("h2", { style: { color: "white", fontSize: isMobile ? "24px" : "27px", fontWeight: "300", margin: 0, letterSpacing: "2px", textTransform: "uppercase" } },
            React.createElement("span", { style: { fontWeight: "800" } }, "INOV"), "EXA"
          ),
          React.createElement("div", { className: "erp-text-glow", style: { background: "linear-gradient(90deg, #A855F7, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "12px", fontWeight: "700", letterSpacing: "7px", marginTop: "2px", textTransform: "uppercase" } }, "ERP")
        )
      ),
      React.createElement("h1", { style: { fontSize: isMobile ? "32px" : isTablet ? "44px" : "52px", color: "white", fontWeight: "900", lineHeight: "1.1", marginBottom: "28px", letterSpacing: "-1.5px", textShadow: "0 0 30px rgba(168, 85, 247, 0.15)", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)" } }, text.title),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: isMobile ? "10px" : "12px", marginBottom: "36px", maxWidth: "460px" } },
        text.features.map((f: { title: string }, i: number) => {
          return React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: "8px", padding: isMobile ? "14px" : "16px", background: "rgba(168, 85, 247, 0.06)", border: "1px solid rgba(168, 85, 247, 0.18)", borderRadius: "14px", backdropFilter: "blur(8px)", opacity: visibleCards[i] ? 1 : 0, transform: visibleCards[i] ? "translateY(0) scale(1)" : "translateY(22px) scale(0.97)", transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)" } },
            React.createElement("div", { style: { width: "36px", height: "36px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.12)", border: "1px solid rgba(168, 85, 247, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" } }, featureIcons[i]),
            React.createElement("span", { style: { color: "rgba(255,255,255,0.85)", fontSize: isMobile ? "9px" : "10px", fontWeight: "800", letterSpacing: "0.6px", lineHeight: "1.3" } }, f.title)
          );
        })
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", opacity: subtitleVisible ? 1 : 0, transform: subtitleVisible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.65s ease, transform 0.65s ease" } },
        React.createElement(Link, { href: isLoggedIn ? "/dashboard" : "/auth/login", style: { textDecoration: "none" } },
          React.createElement("button", { className: "cta-button-shimmer", style: { padding: isMobile ? "16px 36px" : "17px 44px", fontSize: isMobile ? "14px" : "15px", borderRadius: "14px", border: "none", cursor: "pointer", color: "white", fontWeight: "700", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: "10px", letterSpacing: "0.3px" } },
            React.createElement("span", { style: { position: "relative", zIndex: 2 } }, isLoggedIn ? text.button : text.login),
            React.createElement("span", { style: { position: "relative", zIndex: 2 } }, React.createElement(IconArrowRight, { size: 17, color: "white" })),
            React.createElement("div", { className: "shimmer-effect" })
          )
        )
      ),
      React.createElement("div", { style: { marginTop: isMobile ? "44px" : "52px", display: "flex", flexDirection: "column", gap: "10px" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" } },
          React.createElement("a", { href: "https://inovexa-erp.com/privacy.html", target: "_blank", rel: "noopener noreferrer", style: { color: "rgba(168, 85, 247, 0.7)", fontSize: "10px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" } },
            React.createElement(IconLock, { size: 10, color: "currentColor" }), text.privacy
          ),
          React.createElement("span", { style: { color: "rgba(255,255,255,0.15)", fontSize: "10px" } }, "•"),
          React.createElement("a", { href: "https://inovexa-erp.com/terms.html", target: "_blank", rel: "noopener noreferrer", style: { color: "rgba(168, 85, 247, 0.7)", fontSize: "10px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" } },
            React.createElement(IconFileText, { size: 10, color: "currentColor" }), text.terms
          )
        ),
        React.createElement("p", { style: { color: "rgba(255,255,255,0.2)", fontSize: "9px", fontWeight: "600", margin: 0, letterSpacing: "0.5px" } }, "\u00A9 2026 INOVEXA. " + text.copyright.toUpperCase())
      )
    ),
    
    // RIGHT SIDE
    !isMobile && React.createElement("div", {
      style: {
        width: isTablet ? "100%" : "52%",
        position: "relative",
        height: isTablet ? "420px" : "100vh",
        background: "#000000",
        flexShrink: 0
      }
    },
      React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80%", height: "80%", background: "radial-gradient(circle, rgba(138, 43, 226, 0.22) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 1, pointerEvents: "none" } }),
      React.createElement("img", {
        src: "/images/1.png",
        alt: "Inovexa Dashboard",
        style: {
          width: "100%", height: "100%", objectFit: "cover",
          filter: "brightness(0.88) contrast(1.06)",
          maskImage: "linear-gradient(to right, transparent 0%, black 18%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%)",
          zIndex: 2, position: "relative"
        }
      }),
      React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: "120px", height: "100%", background: "linear-gradient(90deg, #000000 0%, transparent 100%)", zIndex: 3, pointerEvents: "none" } }),
      React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, width: "100%", height: "80px", background: "linear-gradient(0deg, #000000 0%, transparent 100%)", zIndex: 3, pointerEvents: "none" } })
    ),
    
    // Global Styles
    React.createElement("style", { dangerouslySetInnerHTML: { __html: `
      * { -webkit-tap-highlight-color: transparent; }
      .erp-text-glow { animation: textPulse 3s ease-in-out infinite; }
      @keyframes textPulse { 0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 2px rgba(168,85,247,0.3)); } 50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(168,85,247,0.7)); } }
      .cta-button-shimmer { background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%); box-shadow: 0 8px 32px rgba(168, 85, 247, 0.35); animation: buttonPulse 2.5s infinite; transition: transform 0.2s, filter 0.2s; }
      .cta-button-shimmer:hover { transform: translateY(-2px); filter: brightness(1.1); }
      .cta-button-shimmer:active { transform: translateY(0px); filter: brightness(0.95); }
      @keyframes buttonPulse { 0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.5); } 70% { box-shadow: 0 0 0 16px rgba(168, 85, 247, 0); } 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); } }
      .shimmer-effect { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); animation: shimmer 2.8s infinite; pointer-events: none; }
      @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      .ambient-glow { position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: radial-gradient(circle at 18% 28%, rgba(138,43,226,0.09), transparent 42%); z-index: 0; pointer-events: none; }
      @keyframes floatParticle { 0% { transform: translateY(0) translateX(0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(-85vh) translateX(25px); opacity: 0; } }
      .hero-word-glow { display: inline-block; animation: wordGlow 3.5s ease-in-out infinite; background: linear-gradient(135deg, #C084FC 0%, #818CF8 50%, #A855F7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; background-size: 200% 200%; animation: wordGlow 3.5s ease-in-out infinite, gradientShift 4s ease infinite; }
      @keyframes wordGlow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(168,85,247,0.4)); } 50% { filter: drop-shadow(0 0 22px rgba(168,85,247,0.85)) drop-shadow(0 0 40px rgba(99,102,241,0.4)); } }
      @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @media (max-width: 640px) { .cta-button-shimmer { width: 100%; justify-content: center; } }

      /* ── Animation 3D du logo ─────────────────────────────────────── */
      .logo3d-scene { perspective: 700px; cursor: pointer; }
      .logo3d { transform-style: preserve-3d; animation: logoFloat3D 7s ease-in-out infinite; will-change: transform; }
      .logo3d-scene:hover .logo3d { animation: logoSpin3D 1.6s cubic-bezier(0.45, 0, 0.25, 1) infinite; }
      @keyframes logoFloat3D {
        0%, 100% { transform: rotateY(-16deg) rotateX(8deg) translateY(0px); }
        25%      { transform: rotateY(0deg)   rotateX(-5deg) translateY(-5px); }
        50%      { transform: rotateY(16deg)  rotateX(8deg) translateY(0px); }
        75%      { transform: rotateY(0deg)   rotateX(-5deg) translateY(-5px); }
      }
      @keyframes logoSpin3D {
        0%   { transform: rotateY(0deg)   rotateX(6deg); }
        100% { transform: rotateY(360deg) rotateX(6deg); }
      }
      .logo3d-halo { position: absolute; inset: -14%; border-radius: 50%; background: radial-gradient(circle, rgba(168,85,247,0.38) 0%, transparent 65%); transform: translateZ(-32px); animation: logoHaloPulse 3.2s ease-in-out infinite; pointer-events: none; }
      @keyframes logoHaloPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
      .logo3d-ring { position: absolute; border-radius: 50%; pointer-events: none; }
      .logo3d-ring-1 { inset: -13%; border: 1px solid rgba(168,85,247,0.5); box-shadow: 0 0 14px rgba(168,85,247,0.25) inset; animation: logoRingSpin1 9s linear infinite; }
      .logo3d-ring-2 { inset: -24%; border: 1px solid rgba(99,102,241,0.35); animation: logoRingSpin2 14s linear infinite; }
      .logo3d-ring-1::before { content: ""; position: absolute; top: -3px; left: 50%; width: 6px; height: 6px; border-radius: 50%; background: #C084FC; box-shadow: 0 0 10px #A855F7, 0 0 22px rgba(168,85,247,0.6); }
      .logo3d-ring-2::before { content: ""; position: absolute; bottom: -2px; left: 30%; width: 5px; height: 5px; border-radius: 50%; background: #818CF8; box-shadow: 0 0 10px #6366F1; }
      @keyframes logoRingSpin1 { from { transform: rotateX(72deg) rotateZ(0deg); } to { transform: rotateX(72deg) rotateZ(360deg); } }
      @keyframes logoRingSpin2 { from { transform: rotateX(64deg) rotateY(14deg) rotateZ(360deg); } to { transform: rotateX(64deg) rotateY(14deg) rotateZ(0deg); } }
      @media (prefers-reduced-motion: reduce) {
        .logo3d, .logo3d-ring-1, .logo3d-ring-2, .logo3d-halo { animation: none !important; }
      }
    ` } })
  );
}