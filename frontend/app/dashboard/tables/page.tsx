"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTables(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const updateTableStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/tables/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchTables();
    setMessage(`Table ${id} ${status === 'occupied' ? 'occupée' : status === 'reserved' ? 'réservée' : 'libre'}`);
    setTimeout(() => setMessage(''), 2000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'free': return '#10b981';
      case 'occupied': return '#ef4444';
      case 'reserved': return '#f59e0b';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'free': return 'Libre';
      case 'occupied': return 'Occupée';
      case 'reserved': return 'Réservée';
      default: return status;
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🪑 Gestion des Tables</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Visualisez et gérez l'occupation de vos tables</p>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            {tables.map(table => (
              <div key={table.id} style={{ 
                background: '#111', 
                borderRadius: '20px', 
                padding: '24px', 
                textAlign: 'center',
                border: `2px solid ${getStatusColor(table.status)}`,
                cursor: 'pointer'
              }} onClick={() => setSelectedTable(table)}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {table.status === 'free' ? '🪑' : table.status === 'occupied' ? '🍽️' : '🔖'}
                </div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>Table {table.number || table.id}</h3>
                <div style={{ 
                  background: getStatusColor(table.status), 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  display: 'inline-block',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  {getStatusText(table.status)}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {table.status !== 'free' && (
                    <button onClick={() => updateTableStatus(table.id, 'free')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                      Libérer
                    </button>
                  )}
                  {table.status !== 'occupied' && (
                    <button onClick={() => updateTableStatus(table.id, 'occupied')} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                      Occuper
                    </button>
                  )}
                  {table.status !== 'reserved' && (
                    <button onClick={() => updateTableStatus(table.id, 'reserved')} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                      Réserver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
