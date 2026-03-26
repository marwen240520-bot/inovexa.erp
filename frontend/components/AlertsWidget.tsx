"use client";
import { useState, useEffect } from 'react';

export function AlertsWidget() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/ai/anomalies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.anomalies || []);
      }
    } catch(e) { console.error(e); }
  };

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: '#111', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
      <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>⚠️ Alertes</h3>
      {alerts.map((alert, i) => (
        <div key={i} style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#f59e0b' }}>⚠️</span>
          <span style={{ color: '#94a3b8', marginLeft: '8px' }}>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}
