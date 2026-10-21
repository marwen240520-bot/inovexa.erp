"use client";
import React from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageMenu from "@/components/ui/LanguageMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";

// ─── Couleurs ──────────────────────────────────────────────────────────────────
// Même style « violet immersif » que la page d'accueil, avec une variante claire.

const LG_DARK: Record<string, string> = {
  "--lg-base": "#0A0614",
  "--lg-glow-1": "rgba(124,58,237,0.5)",
  "--lg-glow-2": "rgba(79,70,229,0.4)",
  "--lg-text": "#ffffff",
  "--lg-muted": "rgba(233,227,255,0.7)",
  "--lg-label": "rgba(233,227,255,0.85)",
  "--lg-faint": "rgba(233,227,255,0.55)",
  "--lg-card": "rgba(255,255,255,0.06)",
  "--lg-card-border": "rgba(255,255,255,0.14)",
  "--lg-card-shadow": "rgba(0,0,0,0.7)",
  "--lg-chip-bg": "rgba(255,255,255,0.08)",
  "--lg-chip-border": "rgba(255,255,255,0.18)",
  "--lg-input-bg": "rgba(0,0,0,0.25)",
  "--lg-input-border": "rgba(255,255,255,0.16)",
  "--lg-placeholder": "rgba(233,227,255,0.4)",
  "--lg-autofill": "#140d24",
  "--lg-accent": "#C4B5FD",
  "--lg-btn-bg": "#ffffff",
  "--lg-btn-text": "#2E1065",
  "--lg-btn-shadow": "rgba(167,139,250,0.45)",
  "--lg-error": "#fca5a5",
  "--lg-warn": "#FBBF24",
};
const LG_LIGHT: Record<string, string> = {
  "--lg-base": "#F5F3FF",
  "--lg-glow-1": "rgba(167,139,250,0.45)",
  "--lg-glow-2": "rgba(129,140,248,0.3)",
  "--lg-text": "#1E1035",
  "--lg-muted": "#4B4466",
  "--lg-label": "#2E2550",
  "--lg-faint": "#6B6485",
  "--lg-card": "rgba(255,255,255,0.78)",
  "--lg-card-border": "rgba(109,40,217,0.16)",
  "--lg-card-shadow": "rgba(76,29,149,0.25)",
  "--lg-chip-bg": "rgba(255,255,255,0.85)",
  "--lg-chip-border": "rgba(109,40,217,0.2)",
  "--lg-input-bg": "#ffffff",
  "--lg-input-border": "rgba(109,40,217,0.22)",
  "--lg-placeholder": "#9a93b3",
  "--lg-autofill": "#ffffff",
  "--lg-accent": "#6D28D9",
  "--lg-btn-bg": "#2E1065",
  "--lg-btn-text": "#ffffff",
  "--lg-btn-shadow": "rgba(109,40,217,0.35)",
  "--lg-error": "#b91c1c",
  "--lg-warn": "#b45309",
};

/** Variables de couleur du login pour n'importe quel thème */
function buildLgVars(themeId: string, theme: any): Record<string, string> {
  if (themeId === "dark") return LG_DARK;
  if (themeId === "light") return LG_LIGHT;
  const light = isLightTheme(theme);
  return { ...(light ? LG_LIGHT : LG_DARK), "--lg-base": theme.background };
}

// ─── Traductions ───────────────────────────────────────────────────────────────

const translations = {
  fr: {
    backToHome: "Retour à l'accueil",
    remember: "Se souvenir de mon e-mail",
    secure: "Connexion sécurisée",
    welcome: "Accédez à votre espace de gestion.",
    signIn: "Connectez-vous",
    email: "Email",
    password: "Mot de passe",
    login: "Se connecter",
    loggingIn: "Connexion...",
    invalidCredentials: "Email ou mot de passe incorrect",
    serverError: "Erreur de connexion au serveur",
    tooMany: "Trop de tentatives. Réessayez plus tard.",
    emailPlaceholder: "exemple@inovexa.com",
    passwordPlaceholder: "Mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    capsLock: "Verr. Maj activée",
    rights: "Tous droits réservés.",
  },
  en: {
    backToHome: "Back to home",
    remember: "Remember my email",
    secure: "Secure sign-in",
    welcome: "Access your management workspace.",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    login: "Sign in",
    loggingIn: "Signing in...",
    invalidCredentials: "Invalid email or password",
    serverError: "Connection error",
    tooMany: "Too many attempts. Please try again later.",
    emailPlaceholder: "example@inovexa.com",
    passwordPlaceholder: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    capsLock: "Caps Lock is on",
    rights: "All rights reserved.",
  },
  es: {
    backToHome: "Volver al inicio",
    remember: "Recordar mi correo",
    secure: "Conexión segura",
    welcome: "Acceda a su espacio de gestión.",
    signIn: "Inicie sesión",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    invalidCredentials: "Correo o contraseña incorrectos",
    serverError: "Error de conexión",
    tooMany: "Demasiados intentos. Inténtelo más tarde.",
    emailPlaceholder: "ejemplo@inovexa.com",
    passwordPlaceholder: "Contraseña",
    showPassword: "Mostrar la contraseña",
    hidePassword: "Ocultar la contraseña",
    capsLock: "Bloq Mayús activado",
    rights: "Todos los derechos reservados.",
  },
};

const LOGO_FONT = "'Orbitron', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Icônes ────────────────────────────────────────────────────────────────────

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IconMail = () => <svg width="18" height="18" {...svgProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
const IconLock = () => <svg width="18" height="18" {...svgProps}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
const IconEye = () => <svg width="20" height="20" {...svgProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconEyeOff = () => <svg width="20" height="20" {...svgProps}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const IconShieldCheck = () => <svg width="14" height="14" {...svgProps} strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
const IconArrowLeft = () => <svg width="16" height="16" {...svgProps} strokeWidth={2.2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const IconArrowRight = () => <svg width="17" height="17" {...svgProps} strokeWidth={2.5}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
const IconAlert = () => <svg width="16" height="16" {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme, themeId } = useTheme();
  const isLight = isLightTheme(theme);
  const themeVars = useMemo(() => buildLgVars(themeId, theme) as React.CSSProperties, [themeId, theme]);
  const t = translations[language as keyof typeof translations] || translations.fr;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Précharge le tableau de bord pendant la saisie : il s'ouvre sans attente après la connexion
  useEffect(() => {
    try { router.prefetch("/dashboard", { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]); } catch { /* ignoré */ }
  }, [router]);

  // Pré-remplit l'e-mail mémorisé lors d'une précédente connexion
  useEffect(() => {
    try {
      const saved = localStorage.getItem("remember_email");
      if (saved) setEmail(saved);
      else if (localStorage.getItem("remember_email_off")) setRemember(false);
    } catch { /* stockage indisponible */ }
  }, []);

  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({} as any));

      if (res.ok) {
        try {
          if (remember) { localStorage.setItem("remember_email", email.trim().toLowerCase()); localStorage.removeItem("remember_email_off"); }
          else { localStorage.removeItem("remember_email"); localStorage.setItem("remember_email_off", "1"); }
        } catch { /* stockage indisponible */ }
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") router.push("/admin/clients");
        else if (data.user.role === "transporteur") router.push("/transporteur/shipments");
        else router.push("/dashboard");
      } else {
        const serverMsg = Array.isArray(data?.message) ? data.message[0] : data?.message;
        if (res.status === 429) setError(serverMsg || t.tooMany);
        else if (res.status >= 500) setError(t.serverError);
        else setError(serverMsg || t.invalidCredentials);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className={"lg-root " + (isLight ? "lg-light" : "lg-dark")} style={themeVars}>
      {/* ── Barre du haut : retour à gauche, thème + langue à droite ── */}
      <div className="lg-topbar">
        <Link href="/" className="lg-back">
          <IconArrowLeft />
          <span>{t.backToHome}</span>
        </Link>
        <div className="lg-controls">
          <ThemeToggle size={40} />
          <LanguageMenu />
        </div>
      </div>

      {/* ── Contenu centré ── */}
      <main className="lg-center">
        <Link href="/" aria-label="Inovexa ERP" className="lg-brand lg-anim">
          <span className="lg-logo">
            <img src="/images/logo.png" alt="" width={96} height={96} />
          </span>
          <span className="lg-brand-name">
            INOVEXA <span className="lg-brand-erp">ERP</span>
          </span>
        </Link>

        <div className="lg-card lg-anim lg-d1">
          <h1 className="lg-title">{t.signIn}</h1>
          <p className="lg-welcome">{t.welcome}</p>

          {error && (
            <div className="lg-error" role="alert" aria-live="assertive">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate={false}>
            <div className="lg-field">
              <label htmlFor="lg-email" className="lg-label">{t.email}</label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon"><IconMail /></span>
                <input
                  id="lg-email"
                  className="lg-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  spellCheck={false}
                  autoFocus
                  aria-invalid={!!error}
                  required
                />
              </div>
            </div>

            <div className="lg-field">
              <label htmlFor="lg-password" className="lg-label">{t.password}</label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon"><IconLock /></span>
                <input
                  id="lg-password"
                  className="lg-input lg-input-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  aria-invalid={!!error}
                  onKeyDown={detectCapsLock}
                  onKeyUp={detectCapsLock}
                  required
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {capsLockOn && (
                <p role="status" className="lg-caps"><span aria-hidden="true">⇪</span> {t.capsLock}</p>
              )}
            </div>

            <label className="lg-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              {t.remember}
            </label>

            <button className="lg-btn" type="submit" disabled={loading} aria-busy={loading}>
              {loading && <span className="lg-spinner" aria-hidden="true" />}
              <span>{loading ? t.loggingIn : t.login}</span>
              {!loading && <IconArrowRight />}
            </button>

            <div className="lg-secure">
              <IconShieldCheck />
              {t.secure}
            </div>
          </form>
        </div>
      </main>

      <p className="lg-footer" suppressHydrationWarning>© {year} Inovexa. {t.rights}</p>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Tailles fluides (clamp) : la carte tient dans l'écran à 100 % de zoom, de 1280×720 à 1920×1080.

const STYLES = `
  .lg-root {
    min-height: 100vh; min-height: 100dvh; position: relative; overflow-x: hidden;
    display: flex; flex-direction: column; align-items: center;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; color: var(--lg-text);
    background-color: var(--lg-base);
    background-image:
      radial-gradient(ellipse 55% 50% at 15% 10%, var(--lg-glow-1), transparent 60%),
      radial-gradient(ellipse 50% 45% at 85% 95%, var(--lg-glow-2), transparent 60%);
  }
  .lg-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .lg-root :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }

  /* ── Barre du haut ── */
  .lg-topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 60; display: flex; align-items: center; justify-content: space-between; padding: max(env(safe-area-inset-top, 0px), 16px) clamp(16px, 2.2vw, 32px) 0; pointer-events: none; }
  .lg-topbar > * { pointer-events: auto; }
  .lg-back { display: inline-flex; align-items: center; gap: 8px; color: var(--lg-muted); font-size: 14px; font-weight: 500; text-decoration: none; padding: 8px 4px; transition: color .2s; }
  .lg-back:hover { color: var(--lg-text); }
  .lg-controls { display: flex; align-items: center; gap: 10px; }

  /* ── Centre ── */
  .lg-center { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(72px, 9vh, 96px) 16px clamp(16px, 3vh, 32px); }

  /* ── Marque ── */
  .lg-brand { display: flex; flex-direction: column; align-items: center; gap: clamp(8px, 1.4vh, 14px); text-decoration: none; margin-bottom: clamp(16px, 3vh, 30px); }
  .lg-logo { width: clamp(64px, 10vh, 96px); height: clamp(64px, 10vh, 96px); border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); box-shadow: 0 0 40px rgba(168,85,247,0.45); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .lg-logo img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(138,43,226,0.6)); }
  .lg-brand-name { font-family: ${LOGO_FONT}; font-weight: 800; font-size: clamp(18px, 2.6vh, 24px); letter-spacing: 2px; color: var(--lg-text); white-space: nowrap; }
  .lg-brand-erp { color: var(--lg-accent); font-size: 0.7em; letter-spacing: 4px; }

  /* ── Carte ── */
  .lg-card { width: 100%; max-width: 460px; padding: clamp(24px, 4vh, 36px) clamp(22px, 2.6vw, 36px) clamp(20px, 3.2vh, 28px); border-radius: 24px; background: var(--lg-card); border: 1px solid var(--lg-card-border); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 40px 100px -30px var(--lg-card-shadow); }
  .lg-title { margin: 0 0 6px; text-align: center; font-size: clamp(24px, 3.4vh, 30px); font-weight: 700; letter-spacing: -0.02em; color: var(--lg-text); }
  .lg-welcome { margin: 0 0 clamp(18px, 3vh, 26px); text-align: center; font-size: 14.5px; line-height: 1.5; color: var(--lg-muted); }

  .lg-error { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 14px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--lg-error); font-size: 13.5px; animation: lgShake .5s ease; }
  .lg-error svg { flex-shrink: 0; }

  .lg-field { margin-bottom: clamp(12px, 2vh, 18px); }
  .lg-label { display: block; margin-bottom: 7px; font-size: 13px; font-weight: 500; color: var(--lg-label); }
  .lg-input-wrap { position: relative; }
  .lg-input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); display: flex; color: var(--lg-muted); pointer-events: none; }
  .lg-input { width: 100%; height: clamp(46px, 6vh, 52px); padding: 0 16px 0 46px; border-radius: 12px; border: 1px solid var(--lg-input-border); background: var(--lg-input-bg); color: var(--lg-text); font-family: inherit; font-size: 15.5px; outline: none; -webkit-appearance: none; transition: border-color .2s, box-shadow .2s; }
  .lg-input-pass { padding-right: 50px; }
  .lg-input::placeholder { color: var(--lg-placeholder); }
  .lg-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
  .lg-input[aria-invalid="true"] { border-color: rgba(239,68,68,0.55); }
  .lg-input:-webkit-autofill, .lg-input:-webkit-autofill:hover, .lg-input:-webkit-autofill:focus { -webkit-text-fill-color: var(--lg-text); -webkit-box-shadow: 0 0 0 1000px var(--lg-autofill) inset; transition: background-color 5000s ease-in-out 0s; }
  .lg-eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 10px; color: var(--lg-muted); cursor: pointer; }
  .lg-eye:hover { color: var(--lg-text); }
  .lg-caps { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; font-size: 12.5px; color: var(--lg-warn); }

  .lg-remember { display: flex; align-items: center; gap: 10px; min-height: 28px; margin: 2px 0 clamp(16px, 2.6vh, 22px); font-size: 13.5px; color: var(--lg-label); cursor: pointer; }
  .lg-remember input { width: 18px; height: 18px; accent-color: #8b5cf6; cursor: pointer; }

  .lg-btn { width: 100%; height: clamp(48px, 6.2vh, 54px); display: flex; align-items: center; justify-content: center; gap: 10px; border: none; border-radius: 999px; background: var(--lg-btn-bg); color: var(--lg-btn-text); font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 40px var(--lg-btn-shadow); transition: transform .15s ease, box-shadow .25s ease, opacity .2s; touch-action: manipulation; }
  .lg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 48px var(--lg-btn-shadow); }
  .lg-btn:active:not(:disabled) { transform: scale(0.98); }
  .lg-btn:disabled { opacity: .7; cursor: not-allowed; }
  .lg-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: lgSpin .8s linear infinite; }

  .lg-secure { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 12.5px; color: var(--lg-muted); }

  .lg-footer { margin: 0; padding: 0 16px max(env(safe-area-inset-bottom, 0px), clamp(14px, 2.6vh, 24px)); font-size: 12px; color: var(--lg-faint); text-align: center; }

  /* ── Mobile ── */
  @media (max-width: 520px) {
    .lg-back span { display: none; }
    .lg-back { width: 40px; height: 40px; justify-content: center; border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); padding: 0; }
    .lg-card { border-radius: 20px; padding: 24px 20px 20px; }
    .lg-input { font-size: 16px; } /* évite le zoom automatique sur iPhone */
  }

  /* ── Animations ── */
  @keyframes lgFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes lgShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(3px); } 30%, 50%, 70% { transform: translateX(-5px); } 40%, 60% { transform: translateX(5px); } }
  @keyframes lgSpin { to { transform: rotate(360deg); } }
  .lg-anim { animation: lgFadeUp .6s cubic-bezier(0.22,1,0.36,1) both; }
  .lg-d1 { animation-delay: 120ms; }
  @media (prefers-reduced-motion: reduce) {
    .lg-anim, .lg-error { animation: none !important; }
    .lg-btn, .lg-input { transition: none !important; }
  }
`;