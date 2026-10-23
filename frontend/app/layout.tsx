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
  "--lg-veil": "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(5,4,10,0.45), rgba(5,4,10,0.88))",
  "--lg-card-solid": "rgba(16,10,30,0.74)",
  "--lg-bg-opacity": "0.7",
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
  "--lg-veil": "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(245,243,255,0.35), rgba(245,243,255,0.88))",
  "--lg-card-solid": "rgba(255,255,255,0.86)",
  "--lg-bg-opacity": "0.85",
  "--lg-warn": "#b45309",
};

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

const BG_DARK = "/images/2.png";
const BG_LIGHT = "/images/1.png";

const FX_BACKGROUNDS = ["rays", "spotlight", "horizon", "waves", "grain", "rings", "hexagons", "lines", "split", "bokeh", "stars", "nebula", "sunset", "ocean", "midnight", "shapes", "topo", "checker", "beam", "stripes"] as const;
type LoginBackground = "capture" | "aurora" | "grid" | "mesh" | "modules" | (typeof FX_BACKGROUNDS)[number];
const BACKGROUND: LoginBackground = "horizon";

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

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const MODULE_ICONS = [
  () => <svg {...ico}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>,
  () => <svg {...ico}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" /></svg>,
  () => <svg {...ico}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  () => <svg {...ico}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  () => <svg {...ico}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
  () => <svg {...ico}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  () => <svg {...ico}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  () => <svg {...ico}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
];
const MODULE_POS: React.CSSProperties[] = [
  { top: "12%", left: "8%", width: 92, transform: "rotate(-12deg)" },
  { top: "64%", left: "12%", width: 120, transform: "rotate(8deg)" },
  { top: "20%", right: "10%", width: 110, transform: "rotate(10deg)" },
  { top: "70%", right: "8%", width: 96, transform: "rotate(-8deg)" },
  { top: "42%", left: "3%", width: 70, transform: "rotate(4deg)" },
  { top: "46%", right: "3%", width: 74, transform: "rotate(-6deg)" },
  { top: "84%", left: "40%", width: 64, transform: "rotate(-4deg)" },
  { top: "4%", left: "44%", width: 60, transform: "rotate(6deg)" },
];

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

  useEffect(() => {
    try { router.prefetch("/dashboard", { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]); } catch { /* ignoré */ }
  }, [router]);

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
    <div
      className={"lg-root " + (isLight ? "lg-light" : "lg-dark")}
      style={themeVars}
    >
      {BACKGROUND === "capture" && (
        <>
          <div className="lg-bg" aria-hidden="true">
            <img key={isLight ? "light" : "dark"} src={isLight ? BG_LIGHT : BG_DARK} alt="" draggable={false} />
          </div>
          <div className="lg-veil" aria-hidden="true" />
        </>
      )}
      {BACKGROUND === "aurora" && (
        <div className="lg-aurora" aria-hidden="true"><span /><span /><span /></div>
      )}
      {BACKGROUND === "grid" && <div className="lg-grid" aria-hidden="true" />}
      {BACKGROUND === "mesh" && <div className="lg-mesh" aria-hidden="true" />}
      {(FX_BACKGROUNDS as readonly string[]).includes(BACKGROUND) && (
        <div className={"lg-fx lg-fx-" + BACKGROUND} aria-hidden="true"><span /></div>
      )}
      {BACKGROUND === "modules" && (
        <div className="lg-modules" aria-hidden="true">
          {MODULE_ICONS.map((Icon, i) => (
            <span key={i} style={MODULE_POS[i]}><Icon /></span>
          ))}
        </div>
      )}

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

      <main className="lg-center">
        <div className="lg-card lg-anim">
          <Link href="/" aria-label="Inovexa ERP" className="lg-brand">
            <span className="lg-logo">
              <img src="/images/logo.png" alt="" width={64} height={64} />
            </span>
            <span className="lg-brand-name">
              INOVEXA <span className="lg-brand-erp">ERP</span>
            </span>
          </Link>
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

const STYLES = `
  .lg-root {
    min-height: 100vh; min-height: 100dvh; position: relative; overflow-x: hidden;
    display: flex; flex-direction: column; align-items: center;
    font-family: var(--font-poppins), -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--lg-text);
    background-color: var(--lg-base);
    background-image:
      radial-gradient(ellipse 55% 50% at 15% 10%, var(--lg-glow-1), transparent 60%),
      radial-gradient(ellipse 50% 45% at 85% 95%, var(--lg-glow-2), transparent 60%);
  }
  .lg-bg { position: fixed; inset: -60px; z-index: 0; pointer-events: none; }
  .lg-bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(12px) saturate(1.1); opacity: var(--lg-bg-opacity); transform: scale(1.04); }
  .lg-veil { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: var(--lg-veil); }
  .lg-center, .lg-footer { position: relative; z-index: 1; }

  .lg-aurora { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .lg-aurora span { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .75; }
  .lg-aurora span:nth-child(1) { width: 55vw; height: 55vw; left: -12vw; top: -18vw; background: #7C3AED; animation: lgFloat1 18s ease-in-out infinite alternate; }
  .lg-aurora span:nth-child(2) { width: 45vw; height: 45vw; right: -10vw; bottom: -16vw; background: #4F46E5; animation: lgFloat2 22s ease-in-out infinite alternate; }
  .lg-aurora span:nth-child(3) { width: 30vw; height: 30vw; left: 55%; top: 10%; background: #C026D3; opacity: .45; animation: lgFloat3 26s ease-in-out infinite alternate; }
  .lg-light .lg-aurora span { opacity: .35; }
  @keyframes lgFloat1 { to { transform: translate(10vw, 8vh) scale(1.1); } }
  @keyframes lgFloat2 { to { transform: translate(-8vw, -10vh) scale(1.15); } }
  @keyframes lgFloat3 { to { transform: translate(-14vw, 22vh) scale(.9); } }

  .lg-grid { position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: radial-gradient(circle at 50% 45%, rgba(124,58,237,0.38), transparent 45%), radial-gradient(var(--lg-dot, rgba(196,181,253,0.22)) 1.2px, transparent 1.2px);
    background-size: 100% 100%, 26px 26px;
    -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%); mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%); }
  .lg-light .lg-grid { --lg-dot: rgba(109,40,217,0.22); }

  .lg-mesh { position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(at 12% 18%, rgba(124,58,237,0.75) 0, transparent 45%),
      radial-gradient(at 88% 12%, rgba(192,38,211,0.45) 0, transparent 40%),
      radial-gradient(at 80% 88%, rgba(79,70,229,0.7) 0, transparent 45%),
      radial-gradient(at 18% 92%, rgba(56,189,248,0.25) 0, transparent 40%); }
  .lg-light .lg-mesh { opacity: .5; }

  .lg-fx { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .lg-fx span { position: absolute; inset: 0; }
  .lg-light .lg-fx { opacity: .5; }
  .lg-fx-rays { background: conic-gradient(from 180deg at 50% -10%, transparent 0deg, rgba(168,85,247,0.28) 8deg, transparent 16deg, transparent 24deg, rgba(99,102,241,0.22) 32deg, transparent 40deg, transparent 150deg, rgba(168,85,247,0.25) 158deg, transparent 166deg, transparent 176deg, rgba(192,38,211,0.2) 184deg, transparent 192deg, transparent 320deg, rgba(99,102,241,0.25) 328deg, transparent 336deg, transparent 344deg, rgba(168,85,247,0.28) 352deg, transparent 360deg); -webkit-mask-image: linear-gradient(#000, transparent 85%); mask-image: linear-gradient(#000, transparent 85%); }
  .lg-fx-spotlight { background: radial-gradient(ellipse 40% 75% at 50% -5%, rgba(196,181,253,0.45), rgba(124,58,237,0.18) 45%, transparent 75%); }
  .lg-fx-horizon { background: linear-gradient(180deg, transparent 50%, rgba(124,58,237,0.25)); }
  .lg-fx-horizon span { top: 55%; inset-inline: -50%; bottom: -20%; background-image: linear-gradient(rgba(196,181,253,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,0.35) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(500px) rotateX(62deg); transform-origin: top; -webkit-mask-image: linear-gradient(transparent, #000 40%); mask-image: linear-gradient(transparent, #000 40%); }
  .lg-light .lg-fx-horizon { opacity: 1; background: linear-gradient(180deg, transparent 50%, rgba(167,139,250,0.3)); }
  .lg-light .lg-fx-horizon span { background-image: linear-gradient(rgba(109,40,217,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,0.28) 1px, transparent 1px); }
  .lg-fx-waves { background: radial-gradient(ellipse 90% 35% at 20% 108%, rgba(124,58,237,0.75), transparent 70%), radial-gradient(ellipse 80% 30% at 80% 112%, rgba(79,70,229,0.7), transparent 70%), radial-gradient(ellipse 120% 45% at 50% 120%, rgba(192,38,211,0.35), transparent 70%); }
  .lg-fx-grain { background: radial-gradient(ellipse 60% 55% at 30% 25%, rgba(124,58,237,0.55), transparent 65%), radial-gradient(ellipse 55% 50% at 75% 80%, rgba(79,70,229,0.45), transparent 65%); }
  .lg-fx-grain span { opacity: .22; mix-blend-mode: overlay; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }
  .lg-fx-rings { background: repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, rgba(168,85,247,0.16) 46px 47px); -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 20%, transparent 70%); mask-image: radial-gradient(circle at 50% 50%, #000 20%, transparent 70%); }
  .lg-fx-hexagons { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='98'><path d='M28 66L0 50V16L28 0l28 16v34L28 66zm0 32L0 82V66l28 16 28-16v16L28 98z' fill='none' stroke='%23A78BFA' stroke-opacity='0.22'/></svg>"), radial-gradient(ellipse 60% 55% at 50% 45%, rgba(124,58,237,0.3), transparent 70%); -webkit-mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%); mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%); }
  .lg-fx-lines { background-image: linear-gradient(rgba(196,181,253,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,0.09) 1px, transparent 1px), radial-gradient(ellipse 55% 50% at 50% 45%, rgba(124,58,237,0.35), transparent 70%); background-size: 44px 44px, 44px 44px, 100% 100%; }
  .lg-fx-split { background: linear-gradient(115deg, #2E1065 0%, #5B21B6 42%, transparent 42.1%), radial-gradient(ellipse 50% 50% at 85% 80%, rgba(79,70,229,0.35), transparent 70%); }
  .lg-fx-bokeh { background: radial-gradient(circle at 12% 22%, rgba(168,85,247,0.55) 0 50px, transparent 90px), radial-gradient(circle at 86% 18%, rgba(99,102,241,0.5) 0 70px, transparent 120px), radial-gradient(circle at 78% 78%, rgba(192,38,211,0.4) 0 40px, transparent 80px), radial-gradient(circle at 20% 82%, rgba(124,58,237,0.45) 0 80px, transparent 140px), radial-gradient(circle at 52% 8%, rgba(196,181,253,0.3) 0 24px, transparent 50px), radial-gradient(circle at 60% 92%, rgba(99,102,241,0.35) 0 30px, transparent 60px); filter: blur(14px); }
  .lg-fx-stars { background-color: transparent; background-image: radial-gradient(1.5px 1.5px at 8% 12%, #fff, transparent), radial-gradient(1px 1px at 22% 68%, #fff, transparent), radial-gradient(1.5px 1.5px at 35% 30%, #E9D5FF, transparent), radial-gradient(1px 1px at 48% 85%, #fff, transparent), radial-gradient(2px 2px at 62% 18%, #fff, transparent), radial-gradient(1px 1px at 74% 54%, #C4B5FD, transparent), radial-gradient(1.5px 1.5px at 88% 32%, #fff, transparent), radial-gradient(1px 1px at 93% 80%, #fff, transparent), radial-gradient(1px 1px at 15% 45%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 50%, #fff, transparent), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124,58,237,0.4), transparent 70%); background-size: 340px 340px, 280px 280px, 400px 400px, 300px 300px, 460px 460px, 260px 260px, 380px 380px, 320px 320px, 220px 220px, 500px 500px, 100% 100%; }
  .lg-light .lg-fx-stars { filter: invert(1) hue-rotate(180deg); }
  .lg-fx-nebula { background: conic-gradient(from 210deg at 65% 40%, rgba(124,58,237,0.55), rgba(192,38,211,0.4), rgba(79,70,229,0.5), rgba(56,189,248,0.2), rgba(124,58,237,0.55)); filter: blur(60px); transform: scale(1.2); }
  .lg-fx-sunset { background: linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.35) 45%, rgba(219,39,119,0.45) 78%, rgba(251,146,60,0.4) 100%); }
  .lg-fx-ocean { background: radial-gradient(ellipse 70% 60% at 20% 20%, rgba(79,70,229,0.6), transparent 65%), radial-gradient(ellipse 70% 60% at 85% 85%, rgba(13,148,136,0.45), transparent 65%), radial-gradient(ellipse 50% 40% at 70% 30%, rgba(56,189,248,0.2), transparent 70%); }
  .lg-fx-midnight { background: radial-gradient(ellipse 70% 60% at 50% 40%, rgba(46,16,101,0.55), transparent 75%); }
  .lg-fx-shapes span { inset: auto; width: 38vw; height: 38vw; left: -8vw; top: -10vw; border-radius: 22%; background: linear-gradient(135deg, #7C3AED, #4F46E5); transform: rotate(24deg); filter: blur(50px); opacity: .55; box-shadow: 70vw 55vw 0 -6vw #C026D3; }
  .lg-fx-topo { background: repeating-radial-gradient(ellipse 120% 80% at 30% 40%, transparent 0 22px, rgba(196,181,253,0.12) 22px 23px), repeating-radial-gradient(ellipse 100% 90% at 80% 70%, transparent 0 28px, rgba(165,180,252,0.1) 28px 29px); -webkit-mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 30%, transparent 100%); mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 30%, transparent 100%); }
  .lg-fx-checker { background-image: conic-gradient(rgba(168,85,247,0.08) 25%, transparent 0 50%, rgba(168,85,247,0.08) 0 75%, transparent 0), radial-gradient(ellipse 55% 50% at 50% 45%, rgba(124,58,237,0.32), transparent 70%); background-size: 64px 64px, 100% 100%; -webkit-mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%); mask-image: radial-gradient(ellipse 80% 75% at 50% 50%, #000 35%, transparent 100%); }
  .lg-fx-beam { background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(46,16,101,0.6), transparent 75%); }
  .lg-fx-beam span { inset: -50% -20%; background: linear-gradient(105deg, transparent 40%, rgba(196,181,253,0.18) 48%, rgba(168,85,247,0.3) 50%, rgba(196,181,253,0.18) 52%, transparent 60%); animation: lgBeam 9s ease-in-out infinite; }
  @keyframes lgBeam { 0% { transform: translateX(-45%); } 100% { transform: translateX(45%); } }
  .lg-fx-stripes { background-image: repeating-linear-gradient(135deg, rgba(196,181,253,0.07) 0 2px, transparent 2px 22px), radial-gradient(ellipse 60% 55% at 50% 45%, rgba(124,58,237,0.35), transparent 70%); }

  .lg-modules { position: fixed; inset: 0; z-index: 0; pointer-events: none; color: var(--lg-accent); }
  .lg-modules span { position: absolute; display: block; aspect-ratio: 1; opacity: .14; }
  .lg-modules svg { width: 100%; height: 100%; }
  @media (max-width: 520px) { .lg-modules span { opacity: .08; } }
  .lg-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .lg-root :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }

  .lg-topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 60; display: flex; align-items: center; justify-content: space-between; padding: max(env(safe-area-inset-top, 0px), 16px) clamp(16px, 2.2vw, 32px) 0; pointer-events: none; }
  .lg-topbar > * { pointer-events: auto; }
  .lg-back { display: inline-flex; align-items: center; gap: 8px; color: var(--lg-muted); font-size: 14px; font-weight: 500; text-decoration: none; padding: 8px 4px; transition: color .2s; }
  .lg-back:hover { color: var(--lg-text); }
  .lg-controls { display: flex; align-items: center; gap: 10px; }

  .lg-center { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(72px, 9vh, 96px) 16px clamp(16px, 3vh, 32px); }

  .lg-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; margin-bottom: clamp(18px, 3vh, 26px); }
  .lg-logo { width: clamp(50px, 7vh, 64px); height: clamp(50px, 7vh, 64px); flex-shrink: 0; border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); box-shadow: 0 0 28px rgba(168,85,247,0.4); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .lg-logo img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 0 8px rgba(138,43,226,0.6)); }
  .lg-brand-name { font-family: var(--font-orbitron), var(--font-poppins), sans-serif; font-weight: 800; font-size: clamp(17px, 2.3vh, 20px); letter-spacing: 2px; color: var(--lg-text); white-space: nowrap; }
  .lg-brand-erp { color: var(--lg-accent); font-size: 0.7em; letter-spacing: 4px; }

  .lg-card { width: 100%; max-width: 440px; padding: clamp(24px, 4vh, 36px) clamp(22px, 2.6vw, 36px) clamp(20px, 3.2vh, 28px); border-radius: 24px; background: var(--lg-card-solid); border: 1px solid var(--lg-card-border); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 40px 100px -30px var(--lg-card-shadow); }
  .lg-title { margin: 0 0 6px; text-align: left; font-size: clamp(24px, 3.4vh, 30px); font-weight: 700; letter-spacing: -0.02em; color: var(--lg-text); }
  .lg-welcome { margin: 0 0 clamp(18px, 3vh, 26px); text-align: left; font-size: 14.5px; line-height: 1.5; color: var(--lg-muted); }

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

  .lg-btn { width: 100%; height: clamp(48px, 6.2vh, 54px); display: flex; align-items: center; justify-content: center; gap: 10px; border: none; border-radius: 999px; background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%); color: #ffffff; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 40px rgba(168,85,247,0.45); transition: transform .15s ease, box-shadow .25s ease, opacity .2s; touch-action: manipulation; }
  .lg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 48px var(--lg-btn-shadow); }
  .lg-btn:active:not(:disabled) { transform: scale(0.98); }
  .lg-btn:disabled { opacity: .7; cursor: not-allowed; }
  .lg-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: lgSpin .8s linear infinite; }

  .lg-secure { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 12.5px; color: var(--lg-muted); }

  .lg-footer { margin: 0; padding: 0 16px max(env(safe-area-inset-bottom, 0px), clamp(14px, 2.6vh, 24px)); font-size: 12px; color: var(--lg-faint); text-align: center; }

  @media (max-width: 520px) {
    .lg-back span { display: none; }
    .lg-back { width: 40px; height: 40px; justify-content: center; border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); padding: 0; }
    .lg-card { border-radius: 20px; padding: 24px 20px 20px; }
    .lg-input { font-size: 16px; }
  }

  @keyframes lgFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes lgShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(3px); } 30%, 50%, 70% { transform: translateX(-5px); } 40%, 60% { transform: translateX(5px); } }
  @keyframes lgSpin { to { transform: rotate(360deg); } }
  .lg-anim { animation: lgFadeUp .6s cubic-bezier(0.22,1,0.36,1) both; }
  .lg-d1 { animation-delay: 120ms; }
  @media (prefers-reduced-motion: reduce) {
    .lg-anim, .lg-error, .lg-aurora span, .lg-fx-beam span { animation: none !important; }
    .lg-btn, .lg-input { transition: none !important; }
  }
`;