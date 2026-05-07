"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/routes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRoutes(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const optimizeRoute = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveries: routes })
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizedRoute(data);
        setMessage('✅ Itinéraire optimisé !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>🗺️ Optimisation des tournées</h1>
              <p style={{ color: '#94a3b8' }}>Optimisez vos itinéraires de livraison</p>
            </div>
            <button onClick={optimizeRoute} style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              🗺️ Optimiser les routes
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>📍 Points de livraison</h2>
              {routes.map(r => (
                <div key={r.id} style={{ padding: '12px', borderBottom: '1px solid #222' }}>
                  <div style={{ color: 'white' }}>{r.address}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Client: {r.clientName}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>🗺️ Itinéraire optimisé</h2>
              {optimizedRoute ? (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>Distance totale: {optimizedRoute.totalDistance} km</div>
                    <div style={{ color: '#10b981' }}>Temps estimé: {optimizedRoute.totalTime} min</div>
                  </div>
                  {optimizedRoute.order?.map((stop, idx) => (
                    <div key={idx} style={{ padding: '12px', borderBottom: '1px solid #222' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>{idx + 1}</div>
                        <div>
                          <div style={{ color: 'white' }}>{stop.address}</div>
                          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Client: {stop.clientName}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#666', textAlign: 'center' }}>Cliquez sur "Optimiser les routes" pour générer l'itinéraire optimal</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
