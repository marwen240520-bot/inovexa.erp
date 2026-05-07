"use client";
import { useState, useEffect, useRef } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

// Configuration IA par catégorie
const aiConfig = {
  pme: { name: 'Assistant PME', icon: '🏪', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  commerce: { name: 'Assistant Commerce', icon: '🛍️', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  restaurant: { name: 'Assistant Restaurant', icon: '🍽️', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  industrie: { name: 'Assistant Industrie', icon: '🏭', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  logistique: { name: 'Assistant Logistique', icon: '🚚', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  services: { name: 'Assistant Services', icon: '🧑‍💼', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  ecommerce: { name: 'Assistant E-commerce', icon: '🛒', color: '#ec489a', gradient: 'linear-gradient(135deg, #ec489a, #db2777)' },
  btp: { name: 'Assistant BTP', icon: '🏗️', color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  sante: { name: 'Assistant Santé', icon: '🏥', color: '#14b8a6', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)' },
  education: { name: 'Assistant Éducation', icon: '🎓', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' }
};

export function AIChatbotPro() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { category, getCategoryInfo } = useCategory();
  const categoryInfo = getCategoryInfo();
  const config = aiConfig[category] || aiConfig.pme;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `👋 Bonjour ! Je suis ${config.name}, votre assistant IA. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: input, category: category })
      });

      const data = await res.json();
      const botMessage = {
        role: 'assistant',
        content: data.response || `Je peux vous aider avec les analyses de ${config.name}. Que voulez-vous savoir ?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Je suis désolé, une erreur est survenue. Veuillez réessayer.`,
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: config.gradient,
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        🤖
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '380px',
            height: '550px',
            background: '#111',
            borderRadius: '16px',
            border: `1px solid ${config.color}`,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px',
              background: config.gradient,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{config.icon}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{config.name}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div
                  style={{
                    background: msg.role === 'user' ? config.color : '#1a1a1a',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    color: 'white',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.content}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#1a1a1a', padding: '10px 14px', borderRadius: '16px', color: '#94a3b8' }}>
                <span style={{ animation: 'pulse 1s infinite' }}>🤔 Réflexion...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #222', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              style={{
                flex: 1,
                padding: '12px',
                background: '#1a1a1a',
                border: `1px solid ${config.color}`,
                borderRadius: '24px',
                color: 'white',
                outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: config.color,
                border: 'none',
                borderRadius: '24px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
