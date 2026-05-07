"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MultiStockPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/warehouses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setWarehouses(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const transferStock = async (fromId, toId, productId, quantity) => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/warehouses/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fromId, toId, productId, quantity })
    });
    fetchWarehouses();
    setMessage('✅ Transfert effectué');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🏭 Gestion Multi-dépôts</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Gérez vos stocks sur plusieurs sites</p>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {warehouses.map(wh => (
              <div key={wh.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{wh.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{wh.address}</p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>📦 Produits en stock</div>
                  {wh.products?.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                      <span style={{ color: 'white' }}>{p.name}</span>
                      <span style={{ color: '#10b981' }}>{p.quantity} unités</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedWarehouse(wh)} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Transférer depuis ce dépôt
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
