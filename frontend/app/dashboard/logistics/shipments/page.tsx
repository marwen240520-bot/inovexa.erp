"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/logistics/shipments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setShipments(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createShipment = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/logistics/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchShipments();
        setMessage('✅ Expédition créée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>📦 Expéditions</h1>
              <p style={{ color: '#94a3b8' }}>Gestion des expéditions</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { clientName: '', address: '', weight: 0, carrier: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle expédition
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Adresse</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Poids</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Transporteur</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{s.clientName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.address}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{s.weight} kg</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.carrier}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: s.status === 'shipped' ? 'rgba(16,185,129,0.2)' : s.status === 'delivered' ? 'rgba(102,126,234,0.2)' : 'rgba(245,158,11,0.2)', color: s.status === 'shipped' ? '#10b981' : s.status === 'delivered' ? '#667eea' : '#f59e0b', padding: '4px 12px', borderRadius: '20px' }}>
                        {s.status === 'shipped' ? 'Expédié' : s.status === 'delivered' ? 'Livré' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>📋</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
