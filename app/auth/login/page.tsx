"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";

// Traductions
const translations = {
  fr: {
    backToHome: "Retour à l'accueil",
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
  const { isMobile, isTablet } = useResponsive();
  const t = translations[language as keyof typeof translations] || translations.fr;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Détection Verr. Maj sur le champ mot de passe (UX : évite les échecs de connexion silencieux)
  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const isSmallScreen = isMobile || isTablet;

  // Particules lumineuses
  const particles = useMemo(() => {
    return Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 15}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 3}px`
    }));
  }, [isMobile]);

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
    <div className="root-container" style={{ 
      background: "#000000",
      display: "flex", 
      flexDirection: isSmallScreen ? "column" : "row",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
    }}>
      
      {/* PARTICULES LUMINEUSES */}
      {particles.map((p) => (
        <div key={p.id} className="particle" style={{
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
          zIndex: 1
        }} />
      ))}

      <div className="ambient-glow" />

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

          {/* TOP SAFE-AREA SPACER + HEADER */}
          <div style={{
            padding: "env(safe-area-inset-top, 20px) 24px 0",
            paddingTop: "max(env(safe-area-inset-top, 20px), 20px)",
          }}>
            {/* Back link — top left */}
            <Link href="/" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              textDecoration: "none",
              padding: "10px 0",
              WebkitTapHighlightColor: "transparent",
            }}>
              <span style={{ fontSize: "16px" }}>←</span>
              <span>{t.backToHome}</span>
            </Link>
          </div>

          {/* SCROLLABLE CONTENT AREA */}
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
              gap: "10px",
              marginBottom: "36px",
            }}>
              <img 
                src="/images/logo.png" 
                alt="Inovexa Logo" 
                style={{ 
                  width: "52px",
                  height: "auto", 
                  filter: "drop-shadow(0 0 12px rgba(138,43,226,0.7))" 
                }} 
              />
              <div>
                <h2 style={{ 
                  color: "white", 
                  fontSize: "22px", 
                  fontWeight: "300", 
                  margin: 0, 
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}>
                  <span style={{ fontWeight: "800" }}>INOV</span>EXA
                </h2>
                <div className="erp-text-glow" style={{ 
                  background: "linear-gradient(90deg, #A855F7, #6366F1)",
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent",
                  fontSize: "11px", 
                  fontWeight: "700", 
                  letterSpacing: "7px", 
                  marginTop: "3px",
                  textTransform: "uppercase"
                }}>ERP</div>
              </div>
            </div>

            {/* TITLE */}
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ 
                fontSize: "32px",
                color: "white", 
                fontWeight: "800", 
                lineHeight: "1.15",
                letterSpacing: "-1px",
                margin: 0,
              }}>
                {t.signIn}
              </h1>
              {/* Decorative accent line */}
              <div style={{
                marginTop: "12px",
                width: "48px",
                height: "3px",
                background: "linear-gradient(90deg, #A855F7, #6366F1)",
                borderRadius: "2px",
              }} />
            </div>

            {/* GLASS CARD WRAPPER */}
            <div className="login-card-enter" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(168, 85, 247, 0.12)",
              borderRadius: "20px",
              padding: "28px 24px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}>

              {/* ERROR */}
              {error && (
                <div role="alert" aria-live="assertive" style={{ 
                  background: "rgba(239,68,68,0.08)", 
                  border: "1px solid rgba(239,68,68,0.25)", 
                  color: "#f87171", 
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
                {/* EMAIL */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ 
                    color: "rgba(255,255,255,0.6)", 
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
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(138, 43, 226, 0.2)", 
                      borderRadius: "12px", 
                      color: "white",
                      fontSize: "16px",
                      transition: "all 0.25s ease",
                      WebkitAppearance: "none",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#A855F7";
                      e.currentTarget.style.background = "rgba(168, 85, 247, 0.07)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(168, 85, 247, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(138, 43, 226, 0.2)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div style={{ marginBottom: "26px" }}>
                  <label style={{ 
                    color: "rgba(255,255,255,0.6)", 
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
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(138, 43, 226, 0.2)", 
                      borderRadius: "12px", 
                      color: "white",
                      fontSize: "16px",
                      transition: "all 0.25s ease",
                      WebkitAppearance: "none",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#A855F7";
                      e.currentTarget.style.background = "rgba(168, 85, 247, 0.07)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(168, 85, 247, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(138, 43, 226, 0.2)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    tabIndex={-1}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "4px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                  </div>
                  {capsLockOn && (
                    <p role="status" style={{ color: "#FBBF24", fontSize: "12px", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span aria-hidden="true">⇪</span> {t.capsLock}
                    </p>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="cta-button-shimmer"
                  style={{
                    width: "100%",
                    padding: "18px",
                    fontSize: "16px",
                    borderRadius: "14px",
                    position: "relative",
                    zIndex: 2,
                    overflow: "hidden",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "white",
                    fontWeight: "700",
                    background: loading
                      ? "rgba(168, 85, 247, 0.4)"
                      : "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(168, 85, 247, 0.35)",
                    transition: "all 0.25s ease",
                    letterSpacing: "0.3px",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
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
                  {!loading && <div className="shimmer-effect" />}
                </button>
              </form>
            </div>

            {/* FOOTER */}
            <p style={{ 
              marginTop: "28px", 
              color: "rgba(255,255,255,0.18)", 
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
          {/* CÔTÉ GAUCHE - FORMULAIRE */}
          <div style={{ 
            width: "49.5%",
            padding: "0 0 0 20px", 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 10
          }}>
            
            {/* LOGO ET TEXTE */}
            <div className="login-rise lr-1" style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "15px", marginLeft: "5px" }}>
              <div style={{ marginTop: "2px" }}> 
                <img 
                  src="/images/logo.png" 
                  alt="Inovexa Logo" 
                  style={{ 
                    width: "126px",
                    height: "auto", 
                    filter: "drop-shadow(0 0 15px rgba(138,43,226,0.6))" 
                  }} 
                />
              </div>
              <div>
                <h2 style={{ 
                  color: "white", 
                  fontSize: "28px", 
                  fontWeight: "300", 
                  margin: 0, 
                  letterSpacing: "2px",
                  textTransform: "uppercase"
                }}>
                  <span style={{ fontWeight: "800" }}>INOV</span>EXA
                </h2>
                <div className="erp-text-glow" style={{ 
                  background: "linear-gradient(90deg, #A855F7, #6366F1)",
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent",
                  fontSize: "14px", 
                  fontWeight: "600", 
                  letterSpacing: "8px", 
                  marginTop: "1px",
                  textTransform: "uppercase"
                }}>ERP</div>
              </div>
            </div>

            {/* TITRE DE CONNEXION */}
            <h1 className="login-rise lr-2" style={{ 
              fontSize: "42px",
              color: "white", 
              fontWeight: "800", 
              lineHeight: "1.2",
              marginBottom: "30px",
              letterSpacing: "-1.5px",
              marginTop: "20px"
            }}>
              {t.signIn}
            </h1>

            {/* FORMULAIRE */}
            {error && (
              <div role="alert" aria-live="assertive" style={{ 
                background: "rgba(239,68,68,0.1)", 
                border: "1px solid rgba(239,68,68,0.2)", 
                color: "#f87171", 
                padding: "12px", 
                borderRadius: "12px", 
                marginBottom: "20px", 
                fontSize: "13px" 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-rise lr-3" style={{ maxWidth: "495px", width: "100%" }}>
              <div style={{ marginBottom: "22px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "9px", fontSize: "13px", fontWeight: "500" }}>
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
                    background: "rgba(26, 26, 26, 0.8)",
                    border: "1px solid rgba(138, 43, 226, 0.2)", 
                    borderRadius: "12px", 
                    color: "white",
                    fontSize: "15.4px",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#A855F7";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(168, 85, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(138, 43, 226, 0.2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "30.8px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "9px", fontSize: "13px", fontWeight: "500" }}>
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
                    background: "rgba(26, 26, 26, 0.8)",
                    border: "1px solid rgba(138, 43, 226, 0.2)", 
                    borderRadius: "12px", 
                    color: "white",
                    fontSize: "15.4px",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#A855F7";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(168, 85, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(138, 43, 226, 0.2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    tabIndex={-1}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "4px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                  </div>
                  {capsLockOn && (
                    <p role="status" style={{ color: "#FBBF24", fontSize: "12.5px", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span aria-hidden="true">⇪</span> {t.capsLock}
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cta-button-shimmer"
                style={{
                  width: "100%",
                  padding: "17.6px",
                  fontSize: "16.5px",
                  borderRadius: "12px",
                  position: "relative",
                  zIndex: 2,
                  overflow: "hidden",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "white",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
                  boxShadow: "0 10px 30px rgba(168, 85, 247, 0.3)",
                  opacity: loading ? 0.7 : 1
                }}
              >
                <span style={{ position: "relative", zIndex: 3 }}>
                  {loading ? t.loggingIn : t.login}
                </span>
                <div className="shimmer-effect"></div>
              </button>
            </form>

            <div className="login-rise lr-4" style={{ marginTop: "33px" }}>
              <Link href="/" style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px",
                color: "rgba(255,255,255,0.5)", 
                fontSize: "14.3px",
                textDecoration: "none",
                transition: "all 0.3s ease"
              }}>
                <span style={{ fontSize: "17.6px" }}>←</span>
                <span>{t.backToHome}</span>
              </Link>
            </div>

            <p style={{ marginTop: "55px", color: "rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: "600" }}>
              © 2026 INOVEXA. {t.rights.toUpperCase()}
            </p>
          </div>

          {/* CÔTÉ DROIT - IMAGE */}
          <div className="login-hero" style={{ 
            width: "50.5%",
            position: "relative",
            height: "100vh",
            background: "#000000"
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: "80%", height: "80%", background: "radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)",
              filter: "blur(60px)", zIndex: 1
            }} />

            <img 
              src="/images/1.png" 
              alt="Inovexa Futuristic" 
              style={{ 
                width: "100%", height: "100%", objectFit: "cover",
                filter: "brightness(0.9) contrast(1.05)",
                maskImage: "linear-gradient(to right, transparent 0%, black 15%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%)",
                zIndex: 2, position: "relative"
              }}
            />
            
            <div style={{ 
              position: "absolute", top: 0, left: 0, width: "100px", 
              background: "linear-gradient(90deg, #000000 0%, transparent 100%)", 
              height: "100%", zIndex: 3 
            }} />
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .erp-text-glow {
          animation: textPulse 3s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)); }
        }

        .cta-button-shimmer {
          animation: buttonPulse 2s infinite;
          transition: all 0.3s ease;
          position: relative;
        }

        @keyframes buttonPulse {
          0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }

        .shimmer-effect {
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2.5s infinite;
        }

        @keyframes shimmer { 
          0% { left: -100%; } 
          100% { left: 100%; } 
        }

        .cta-button-shimmer:hover { 
          transform: translateY(-2px); 
          filter: brightness(1.1); 
        }

        .cta-button-shimmer:active {
          transform: translateY(0px);
          filter: brightness(0.95);
        }

        .ambient-glow {
          position: absolute; width: 100%; height: 100%;
          background: radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.08), transparent 40%);
          z-index: 0;
        }

        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-80vh) translateX(30px); opacity: 0; }
        }

        .particle {
          pointer-events: none;
        }

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

        input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(26, 26, 26, 0.95) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* === Animation d'entrée de la carte de connexion === */
        .login-card-enter {
          animation: cardEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardEnter {
          0%   { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* === Masquer l'image héro (1.png) sur mobile === */
        @media (max-width: 768px) {
          .login-hero { display: none !important; }
        }

        /* === Entrée en cascade de la colonne formulaire (desktop) === */
        .login-rise { animation: loginRise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .lr-1 { animation-delay: 0.08s; }
        .lr-2 { animation-delay: 0.20s; }
        .lr-3 { animation-delay: 0.34s; }
        .lr-4 { animation-delay: 0.48s; }
        @keyframes loginRise {
          0%   { opacity: 0; transform: translateY(22px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* === Respect de prefers-reduced-motion === */
        @media (prefers-reduced-motion: reduce) {
          .login-card-enter,
          .login-rise { animation: none !important; }
        }
      ` }} />
    </div>
  );
}