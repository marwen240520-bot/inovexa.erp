"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkflowBuilder from '@/components/WorkflowBuilder';

export default function AdminAdvanced() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    const u = JSON.parse(userData || '{}');
    setUser(u);
    if (u.role !== 'admin') router.push('/dashboard');
    setLoading(false);
  }, []);

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ background: '#111', padding: '20px 32px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" style={{ width: '50px' }} />
          <h1 style={{ color: 'white', fontSize: '24px' }}>⚙️ Administration avancée</h1>
        </div>
        <div>
          <span style={{ color: '#e2e8f0', marginRight: '20px' }}>👋 {user?.firstName} {user?.lastName}</span>
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} style={{ background: '#c33', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #222' }}>
            <button onClick={() => setActiveTab('workflows')} style={{ padding: '12px 24px', background: activeTab === 'workflows' ? '#667eea' : 'transparent', color: activeTab === 'workflows' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              ⚡ Automatisations
            </button>
            <button onClick={() => setActiveTab('modules')} style={{ padding: '12px 24px', background: activeTab === 'modules' ? '#667eea' : 'transparent', color: activeTab === 'modules' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              📦 Modules
            </button>
            <button onClick={() => setActiveTab('integrations')} style={{ padding: '12px 24px', background: activeTab === 'integrations' ? '#667eea' : 'transparent', color: activeTab === 'integrations' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🔌 Intégrations
            </button>
            <button onClick={() => setActiveTab('security')} style={{ padding: '12px 24px', background: activeTab === 'security' ? '#667eea' : 'transparent', color: activeTab === 'security' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🔒 Sécurité
            </button>
          </div>

          {activeTab === 'workflows' && <WorkflowBuilder />}

          {activeTab === 'modules' && (
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>📦 Modules disponibles</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                {['Finance', 'Stock', 'Ventes', 'Achats', 'RH', 'Logistique', 'IA', 'Analytics'].map(module => (
                  <div key={module} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white' }}>{module}</span>
                    <button style={{ background: '#667eea', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Activer</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>🔌 Intégrations</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
                {[
                  { name: 'Stripe', icon: '💳', status: 'non connecté' },
                  { name: 'SendGrid', icon: '📧', status: 'non connecté' },
                  { name: 'Shopify', icon: '🛒', status: 'non connecté' },
                  { name: 'WooCommerce', icon: '🛍️', status: 'non connecté' }
                ].map(integration => (
                  <div key={integration.name} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '24px', marginRight: '12px' }}>{integration.icon}</span>
                      <span style={{ color: 'white' }}>{integration.name}</span>
                      <span style={{ color: '#64748b', marginLeft: '12px', fontSize: '12px' }}>({integration.status})</span>
                    </div>
                    <button style={{ background: '#667eea', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Connecter</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>🔒 Sécurité</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white' }}>🔐 Authentification à deux facteurs (2FA)</span>
                  <button style={{ background: '#667eea', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Activer</button>
                </div>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white' }}>📊 Journal d'audit</span>
                  <button style={{ background: '#667eea', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Voir logs</button>
                </div>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white' }}>🔑 Politique de mot de passe</span>
                  <button style={{ background: '#667eea', color: 'white', padding: '6px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Configurer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
