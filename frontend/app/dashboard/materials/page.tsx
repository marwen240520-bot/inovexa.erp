"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/materials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMaterials(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createMaterial = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchMaterials();
        setMessage('✅ Matériau ajouté !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>🏭 Gestion des matériaux</h1>
              <p style={{ color: '#94a3b8' }}>Suivez vos stocks de matériaux</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', unit: '', quantity: 0, price: 0, supplier: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau matériau
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Unité</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Quantité</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fournisseur</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{m.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{m.unit}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: m.quantity < 10 ? '#f87171' : '#94a3b8' }}>{m.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{m.price} €</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{m.supplier || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', marginRight: '5px', cursor: 'pointer' }}>
                        📦
                      </button>
                      <button style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>🏭 Nouveau matériau</h2>
              <input type="text" placeholder="Nom du matériau" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Unité (kg, m, L...)" value={modal.form.unit || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, unit: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Quantité" value={modal.form.quantity || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Prix unitaire (€)" value={modal.form.price || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, price: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Fournisseur" value={modal.form.supplier || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, supplier: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createMaterial} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
