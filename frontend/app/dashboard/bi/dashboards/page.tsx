"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function BIDashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [stats, setStats] = useState({ sales: 0, orders: 0, clients: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchDashboards();
    fetchStats();
  }, []);

  const fetchDashboards = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/bi/dashboards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDashboards(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const [salesRes, ordersRes, clientsRes] = await Promise.all([
        fetch('http://localhost:3001/sales', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/clients', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const sales = await salesRes.json();
      const orders = await ordersRes.json();
      const clients = await clientsRes.json();
      setStats({
        sales: Array.isArray(sales) ? sales.reduce((s, i) => s + (i.total || 0), 0) : 0,
        orders: Array.isArray(orders) ? orders.length : 0,
        clients: Array.isArray(clients) ? clients.length : 0
      });
    } catch(e) { console.error(e); }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📊 Tableaux de bord personnalisables</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Créez et personnalisez vos tableaux de bord</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.sales.toLocaleString()} €</div>
              <div style={{ color: '#94a3b8' }}>Chiffre d'affaires</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.orders}</div>
              <div style={{ color: '#94a3b8' }}>Commandes</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.clients}</div>
              <div style={{ color: '#94a3b8' }}>Clients</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {dashboards.map(db => (
              <div key={db.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', cursor: 'pointer' }} onClick={() => setSelectedDashboard(db)}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{db.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '12px' }}>{db.description}</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {db.widgets?.map((w, i) => (
                    <span key={i} style={{ background: '#1a1a1a', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', color: '#94a3b8' }}>{w}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
