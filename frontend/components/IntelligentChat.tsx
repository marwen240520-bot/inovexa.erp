"use client";
import { useState, useEffect, useRef } from 'react';

export default function IntelligentChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSuggestions();
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    setSuggestions([
      "📊 Quel est le chiffre d'affaires ?",
      "📦 Produits en stock bas",
      "🔮 Prévisions des ventes",
      "⚡ Automatiser les relances",
      "📄 Créer une facture",
      "📈 Analyse des performances"
    ]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = { text: message, sender: 'user', time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const res = await fetch('http://localhost:3001/ai/advanced/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, userId: userData.id })
      });
      
      const data = await res.json();
      const aiMessage = { text: data.response, sender: 'ai', time: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { text: "❌ Erreur de connexion à l'IA", sender: 'ai', time: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #222', background: '#0f172a', borderRadius: '20px 20px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px' }}>Assistant IA Intelligent</h2>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Prédictions • Automatisation • Analyses</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>Assistant IA Inovexa</h3>
            <p>Posez-moi une question ou demandez-moi d'agir !</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '16px', display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '16px',
              background: msg.sender === 'user' ? '#667eea' : '#1e293b',
              color: 'white'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{msg.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '16px' }}>
              <span style={{ color: '#94a3b8' }}>🤖 L'IA réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && messages.length < 3 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #222', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSuggestionClick(s)} style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '20px', borderTop: '1px solid #222', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Posez votre question ou donnez un ordre..."
          style={{ flex: 1, padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: 'white' }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
