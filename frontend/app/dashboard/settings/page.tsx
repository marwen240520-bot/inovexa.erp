"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    const u = JSON.parse(userData || '{}');
    setUser(u);
    setProfile({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '' });
  }, []);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3001/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => setMessage(''), 3000);
      localStorage.setItem('user', JSON.stringify({ ...user, ...profile }));
    } catch(e) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '32px' }}>⚙️ Paramètres</h1>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', marginBottom: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '20px' }}>👤 Mon profil</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div><label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Prénom</label><input type="text" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white' }} /></div>
              <div><label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Nom</label><input type="text" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white' }} /></div>
              <div><label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Email</label><input type="email" value={profile.email} disabled style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#64748b' }} /></div>
              <button onClick={saveProfile} style={{ background: '#667eea', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
