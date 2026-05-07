"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function CorrelationAnalysis() {
  const [correlations, setCorrelations] = useState(null);
  const [loading, setLoading] = useState(true);
  const { category } = useCategory();

  useEffect(() => {
    fetchCorrelations();
  }, [category]);

  const fetchCorrelations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/correlations?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCorrelations(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const getCorrelationColor = (value) => {
    if (value > 0.7) return '#10b981';
    if (value > 0.4) return '#f59e0b';
    if (value > 0) return '#667eea';
    return '#ef4444';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Analyse des corrélations...</div>;

  return (
    <div>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>🔗 Analyse des corrélations</h3>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
        {correlations?.pairs?.map((pair, idx) => (
          <div key={idx} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'white' }}>{pair.variable1} ↔ {pair.variable2}</span>
              <span style={{ color: getCorrelationColor(pair.correlation) }}>
                {pair.correlation > 0 ? '+' : ''}{pair.correlation.toFixed(2)}
              </span>
            </div>
            <div style={{ background: '#2a2a2a', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.abs(pair.correlation) * 100}%`,
                background: getCorrelationColor(pair.correlation),
                height: '100%',
                borderRadius: '8px'
              }} />
            </div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
              {pair.interpretation}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', background: '#1a1a1a', borderRadius: '12px', padding: '16px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>💡 Interprétation</div>
        <ul style={{ color: '#94a3b8', fontSize: '12px', paddingLeft: '20px' }}>
          <li>Corrélation > 0.7 : Forte relation positive</li>
          <li>Corrélation 0.4-0.7 : Relation modérée</li>
          <li>Corrélation 0-0.4 : Faible relation</li>
          <li>Corrélation négative : Relation inverse</li>
        </ul>
      </div>
    </div>
  );
}
