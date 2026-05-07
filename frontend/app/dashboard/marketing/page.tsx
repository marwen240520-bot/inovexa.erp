"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MarketingPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/marketing/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCampaigns(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createCampaign = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchCampaigns();
        setMessage('✅ Campagne créée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>📢 Marketing</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos campagnes marketing</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', type: '', budget: 0, startDate: '', endDate: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle campagne
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📢</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{c.name}</h3>
                <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Type: {c.type}</div>
                <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>{c.budget} €</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#666' }}>{new Date(c.startDate).toLocaleDateString()}</span>
                  <span style={{ color: '#666' }}>→</span>
                  <span style={{ color: '#666' }}>{new Date(c.endDate).toLocaleDateString()}</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <span style={{ color: c.status === 'active' ? '#10b981' : '#94a3b8' }}>
                    {c.status === 'active' ? 'Active' : 'Terminée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📢 Nouvelle campagne</h2>
              <input type="text" placeholder="Nom de la campagne" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.type || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, type: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner un type</option>
                <option value="Email">Email marketing</option>
                <option value="Réseaux sociaux">Réseaux sociaux</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Promotion">Promotion</option>
              </select>
              <input type="number" placeholder="Budget (€)" value={modal.form.budget || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, budget: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date de début" value={modal.form.startDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, startDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date de fin" value={modal.form.endDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, endDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createCampaign} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
