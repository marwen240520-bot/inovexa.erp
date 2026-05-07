"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function LoginPage() {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const flagCodes: { [key: string]: string } = {
    en: "us",
    fr: "fr",
    es: "es"
  };

  const getLoginText = () => {
    switch(language) {
      case 'fr': return { email: "Email", password: "Mot de passe", login: "Se connecter", loading: "Connexion...", back: "Retour à l'accueil", error: "Identifiants incorrects", serverError: "Erreur serveur", accountsInfo: "Accès restreint aux administrateurs", welcome: "Bienvenue", subtitle: "Accédez à votre espace INOVEXA" };
      case 'es': return { email: "Email", password: "Contraseña", login: "Conectarse", loading: "Cargando...", back: "Volver", error: "Credenciales incorrectas", serverError: "Error del servidor", accountsInfo: "Acceso restringido a administradores", welcome: "Bienvenido", subtitle: "Acceda a su espace INOVEXA" };
      default: return { email: "Email", password: "Password", login: "Sign In", loading: "Loading...", back: "Back Home", error: "Invalid credentials", serverError: "Server error", accountsInfo: "Admin access only", welcome: "Welcome", subtitle: "Access your INOVEXA space" };
    }
  };

  const t = getLoginText();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // ⭐ CORRECTION: Redirection selon le rôle
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else if (data.user.role === 'transporteur') {
          router.push('/transporteur/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(t.error);
      }
    } catch { 
      setError(t.serverError); 
    }
    finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#050507", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      position: "relative", 
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        zIndex: 1
      }} />

      {[...Array(12)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${15 + Math.random() * 10}s`
        }} />
      ))}

      {/* --- SÉLECTEUR DE LANGUE --- */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100 }}>
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="glass-btn"
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(102, 126, 234, 0.3)", borderRadius: "25px",
            color: "white", cursor: "pointer", fontSize: "11px", fontWeight: "700"
          }}
        >
          <img src={`https://flagcdn.com/w20/${flagCodes[language]}.png`} width="16" alt={language} />
          <span>{language.toUpperCase()}</span>
        </button>

        {showLanguageMenu && (
          <div style={{
            position: "absolute", top: "40px", right: 0, background: "rgba(10, 10, 12, 0.95)",
            border: "1px solid rgba(118, 75, 162, 0.3)", borderRadius: "10px",
            minWidth: "130px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            animation: "slideIn 0.2s ease-out"
          }}>
            {Object.keys(flagCodes).map((lang) => (
              <button key={lang} onClick={() => { changeLanguage(lang); setShowLanguageMenu(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 15px",
                  background: language === lang ? "rgba(102, 126, 234, 0.15)" : "transparent",
                  border: "none", color: "white", cursor: "pointer", fontSize: "12px", textAlign: "left"
                }}>
                <img src={`https://flagcdn.com/w20/${flagCodes[lang]}.png`} width="18" alt={lang} />
                {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Español'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- LOGIN CARD --- */}
      <div className="login-card" style={{ 
        background: "rgba(13, 13, 18, 0.8)", 
        backdropFilter: "blur(25px)", 
        borderRadius: "24px", 
        padding: isMobile ? "30px 20px" : "40px",
        width: isMobile ? "85%" : "360px",
        border: "1px solid rgba(118, 75, 162, 0.3)", 
        boxShadow: "0 20px 50px -15px rgba(0, 0, 0, 0.7)", 
        zIndex: 10,
        position: "relative"
      }}>
        
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)" }} />

        <Link href="/" style={{ textDecoration: "none", color: "#667eea", fontSize: "10px", fontWeight: "800", letterSpacing: "1px", display: "inline-block" }}>
          ← {t.back.toUpperCase()}
        </Link>

        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "170px", filter: "drop-shadow(0 0 12px rgba(102, 126, 234, 0.4))"}} />
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: "900", letterSpacing: "-1px", marginBottom: "8px" }}>{t.welcome}</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{t.subtitle}</p>
        </div>

        {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#f87171", padding: "10px", borderRadius: "10px", marginBottom: "18px", fontSize: "11px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "8px", fontSize: "9px", fontWeight: "800", letterSpacing: "1px" }}>{t.email.toUpperCase()}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white", outline: "none", boxSizing: "border-box", fontSize: "13px", transition: "0.3s" }} 
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              required 
            />
          </div>
          
          <div style={{ marginBottom: "25px" }}>
            <label style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "8px", fontSize: "9px", fontWeight: "800", letterSpacing: "1px" }}>{t.password.toUpperCase()}</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white", outline: "none", boxSizing: "border-box", fontSize: "13px" }} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "16px" }}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="btn-login" style={{
            width: "100%", padding: "15px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "900", cursor: "pointer",
            boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)", transition: "0.4s"
          }}>
            {loading ? t.loading : t.login.toUpperCase()}
          </button>
        </form>

        <div style={{ marginTop: "25px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textAlign: "center", margin: 0 }}>
            🛡️ {t.accountsInfo}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
        
        .particle {
          position: absolute; width: 1.5px; height: 1.5px; background: white; border-radius: 50%; opacity: 0.2;
          animation: floatParticle linear infinite; z-index: 1;
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.4; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }

        .btn-login:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5); filter: brightness(1.1); }
        .btn-login:active { transform: translateY(0); }
        .glass-btn:hover { background: rgba(255, 255, 255, 0.1) !important; border-color: #667eea !important; }
      ` }} />
    </div>
  );
}