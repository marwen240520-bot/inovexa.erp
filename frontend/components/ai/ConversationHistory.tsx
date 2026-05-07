"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function ConversationHistory() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { category } = useCategory();

  useEffect(() => {
    fetchHistory();
  }, [category]);

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/history?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setConversations(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Chargement de l'historique...</div>;

  return (
    <div>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>📜 Historique des conversations</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #333',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#667eea', fontWeight: 'bold' }}>{conv.topic || 'Conversation'}</span>
              <span style={{ color: '#666', fontSize: '11px' }}>{new Date(conv.date).toLocaleDateString()}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              {conv.preview}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#2a2a2a', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#94a3b8' }}>
                {conv.messageCount} messages
              </span>
              <span style={{ background: '#2a2a2a', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#94a3b8' }}>
                {conv.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedConversation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedConversation(null)}>
          <div style={{
            background: '#111',
            borderRadius: '20px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '24px',
            border: '1px solid #333'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'white' }}>{selectedConversation.topic || 'Conversation'}</h3>
              <button onClick={() => setSelectedConversation(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedConversation.messages?.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}>
                  <div style={{
                    background: msg.role === 'user' ? '#667eea' : '#1a1a1a',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: 'white'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
