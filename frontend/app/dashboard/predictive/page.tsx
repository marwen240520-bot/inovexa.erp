"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PredictivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [churn, setChurn] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('price_increase_10');
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [predRes, churnRes] = await Promise.all([
        fetch('http://localhost:3001/ai/predict/lstm?horizon=30', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/ai/churn/predict', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (predRes.ok) setPredictions(await predRes.json());
      if (churnRes.ok) setChurn(await churnRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const runSimulation = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/ai/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ scenario: selectedScenario })
    });
    if (res.ok) setSimulation(await res.json());
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '32px' }}>🔮 Analyse Prédictive</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>📈 Prédictions des ventes</h2>
              {predictions && (
                <>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{predictions.predictions?.[0] || 0}€</div>
                  <div style={{ color: '#94a3b8', marginBottom: '20px' }}>Prévision mois prochain</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Confiance: {predictions.confidence}%</span>
                    <span style={{ color: predictions.trend === 'up' ? '#10b981' : '#ef4444' }}>{predictions.trend === 'up' ? '📈 Hausse' : '📉 Baisse'}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>⚠️ Clients à risque</h2>
              {churn && (
                <>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{churn.atRisk}</div>
                  <div style={{ color: '#94a3b8', marginBottom: '20px' }}>clients à risque de départ</div>
                  {churn.churnRisks?.slice(0, 3).map((c, i) => (
                    <div key={i} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'white' }}>{c.customerName}</span>
                      <span style={{ color: '#f59e0b' }}>{c.riskScore}%</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>🎲 Simulation "What-If"</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)} style={{ flex: 1, padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white' }}>
                <option value="price_increase_10">📈 Augmentation des prix +10%</option>
                <option value="price_decrease_10">📉 Baisse des prix -10%</option>
              </select>
              <button onClick={runSimulation} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Simuler</button>
            </div>
            {simulation && (
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '12px' }}>
                  <div><span style={{ color: '#94a3b8' }}>Impact</span><div style={{ color: '#10b981', fontSize: '20px' }}>{simulation.impact}</div></div>
                  <div><span style={{ color: '#94a3b8' }}>Nouveau CA</span><div style={{ color: 'white', fontSize: '20px' }}>{simulation.newRevenue}€</div></div>
                </div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: '#94a3b8' }}>Risques</span><div style={{ color: '#f59e0b' }}>{simulation.risk}</div></div>
                <div><span style={{ color: '#94a3b8' }}>Recommandation</span><div style={{ color: 'white' }}>{simulation.recommendation}</div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
