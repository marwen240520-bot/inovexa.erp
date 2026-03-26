"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createOrder = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchOrders();
        setMessage('Commande créée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const deleteOrder = async (id) => {
    if (confirm('Supprimer cette commande ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      setMessage('Commande supprimée');
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
            <h1 style={{ color: 'white', fontSize: '28px' }}>📝 Gestion des Commandes</h1>
            <button onClick={() => setModal({ open: true, form: { clientName: '', total: 0, status: 'pending' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle commande
            </button>
          </div>

          {message && (
            <div style={{ background: message.includes('créée') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.includes('créée') ? '#10b981' : '#ef4444'}`, color: message.includes('créée') ? '#10b981' : '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{o.clientName || 'Client'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{o.total}€</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: o.status === 'delivered' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: o.status === 'delivered' ? '#10b981' : '#f59e0b', padding: '4px 12px', borderRadius: '20px' }}>
                        {o.status === 'delivered' ? 'Livrée' : o.status === 'processing' ? 'En traitement' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => deleteOrder(o.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune commande</p>}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '400px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Nouvelle commande</h2>
              <input type="text" placeholder="Nom du client" value={modal.form.clientName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Total (€)" value={modal.form.total || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, total: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createOrder} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
