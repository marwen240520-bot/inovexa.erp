"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ToastProvider';

export default function ' + $page + 'Page() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    setUser(JSON.parse(userData || '{}'));
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/' + $pageName + '`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setItems(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createItem = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/' + $pageName + '`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(modal.form)
    });
    if (res.ok) {
      setModal({ open: false, form: {} });
      fetchItems();
      showToast.success('Élément ajouté');
    }
  };

  const deleteItem = async (id) => {
    if (confirm('Supprimer ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/' + $pageName + '/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchItems();
      showToast.success('Supprimé');
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '28px' }}>📋 Gestion des ' + $page + '</h1>
          <button onClick={() => setModal({ open: true, form: {} })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>+ Ajouter</button>
        </div>

        <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '12px', color: 'white' }}>{item.name || item.id}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{item.description || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => deleteItem(item.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune donnée. Cliquez sur "Ajouter" pour commencer.</p>}
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}>Ajouter</h2>
            <input type="text" placeholder="Nom" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            <input type="text" placeholder="Description" value={modal.form.description || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '24px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createItem} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
