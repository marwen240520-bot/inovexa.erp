"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPromotions(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createPromotion = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchPromotions();
        setMessage('✅ Promotion créée avec succès !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const deletePromotion = async (id) => {
    if (confirm('Supprimer cette promotion ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/promotions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPromotions();
      setMessage('Promotion supprimée');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>🏷️ Promotions</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos offres promotionnelles</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { code: '', description: '', discount: 0, validUntil: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle promotion
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {promotions.map(promo => (
              <div key={promo.id} style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>Code: {promo.code}</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{promo.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: 'bold' }}>-{promo.discount}%</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>Valable jusqu'au {new Date(promo.validUntil).toLocaleDateString()}</div>
                  <button onClick={() => deletePromotion(promo.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {promotions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', background: '#111', borderRadius: '20px', border: '1px solid #222' }}>
              <p style={{ color: '#666' }}>Aucune promotion active</p>
            </div>
          )}
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>🏷️ Nouvelle promotion</h2>
              <input type="text" placeholder="Code promo" value={modal.form.code || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, code: e.target.value.toUpperCase() } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Description" value={modal.form.description || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Réduction (%)" value={modal.form.discount || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, discount: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date d'expiration" value={modal.form.validUntil || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, validUntil: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createPromotion} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
