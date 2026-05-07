"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SupplyPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        fetch('http://localhost:3001/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/warehouses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (warehousesRes.ok) setWarehouses(await warehousesRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const lowStockProducts = products.filter(p => (p.quantity || 0) < 10);

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ color: '#667eea', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Retour au tableau de bord
          </Link>
          <h1 style={{ color: 'white', fontSize: '28px', marginTop: '16px' }}>📦 Supply Chain & Stocks</h1>
          <p style={{ color: '#94a3b8' }}>Optimisation des stocks, approvisionnements et traçabilité complète multi-dépôts</p>
        </div>

        {lowStockProducts.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '12px' }}>⚠️ Alertes stock ({lowStockProducts.length})</h3>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ef444420' }}>
                <span style={{ color: 'white' }}>{p.name}</span>
                <span style={{ color: '#ef4444' }}>Stock: {p.quantity || 0}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {warehouses.map(wh => (
            <div key={wh.id} style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏭</div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>{wh.name}</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>{wh.location}</p>
              <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <span style={{ color: '#10b981' }}>Stock total: {products.filter(p => p.warehouseId === wh.id).reduce((s, p) => s + (p.quantity || 0), 0)} unités</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
