"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const token = localStorage.getItem('token');
    try {
      const [catsRes, itemsRes] = await Promise.all([
        fetch('http://localhost:3001/menu/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/menu/items', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createItem = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchMenu();
        setMessage('✅ Plat ajouté au menu !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>📋 Carte / Menu</h1>
              <p style={{ color: '#94a3b8' }}>Gérez les plats de votre restaurant</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', description: '', price: 0, categoryId: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau plat
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#f59e0b', marginBottom: '16px' }}>{cat.name}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {items.filter(i => i.categoryId === cat.id).map(item => (
                  <div key={item.id} style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ color: 'white', margin: 0 }}>{item.name}</h3>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{item.price}€</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📋 Nouveau plat</h2>
              <input type="text" placeholder="Nom du plat" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <textarea placeholder="Description" value={modal.form.description || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '80px' }} />
              <input type="number" placeholder="Prix (€)" value={modal.form.price || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, price: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.categoryId || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, categoryId: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createItem} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
