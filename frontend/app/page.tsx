"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (userData) setUser(JSON.parse(userData));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <nav style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Inovexa" style={{ width: '40px', height: '40px' }} />
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Inovexa ERP</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <Link href={user?.role === 'admin' ? "/admin/clients" : "/dashboard"} style={{ background: '#667eea', color: 'white', padding: '8px 20px', borderRadius: '40px', textDecoration: 'none' }}>
                {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
              </Link>
              <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} style={{ background: 'transparent', color: '#f87171', padding: '8px 16px', border: '1px solid #f87171', borderRadius: '40px', cursor: 'pointer' }}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/auth/login" style={{ background: '#667eea', color: 'white', padding: '8px 24px', borderRadius: '40px', textDecoration: 'none' }}>
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <img src="/logo.png" alt="Inovexa" style={{ width: '120px', height: '120px', marginBottom: '30px' }} />
        <h1 style={{ fontSize: '64px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '20px' }}>
          Inovexa ERP
        </h1>
        <p style={{ fontSize: '20px', color: '#94a3b8', marginBottom: '40px' }}>
          La nouvelle génération d'ERP avec intelligence artificielle
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {isLoggedIn ? (
            <Link href={user?.role === 'admin' ? "/admin/clients" : "/dashboard"} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '14px 32px', borderRadius: '40px', textDecoration: 'none' }}>
              Accéder à mon espace
            </Link>
          ) : (
            <Link href="/auth/login" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '14px 32px', borderRadius: '40px', textDecoration: 'none' }}>
              Commencer maintenant
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
