"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import IntelligentChat from '@/components/IntelligentChat';

export default function AIAdvancedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [autoOrders, setAutoOrders] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [predRes, orderRes, reminderRes] = await Promise.all([
        fetch('http://localhost:3001/ai/advanced/predict?months=3', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/ai/advanced/replenish', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/ai/advanced/reminders', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (predRes.ok) setPredictions(await predRes.json());
      if (orderRes.ok) setAutoOrders(await orderRes.json());
      if (reminderRes.ok) setReminders(await reminderRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const executeAutoReplenish = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/ai/advanced/replenish', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    alert('✅ Réapprovisionnement automatique lancé');
    loadData();
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🤖 IA Avancée</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Prédictions, automatisation et assistant intelligent</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            {/* Prédictions */}
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>📈 Prédictions IA</h2>
              {predictions && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#94a3b8' }}>Prévision mois prochain</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                      {predictions.predictions?.[0]?.predictedRevenue || 0}€
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      Confiance: {predictions.predictions?.[0]?.confidence || 85}%
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#94a3b8' }}>Tendance</div>
                    <div style={{ color: predictions.trend > 0 ? '#10b981' : '#ef4444' }}>
                      {predictions.trend > 0 ? '📈 Hausse' : '📉 Baisse'} ({Math.abs(predictions.trend)}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Saisonnalitété</div>
                    {predictions.seasonality?.summerPeak && (
                      <span style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>☀️ Pic été</span>
                    )}
                    {predictions.seasonality?.winterPeak && (
                      <span style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>❄️ Pic hiver</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Automatisation */}
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>⚡ Automatisation</h2>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Réapprovisionnement auto</span>
                  <button onClick={executeAutoReplenish} style={{ background: '#667eea', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Lancer
                  </button>
                </div>
                {autoOrders.length > 0 && (
                  <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ color: '#10b981', fontSize: '12px' }}>{autoOrders.length} produits à réapprovisionner</div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '12px' }}>Relances automatiques</div>
                {reminders.length > 0 && (
                  <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ color: '#f59e0b', fontSize: '12px' }}>{reminders.length} factures en retard</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat IA Intelligent */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>💬 Assistant IA Conversationnel</h2>
            <IntelligentChat />
          </div>
        </div>
      </div>
    </div>
  );
}
