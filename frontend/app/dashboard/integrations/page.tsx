"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function IntegrationsPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState([]);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchWebhooks();
    setApiKey('inovexa_' + Math.random().toString(36).substring(2, 15));
  }, []);

  const fetchWebhooks = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/ai/webhooks', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWebhooks(await res.json());
    } catch(e) { console.error(e); }
  };

  const integrations = [
    { name: 'Slack', icon: '💬', description: 'Notifications en temps réel', status: 'available' },
    { name: 'Zapier', icon: '⚡', description: '5000+ applications connectables', status: 'available' },
    { name: 'Stripe', icon: '💳', description: 'Paiements et facturation', status: 'connected' },
    { name: 'Shopify', icon: '🛍️', description: 'E-commerce', status: 'available' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '32px' }}>🔌 Intégrations</h1>

          {/* API Key */}
          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', marginBottom: '32px' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>🔑 API Publique</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="text" value={apiKey} readOnly style={{ flex: 1, padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white' }} />
              <button onClick={() => navigator.clipboard.writeText(apiKey)} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Copier</button>
            </div>
          </div>

          {/* Intégrations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
            {integrations.map(i => (
              <div key={i.name} style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{i.icon}</div>
                <h3 style={{ color: 'white', marginBottom: '4px' }}>{i.name}</h3>
                <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>{i.description}</p>
                <button style={{ width: '100%', padding: '8px', background: i.status === 'connected' ? '#10b981' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {i.status === 'connected' ? '✅ Connecté' : '🔌 Connecter'}
                </button>
              </div>
            ))}
          </div>

          {/* Webhooks */}
          <h2 style={{ color: 'white', fontSize: '20px', marginTop: '32px', marginBottom: '20px' }}>🔔 Webhooks</h2>
          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            {webhooks.map(w => (
              <div key={w.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'white' }}>{w.name}</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>{w.url}</div>
                </div>
                <span style={{ color: w.isActive ? '#10b981' : '#64748b' }}>{w.isActive ? '● Actif' : '○ Inactif'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
