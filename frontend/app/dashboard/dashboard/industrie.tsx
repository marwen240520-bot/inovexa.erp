"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardIndustrie() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    productionOrders: 0,
    inProgress: 0,
    completed: 0,
    qualityPassRate: 0,
    stockValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    if (userData) setUser(JSON.parse(userData));
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [productionRes, qualityRes, productsRes] = await Promise.all([
        fetch('http://localhost:3001/production/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/quality/inspections', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/products', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const production = await productionRes.json();
      const quality = await qualityRes.json();
      const products = await productsRes.json();

      const passed = quality.filter(i => i.status === 'passed').length;
      const total = quality.length;

      setStats({
        productionOrders: production.length,
        inProgress: production.filter(p => p.status === 'in_progress').length,
        completed: production.filter(p => p.status === 'completed').length,
        qualityPassRate: total > 0 ? (passed / total * 100) : 0,
        stockValue: products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0)
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px' }}>🏭 Dashboard Industrie</h1>
            <p style={{ color: '#94a3b8' }}>Bonjour {user?.name}, suivez votre production</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.productionOrders}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Ordres de fabrication</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.inProgress}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>En cours</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.completed}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Terminés</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.qualityPassRate.toFixed(1)}%</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Taux conformité</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>📊 Valeur du stock</h2>
            <div style={{ fontSize: '36px', color: '#10b981', fontWeight: 'bold' }}>{stats.stockValue.toLocaleString()} €</div>
            <div style={{ height: '8px', background: '#222', borderRadius: '4px', marginTop: '16px' }}>
              <div style={{ width: `${Math.min((stats.completed / stats.productionOrders) * 100, 100)}%`, height: '100%', background: '#667eea', borderRadius: '4px' }}></div>
            </div>
            <p style={{ color: '#94a3b8', marginTop: '12px' }}>Progression de production: {stats.productionOrders > 0 ? ((stats.completed / stats.productionOrders) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
