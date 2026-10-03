"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const t = translations[language as keyof typeof translations] || translations.fr;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

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
    <div className={"lg-root" + (mounted ? " mounted" : "")}>
      <div className="lg-panel">
        <div className="lg-panel-inner">
          <Link href="/" className="lg-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            {t.backToHome}
          </Link>

          <div className="lg-card">
            <div className="lg-brand">
              <div className="lg-logo-tile"><img src="/images/logo.png" alt="Inovexa" /></div>
              <div className="lg-brand-text">
                <span className="lg-brand-name"><b>INOV</b>EXA</span>
                <span className="lg-brand-erp">ERP</span>
              </div>
            </div>

            <h1 className="lg-title">{t.signIn}</h1>

            {error && (
              <div className="lg-error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate={false}>
              <label className="lg-label" htmlFor="lg-email">{t.email}</label>
              <div className="lg-field">
                <svg className="lg-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><polyline points="22 7 12 13 2 7" /></svg>
                <input
                  id="lg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  required
                />
              </div>

              <label className="lg-label" htmlFor="lg-password">{t.password}</label>
              <div className="lg-field">
                <svg className="lg-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  id="lg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={detectCapsLock}
                  onKeyUp={detectCapsLock}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: "46px" }}
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>

              {capsLockOn && (
                <div className="lg-caps">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><polyline points="5 12 12 5 19 12" /></svg>
                  {t.capsLock}
                </div>
              )}

              <button type="submit" className="lg-submit" disabled={loading}>
                {loading ? (<><span className="lg-spinner" />{t.loggingIn}</>) : t.login}
              </button>
            </form>
          </div>

          <div className="lg-copy">© {new Date().getFullYear()} INOVEXA. {t.rights}</div>
        </div>
      </div>

      <div className="lg-visual">
        <div className="lg-visual-blob lg-visual-blob-1" />
        <div className="lg-visual-blob lg-visual-blob-2" />
        <div className="lg-visual-frame">
          <img src="/images/1.png" alt="Inovexa Dashboard" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

const STYLES = `
  .lg-root {
    --lg-primary: #4f46e5; --lg-secondary: #7c3aed;
    --lg-bg: var(--theme-background, #f3f4f6); --lg-surface: var(--theme-surface, #ffffff);
    --lg-text: var(--theme-text, #111827); --lg-muted: var(--theme-text-secondary, #6b7280);
    --lg-border: var(--theme-border, #e5e7eb);
    min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--lg-surface); color: var(--lg-text);
    opacity: 0; transition: opacity .5s ease;
  }
  .lg-root.mounted { opacity: 1; }

  .lg-panel { display: flex; align-items: center; justify-content: center; padding: 32px clamp(20px, 5vw, 64px);
    background: radial-gradient(circle at 0% 0%, rgba(99,102,241,.10), transparent 45%), var(--lg-surface); }
  .lg-panel-inner { width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 22px; }

  .lg-back { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; font-size: 13px; font-weight: 500; color: var(--lg-muted); text-decoration: none; padding: 6px 10px 6px 6px; border-radius: 10px; transition: color .2s, background .2s; }
  .lg-back:hover { color: var(--lg-primary); background: #eef2ff; }

  .lg-card { background: var(--lg-surface); border: 1px solid var(--lg-border); border-radius: 24px; padding: clamp(24px, 4vw, 36px); box-shadow: 0 20px 50px rgba(17,24,39,.08), 0 2px 6px rgba(17,24,39,.04); }

  .lg-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
  .lg-logo-tile { width: 56px; height: 56px; border-radius: 16px; padding: 4px; background: linear-gradient(135deg, #1e1b4b, #4338ca); box-shadow: 0 8px 22px rgba(67,56,202,.28); flex-shrink: 0; }
  .lg-logo-tile img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .lg-brand-text { display: flex; flex-direction: column; line-height: 1.1; font-family: 'Orbitron', 'Poppins', sans-serif; }
  .lg-brand-name { font-size: 22px; letter-spacing: 3px; font-weight: 300; }
  .lg-brand-name b { font-weight: 800; }
  .lg-brand-erp { font-size: 11px; letter-spacing: 7px; font-weight: 700; margin-top: 4px; background: linear-gradient(90deg, var(--lg-secondary), var(--lg-primary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

  .lg-title { margin: 0 0 22px; font-size: clamp(22px, 3vw, 28px); font-weight: 700; letter-spacing: -.4px; line-height: 1.25; }

  .lg-error { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; margin-bottom: 18px; border-radius: 12px; font-size: 13px; font-weight: 500; line-height: 1.4; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
  .lg-error svg { flex-shrink: 0; margin-top: 1px; }

  .lg-label { display: block; margin: 0 0 7px; font-size: 13px; font-weight: 600; color: var(--lg-text); }
  .lg-field { position: relative; margin-bottom: 18px; }
  .lg-field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; transition: color .2s; }
  .lg-field input { width: 100%; box-sizing: border-box; padding: 14px 16px 14px 44px; font: 400 15px 'Poppins', sans-serif; color: var(--lg-text); background: #f9fafb; border: 1.5px solid var(--lg-border); border-radius: 12px; outline: none; transition: border-color .2s, box-shadow .2s, background .2s; }
  .lg-field input::placeholder { color: #9ca3af; }
  .lg-field input:hover { border-color: #d1d5db; }
  .lg-field input:focus { background: #fff; border-color: var(--lg-primary); box-shadow: 0 0 0 4px rgba(79,70,229,.14); }
  .lg-field:focus-within .lg-field-icon { color: var(--lg-primary); }
  .lg-eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: #9ca3af; border-radius: 10px; cursor: pointer; transition: color .2s, background .2s; }
  .lg-eye:hover { color: var(--lg-primary); background: #eef2ff; }

  .lg-caps { display: inline-flex; align-items: center; gap: 6px; margin: -6px 0 16px; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; }

  .lg-submit { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px; margin-top: 6px; font: 600 15px 'Poppins', sans-serif; color: #fff; border: none; border-radius: 12px; cursor: pointer; background: linear-gradient(135deg, var(--lg-primary), var(--lg-secondary)); box-shadow: 0 10px 26px rgba(79,70,229,.32); transition: transform .2s, box-shadow .2s, filter .2s, opacity .2s; }
  .lg-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(79,70,229,.42); filter: brightness(1.05); }
  .lg-submit:active:not(:disabled) { transform: translateY(0); }
  .lg-submit:disabled { opacity: .7; cursor: not-allowed; }
  .lg-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: lgSpin .7s linear infinite; }
  @keyframes lgSpin { to { transform: rotate(360deg); } }

  .lg-copy { text-align: center; font-size: 12px; color: var(--lg-muted); }

  /* Visuel droite */
  .lg-visual { position: relative; display: flex; align-items: center; justify-content: center; padding: 40px; overflow: hidden;
    background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #fae8ff 100%); }
  .lg-visual-blob { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
  .lg-visual-blob-1 { width: 420px; height: 420px; top: -120px; right: -100px; background: rgba(99,102,241,.35); }
  .lg-visual-blob-2 { width: 380px; height: 380px; bottom: -120px; left: -80px; background: rgba(217,70,239,.25); }
  .lg-visual-frame { position: relative; width: 100%; max-width: 640px; aspect-ratio: 1044 / 935; padding: 10px; border-radius: 28px; overflow: hidden; background: rgba(255,255,255,.7); box-shadow: 0 30px 70px rgba(79,70,229,.28), 0 6px 18px rgba(17,24,39,.08); }
  .lg-visual-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; display: block; }

  @media (max-width: 960px) {
    .lg-root { grid-template-columns: 1fr; }
    .lg-visual { display: none; }
    .lg-panel { min-height: 100vh; background: radial-gradient(circle at 100% 0%, rgba(168,85,247,.12), transparent 50%), radial-gradient(circle at 0% 0%, rgba(99,102,241,.12), transparent 50%), var(--lg-bg); }
  }
  @media (max-width: 480px) {
    .lg-panel { padding: 20px 16px; align-items: flex-start; }
    .lg-card { border-radius: 20px; }
    .lg-logo-tile { width: 48px; height: 48px; border-radius: 14px; }
    .lg-brand-name { font-size: 19px; }
  }
  @media (prefers-reduced-motion: reduce) { .lg-root, .lg-spinner { transition: none !important; animation: none !important; } }
`;
