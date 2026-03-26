"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirection selon le rôle
        if (data.user.role === 'admin') {
          console.log('Admin connecté, redirection vers /admin/clients');
          router.push('/admin/clients');
        } else {
          console.log('Utilisateur connecté, redirection vers /dashboard');
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111', padding: '48px', borderRadius: '32px', width: '450px', border: '1px solid #222' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo.png" alt="Inovexa" style={{ width: '80px', marginBottom: '20px' }} />
          <h1 style={{ color: 'white', fontSize: '28px' }}>Inovexa ERP</h1>
          <p style={{ color: '#94a3b8' }}>Connectez-vous à votre espace</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marwen2405@gmail.com"
            style={{ width: '100%', padding: '14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: 'white', marginBottom: '16px' }}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: 'white', marginBottom: '24px' }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
