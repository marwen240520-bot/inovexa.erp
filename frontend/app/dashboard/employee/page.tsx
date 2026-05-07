"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, processing: 0, today: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'employee') {
        router.push('/dashboard');
      }
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        calculateStats(data);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const calculateStats = (orders) => {
    const today = new Date().toDateString();
    setStats({
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      processing: orders.filter(o => o.status === 'processing').length,
      today: orders.filter(o => new Date(o.createdAt).toDateString() === today).length
    });
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
        setMessage('✅ Commande créée avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(`❌ ${error.message || 'Erreur lors de la création'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { 
      setMessage('❌ Erreur de connexion au serveur');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3001/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchOrders();
      setMessage(`✅ Commande #${id} mise à jour`);
      setTimeout(() => setMessage(''), 2000);
    } catch(e) { console.error(e); }
  };

  const deleteOrder = async (id) => {
    if (confirm('⚠️ Supprimer cette commande ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      setMessage('✅ Commande supprimée');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#667eea';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return '⏳ En attente';
      case 'processing': return '🔄 En traitement';
      case 'delivered': return '✅ Livrée';
      case 'cancelled': return '❌ Annulée';
      default: return status;
    }
  };

  if (loading) {
    return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Chargement...</div>;
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Gestion des Commandes</h1>
              <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
                Bonjour {user?.name}, vous gérez les commandes de {user?.companyName || 'votre entreprise'}
              </p>
            </div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login'); }} style={{ background: '#c33', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>📦 Total commandes</div>
            <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>⏳ En attente</div>
            <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.pending}</div>
          </div>
          <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>🔄 En traitement</div>
            <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.processing}</div>
          </div>
          <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>✅ Livrées</div>
            <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.delivered}</div>
          </div>
          <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>📅 Aujourd'hui</div>
            <div style={{ fontSize: '28px', color: '#ec489a', fontWeight: 'bold' }}>{stats.today}</div>
          </div>
        </div>

        {message && (
          <div style={{ background: message.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`, color: message.includes('✅') ? '#10b981' : '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* Barre d'outils */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button 
            onClick={() => setModal({ open: true, form: { clientName: '', productName: '', quantity: 1, total: 0 } })}
            style={{ background: '#667eea', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>➕</span> Nouvelle commande
          </button>
        </div>

        {/* Tableau des commandes */}
        <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '16px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Quantité</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '16px', color: '#667eea', fontWeight: '500' }}>#{order.id}</td>
                    <td style={{ padding: '16px', color: 'white' }}>{order.clientName}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{order.productName}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8' }}>{order.quantity}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>{order.total} €</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{ 
                          background: '#1a1a1a', 
                          color: getStatusColor(order.status), 
                          border: `1px solid ${getStatusColor(order.status)}`,
                          borderRadius: '8px', 
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">⏳ En attente</option>
                        <option value="processing">🔄 En traitement</option>
                        <option value="delivered">✅ Livrée</option>
                        <option value="cancelled">❌ Annulée</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p>Aucune commande pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création */}
      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>📝 Nouvelle commande</h2>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Nom du client *</label>
              <input 
                type="text" 
                placeholder="Jean Dupont" 
                value={modal.form.clientName || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Nom du produit *</label>
              <input 
                type="text" 
                placeholder="Produit" 
                value={modal.form.productName || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Quantité *</label>
              <input 
                type="number" 
                placeholder="1" 
                value={modal.form.quantity || 1} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Total (€) *</label>
              <input 
                type="number" 
                placeholder="0" 
                value={modal.form.total || 0} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, total: parseFloat(e.target.value) } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createOrder} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                Créer la commande
              </button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
