"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
    forgotHint: "Mot de passe oublié ? Contactez votre administrateur.",
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
    forgotHint: "Forgot your password? Contact your administrator.",
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
    forgotHint: "¿Olvidó su contraseña? Contacte a su administrador.",
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
  const { language, changeLanguage } = useLanguage();
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
        <select
          aria-label="Language"
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{ height: "40px", padding: "0 12px", borderRadius: "999px", border: "1px solid var(--theme-border)", background: "var(--theme-surface)", color: "var(--theme-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", outline: "none" }}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
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

          <div style={{
            padding: "env(safe-area-inset-top, 20px) 24px 0",
            paddingTop: "max(env(safe-area-inset-top, 20px), 20px)",
          }}>
            <Link href="/" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--lg-muted)",
              fontSize: "13px",
              textDecoration: "none",
              padding: "10px 0",
              WebkitTapHighlightColor: "transparent",
            }}>
              <span style={{ fontSize: "16px" }}>←</span>
              <span>{t.backToHome}</span>
            </Link>
          </div>


          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "32px 24px",
            paddingBottom: "max(env(safe-area-inset-bottom, 24px), 40px)",
            overflowY: "auto",
          }}>

            {/* LOGO BLOCK */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0px",
              marginBottom: "32px",
            }}>
              <img 
                src="/images/logo.png" 
                alt="Inovexa Logo" 
                style={{ 
                  width: "96px",
                  height: "auto", 
                  marginRight: "-8px",
                }} 
              />
              <div>
                <h2 style={{ 
                  color: "var(--lg-text)", 
                  fontSize: "16px", 
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  fontWeight: "300", 
                  margin: 0, 
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}>
                  <span style={{ fontWeight: "800" }}>INOV</span>EXA
                </h2>
                <div style={{ 
                  background: "linear-gradient(90deg, #A855F7, #6366F1)",
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent",
                  fontSize: "9px", 
                  fontWeight: "700",
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  letterSpacing: "5px", 
                  marginTop: "3px",
                  textTransform: "uppercase"
                }}>ERP</div>
              </div>
            </div>

            {/* TITLE */}
            <div style={{ marginBottom: "32px" }}>
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
            <div style={{
              background: "var(--lg-card)",
              border: "1px solid rgba(168, 85, 247, 0.12)",
              borderRadius: "20px",
              padding: "28px 24px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}>

              {error && (
                <div role="alert" aria-live="assertive" style={{ 
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

              <form onSubmit={handleLogin} style={{ width: "100%" }}>
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

            <p style={{ 
              marginTop: "28px", 
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
            width: "49.5%",
            padding: "0 0 0 20px", 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 10,
            position: "relative",
          }}>
            
            {/* LOGO ET TEXTE */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "15px", marginLeft: "5px" }}>
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

            {/* TITRE DE CONNEXION */}
            <h1 style={{ 
              fontSize: "42px",
              color: "var(--lg-text)", 
              fontWeight: "800", 
              lineHeight: "1.2",
              marginBottom: "30px",
              letterSpacing: "-1.5px",
              marginTop: "20px"
            }}>
              {t.signIn}
            </h1>

            {error && (
              <div role="alert" aria-live="assertive" style={{ 
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

            <form onSubmit={handleLogin} style={{ maxWidth: "495px", width: "100%" }}>
              <div style={{ marginBottom: "22px" }}>
                <label style={{ color: "var(--lg-label)", display: "block", marginBottom: "9px", fontSize: "13px", fontWeight: "500" }}>
                  {t.email}
                </label>
                <input
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
                    padding: "15.4px",
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

              <div style={{ marginBottom: "30.8px" }}>
                <label style={{ color: "var(--lg-label)", display: "block", marginBottom: "9px", fontSize: "13px", fontWeight: "500" }}>
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
                    padding: "15.4px",
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

              {/* Se souvenir de l'e-mail + aide mot de passe */}
<div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "4px 0 18px" }}>
  <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--lg-label)", fontSize: "13.5px", cursor: "pointer", minHeight: "28px" }}>
    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#8b5cf6", cursor: "pointer" }} />
    {t.remember}
  </label>
  <span style={{ color: "var(--lg-muted)", fontSize: "12.5px", lineHeight: 1.5 }}>{t.forgotHint}</span>
</div>
<button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "17.6px",
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
              </button>
            </form>

            <div style={{ marginTop: "33px" }}>
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

            <p style={{ marginTop: "55px", color: "var(--lg-faint)", fontSize: "11px", fontWeight: "600" }}>
              © 2026 INOVEXA. {t.rights.toUpperCase()}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT SIDE — Hero visuel amélioré (aligné sur la home page)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="login-hero anim-hero" style={{ 
            width: "50.5%",
            position: "relative",
            height: "100vh",
            background: "var(--lg-bg)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px"
          }}>
            {/* Halo ambiant */}
            <div className="lg-hero-halo" style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "120%", height: "120%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.28) 0%, rgba(99,102,241,0.12) 35%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
              zIndex: 0,
              animation: "lgHaloPulse 6s ease-in-out infinite"
            }} />

            {/* Grille décorative */}
            <div className="lg-hero-grid" style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(168,85,247,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168,85,247,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
              pointerEvents: "none",
              zIndex: 1,
              opacity: 0.8
            }} />

            {/* Cercles orbitaux */}
            <div className="lg-hero-orbit lg-hero-orbit-1" style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "88%", height: "88%",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1px solid rgba(168,85,247,0.18)",
              pointerEvents: "none",
              zIndex: 2,
              animation: "lgOrbitSpin 28s linear infinite"
            }}>
              <span style={{
                position: "absolute",
                top: "-3px", left: "50%",
                width: "8px", height: "8px",
                borderRadius: "50%",
                background: "#C084FC",
                boxShadow: "0 0 14px #A855F7, 0 0 28px rgba(168,85,247,0.7)"
              }} />
            </div>
            <div className="lg-hero-orbit lg-hero-orbit-2" style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "68%", height: "68%",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1px solid rgba(99,102,241,0.15)",
              pointerEvents: "none",
              zIndex: 2,
              animation: "lgOrbitSpinReverse 20s linear infinite"
            }}>
              <span style={{
                position: "absolute",
                bottom: "-3px", left: "30%",
                width: "6px", height: "6px",
                borderRadius: "50%",
                background: "#818CF8",
                boxShadow: "0 0 12px #6366F1"
              }} />
            </div>

            {/* Carte contenant l'image */}
            <div className="lg-hero-card" style={{
              position: "relative",
              width: "100%",
              height: "100%",
              maxWidth: "640px",
              maxHeight: "78vh",
              borderRadius: "28px",
              overflow: "hidden",
              border: "1px solid rgba(168,85,247,0.25)",
              background: "linear-gradient(145deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04))",
              boxShadow: `
                0 30px 80px -20px rgba(168,85,247,0.35),
                0 0 0 1px rgba(168,85,247,0.1) inset,
                0 0 60px -20px rgba(99,102,241,0.4) inset
              `,
              zIndex: 3,
              transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
              transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.6s ease",
              animation: "lgCardFloat 7s ease-in-out infinite"
            }}>
              {/* Reflet haut */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(192,132,252,0.9), transparent)",
                zIndex: 5
              }} />

              {/* Image */}
              <img 
                src="/images/1.png" 
                alt="Inovexa Futuristic" 
                className="lg-hero-image"
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover", 
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  filter: "var(--lg-img-filter, brightness(0.95) contrast(1.05))",
                  transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1)"
                }}
              />

              {/* Overlay dégradé */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.45) 100%)",
                zIndex: 3,
                pointerEvents: "none"
              }} />
            </div>
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

        /* ═══════════════════════════════════════════════════════════════
           HERO VISUEL — partie droite (desktop)
           ═══════════════════════════════════════════════════════════════ */
        .login-hero {
          animation: lgHeroSlideIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes lgHeroSlideIn {
          0%   { opacity: 0; transform: translateX(60px) scale(1.04); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes lgHaloPulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes lgOrbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes lgOrbitSpinReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to   { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes lgCardFloat {
          0%, 100% { transform: perspective(1200px) rotateY(-4deg) rotateX(2deg) translateY(0); }
          50%      { transform: perspective(1200px) rotateY(-3deg) rotateX(1deg) translateY(-10px); }
        }
        .lg-hero-card:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) translateY(-6px) scale(1.015) !important;
          box-shadow:
            0 40px 100px -20px rgba(168,85,247,0.55),
            0 0 0 1px rgba(168,85,247,0.25) inset,
            0 0 80px -20px rgba(99,102,241,0.6) inset !important;
        }
        .lg-hero-card:hover .lg-hero-image {
          transform: scale(1.06);
        }
        .lg-light .lg-hero-card {
          box-shadow:
            0 30px 80px -20px rgba(124,58,237,0.25),
            0 0 0 1px rgba(124,58,237,0.12) inset !important;
        }
        .lg-light .lg-hero-halo {
          background: radial-gradient(circle at 50% 50%, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.08) 35%, transparent 70%) !important;
        }
        .lg-light .lg-hero-grid {
          background-image:
            linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-hero,
          .lg-hero-card,
          .lg-hero-orbit-1,
          .lg-hero-orbit-2,
          .lg-hero-halo { 
            animation: none !important; 
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        @media (max-width: 1024px) {
          .lg-hero-card { transform: none !important; }
          .lg-hero-card:hover { transform: translateY(-4px) scale(1.01) !important; }
        }
      ` }} />
    </div>
  );
}