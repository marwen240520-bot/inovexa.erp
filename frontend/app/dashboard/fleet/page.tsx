"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function FleetPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/fleet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setVehicles(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createVehicle = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchVehicles();
        setMessage('✅ Véhicule ajouté !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>🚛 Gestion de flotte</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos véhicules et chauffeurs</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { brand: '', model: '', plate: '', driver: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau véhicule
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {vehicles.map(v => (
              <div key={v.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚛</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{v.brand} {v.model}</h3>
                <div style={{ color: '#94a3b8', marginBottom: '16px' }}>Immatriculation: {v.plate}</div>
                <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Chauffeur: {v.driver || 'Non assigné'}</div>
                <div style={{ marginTop: '16px' }}>
                  <span style={{ background: v.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: v.status === 'active' ? '#10b981' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {v.status === 'active' ? 'En service' : 'En maintenance'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>🚛 Nouveau véhicule</h2>
              <input type="text" placeholder="Marque" value={modal.form.brand || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, brand: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Modèle" value={modal.form.model || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, model: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Immatriculation" value={modal.form.plate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, plate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Chauffeur" value={modal.form.driver || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, driver: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createVehicle} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
