"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PurchasingPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch('http://localhost:3001/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/purchase-orders', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (ordersRes.ok) setPurchaseOrders(await ordersRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createOrder = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchData();
        setMessage('✅ Commande fournisseur créée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const receiveOrder = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/purchase-orders/${id}/receive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
    setMessage('✅ Commande reçue');
    setTimeout(() => setMessage(''), 2000);
  };

  const evaluateSupplier = async (id, rating) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/suppliers/${id}/evaluate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating })
    });
    fetchData();
    setMessage('✅ Évaluation enregistrée');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ color: '#667eea', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Retour au tableau de bord
          </Link>
          <h1 style={{ color: 'white', fontSize: '28px', marginTop: '16px' }}>🛒 Achats & Approvisionnements</h1>
          <p style={{ color: '#94a3b8' }}>Optimisation des achats, gestion fournisseurs et réduction des coûts</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #222' }}>
          <button onClick={() => setActiveTab('orders')} style={{ padding: '12px 24px', background: activeTab === 'orders' ? '#667eea' : 'transparent', border: 'none', color: activeTab === 'orders' ? 'white' : '#94a3b8', cursor: 'pointer' }}>
            📋 Commandes ({purchaseOrders.filter(o => o.status !== 'received').length})
          </button>
          <button onClick={() => setActiveTab('suppliers')} style={{ padding: '12px 24px', background: activeTab === 'suppliers' ? '#667eea' : 'transparent', border: 'none', color: activeTab === 'suppliers' ? 'white' : '#94a3b8', cursor: 'pointer' }}>
            🏭 Fournisseurs ({suppliers.length})
          </button>
          <button onClick={() => setModal({ open: true, form: { type: activeTab === 'orders' ? 'order' : 'supplier' } })} style={{ marginLeft: 'auto', background: '#667eea', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + {activeTab === 'orders' ? 'Nouvelle commande' : 'Nouveau fournisseur'}
          </button>
        </div>

        {message && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {purchaseOrders.map(order => {
              const supplier = suppliers.find(s => s.id === order.supplierId);
              return (
                <div key={order.id} style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#667eea', fontWeight: 'bold' }}>PO-{order.id}</span>
                      <span style={{ color: 'white', marginLeft: '12px' }}>{supplier?.name}</span>
                    </div>
                    <span style={{ background: order.status === 'received' ? 'rgba(16,185,129,0.2)' : order.status === 'shipped' ? 'rgba(245,158,11,0.2)' : 'rgba(102,126,234,0.2)', color: order.status === 'received' ? '#10b981' : order.status === 'shipped' ? '#f59e0b' : '#667eea', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                      {order.status === 'received' ? 'Reçue' : order.status === 'shipped' ? 'Expédiée' : 'En attente'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>Quantité</div>
                      <div style={{ color: 'white' }}>{order.quantity} unités</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>Prix unitaire</div>
                      <div style={{ color: '#10b981' }}>{order.unitPrice} €</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>Total</div>
                      <div style={{ color: 'white' }}>{order.total} €</div>
                    </div>
                  </div>
                  {order.status !== 'received' && (
                    <button onClick={() => receiveOrder(order.id)} style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      ✅ Réceptionner la commande
                    </button>
                  )}
                </div>
              );
            })}
            {purchaseOrders.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune commande</p>}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {suppliers.map(s => (
              <div key={s.id} style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>{s.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{s.email} • {s.phone}</div>
                  </div>
                  <div style={{ background: s.rating >= 4 ? 'rgba(16,185,129,0.2)' : s.rating >= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', padding: '4px 12px', borderRadius: '20px' }}>
                    <span style={{ color: s.rating >= 4 ? '#10b981' : s.rating >= 3 ? '#f59e0b' : '#ef4444' }}>
                      {'⭐'.repeat(Math.floor(s.rating || 0))}{s.rating ? ` ${s.rating}/5` : 'Non évalué'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => evaluateSupplier(s.id, r)} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '6px 12px', color: '#94a3b8', cursor: 'pointer' }}>
                      {r}★
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {suppliers.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucun fournisseur</p>}
          </div>
        )}
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}>
              {modal.form.type === 'order' ? '🛒 Nouvelle commande' : '🏭 Nouveau fournisseur'}
            </h2>
            {modal.form.type === 'order' && (
              <>
                <select value={modal.form.supplierId || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, supplierId: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="number" placeholder="Quantité" value={modal.form.quantity || 1} onChange={e => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
                <input type="number" placeholder="Prix unitaire (€)" value={modal.form.unitPrice || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, unitPrice: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              </>
            )}
            {modal.form.type === 'supplier' && (
              <>
                <input type="text" placeholder="Nom du fournisseur" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
                <input type="email" placeholder="Email" value={modal.form.email || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
                <input type="tel" placeholder="Téléphone" value={modal.form.phone || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              </>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={modal.form.type === 'order' ? createOrder : createSupplier} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
