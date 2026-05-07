"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function RFMAnalysis() {
  const [rfmData, setRfmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { category } = useCategory();

  useEffect(() => {
    fetchRFM();
  }, [category]);

  const fetchRFM = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/rfm?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRfmData(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const getSegmentColor = (segment) => {
    switch(segment) {
      case 'VIP': return '#10b981';
      case 'Fidèle': return '#667eea';
      case 'Potentiel': return '#f59e0b';
      case 'Risque': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Analyse RFM en cours...</div>;

  return (
    <div>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>📊 Analyse RFM - Segmentation clients</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🕐</div>
          <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>{rfmData?.avgRecency || 0} jours</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Récence moyenne</div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
          <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>{rfmData?.avgFrequency || 0}</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Fréquence moyenne</div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
          <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>{rfmData?.avgMonetary?.toLocaleString() || 0} €</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Montant moyen</div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px' }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>Segments clients</div>
        {rfmData?.segments?.map(segment => (
          <div key={segment.name} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: getSegmentColor(segment.name), fontWeight: 'bold' }}>{segment.name}</span>
              <span style={{ color: '#94a3b8' }}>{segment.count} clients</span>
            </div>
            <div style={{ background: '#2a2a2a', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${(segment.count / rfmData?.total) * 100}%`,
                background: getSegmentColor(segment.name),
                height: '100%',
                borderRadius: '8px'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
