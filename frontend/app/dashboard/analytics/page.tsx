"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalProducts: 0, totalStock: 0, stockValue: 0,
    lowStockCount: 0, totalEmployees: 0, totalSalary: 0, totalInvoices: 0,
    paidInvoices: 0, pendingInvoices: 0, growthRate: 0, predictedNextMonth: 0
  });
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const endpoints = ['products', 'invoices', 'employees'];
      const newStats = { totalRevenue: 0, totalProducts: 0, totalStock: 0, stockValue: 0,
        lowStockCount: 0, totalEmployees: 0, totalSalary: 0, totalInvoices: 0,
        paidInvoices: 0, pendingInvoices: 0, growthRate: 0, predictedNextMonth: 0 };
      
      for (const ep of endpoints) {
        const res = await fetch(`http://localhost:3001/${ep}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list = await res.json();
          if (ep === 'products') {
            newStats.totalProducts = list.length;
            newStats.totalStock = list.reduce((s, p) => s + (p.quantity || 0), 0);
            newStats.stockValue = list.reduce((s, p) => s + ((p.price || 0) * (p.quantity || 0)), 0);
            newStats.lowStockCount = list.filter(p => (p.quantity || 0) < 10).length;
          }
          if (ep === 'invoices') {
            newStats.totalInvoices = list.length;
            newStats.paidInvoices = list.filter(i => i.status === 'paid').length;
            newStats.pendingInvoices = list.filter(i => i.status === 'pending').length;
            newStats.totalRevenue = list.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
            const monthlyData = new Array(12).fill(0);
            list.forEach(i => {
              if (i.status === 'paid') {
                const month = new Date(i.createdAt).getMonth();
                monthlyData[month] += i.amount || 0;
              }
            });
            newStats.growthRate = monthlyData[11] && monthlyData[0] ? ((monthlyData[11] - monthlyData[0]) / monthlyData[0] * 100) : 5;
            newStats.predictedNextMonth = Math.round((monthlyData[11] || newStats.totalRevenue / 12) * (1 + newStats.growthRate / 100));
          }
          if (ep === 'employees') {
            newStats.totalEmployees = list.length;
            newStats.totalSalary = list.reduce((s, e) => s + (e.salary || 0), 0);
          }
        }
      }
      setStats(newStats);
      
      const recos = [];
      if (newStats.totalRevenue < 10000) recos.push('Augmentez vos campagnes marketing');
      if (newStats.lowStockCount > 0) recos.push(`Réapprovisionnez ${newStats.lowStockCount} produits en stock bas`);
      if (newStats.pendingInvoices > 0) recos.push(`Relancez ${newStats.pendingInvoices} factures impayées`);
      if (recos.length === 0) recos.push('Excellent ! Tous les indicateurs sont au vert');
      setRecommendations(recos);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📊 Analytics avancés</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Indicateurs clés de performance et analyses prédictives</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px', marginBottom: '40px' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '24px', borderRadius: '20px' }}>
              <div style={{ fontSize: '32px' }}>💰</div>
              <div>CA Total</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalRevenue}€</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', padding: '24px', borderRadius: '20px' }}>
              <div style={{ fontSize: '32px' }}>📈</div>
              <div>Croissance</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: stats.growthRate > 0 ? '#10b981' : '#ef4444' }}>
                {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', padding: '24px', borderRadius: '20px' }}>
              <div style={{ fontSize: '32px' }}>🔮</div>
              <div>Prévision mois prochain</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.predictedNextMonth}€</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', padding: '24px', borderRadius: '20px' }}>
              <div style={{ fontSize: '32px' }}>📦</div>
              <div>Valeur du stock</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.stockValue}€</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>📋 Indicateurs détaillés</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#94a3b8' }}>Produits</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.totalProducts}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#94a3b8' }}>Stock total</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.totalStock}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#94a3b8' }}>Employés</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.totalEmployees}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#94a3b8' }}>Masse salariale</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.totalSalary}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#94a3b8' }}>Factures payées</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{stats.paidInvoices} / {stats.totalInvoices}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#94a3b8' }}>Factures en attente</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{stats.pendingInvoices}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>💡 Recommandations IA</h2>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                  <span style={{ color: '#667eea', marginRight: '8px' }}>🤖</span>
                  <span style={{ color: '#94a3b8' }}>{rec}</span>
                </div>
              ))}
              <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(102,126,234,0.1)', borderRadius: '12px' }}>
                <span style={{ color: '#667eea' }}>📈</span>
                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>
                  Croissance projetée: {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}% sur l'année
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>📊 KPIs temps réel</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
              <div><span style={{ color: '#94a3b8' }}>Panier moyen:</span><br/><span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{(stats.totalRevenue / stats.totalInvoices || 0).toFixed(2)}€</span></div>
              <div><span style={{ color: '#94a3b8' }}>Valeur stock/employé:</span><br/><span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{(stats.stockValue / stats.totalEmployees || 0).toFixed(0)}€</span></div>
              <div><span style={{ color: '#94a3b8' }}>CA par employé:</span><br/><span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{(stats.totalRevenue / stats.totalEmployees || 0).toFixed(0)}€</span></div>
              <div><span style={{ color: '#94a3b8' }}>Rotation stock:</span><br/><span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{((stats.totalRevenue / stats.stockValue) * 100 || 0).toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
