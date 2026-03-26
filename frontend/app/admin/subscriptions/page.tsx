"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AdminSubscriptions() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [plans, setPlans] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    const u = JSON.parse(userData || '{}');
    setUser(u);
    if (u.role !== 'admin') router.push('/dashboard');
    fetchClients();
    fetchPlans();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const users = await res.json();
        setClients(users.filter(u => u.role === 'user'));
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/subscription/plans', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPlans(await res.json());
    } catch(e) { console.error(e); }
  };

  const updateSubscription = async (userId, action, duration = 30) => {
    const token = localStorage.getItem('token');
    let url = '';
    switch(action) {
      case 'pause': url = `http://localhost:3001/subscription/pause/${userId}`; break;
      case 'activate': url = `http://localhost:3001/subscription/activate/${userId}`; break;
      case 'renew': url = `http://localhost:3001/subscription/renew/${userId}`; break;
    }
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ duration }) });
    if (res.ok) {
      setMessage(`Action effectuée avec succès`);
      setTimeout(() => setMessage(''), 3000);
      fetchClients();
    }
  };

  const getStatusBadge = (status, endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const isExpired = end < now && status === 'active';
    
    if (isExpired) return <span style={{ background: '#c33', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>Expiré</span>;
    if (status === 'active') return <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>Actif</span>;
    if (status === 'paused') return <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>En pause</span>;
    return <span style={{ background: '#64748b', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>{status}</span>;
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1 }}>
        <div style={{ padding: '20px 32px', background: '#111', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '24px' }}>👑 Gestion des Abonnements</h1>
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} style={{ background: '#c33', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Déconnexion</button>
        </div>

        <div style={{ padding: '32px' }}>
          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Plan</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date fin</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  '\''
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{c.firstName} {c.lastName}  '\''
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.email}  '\''
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#667eea', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>
                        {c.subscriptionPlan || 'basic'}
                      </span>
                     '\''
                    <td style={{ padding: '12px' }}>{getStatusBadge(c.subscriptionStatus, c.subscriptionEndDate)} '\''
                    <td style={{ padding: '12px', color: '#94a3b8' }}>
                      {c.subscriptionEndDate ? new Date(c.subscriptionEndDate).toLocaleDateString() : '-'}
                     '\''
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {c.subscriptionStatus === 'active' && (
                          <button onClick={() => updateSubscription(c.id, 'pause')} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Pause</button>
                        )}
                        {c.subscriptionStatus === 'paused' && (
                          <button onClick={() => updateSubscription(c.id, 'activate')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Activer</button>
                        )}
                        <button onClick={() => updateSubscription(c.id, 'renew', 30)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Renouveler</button>
                      </div>
                     '\''
                   '\''
                ))}
              </tbody>
            表'
          </div>
        </div>
      </div>
    </div>
  );
}
