"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function AIDashboard() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { category } = useCategory();

  useEffect(() => {
    fetchPredictions();
  }, [selectedPeriod, category]);

  const fetchPredictions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/advanced-predict?period=${selectedPeriod}&category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPredictions(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chargement des prédictions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: 'white', fontSize: '18px' }}>📈 Prédictions et tendances</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              style={{
                padding: '6px 12px',
                background: selectedPeriod === p ? '#667eea' : '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Prévision basse</div>
          <div style={{ color: '#94a3b8', fontSize: '24px', fontWeight: 'bold' }}>{predictions?.low?.toLocaleString() || 0} €</div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', border: '1px solid #667eea' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Prévision moyenne</div>
          <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>{predictions?.medium?.toLocaleString() || 0} €</div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Prévision haute</div>
          <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>{predictions?.high?.toLocaleString() || 0} €</div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Tendance</span>
          <span style={{ color: predictions?.trend > 0 ? '#10b981' : '#ef4444', fontSize: '12px' }}>
            {predictions?.trend > 0 ? '📈 +' : '📉 '}{Math.abs(predictions?.trend || 0)}%
          </span>
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, (predictions?.medium / predictions?.high) * 100))}%`,
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            height: '100%',
            borderRadius: '8px'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ color: '#666', fontSize: '10px' }}>Confidence: {predictions?.confidence || 85}%</span>
          <span style={{ color: '#666', fontSize: '10px' }}>Basé sur {predictions?.dataPoints || 30} points de données</span>
        </div>
      </div>
    </div>
  );
}
