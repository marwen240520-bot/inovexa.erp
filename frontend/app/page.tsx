
"use client";
import React from 'react';
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import HeroPreview from "@/components/ui/HeroPreview";
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

const HP_DARK: Record<string, string> = {
  "--hp-bg": "#000000",
  "--hp-text": "white",
  "--hp-muted": "rgba(255,255,255,0.5)",
  "--hp-header-bg": "rgba(0, 0, 0, 0.85)",
  "--hp-chip-bg": "rgba(255,255,255,0.06)",
  "--hp-menu-bg": "rgba(10,10,10,0.95)",
  "--hp-shadow": "rgba(0,0,0,0.9)",
  "--hp-menu-text": "rgba(255,255,255,0.8)",
  "--hp-feature-text": "rgba(255,255,255,0.85)",
  "--hp-dot": "rgba(255,255,255,0.15)",
  "--hp-faint": "rgba(255,255,255,0.2)",
  "--hp-card-bg": "rgba(168, 85, 247, 0.06)",
  "--hp-img-filter": "brightness(0.88) contrast(1.06)",
};
const HP_LIGHT: Record<string, string> = {
  "--hp-bg": "#f8f7ff",
  "--hp-text": "#111827",
  "--hp-muted": "#6b7280",
  "--hp-header-bg": "rgba(255, 255, 255, 0.88)",
  "--hp-chip-bg": "#ffffff",
  "--hp-menu-bg": "rgba(255,255,255,0.98)",
  "--hp-shadow": "rgba(17,24,39,0.18)",
  "--hp-menu-text": "#374151",
  "--hp-feature-text": "#1f2937",
  "--hp-dot": "#d1d5db",
  "--hp-faint": "#9ca3af",
  "--hp-card-bg": "#ffffff",
  "--hp-img-filter": "brightness(1) contrast(1.03) saturate(1.05)",
};

function buildHpVars(themeId: string, theme: any): Record<string, string> {
  if (themeId === "dark") return HP_DARK;
  if (themeId === "light") return HP_LIGHT;
  const light = isLightTheme(theme);
  return {
    "--hp-bg": theme.background,
    "--hp-text": theme.text,
    "--hp-muted": theme.textSecondary,
    "--hp-header-bg": `${theme.surface}e6`,
    "--hp-chip-bg": theme.surface,
    "--hp-menu-bg": theme.surface,
    "--hp-shadow": light ? "rgba(17,24,39,0.18)" : "rgba(0,0,0,0.6)",
    "--hp-menu-text": theme.text,
    "--hp-feature-text": theme.text,
    "--hp-dot": theme.border,
    "--hp-faint": theme.textSecondary,
    "--hp-card-bg": theme.surface,
  };
}

const LOGO_FONT = "'Orbitron', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";

export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const { theme, themeId } = useTheme();
  const isLight = isLightTheme(theme);
  const themeVars = buildHpVars(themeId, theme) as React.CSSProperties;
  const themeClass = isLight ? "hp-light" : "hp-dark";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState<boolean>(false);

  const isCompact: boolean = isMobile || isTablet;

  const particles: Particle[] = useMemo((): Particle[] => {
    const count: number = isMobile ? 10 : 20;
    const rand = (n: number): number => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        left: (rand(i * 5 + 1) * 100).toFixed(2) + "%",
        top: (rand(i * 5 + 2) * 100).toFixed(2) + "%",
        duration: (8 + rand(i * 5 + 3) * 15).toFixed(2) + "s",
        delay: (rand(i * 5 + 4) * 5).toFixed(2) + "s",
        size: (1 + rand(i * 5 + 5) * 3).toFixed(2) + "px"
      });
    }
    return result;
  }, [isMobile]);

  useEffect((): void => {
    let token: string | null = null;
    try { token = localStorage.getItem("token"); } catch { /* stockage indisponible */ }
    setIsLoggedIn(!!token);
    const full = { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1];
    if (token) { try { router.prefetch("/dashboard", full); } catch { /* ignoré */ } }
    else { try { router.prefetch("/auth/login", full); } catch { /* ignoré */ } }
  }, [pathname, router]);

  useEffect((): (() => void) | undefined => {
    if (!showLanguageMenu) return;
    const handler = (): void => { setShowLanguageMenu(false); };
    setTimeout((): void => { document.addEventListener("click", handler); }, 0);
    return (): void => { document.removeEventListener("click", handler); };
  }, [showLanguageMenu]);

  const handleLanguageChange = (lang: string): void => {
    changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  const getTranslations = (): any => {
    const translations: any = {
      fr: {
        title: React.createElement(React.Fragment, null, "L'avenir de la ", React.createElement("span", { className: "hero-word-glow" }, "gestion d'entreprise"), " commence ici."),
        subtitle: "INOVEXA",
        eyebrow: "ERP · Solution Intelligente",
        button: "Accéder au Dashboard",
        login: "Commencer maintenant",
        copyright: "Tous droits réservés",
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
        features: [
          { title: "SOLUTIONS INTÉGRÉES", desc: "Ventes, achats, stock, factures" },
          { title: "ANALYSES TEMPS RÉEL", desc: "Tableaux de bord en direct" },
          { title: "SÉCURISÉ & FIABLE", desc: "Données protégées, partout" },
          { title: "VOTRE ÉQUIPE", desc: "RH, finance et logistique" }
        ]
      },
      es: {
        title: React.createElement(React.Fragment, null, "El futuro de la ", React.createElement("span", { className: "hero-word-glow" }, "gestión empresarial"), " comienza aquí."),
        subtitle: "INOVEXA",
        eyebrow: "ERP · Solución Inteligente",
        button: "Panel de Control",
        login: "Empezar ahora",
        copyright: "Todos los derechos reservados",
        privacy: "Política de privacidad",
        terms: "Términos de uso",
        features: [
          { title: "SOLUCIONES INTEGRADAS", desc: "Ventas, compras, stock, facturas" },
          { title: "ANÁLISIS EN TIEMPO REAL", desc: "Paneles y objetivos en vivo" },
          { title: "SEGURO & CONFIABLE", desc: "Datos protegidos, en todo lugar" },
          { title: "SU EQUIPO", desc: "RR. HH., finanzas y logística" }
        ]
      },
      en: {
        title: React.createElement(React.Fragment, null, "The future of ", React.createElement("span", { className: "hero-word-glow" }, "business management"), " starts here."),
        subtitle: "INOVEXA",
        eyebrow: "ERP · Smart Solution",
        button: "Go to Dashboard",
        login: "Get Started Now",
        copyright: "All rights reserved",
        privacy: "Privacy Policy",
        terms: "Terms of Use",
        features: [
          { title: "INTEGRATED SOLUTIONS", desc: "Sales, purchases, stock, invoices" },
          { title: "REAL-TIME INSIGHTS", desc: "Live dashboards and goals" },
          { title: "SECURE & RELIABLE", desc: "Protected data, anywhere" },
          { title: "EMPOWER YOUR TEAM", desc: "HR, finance and logistics" }
        ]
      }
    };
    return translations[language] || translations.en;
  };

  const text: any = getTranslations();
  const flagCodes: Record<string, string> = { en: "gb", fr: "fr", es: "es" };

  return React.createElement("div", {
    className: "home-page-enter " + themeClass,
    style: {
      ...themeVars,
      minHeight: "100vh",
      background: "var(--hp-bg)",
      display: "flex",
      flexDirection: isCompact ? "column" : "row",
      overflow: "hidden",
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative"
    }
  },
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

    isMobile && React.createElement("header", {
      className: "mobile-header",
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "72px",
        background: "var(--hp-header-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 150,
        padding: "0 16px"
      }
    },
      React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "12px"
        },
        className: "hp-rise"
      },
        React.createElement("div", {
          style: {
            width: "52px",
            height: "52px",
            position: "relative",
            flexShrink: 0
          }
        },
          React.createElement("div", {
            style: {
              position: "absolute",
              inset: "-20%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)",
              animation: "headerHaloPulse 2.8s ease-in-out infinite",
              pointerEvents: "none"
            }
          }),
          React.createElement("img", {
            src: "/images/logo.png",
            alt: "Inovexa Logo",
            style: {
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "relative",
              zIndex: 2,
              filter: "drop-shadow(0 0 12px rgba(138,43,226,0.75))"
            }
          })
        ),
        React.createElement("div", {
          style: {
            display: "flex",
            flexDirection: "column",
            lineHeight: 1
          }
        },
          React.createElement("span", {
            style: {
              color: "var(--hp-text)",
              fontSize: "14px",
              fontWeight: "300",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: LOGO_FONT
            }
          },
            React.createElement("span", { style: { fontWeight: "800" } }, "INOV"), "EXA"
          ),
          React.createElement("span", {
            className: "erp-text-glow",
            style: {
              background: "linear-gradient(90deg, #A855F7, #6366F1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "8px",
              fontWeight: "700",
              letterSpacing: "5px",
              marginTop: "2px",
              textTransform: "uppercase",
              fontFamily: LOGO_FONT
            }
          }, "ERP")
        )
      )
    ),

    // Language Selector & Theme Toggle
    React.createElement("div", { style: { position: "fixed", top: "16px", right: "16px", zIndex: 200, display: "flex", alignItems: "center", gap: "10px" } },
      React.createElement(ThemeToggle, { variant: "home", size: 38 }),
      React.createElement("div", { style: { position: "relative" } },
      React.createElement("button", {
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowLanguageMenu(!showLanguageMenu); },
        style: {
          background: "var(--hp-chip-bg)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          borderRadius: "36px",
          color: "var(--hp-text)",
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: "11px",
          display: "flex", alignItems: "center", gap: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease"
        }
      },
        React.createElement("img", { src: "https://flagcdn.com/w20/" + flagCodes[language] + ".png", width: "15", alt: language, style: { borderRadius: "2px" } }),
        React.createElement("span", { style: { fontWeight: "700", letterSpacing: "0.5px" } }, language.toUpperCase()),
        React.createElement(IconChevronDown, { size: 11, color: "var(--hp-muted)" })
      ),
      showLanguageMenu && React.createElement("div", {
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); },
        style: {
          position: "absolute", top: "46px", right: "0",
          background: "var(--hp-menu-bg)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          borderRadius: "14px", padding: "6px",
          display: "flex", flexDirection: "column",
          minWidth: "130px",
          boxShadow: "0 20px 40px var(--hp-shadow), 0 0 0 1px rgba(168,85,247,0.1)",
          zIndex: 201
        }
      },
        ["fr", "en", "es"].map((lang: string) => {
          return React.createElement("button", {
            key: lang,
            onClick: () => handleLanguageChange(lang),
            style: {
              background: language === lang ? "rgba(168, 85, 247, 0.15)" : "transparent",
              border: "none",
              color: language === lang ? "#A855F7" : "var(--hp-menu-text)",
              padding: "10px 12px",
              borderRadius: "9px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              fontWeight: language === lang ? "700" : "400",
              display: "flex", alignItems: "center", gap: "10px",
              transition: "background 0.15s ease"
            }
          },
            React.createElement("img", { src: "https://flagcdn.com/w20/" + flagCodes[lang] + ".png", width: "15", alt: lang, style: { borderRadius: "2px" } }),
            lang === "fr" ? "Français" : lang === "en" ? "English" : "Español"
          );
        })
      )
    )),

    // ═════════════════════════════════════════════════════════════════════════
    //  AMÉLIORATION DE LA PARTIE GAUCHE (LEFT SIDE)
    // ═════════════════════════════════════════════════════════════════════════
    React.createElement("div", {
      style: {
        width: isCompact ? "100%" : "48%",
        padding: isMobile ? "96px 24px 40px" : isTablet ? "80px 48px 48px" : "32px 0 32px 64px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", justifyContent: "center",
        zIndex: 10, position: "relative",
        minHeight: isMobile ? "100vh" : "auto"
      }
    },
      // Logo Desktop
      !isMobile && React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "clamp(16px, 2.5vh, 32px)"
        },
        className: "hp-rise"
      },
        React.createElement("div", { className: "logo3d-scene", style: { width: "92px", height: "92px", position: "relative", flexShrink: 0 } },
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
          React.createElement("h2", { style: { color: "var(--hp-text)", fontSize: "20px", fontWeight: "300", margin: 0, letterSpacing: "2.5px", textTransform: "uppercase", fontFamily: LOGO_FONT } },
            React.createElement("span", { style: { fontWeight: "800" } }, "INOV"), "EXA"
          ),
          React.createElement("div", { className: "erp-text-glow", style: { background: "linear-gradient(90deg, #A855F7, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "11px", fontWeight: "700", letterSpacing: "7px", marginTop: "4px", textTransform: "uppercase", fontFamily: LOGO_FONT } }, "ERP")
        )
      ),

      // Pastille Eyebrow modernisée
      !isMobile && React.createElement("div", { 
        style: { 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "10px", 
          alignSelf: "flex-start", 
          padding: "7px 16px", 
          borderRadius: "999px", 
          border: "1px solid rgba(168, 85, 247, 0.3)", 
          background: "var(--hp-card-bg)", 
          color: "var(--hp-feature-text)", 
          fontSize: "12px", 
          fontWeight: "700", 
          letterSpacing: "1px", 
          textTransform: "uppercase", 
          marginBottom: "clamp(16px, 2.5vh, 24px)",
          boxShadow: "0 4px 16px rgba(168, 85, 247, 0.08)"
        }, 
        className: "hp-rise hp-d1" 
      },
        React.createElement("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "#A855F7", boxShadow: "0 0 8px #A855F7" } }),
        text.eyebrow
      ),

      // Titre principal optimisé avec fluidité et impact visuel
      React.createElement("h1", {
        style: {
          fontSize: isMobile ? "34px" : isTablet ? "44px" : "clamp(38px, 4.8vw, 54px)",
          color: "var(--hp-text)",
          fontWeight: "850",
          lineHeight: "1.12",
          marginBottom: isMobile ? "24px" : "20px",
          marginTop: isMobile ? "20px" : "0",
          letterSpacing: "-1.2px",
        },
        className: "hp-rise hp-d2"
      }, text.title),

      // Grille des fonctionnalités modernisée
      React.createElement("div", { 
        style: { 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "14px", 
          marginBottom: isMobile ? "32px" : "28px", 
          maxWidth: "520px" 
        } 
      },
        text.features.map((f: { title: string; desc?: string }, i: number) => {
          return React.createElement("div", { 
            key: i, 
            className: "hp-feature-card hp-rise", 
            style: { 
              display: "flex", 
              flexDirection: isMobile ? "column" : "row", 
              alignItems: isMobile ? "stretch" : "center", 
              gap: "12px", 
              padding: "16px", 
              background: "var(--hp-card-bg)", 
              border: "1px solid rgba(168, 85, 247, 0.18)", 
              borderRadius: "16px", 
              animationDelay: (180 + i * 60) + "ms", 
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
            } 
          },
            React.createElement("div", { 
              style: { 
                width: "42px", 
                height: "42px", 
                borderRadius: "12px", 
                background: "rgba(168, 85, 247, 0.12)", 
                border: "1px solid rgba(168, 85, 247, 0.25)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                flexShrink: 0
              } 
            }, featureIcons[i]),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } },
              React.createElement("span", { style: { color: "var(--hp-feature-text)", fontSize: "11.5px", fontWeight: "800", letterSpacing: "0.5px", lineHeight: "1.3" } }, f.title),
              !isMobile && f.desc && React.createElement("span", { style: { color: "var(--hp-muted)", fontSize: "12px", lineHeight: 1.4, fontWeight: "400" } }, f.desc)
            )
          );
        })
      ),

      // Bouton CTA principal raffiné
      React.createElement("div", { className: "hp-rise hp-d3", style: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" } },
        React.createElement(Link, { href: isLoggedIn ? "/dashboard" : "/auth/login", style: { textDecoration: "none", width: isMobile ? "100%" : "auto" } },
          React.createElement("button", { 
            className: "cta-button-shimmer", 
            style: { 
              width: isMobile ? "100%" : "auto",
              padding: isMobile ? "16px 24px" : "18px 38px", 
              fontSize: "15px", 
              borderRadius: "14px", 
              border: "none", 
              cursor: "pointer", 
              color: "white", 
              fontWeight: "700", 
              position: "relative", 
              overflow: "hidden", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "12px", 
              letterSpacing: "0.4px" 
            } 
          },
            React.createElement("span", { style: { position: "relative", zIndex: 2 } }, isLoggedIn ? text.button : text.login),
            React.createElement("span", { style: { position: "relative", zIndex: 2, display: "flex", alignItems: "center" } }, React.createElement(IconArrowRight, { size: 18, color: "white" })),
            React.createElement("div", { className: "shimmer-effect" })
          )
        )
      ),

      // Section de bas de page (Copyright et Liens Légaux)
      React.createElement("div", { 
        style: { 
          marginTop: isMobile ? "36px" : "clamp(24px, 3vh, 38px)", 
          paddingTop: "16px", 
          borderTop: "1px solid rgba(168, 85, 247, 0.16)", 
          maxWidth: "520px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "8px" 
        } 
      },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } },
          React.createElement("a", { href: "https://inovexa-erp.com/privacy.html", target: "_blank", rel: "noopener noreferrer", style: { color: "rgba(168, 85, 247, 0.8)", fontSize: "11px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" } },
            React.createElement(IconLock, { size: 11, color: "currentColor" }), text.privacy
          ),
          React.createElement("span", { style: { color: "var(--hp-dot)", fontSize: "11px" } }, "•"),
          React.createElement("a", { href: "https://inovexa-erp.com/terms.html", target: "_blank", rel: "noopener noreferrer", style: { color: "rgba(168, 85, 247, 0.8)", fontSize: "11px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" } },
            React.createElement(IconFileText, { size: 11, color: "currentColor" }), text.terms
          )
        ),
        React.createElement("p", { style: { color: "var(--hp-faint)", fontSize: "10px", fontWeight: "600", margin: 0, letterSpacing: "0.6px" } }, "\u00A9 2026 INOVEXA. " + text.copyright.toUpperCase())
      )
    ),

    // RIGHT SIDE (Statique)
    !isMobile && React.createElement("div", {
      style: {
        width: isTablet ? "100%" : "52%",
        height: isTablet ? "auto" : "100vh",
        minHeight: isTablet ? "520px" : undefined,
        background: "linear-gradient(0deg, rgba(139, 92, 246, 0.06), rgba(139, 92, 246, 0.06)), var(--hp-bg)",
        borderLeft: isTablet ? "none" : "1px solid rgba(139, 92, 246, 0.18)",
        borderTop: isTablet ? "1px solid rgba(139, 92, 246, 0.18)" : "none",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isTablet ? "32px 24px" : "clamp(24px, 5vh, 56px) clamp(28px, 3.4vw, 56px)",
        boxSizing: "border-box"
      }
    },
      React.createElement(HeroPreview)
    ),

    React.createElement("style", { dangerouslySetInnerHTML: { __html: `
      * { -webkit-tap-highlight-color: transparent; }
      .hp-light .hero-word-glow { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #9333ea 100%) !important; -webkit-background-clip: text !important; background-clip: text !important; filter: none !important; animation: none !important; }
      .hp-light a[href*="inovexa-erp.com"] { color: #7c3aed !important; }
      .hp-light .ambient-glow { background: radial-gradient(circle at 18% 28%, rgba(138,43,226,0.12), transparent 45%) !important; }

      .home-page-enter { animation: none; }
      .hp-rise { animation: hpRise 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      .hp-d1 { animation-delay: 60ms; } .hp-d2 { animation-delay: 110ms; } .hp-d3 { animation-delay: 300ms; }
      @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .hp-rise { animation: none; } .erp-text-glow, .hero-word-glow, .cta-button-shimmer, .shimmer-effect, .logo3d, .logo3d-halo, .logo3d-ring { animation: none !important; } }
      
      .hp-feature-card:hover { 
        transform: translateY(-3px) !important; 
        border-color: rgba(168, 85, 247, 0.5) !important; 
        background: rgba(168, 85, 247, 0.08) !important;
        box-shadow: 0 10px 25px rgba(168, 85, 247, 0.12) !important;
      }

      .erp-text-glow { animation: textPulse 3s ease-in-out infinite; }
      @keyframes textPulse { 0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 2px rgba(168,85,247,0.3)); } 50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(168,85,247,0.7)); } }
      
      .cta-button-shimmer { 
        background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%); 
        box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4); 
        animation: buttonPulse 3s infinite; 
        transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease; 
      }
      .cta-button-shimmer:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 14px 38px rgba(168, 85, 247, 0.55); }
      .cta-button-shimmer:active { transform: translateY(0px); filter: brightness(0.95); }
      @keyframes buttonPulse { 0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.5); } 70% { box-shadow: 0 0 0 16px rgba(168, 85, 247, 0); } 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); } }
      
      .shimmer-effect { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); animation: shimmer 2.8s infinite; pointer-events: none; }
      @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      
      .ambient-glow { position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: radial-gradient(circle at 18% 28%, rgba(138,43,226,0.09), transparent 42%); z-index: 0; pointer-events: none; }
      @keyframes floatParticle { 0% { transform: translateY(0) translateX(0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(-85vh) translateX(25px); opacity: 0; } }
      
      .hero-word-glow { display: inline-block; background: linear-gradient(135deg, #C084FC 0%, #818CF8 50%, #A855F7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; background-size: 200% 200%; animation: wordGlow 3.5s ease-in-out infinite, gradientShift 4s ease infinite; }
      @keyframes wordGlow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(168,85,247,0.4)); } 50% { filter: drop-shadow(0 0 22px rgba(168,85,247,0.85)) drop-shadow(0 0 40px rgba(99,102,241,0.4)); } }
      @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

      @keyframes headerHaloPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }

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
    ` } })
  );
}

