"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import HeroPreview from "@/components/ui/HeroPreview";
import LanguageMenu from "@/components/ui/LanguageMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";

// Traductions
// Variante sombre = apparence d'origine ; variante claire = même mise en page, couleurs claires
const LG_DARK: Record<string, string> = {
  "--lg-bg": "#000000", "--lg-text": "white", "--lg-muted": "rgba(255,255,255,0.4)",
  "--lg-label": "rgba(255,255,255,0.65)", "--lg-faint": "rgba(255,255,255,0.2)",
  "--lg-card": "rgba(255,255,255,0.03)", "--lg-input-bg": "rgba(255,255,255,0.05)",
  "--lg-input-border": "rgba(138, 43, 226, 0.2)", "--lg-error": "#f87171", "--lg-warn": "#FBBF24",
  "--lg-placeholder": "rgba(255, 255, 255, 0.2)", "--lg-autofill": "rgba(26, 26, 26, 0.95)",
  "--lg-img-filter": "brightness(0.88) contrast(1.06)",
};
const LG_LIGHT: Record<string, string> = {
  "--lg-bg": "#f8f7ff", "--lg-text": "#111827", "--lg-muted": "#6b7280",
  "--lg-label": "#374151", "--lg-faint": "#9ca3af",
  "--lg-card": "#ffffff", "--lg-input-bg": "#ffffff",
  "--lg-input-border": "rgba(124, 58, 237, 0.28)", "--lg-error": "#b91c1c", "--lg-warn": "#b45309",
  "--lg-placeholder": "#9ca3af", "--lg-autofill": "#ffffff",
  "--lg-img-filter": "brightness(1) contrast(1.03) saturate(1.05)",
};

/** Variables de couleur du login pour n'importe quel thème */
function buildLgVars(themeId: string, theme: any): Record<string, string> {
  if (themeId === "dark") return LG_DARK;
  if (themeId === "light") return LG_LIGHT;
  const light = isLightTheme(theme);
  return {
    "--lg-bg": theme.background, "--lg-text": theme.text, "--lg-muted": theme.textSecondary,
    "--lg-label": theme.text, "--lg-faint": theme.textSecondary,
    "--lg-card": theme.surface, "--lg-input-bg": theme.surfaceHover,
    "--lg-input-border": theme.border, "--lg-error": light ? "#b91c1c" : "#f87171", "--lg-warn": light ? "#b45309" : "#FBBF24",
    "--lg-placeholder": theme.textSecondary, "--lg-autofill": theme.surface,
    "--lg-img-filter": light ? "brightness(1) contrast(1.03) saturate(1.05)" : "brightness(0.88) contrast(1.06)",
  };
}

const translations = {
  fr: {
    backToHome: "Retour à l'accueil",
    remember: "Se souvenir de mon e-mail",
    area: "Espace client",
    secure: "Connexion sécurisée",
    welcome: "Accédez à votre espace de gestion.",
    signIn: "Connectez-vous à votre espace",
    email: "Email",
    password: "Mot de passe",
    login: "Se connecter",
    loggingIn: "Connexion...",
    invalidCredentials: "Email ou mot de passe incorrect",
    serverError: "Erreur de connexion au serveur",
    emailPlaceholder: "exemple@inovexa.com",
    passwordPlaceholder: "Mot de passe",
    capsLock: "Verr. Maj activée",
    rights: "Tous droits réservés"
  },
  en: {
    backToHome: "Back to home",
    remember: "Remember my email",
    area: "Client area",
    secure: "Secure sign-in",
    welcome: "Access your management workspace.",
    signIn: "Sign in to your workspace",
    email: "Email",
    password: "Password",
    login: "Sign in",
    loggingIn: "Signing in...",
    invalidCredentials: "Invalid email or password",
    serverError: "Connection error",
    emailPlaceholder: "example@inovexa.com",
    passwordPlaceholder: "Password",
    capsLock: "Caps Lock is on",
    rights: "All rights reserved"
  },
  es: {
    backToHome: "Volver al inicio",
    remember: "Recordar mi correo",
    area: "Área de clientes",
    secure: "Conexión segura",
    welcome: "Acceda a su espacio de gestión.",
    signIn: "Inicia sesión en tu espacio",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    invalidCredentials: "Correo o contraseña incorrectos",
    serverError: "Error de conexión",
    emailPlaceholder: "ejemplo@inovexa.com",
    passwordPlaceholder: "Contraseña",
    capsLock: "Bloq Mayús activado",
    rights: "Todos los derechos reservados"
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme, themeId } = useTheme();
  const isLight = isLightTheme(theme);
  const themeVars = buildLgVars(themeId, theme) as React.CSSProperties;
  const themeClass = isLight ? "lg-light" : "lg-dark";
  const { isMobile, isTablet } = useResponsive();
  const t = translations[language as keyof typeof translations] || translations.fr;
  
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  // Pré-remplit l'e-mail mémorisé lors d'une précédente connexion
  useEffect(() => {
    try {
      const saved = localStorage.getItem("remember_email");
      if (saved) setEmail(saved);
      else if (localStorage.getItem("remember_email_off")) setRemember(false);
    } catch {}
  }, []);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const isSmallScreen = isMobile || isTablet;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

      const res = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json().catch(() => ({} as any));

      if (res.ok) {
        try {
          if (remember) { localStorage.setItem("remember_email", email.trim().toLowerCase()); localStorage.removeItem("remember_email_off"); }
          else { localStorage.removeItem("remember_email"); localStorage.setItem("remember_email_off", "1"); }
        } catch {}
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.user.role === "admin") {
          router.push("/admin/clients");
        } else if (data.user.role === "transporteur") {
          router.push("/transporteur/shipments");
        } else {
          router.push("/dashboard");
        }
      } else {
        const serverMsg = Array.isArray(data?.message) ? data.message[0] : data?.message;
        if (res.status === 429) {
          setError(serverMsg || "Trop de tentatives. Réessayez plus tard.");
        } else if (res.status >= 500) {
          setError(t.serverError);
        } else {
          setError(serverMsg || t.invalidCredentials);
        }
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={"root-container " + themeClass}
      style={{ 
        ...themeVars,
        background: "var(--lg-bg)",
        display: "flex", 
        flexDirection: isSmallScreen ? "column" : "row",
        overflow: "hidden",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
      }}
    >
      
      {/* Thème et langue (ordinateur seulement) */}
      {!isSmallScreen && <div style={{ position: "fixed", top: "max(env(safe-area-inset-top, 0px), 14px)", right: "14px", zIndex: 60, display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle size={40} />
        <LanguageMenu />
      </div>}

      {/* ── MOBILE LAYOUT ── */}
      {isSmallScreen ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
          padding: "0",
          minHeight: "100dvh",
        }}>

          {/* En-tête fixe : même présentation que la page d'accueil (logo + nom à gauche, thème et langue à droite) */}
          <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "72px", background: "var(--lg-bg)", borderBottom: "1px solid rgba(168, 85, 247, 0.2)", display: "flex", alignItems: "center", padding: "0 16px", zIndex: 150 }}>
            <Link href="/" aria-label={t.backToHome} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", WebkitTapHighlightColor: "transparent" }}>
              <img src="/images/logo.png" alt="Inovexa Logo" style={{ width: "52px", height: "52px", objectFit: "contain", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{ color: "var(--lg-text)", fontSize: "14px", fontWeight: 300, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Orbitron', 'Poppins', sans-serif" }}>
                  <span style={{ fontWeight: 800 }}>INOV</span>EXA
                </span>
                <span style={{ background: "linear-gradient(90deg, #A855F7, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "8px", fontWeight: 700, letterSpacing: "5px", marginTop: "2px", textTransform: "uppercase", fontFamily: "'Orbitron', 'Poppins', sans-serif" }}>ERP</span>
              </div>
            </Link>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
              <ThemeToggle size={38} />
              <LanguageMenu />
            </div>
          </header>

          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "96px 24px 40px",
            paddingBottom: "max(env(safe-area-inset-bottom, 24px), 40px)",
            overflowY: "auto",
          }}>

            {/* TITLE */}
            <div className="lg-anim" style={{ marginBottom: "32px" }}>
              <h1 style={{ 
                fontSize: "32px",
                color: "var(--lg-text)", 
                fontWeight: "800", 
                lineHeight: "1.15",
                letterSpacing: "-1px",
                margin: 0,
              }}>
                {t.signIn}
              </h1>
              <div style={{
                marginTop: "12px",
                width: "48px",
                height: "3px",
                background: "linear-gradient(90deg, #A855F7, #6366F1)",
                borderRadius: "2px",
              }} />
            </div>

            {/* GLASS CARD WRAPPER */}
            <div className="lg-card" style={{
              background: "var(--lg-card)",
              border: "1px solid rgba(168, 85, 247, 0.12)",
              borderRadius: "20px",
              padding: "28px 24px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}>

              {error && (
                <div className="lg-error" role="alert" aria-live="assertive" style={{ 
                  background: "rgba(239,68,68,0.08)", 
                  border: "1px solid rgba(239,68,68,0.25)", 
                  color: "var(--lg-error)", 
                  padding: "12px 14px", 
                  borderRadius: "12px", 
                  marginBottom: "20px", 
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span style={{ fontSize: "15px" }}>⚠</span>
                  {error}
                </div>
              )}

              <form className="lg-form" onSubmit={handleLogin} style={{ width: "100%" }}>
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ 
                    color: "var(--lg-label)", 
                    display: "block", 
                    marginBottom: "8px", 
                    fontSize: "12px", 
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}>
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    autoCapitalize="none"
                    inputMode="email"
                    style={{ 
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "16px",
                      background: "var(--lg-input-bg)",
                      border: "1px solid var(--lg-input-border)", 
                      borderRadius: "12px", 
                      color: "var(--lg-text)",
                      fontSize: "16px",
                      WebkitAppearance: "none",
                      outline: "none",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "26px" }}>
                  <label style={{ 
                    color: "var(--lg-label)", 
                    display: "block", 
                    marginBottom: "8px", 
                    fontSize: "12px", 
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}>
                    {t.password}
                  </label>
                  <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    aria-invalid={!!error}
                    onKeyDown={detectCapsLock}
                    onKeyUp={detectCapsLock}
                    style={{ 
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "16px",
                      paddingRight: "46px",
                      background: "var(--lg-input-bg)",
                      border: "1px solid var(--lg-input-border)", 
                      borderRadius: "12px", 
                      color: "var(--lg-text)",
                      fontSize: "16px",
                      WebkitAppearance: "none",
                      outline: "none",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    tabIndex={-1}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "4px", cursor: "pointer", color: "var(--lg-muted)", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                  </div>
                  {capsLockOn && (
                    <p role="status" style={{ color: "var(--lg-warn)", fontSize: "12px", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span aria-hidden="true">⇪</span> {t.capsLock}
                    </p>
                  )}
                </div>

                <button
                  className="lg-btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "18px",
                    fontSize: "16px",
                    borderRadius: "14px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "white",
                    fontWeight: "700",
                    background: loading
                      ? "rgba(168, 85, 247, 0.4)"
                      : "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
                    letterSpacing: "0.3px",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {loading && (
                      <span className="spinner" style={{
                        width: "16px", height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        display: "inline-block",
                      }} />
                    )}
                    {loading ? t.loggingIn : t.login}
                  </span>
                </button>
              </form>
            </div>

            <div style={{ marginTop: "22px", textAlign: "center" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--lg-muted)", fontSize: "14px", textDecoration: "none", padding: "8px 4px" }}>
                <span style={{ fontSize: "16px" }}>←</span>
                <span>{t.backToHome}</span>
              </Link>
            </div>

            <p style={{ 
              marginTop: "20px", 
              color: "var(--lg-faint)", 
              fontSize: "10px", 
              fontWeight: "600",
              textAlign: "center",
              letterSpacing: "1px",
            }}>
              © 2026 INOVEXA. {t.rights.toUpperCase()}
            </p>
          </div>
        </div>

      ) : (
        /* ── DESKTOP LAYOUT ── */
        <>
          <div style={{ 
            width: "44%",
            padding: "0 0 0 20px", 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 10,
            position: "relative",
          }}>
            
            {/* LOGO ET TEXTE */}
            <div className="lg-anim-left" style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "15px", marginLeft: "5px" }}>
              <div style={{ marginTop: "2px" }}> 
                <img 
                  src="/images/logo.png" 
                  alt="Inovexa Logo" 
                  style={{ 
                    width: "126px",
                    height: "auto", 
                  }} 
                />
              </div>
              <div>
                <h2 style={{ 
                  color: "var(--lg-text)", 
                  fontSize: "28px", 
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  fontWeight: "300", 
                  margin: 0, 
                  letterSpacing: "2px",
                  textTransform: "uppercase"
                }}>
                  <span style={{ fontWeight: "800" }}>INOV</span>EXA
                </h2>
                <div style={{ 
                  background: "linear-gradient(90deg, #A855F7, #6366F1)",
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent",
                  fontSize: "14px", 
                  fontWeight: "600",
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  letterSpacing: "8px", 
                  marginTop: "1px",
                  textTransform: "uppercase"
                }}>ERP</div>
              </div>
            </div>

            {/* Carte de connexion */}
            <div className="lg-card" style={{ width: "100%", maxWidth: "520px", boxSizing: "border-box", background: "var(--lg-card)", border: "1px solid var(--lg-input-border)", borderRadius: "22px", padding: "clamp(20px, 3.4vh, 32px) 34px clamp(18px, 3vh, 28px)", boxShadow: "0 24px 56px -30px rgba(76, 29, 149, 0.35)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)", color: "var(--lg-label)", fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: "clamp(10px, 1.8vh, 16px)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#A855F7" }} />
              {t.area}
            </div>
            {/* TITRE DE CONNEXION */}
            <h1 style={{ 
              fontSize: "clamp(28px, 4.2vh, 34px)",
              color: "var(--lg-text)", 
              fontWeight: "800", 
              lineHeight: "1.2",
              marginBottom: "8px",
              letterSpacing: "-1px",
              marginTop: "0"
            }}>
              {t.signIn}
            </h1>
            <p style={{ color: "var(--lg-muted)", fontSize: "15px", margin: "0 0 clamp(14px, 2.6vh, 24px)", lineHeight: 1.5 }}>{t.welcome}</p>

            {error && (
              <div className="lg-error" role="alert" aria-live="assertive" style={{ 
                background: "rgba(239,68,68,0.1)", 
                border: "1px solid rgba(239,68,68,0.2)", 
                color: "var(--lg-error)", 
                padding: "12px", 
                borderRadius: "12px", 
                marginBottom: "20px", 
                fontSize: "13px" 
              }}>
                {error}
              </div>
            )}

            <form className="lg-form" onSubmit={handleLogin} style={{ width: "100%" }}>
              <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                <label style={{ color: "var(--lg-label)", display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: "500" }}>
                  {t.email}
                </label>
                <div style={{ position: "relative" }}>
                <span aria-hidden="true" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--lg-muted)", display: "flex", pointerEvents: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
                <input
                  className="lg-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  aria-invalid={!!error}
                  style={{ 
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "clamp(12px, 1.9vh, 15.4px) 15.4px clamp(12px, 1.9vh, 15.4px) 46px",
                    background: "var(--lg-input-bg)",
                    border: "1px solid var(--lg-input-border)", 
                    borderRadius: "12px", 
                    color: "var(--lg-text)",
                    fontSize: "15.4px",
                    outline: "none",
                  }}
                  required
                />
                </div>
              </div>

              <div style={{ marginBottom: "clamp(10px, 1.6vh, 16px)" }}>
                <label style={{ color: "var(--lg-label)", display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: "500" }}>
                  {t.password}
                </label>
                <div style={{ position: "relative" }}>
                  <span aria-hidden="true" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--lg-muted)", display: "flex", pointerEvents: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                  <input
                  className="lg-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  aria-invalid={!!error}
                  onKeyDown={detectCapsLock}
                  onKeyUp={detectCapsLock}
                  style={{ 
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "clamp(12px, 1.9vh, 15.4px)",
                    paddingLeft: "46px",
                    paddingRight: "46px",
                    background: "var(--lg-input-bg)",
                    border: "1px solid var(--lg-input-border)", 
                    borderRadius: "12px", 
                    color: "var(--lg-text)",
                    fontSize: "15.4px",
                    outline: "none",
                  }}
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    tabIndex={-1}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "4px", cursor: "pointer", color: "var(--lg-muted)", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                  </div>
                  {capsLockOn && (
                    <p role="status" style={{ color: "var(--lg-warn)", fontSize: "12.5px", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span aria-hidden="true">⇪</span> {t.capsLock}
                    </p>
                  )}
              </div>

              {/* Se souvenir de l'e-mail */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", flexWrap: "wrap", margin: "0 0 clamp(12px, 2vh, 18px)" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--lg-label)", fontSize: "13.5px", cursor: "pointer", minHeight: "28px" }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#8b5cf6", cursor: "pointer" }} />
                  {t.remember}
                </label>
                
              </div>
              <button
                className="lg-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 12px 26px -12px rgba(139, 92, 246, 0.65)",
                  padding: "clamp(13px, 2vh, 17px)",
                  fontSize: "16.5px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "white",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
                  opacity: loading ? 0.7 : 1
                }}
              >
                <span>
                  {loading ? t.loggingIn : t.login}
                </span>
                {!loading && <span aria-hidden="true">→</span>}
              </button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px", color: "var(--lg-muted)", fontSize: "12.5px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                {t.secure}
              </div>
            </form>
            </div>

            <div style={{ marginTop: "clamp(12px, 2vh, 20px)" }}>
              <Link href="/" style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px",
                color: "var(--lg-muted)", 
                fontSize: "14.3px",
                textDecoration: "none",
              }}>
                <span style={{ fontSize: "17.6px" }}>←</span>
                <span>{t.backToHome}</span>
              </Link>
            </div>

            <p style={{ marginTop: "clamp(12px, 2.4vh, 26px)", color: "var(--lg-faint)", fontSize: "11px", fontWeight: "600" }}>
              © 2026 INOVEXA. {t.rights.toUpperCase()}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT SIDE — Hero visuel amélioré (aligné sur la home page)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="login-hero" style={{
            width: "56%",
            height: "100vh",
            background: "linear-gradient(0deg, rgba(139, 92, 246, 0.06), rgba(139, 92, 246, 0.06)), var(--lg-bg)",
            borderLeft: "1px solid rgba(139, 92, 246, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(24px, 5vh, 56px) clamp(28px, 3.4vw, 56px)",
            boxSizing: "border-box"
          }}>
            {/* Titre + capture + légende (statique : aucune animation, aucun effet) */}
            <HeroPreview />
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .root-container {
          min-height: 100vh;
          min-height: 100dvh;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spinner {
          animation: spin 0.8s linear infinite;
        }

        /* ── Variante claire ── */
        .lg-light h1 span, .lg-light h2 span { text-shadow: none; }

        /* ── Animations (la capture du tableau de bord reste statique) ── */
        @keyframes lgFadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes lgFadeLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: none; } }
        @keyframes lgShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(3px); } 30%, 50%, 70% { transform: translateX(-5px); } 40%, 60% { transform: translateX(5px); } }
        @keyframes lgSheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .lg-anim      { opacity: 0; animation: lgFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards; }
        .lg-anim-left { opacity: 0; animation: lgFadeLeft 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .lg-card      { opacity: 0; animation: lgFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards; }
        .lg-card > *, .lg-form > * { opacity: 0; animation: lgFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .lg-card > :nth-child(1), .lg-form > :nth-child(1) { animation-delay: 0.3s; }
        .lg-card > :nth-child(2), .lg-form > :nth-child(2) { animation-delay: 0.38s; }
        .lg-card > :nth-child(3), .lg-form > :nth-child(3) { animation-delay: 0.46s; }
        .lg-card > :nth-child(4), .lg-form > :nth-child(4) { animation-delay: 0.54s; }
        .lg-card > :nth-child(5), .lg-form > :nth-child(5) { animation-delay: 0.62s; }
        .lg-card > :nth-child(6), .lg-form > :nth-child(6) { animation-delay: 0.7s; }
        .lg-card > .lg-error { opacity: 1; animation: lgShake 0.5s ease; }
        .lg-btn { transition: transform 0.15s ease, box-shadow 0.25s ease; }
        .lg-btn:hover:not(:disabled) { background-size: 200% 100% !important; transform: translateY(-2px); box-shadow: 0 16px 30px -12px rgba(139, 92, 246, 0.8) !important; animation: lgSheen 1.6s linear infinite; }
        .lg-btn:active:not(:disabled) { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .lg-anim, .lg-anim-left, .lg-card, .lg-card > *, .lg-form > * { animation: none !important; opacity: 1 !important; }
          .lg-btn, .lg-btn:hover:not(:disabled) { animation: none !important; transition: none; }
        }

        .lg-input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); }

        input::placeholder {
          color: var(--lg-placeholder);
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--lg-text);
          -webkit-box-shadow: 0 0 0px 1000px var(--lg-autofill) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        @media (max-width: 768px) {
          .login-hero { display: none !important; }
        }
      ` }} />
    </div>
  );
}