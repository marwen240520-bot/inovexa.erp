"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLogistique() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    delayed: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
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
      const res = await fetch('http://localhost:3001/logistics/shipments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const shipments = await res.json();
      
      setStats({
        totalShipments: shipments.length,
        inTransit: shipments.filter(s => s.status === 'in_transit').length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        delayed: shipments.filter(s => s.status === 'delayed').length
      });
      setRecentShipments(shipments.slice(0, 5));
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
            <h1 style={{ color: 'white', fontSize: '28px' }}>🚚 Dashboard Logistique</h1>
            <p style={{ color: '#94a3b8' }}>Bonjour {user?.name}, suivez vos livraisons</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{stats.totalShipments}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Total livraisons</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚚</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{stats.inTransit}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>En transit</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{stats.delivered}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Livrées</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: 'bold' }}>{stats.delayed}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Retardées</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>📋 Dernières livraisons</h2>
            {recentShipments.map(s => (
              <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'white' }}>{s.clientName}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '12px' }}>N° {s.trackingNumber}</span>
                </div>
                <span style={{ 
                  background: s.status === 'delivered' ? 'rgba(16,185,129,0.2)' : 
                             s.status === 'delayed' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                  color: s.status === 'delivered' ? '#10b981' : 
                         s.status === 'delayed' ? '#ef4444' : '#f59e0b',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px' 
                }}>
                  {s.status === 'delivered' ? 'Livrée' : 
                   s.status === 'delayed' ? 'Retardée' : 'En transit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
