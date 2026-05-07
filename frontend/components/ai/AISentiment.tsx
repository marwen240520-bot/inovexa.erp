"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function AISentiment() {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { category } = useCategory();

  useEffect(() => {
    fetchSentiment();
  }, [category]);

  const fetchSentiment = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/sentiment?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSentiment(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Analyse en cours...</div>;

  return (
    <div>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>😊 Analyse de sentiment client</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>😊</div>
          <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>{sentiment?.positive || 0}%</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Positifs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>😐</div>
          <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>{sentiment?.neutral || 0}%</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Neutres</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>😞</div>
          <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>{sentiment?.negative || 0}%</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Négatifs</div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Score global</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, background: '#2a2a2a', borderRadius: '10px', height: '8px' }}>
            <div style={{
              width: `${sentiment?.score || 0}%`,
              background: sentiment?.score > 66 ? '#10b981' : sentiment?.score > 33 ? '#f59e0b' : '#ef4444',
              height: '100%',
              borderRadius: '10px'
            }} />
          </div>
          <div style={{ color: 'white', fontWeight: 'bold' }}>{sentiment?.score || 0}%</div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '12px' }}>
          {sentiment?.score > 66 ? '✅ Très bonne satisfaction client' : sentiment?.score > 33 ? '⚠️ Satisfaction moyenne' : '🔴 Satisfaction à améliorer'}
        </div>
      </div>
    </div>
  );
}
