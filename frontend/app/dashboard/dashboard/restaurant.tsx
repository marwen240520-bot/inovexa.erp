"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardRestaurant() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    lowStock: 0,
    employees: 0
  });
  const [todayOrdersList, setTodayOrdersList] = useState([]);
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
      const [ordersRes, productsRes, employeesRes] = await Promise.all([
        fetch('http://localhost:3001/orders/today', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/employees', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();
      const employees = await employeesRes.json();

      setStats({
        todayOrders: orders.length,
        todayRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        lowStock: products.filter(p => (p.quantity || 0) < 10).length,
        employees: employees.length
      });
      setTodayOrdersList(orders.slice(0, 5));
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
            <h1 style={{ color: 'white', fontSize: '28px' }}>🍽️ Dashboard Restaurant</h1>
            <p style={{ color: '#94a3b8' }}>Bonjour {user?.name}, bienvenue dans votre espace</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.todayOrders}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Commandes aujourd'hui</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.todayRevenue}€</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>CA du jour</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.lowStock}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Stock faible</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '28px', color: 'white', fontWeight: 'bold' }}>{stats.employees}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Personnel</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>📋 Commandes du jour</h2>
            {todayOrdersList.map(o => (
              <div key={o.id} style={{ padding: '12px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'white' }}>Table {o.tableNumber || 'À emporter'}</span>
                <span style={{ color: '#94a3b8' }}>{o.items?.length || 1} articles</span>
                <span style={{ color: '#10b981' }}>{o.total}€</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
