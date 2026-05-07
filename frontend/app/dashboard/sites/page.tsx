"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/sites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSites(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createSite = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchSites();
        setMessage('✅ Chantier ajouté !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const updateProgress = async (id, progress) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/sites/${id}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ progress })
    });
    fetchSites();
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>🏗️ Gestion des chantiers</h1>
              <p style={{ color: '#94a3b8' }}>Suivez l'avancement de vos chantiers</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', location: '', startDate: '', endDate: '', budget: 0 } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau chantier
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {sites.map(site => (
              <div key={site.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{site.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>📍 {site.location}</p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Avancement</span>
                    <span style={{ color: '#10b981', fontSize: '12px' }}>{site.progress || 0}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${site.progress || 0}%`, background: '#10b981', height: '100%' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '10px' }}>Début</div>
                    <div style={{ color: 'white', fontSize: '12px' }}>{new Date(site.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '10px' }}>Fin prévue</div>
                    <div style={{ color: 'white', fontSize: '12px' }}>{new Date(site.endDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '10px' }}>Budget</div>
                    <div style={{ color: '#f59e0b', fontSize: '12px' }}>{site.budget} €</div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={site.progress || 0} onChange={(e) => updateProgress(site.id, parseInt(e.target.value))} style={{ width: '100%', marginTop: '8px' }} />
              </div>
            ))}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>🏗️ Nouveau chantier</h2>
              <input type="text" placeholder="Nom du chantier" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Adresse / Localisation" value={modal.form.location || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, location: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date de début" value={modal.form.startDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, startDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date de fin" value={modal.form.endDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, endDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Budget (€)" value={modal.form.budget || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, budget: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createSite} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
