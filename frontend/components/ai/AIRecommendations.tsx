"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategory } from '@/contexts/CategoryContext';

export function AIRecommendations() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { category } = useCategory();

  useEffect(() => {
    fetchRecommendations();
  }, [category]);

  const fetchRecommendations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/recommendations?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRecommendations(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Chargement des recommandations...</div>;

  return (
    <div>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>🎯 Recommandations personnalisées</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {recommendations.map(rec => (
          <div key={rec.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>{rec.icon}</div>
            <div style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '8px' }}>{rec.title}</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>{rec.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#10b981', fontSize: '12px' }}>
                {rec.impact === 'high' ? '📈 Impact élevé' : rec.impact === 'medium' ? '📊 Impact moyen' : '📉 Impact faible'}
              </div>
              <button
                onClick={() => router.push(rec.actionUrl)}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
          <p>Aucune recommandation pour le moment</p>
        </div>
      )}
    </div>
  );
}
