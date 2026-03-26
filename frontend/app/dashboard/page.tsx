"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, invoices: 0, orders: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData || '{}'));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const [productsRes, invoicesRes, ordersRes] = await Promise.all([
        fetch('http://localhost:3001/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/orders', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const products = productsRes.ok ? await productsRes.json() : [];
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      
      setStats({
        products: products.length,
        invoices: invoices.length,
        orders: orders.length
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ background: '#111', padding: '20px 32px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Inovexa" style={{ width: '40px', height: '40px' }} />
          <h1 style={{ color: 'white', fontSize: '24px' }}>Inovexa ERP</h1>
        </div>
        <div>
          <span style={{ color: '#e2e8f0', marginRight: '20px' }}>👋 {user.firstName} {user.lastName}</span>
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} style={{ background: '#c33', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>Tableau de bord</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Bienvenue {user.firstName} !</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '40px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '24px', borderRadius: '20px', cursor: 'pointer' }} onClick={() => router.push('/dashboard/products')}>
            <div style={{ fontSize: '32px' }}>📦</div>
            <div>Produits</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.products}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', padding: '24px', borderRadius: '20px', cursor: 'pointer' }} onClick={() => router.push('/dashboard/invoices')}>
            <div style={{ fontSize: '32px' }}>💰</div>
            <div>Factures</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.invoices}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', padding: '24px', borderRadius: '20px', cursor: 'pointer' }} onClick={() => router.push('/dashboard/orders')}>
            <div style={{ fontSize: '32px' }}>📝</div>
            <div>Commandes</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.orders}</div>
          </div>
        </div>

        <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Accès rapide</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            <Link href="/dashboard/products" style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
              📦 Produits
            </Link>
            <Link href="/dashboard/invoices" style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
              💰 Factures
            </Link>
            <Link href="/dashboard/orders" style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
              📝 Commandes
            </Link>
            <Link href="/dashboard/ai" style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
              🤖 IA Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
