"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardPME() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    clientCount: 0,
    productCount: 0,
    pendingInvoices: 0
  });
  const [recentSales, setRecentSales] = useState([]);
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
      const [financeRes, clientsRes, productsRes, salesRes] = await Promise.all([
        fetch('http://localhost:3001/finance/summary', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/clients', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/sales', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const finance = await financeRes.json();
      const clients = await clientsRes.json();
      const products = await productsRes.json();
      const sales = await salesRes.json();

      setStats({
        revenue: finance.revenue || 0,
        expenses: finance.expenses || 0,
        profit: finance.profit || 0,
        clientCount: Array.isArray(clients) ? clients.length : 0,
        productCount: Array.isArray(products) ? products.length : 0,
        pendingInvoices: finance.pendingInvoices || 0
      });
      setRecentSales(Array.isArray(sales) ? sales.slice(0, 5) : []);
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
            <h1 style={{ color: 'white', fontSize: '28px' }}>📊 Dashboard PME</h1>
            <p style={{ color: '#94a3b8' }}>Bonjour {user?.name}, bienvenue sur votre tableau de bord</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>💰 Chiffre d'affaires</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.revenue.toLocaleString()} €</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>📉 Dépenses</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.expenses.toLocaleString()} €</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>📈 Bénéfice</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.profit.toLocaleString()} €</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>🧾 Factures impayées</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.pendingInvoices}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>👥 Clients</div>
              <div style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>{stats.clientCount}</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>📦 Produits</div>
              <div style={{ fontSize: '24px', color: 'white', fontWeight: 'bold' }}>{stats.productCount}</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>📋 Dernières ventes</h2>
            {recentSales.map(s => (
              <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'white' }}>{s.product?.name || 'Produit'}</span>
                <span style={{ color: '#94a3b8' }}>{s.quantity} x {s.total}€</span>
                <span style={{ color: '#10b981' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
