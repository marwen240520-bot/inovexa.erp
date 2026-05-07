"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useCategory } from '@/contexts/CategoryContext';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { category } = useCategory();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSubscriptions(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const cancelSubscription = async (id) => {
    if (confirm('Annuler cet abonnement ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/subscriptions/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubscriptions();
      setMessage('✅ Abonnement annulé');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>☁️ Abonnements SaaS</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Gérez vos abonnements et forfaits</p>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {subscriptions.map(sub => (
              <div key={sub.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>☁️</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{sub.name}</h3>
                <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold', marginBottom: '16px' }}>{sub.price}€<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mois</span></div>
                <ul style={{ color: '#94a3b8', marginBottom: '24px', paddingLeft: '20px' }}>
                  {sub.features?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                {sub.active ? (
                  <button onClick={() => cancelSubscription(sub.id)} style={{ width: '100%', padding: '12px', background: '#c33', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                    Annuler l'abonnement
                  </button>
                ) : (
                  <button style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                    Souscrire
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
