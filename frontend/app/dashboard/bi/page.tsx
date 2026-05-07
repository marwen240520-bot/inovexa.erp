"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BIPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [predictRes, anomaliesRes, recosRes] = await Promise.all([
        fetch('http://localhost:3001/ai/predict-sales', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/ai/anomalies', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/ai/recommendations', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (predictRes.ok) setPredictions(await predictRes.json());
      if (anomaliesRes.ok) setAnomalies(await anomaliesRes.json());
      if (recosRes.ok) setRecommendations(await recosRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const token = localStorage.getItem('token');
    const userMessage = { role: 'user', content: chatMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setChatLoading(true);
    
    try {
      const res = await fetch('http://localhost:3001/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: chatMessage })
      });
      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data, timestamp: new Date() };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch(e) { console.error(e); }
    setChatLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ color: '#667eea', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Retour au tableau de bord
          </Link>
          <h1 style={{ color: 'white', fontSize: '28px', marginTop: '16px' }}>🤖 Business Intelligence & IA</h1>
          <p style={{ color: '#94a3b8' }}>Analyse prédictive, reporting dynamique et assistant IA conversationnel</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #222', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '📊 Tableau de bord' },
            { id: 'predictions', label: '📈 Prédictions' },
            { id: 'anomalies', label: '⚠️ Anomalies' },
            { id: 'chat', label: '💬 Assistant IA' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                border: 'none',
                borderRadius: '12px 12px 0 0',
                color: activeTab === tab.id ? 'white' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h3 style={{ color: 'white', marginBottom: '16px' }}>📊 KPIs</h3>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Marge bénéficiaire</span>
                  <span style={{ color: '#10b981' }}>24.5%</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', height: '8px' }}>
                  <div style={{ width: '24.5%', background: '#10b981', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Taux de conversion</span>
                  <span style={{ color: '#f59e0b' }}>18.2%</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', height: '8px' }}>
                  <div style={{ width: '18.2%', background: '#f59e0b', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Rotation des stocks</span>
                  <span style={{ color: '#667eea' }}>4.2x/an</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', height: '8px' }}>
                  <div style={{ width: '35%', background: '#667eea', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h3 style={{ color: 'white', marginBottom: '16px' }}>📈 Évolution mensuelle</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '8px' }}>
                {[65, 72, 68, 85, 92, 88, 95, 102, 98, 110, 115, 125].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: `${v * 1.5}px`, background: '#667eea', width: '100%', borderRadius: '4px 4px 0 0' }}></div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && predictions?.prediction && (
          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>📈 Prédiction des ventes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {predictions.prediction.map((p, i) => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Mois {p.month}</div>
                  <div style={{ fontSize: '20px', color: '#10b981', fontWeight: 'bold' }}>{p.amount.toLocaleString()} €</div>
                  {i > 0 && (
                    <div style={{ fontSize: '10px', color: p.amount > predictions.prediction[i-1].amount ? '#10b981' : '#ef4444' }}>
                      {p.amount > predictions.prediction[i-1].amount ? '📈 +' : '📉 '}
                      {Math.abs(((p.amount - predictions.prediction[i-1].amount) / predictions.prediction[i-1].amount) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center', color: '#94a3b8' }}>
              Niveau de confiance: {predictions.confidence * 100}% • Basé sur vos données historiques
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>⚠️ Anomalies détectées</h2>
            {anomalies.length > 0 ? (
              anomalies.map((a, i) => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '12px', borderLeft: `4px solid #ef4444` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white' }}>Facture #{a.id}</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{a.amount} €</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Déviation: {a.deviation}% • {new Date(a.date).toLocaleDateString()}</div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>✅ Aucune anomalie détectée</p>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: '#1a1a1a', borderBottom: '1px solid #222' }}>
              <h3 style={{ color: 'white', margin: 0 }}>💬 Assistant IA</h3>
            </div>
            <div style={{ height: '400px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                  <p>Posez une question sur votre entreprise</p>
                  <p style={{ fontSize: '12px' }}>Exemples: "Quel est mon chiffre d'affaires ?", "Stock faible ?", "Clients actifs ?"</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: msg.role === 'user' ? '#667eea' : '#1a1a1a',
                    color: 'white'
                  }}>
                    <div>{msg.content}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#1a1a1a', padding: '12px 16px', borderRadius: '16px', color: '#94a3b8' }}>
                    🤔 Réflexion en cours...
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #222', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Posez votre question..."
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading}
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
