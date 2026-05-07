"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";

// SVG Icons
const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconBarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default function HomePage() {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const isCompact = isMobile || isTablet;

  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 15}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 3}px`,
    }));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserRole(user.role);
        if (user.role === "admin") router.replace("/admin/clients");
        else if (user.role === "transporteur") router.replace("/transporteur/dashboard");
        else router.replace("/dashboard");
      } catch (e) {
        console.error("Erreur parsing user:", e);
        setIsLoggedIn(false);
        setUserRole(null);
      }
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (!showLanguageMenu) return;
    const handle = () => setShowLanguageMenu(false);
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [showLanguageMenu]);

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  const getTranslations = () => {
    const translations = {
      fr: {
        title: (
          <>
            L'avenir de la{" "}
            <span style={{ color: "#A855F7" }}>gestion d'entreprise</span>{" "}
            commence ici
          </>
        ),
        subtitle: "INOVEXA",
        button: "Accéder au Dashboard",
        login: "Commencer",
        copyright: "Tous droits réservés",
        features: [
          { title: "SOLUTIONS INTÉGRÉES", Icon: IconTarget },
          { title: "ANALYSES RÉELLES", Icon: IconBarChart },
          { title: "SÉCURISÉ & FIABLE", Icon: IconShield },
          { title: "VOTRE ÉQUIPE", Icon: IconUsers },
        ],
      },
      es: {
        title: (
          <>
            El futuro de la{" "}
            <span style={{ color: "#A855F7" }}>gestión empresarial</span>{" "}
            comienza aquí
          </>
        ),
        subtitle: "INOVEXA",
        button: "Panel de Control",
        login: "Empezar",
        copyright: "Todos los derechos reservados",
        features: [
          { title: "SOLUCIONES INTEGRADAS", Icon: IconTarget },
          { title: "ANÁLISIS REALES", Icon: IconBarChart },
          { title: "SEGURO & CONFIABLE", Icon: IconShield },
          { title: "SU EQUIPO", Icon: IconUsers },
        ],
      },
      en: {
        title: (
          <>
            The future of{" "}
            <span style={{ color: "#A855F7" }}>business management</span>{" "}
            starts here
          </>
        ),
        subtitle: "INOVEXA",
        button: "Go to Dashboard",
        login: "Get Started",
        copyright: "All rights reserved",
        features: [
          { title: "INTEGRATED SOLUTIONS", Icon: IconTarget },
          { title: "REAL-TIME INSIGHTS", Icon: IconBarChart },
          { title: "SECURE & RELIABLE", Icon: IconShield },
          { title: "EMPOWER YOUR TEAM", Icon: IconUsers },
        ],
      },
    };
    return translations[language as keyof typeof translations] || translations.en;
  };

  const text = getTranslations();
  const flagCodes: { [key: string]: string } = { en: "us", fr: "fr", es: "es" };

  const titleFontSize = isMobile ? "32px" : isTablet ? "42px" : "53px";
  const leftPadding = isMobile ? "24px 20px 40px" : isTablet ? "60px 32px" : "0 0 0 40px";
  const leftWidth = isCompact ? "100%" : "45%";
  const rightWidth = isCompact ? "100%" : "55%";
  const rightHeight = isMobile ? "280px" : isTablet ? "380px" : "100vh";
  const logoSize = isMobile ? "90px" : "115px";
  const logoFontSize = isMobile ? "22px" : "28px";
  const erpFontSize = isMobile ? "11px" : "14px";
  const featureGap = isMobile ? "10px" : "14px";
  const featurePadding = isMobile ? "12px" : "15px";
  const featureIconSize = isMobile ? "16px" : "20px";
  const featureTitleSize = isMobile ? "9px" : "10px";
  const ctaPadding = isMobile ? "16px 36px" : "18px 50px";
  const ctaFontSize = isMobile ? "13px" : "15px";
  const marginBetweenTitleAndCards = isMobile ? "32px" : isTablet ? "40px" : "30px";

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid #1a1a1a", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #1a1a1a", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        overflow: isCompact ? "auto" : "hidden",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: "rgba(168, 85, 247, 0.6)",
            borderRadius: "50%",
            boxShadow: "0 0 8px rgba(168, 85, 247, 0.8)",
            animation: `floatParticle ${p.duration} linear infinite`,
            animationDelay: p.delay,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      ))}

      <div className="ambient-glow" />

      {/* Language Selector */}
      <div
        style={{ position: "fixed", top: "16px", right: "16px", zIndex: 100 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowLanguageMenu((v) => !v)}
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(138, 43, 226, 0.25)",
            borderRadius: "36px",
            color: "white",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            touchAction: "manipulation",
          }}
        >
          <img src={`https://flagcdn.com/w20/${flagCodes[language]}.png`} width="16" alt={language} style={{ display: "block" }} />
          <span style={{ fontWeight: "600" }}>{language.toUpperCase()}</span>
        </button>

        {showLanguageMenu && (
          <div
            style={{
              position: "absolute",
              top: "46px",
              right: "0",
              background: "#121212",
              border: "1px solid rgba(138, 43, 226, 0.3)",
              borderRadius: "12px",
              padding: "5px",
              display: "flex",
              flexDirection: "column",
              minWidth: "110px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
              zIndex: 101,
            }}
          >
            {["fr", "en", "es"].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                style={{
                  background: language === lang ? "rgba(168, 85, 247, 0.2)" : "transparent",
                  border: "none",
                  color: "white",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  touchAction: "manipulation",
                }}
              >
                <img src={`https://flagcdn.com/w20/${flagCodes[lang]}.png`} width="16" alt={lang} style={{ display: "block" }} />
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Left Side */}
      <div
        style={{
          width: leftWidth,
          padding: leftPadding,
          display: "flex",
          flexDirection: "column",
          justifyContent: isCompact ? "flex-start" : "center",
          zIndex: 10,
          boxSizing: "border-box",
          paddingTop: isMobile ? "72px" : isTablet ? "80px" : undefined,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", marginLeft: "4px" }}>
          <div style={{ marginTop: "2px" }}>
            <img
              src="/logo.png"
              alt="Inovexa Logo"
              style={{ width: logoSize, height: "auto", filter: "drop-shadow(0 0 15px rgba(138,43,226,0.6))" }}
            />
          </div>
          <div>
            <h2 style={{ color: "white", fontSize: logoFontSize, fontWeight: "300", margin: 0, letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ fontWeight: "800" }}>INOV</span>EXA
            </h2>
            <div
              className="erp-text-glow"
              style={{
                background: "linear-gradient(90deg, #A855F7, #6366F1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: erpFontSize,
                fontWeight: "600",
                letterSpacing: "8px",
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              ERP
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: titleFontSize,
            color: "white",
            fontWeight: "900",
            lineHeight: "1.1",
            letterSpacing: "-1.5px",
            textShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
            margin: "0 0 24px 0",
          }}
        >
          {text.title}
        </h1>

        {/* Marge ajoutée entre le titre et les cartes */}
        <div style={{ marginBottom: marginBetweenTitleAndCards }}></div>

        {/* Feature Cards — SVG icons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: featureGap,
            marginBottom: "36px",
            maxWidth: isMobile ? "100%" : "480px",
          }}
        >
          {text.features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: featurePadding,
                background: "rgba(138, 43, 226, 0.05)",
                border: "1px solid rgba(138, 43, 226, 0.15)",
                borderRadius: "12px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: featureIconSize,
                  height: featureIconSize,
                  color: "#A855F7",
                  flexShrink: 0,
                }}
              >
                <f.Icon />
              </div>
              <span
                style={{
                  color: "white",
                  fontSize: featureTitleSize,
                  fontWeight: "800",
                  opacity: 0.9,
                  letterSpacing: "0.8px",
                }}
              >
                {f.title}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex" }}>
          <Link href="/auth/login" style={{ textDecoration: "none" }}>
            <div className="cta-container">
              <button
                className="cta-button-shimmer"
                style={{
                  padding: ctaPadding,
                  fontSize: ctaFontSize,
                  borderRadius: "12px",
                  position: "relative",
                  zIndex: 2,
                  overflow: "hidden",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "700",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ position: "relative", zIndex: 3 }}>{text.login}</span>
                <div className="shimmer-effect" />
              </button>
            </div>
          </Link>
        </div>

        {/* Copyright */}
        <p style={{ marginTop: "40px", color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "600", marginBottom: isCompact ? "0" : undefined }}>
          © 2026 INOVEXA-ERP. {text.copyright.toUpperCase()}
        </p>
      </div>

      {/* Right Side */}
      <div style={{ width: rightWidth, position: "relative", height: rightHeight, background: "#000000", flexShrink: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            background: "radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <img
          src="/1.png"
          alt="Inovexa Futuristic"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "brightness(0.9) contrast(1.05)",
            maskImage: !isCompact ? "linear-gradient(to right, transparent 0%, black 15%)" : "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage: !isCompact ? "linear-gradient(to right, transparent 0%, black 15%)" : "linear-gradient(to bottom, black 60%, transparent 100%)",
            zIndex: 2,
            position: "relative",
            display: "block",
          }}
        />
        {!isCompact && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100px",
              background: "linear-gradient(90deg, #000000 0%, transparent 100%)",
              height: "100%",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          *, *::before, *::after { box-sizing: border-box; }
          .erp-text-glow { animation: textPulse 3s ease-in-out infinite; }
          @keyframes textPulse {
            0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.3)); }
            50%       { opacity: 1;   filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)); }
          }
          .cta-button-shimmer {
            background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%);
            box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
            animation: buttonPulse 2s infinite;
            transition: transform 0.3s ease, filter 0.3s ease;
          }
          @keyframes buttonPulse {
            0%   { box-shadow: 0 0 0 0   rgba(168, 85, 247, 0.5); }
            70%  { box-shadow: 0 0 0 15px rgba(168, 85, 247, 0); }
            100% { box-shadow: 0 0 0 0   rgba(168, 85, 247, 0); }
          }
          .shimmer-effect {
            position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2.5s infinite;
          }
          @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
          .cta-button-shimmer:hover  { transform: translateY(-2px); filter: brightness(1.1); }
          .cta-button-shimmer:active { transform: translateY(0);    filter: brightness(0.95); }
          .ambient-glow {
            position: absolute; width: 100%; height: 100%; pointer-events: none;
            background: radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.08), transparent 40%);
            z-index: 0;
          }
          @keyframes floatParticle {
            0%   { transform: translateY(0) translateX(0);     opacity: 0; }
            15%  { opacity: 1; }
            100% { transform: translateY(-80vh) translateX(30px); opacity: 0; }
          }
          html, body { overflow-x: hidden; }
          body { -webkit-overflow-scrolling: touch; }
          @supports (padding: env(safe-area-inset-bottom)) {
            .home-left-side { padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
          }
        `,
      }} />
    </div>
  );
}