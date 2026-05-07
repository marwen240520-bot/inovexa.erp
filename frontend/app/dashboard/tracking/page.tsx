"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function TrackingPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/deliveries/tracking', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDeliveries(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return '⏳';
      case 'in_transit': return '🚚';
      case 'delivered': return '✅';
      default: return '📍';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'En attente';
      case 'in_transit': return 'En transit';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📍 Tracking en temps réel</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Suivez vos livraisons en temps réel</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {deliveries.map(d => (
              <div key={d.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', cursor: 'pointer' }} onClick={() => setSelectedDelivery(d)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '32px' }}>{getStatusIcon(d.status)}</div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>Livraison #{d.id}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{d.clientName}</div>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#666', fontSize: '12px' }}>Adresse</div>
                  <div style={{ color: 'white' }}>{d.address}</div>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <span style={{ color: d.status === 'delivered' ? '#10b981' : d.status === 'in_transit' ? '#667eea' : '#f59e0b' }}>
                    {getStatusText(d.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedDelivery && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedDelivery(null)}>
              <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '500px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ color: 'white', marginBottom: '24px' }}>📍 Détails de la livraison</h2>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8' }}>Client</div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{selectedDelivery.clientName}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8' }}>Adresse</div>
                  <div style={{ color: 'white' }}>{selectedDelivery.address}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8' }}>Statut</div>
                  <div style={{ color: selectedDelivery.status === 'delivered' ? '#10b981' : '#f59e0b' }}>{getStatusText(selectedDelivery.status)}</div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: '#94a3b8' }}>Numéro de suivi</div>
                  <div style={{ color: 'white' }}>{selectedDelivery.trackingNumber || 'À venir'}</div>
                </div>
                <button onClick={() => setSelectedDelivery(null)} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
