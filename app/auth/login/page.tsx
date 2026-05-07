"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState('fr');

  const t = {
    fr: { title: "Connexion", subtitle: "Connectez-vous à votre espace", email: "Email", password: "Mot de passe", login: "Se connecter", loading: "Connexion...", back: "Retour à l'accueil", error: "Email ou mot de passe incorrect", serverError: "Erreur de connexion", accountsInfo: "Les comptes sont créés par l'administrateur uniquement" },
    en: { title: "Login", subtitle: "Sign in to your account", email: "Email", password: "Password", login: "Sign in", loading: "Signing in...", back: "Back to home", error: "Invalid email or password", serverError: "Connection error", accountsInfo: "Accounts are created by administrator only" }
  }[];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push(data.user.role === 'admin' ? '/admin' : data.user.role === 'transporteur' ? '/logistics' : '/dashboard');
      } else setError(t.error);
    } catch (err) { setError(t.serverError); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)", borderRadius: "50%", top: "-200px", right: "-100px", animation: "float 20s ease-in-out infinite" }}></div>
      <div style={{ position: "absolute", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%)", borderRadius: "50%", bottom: "-150px", left: "-100px", animation: "float 15s ease-in-out infinite reverse" }}></div>
      
      <div style={{ background: "rgba(17,17,17,0.95)", backdropFilter: "blur(20px)", borderRadius: "32px", padding: "40px", width: "450px", maxWidth: "90%", border: "1px solid rgba(102,126,234,0.3)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", position: "relative", zIndex: 10, animation: "fadeInUp 0.6s ease-out" }}>
        
        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px" }}>
          <button onClick={() => setLang('fr')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "4px 8px", borderRadius: "6px", opacity: lang === 'fr' ? 1 : 0.5 }}>🇫🇷 FR</button>
          <button onClick={() => setLang('en')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "4px 8px", borderRadius: "6px", opacity: lang === 'en' ? 1 : 0.5 }}>🇬🇧 EN</button>
        </div>

        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "32px", color: "#94a3b8", fontSize: "14px", transition: "color 0.3s" }}>← {t.back}</Link>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "64px", height: "64px", marginBottom: "16px", borderRadius: "16px" }} />
          <h1 style={{ color: "white", fontSize: "28px", marginBottom: "8px" }}>Inovexa ERP</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>{t.subtitle}</p>
        </div>

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#f87171", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "14px" }}>{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "14px 16px", background: "#1a1a1a", border: "2px solid #333", borderRadius: "12px", color: "white", fontSize: "16px", transition: "all 0.3s ease", outline: "none" }} required />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "14px" }}>{t.password}</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "14px 16px", background: "#1a1a1a", border: "2px solid #333", borderRadius: "12px", color: "white", fontSize: "16px", paddingRight: "45px", outline: "none" }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}>{showPassword ? '👁️' : '👁️‍🗨️'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {loading && <span style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }}></span>}
            {loading ? t.loading : t.login}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", padding: "16px", background: "#1a1a1a", borderRadius: "12px" }}>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>🔐 {t.accountsInfo}</p>
          <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>Contactez votre administrateur pour obtenir vos identifiants</p>
        </div>
      </div>
      
      <style>{
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      }</style>
    </div>
  );
}
