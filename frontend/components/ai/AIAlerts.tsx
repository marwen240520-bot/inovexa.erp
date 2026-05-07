"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

export function AIAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { category } = useCategory();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, [category]);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/ai/alerts?category=${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAlerts(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/ai/alerts/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAlerts();
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Chargement des alertes...</div>;

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', fontSize: '18px' }}>⚠️ Alertes prédictives</h3>
        {unreadCount > 0 && (
          <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
            {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
          <p>Aucune alerte à signaler</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => !alert.read && markAsRead(alert.id)}
              style={{
                background: alert.read ? '#111' : '#1a1a1a',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${alert.read ? '#222' : getAlertColor(alert.type)}`,
                cursor: alert.read ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '20px' }}>{getAlertIcon(alert.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ color: getAlertColor(alert.type), fontWeight: 'bold', fontSize: '14px' }}>
                      {alert.type === 'critical' ? 'Critique' : alert.type === 'warning' ? 'Attention' : 'Information'}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ color: 'white', marginBottom: '8px' }}>{alert.message}</div>
                  {alert.suggestion && (
                    <div style={{ color: '#94a3b8', fontSize: '12px', background: '#1a1a1a', padding: '8px', borderRadius: '8px' }}>
                      💡 {alert.suggestion}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
