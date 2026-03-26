"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '', trigger: 'stock_below_threshold', condition: { field: 'quantity', operator: '<', value: 10 }, actions: []
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/ai/workflows', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWorkflows(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createWorkflow = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/ai/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newWorkflow)
    });
    if (res.ok) {
      setShowCreator(false);
      fetchWorkflows();
      setNewWorkflow({ name: '', trigger: 'stock_below_threshold', condition: { field: 'quantity', operator: '<', value: 10 }, actions: [] });
    }
  };

  const triggers = [
    { id: 'stock_below_threshold', label: '📦 Stock bas', description: 'Quand le stock est inférieur au seuil' },
    { id: 'invoice_overdue', label: '💰 Facture impayée', description: 'Quand une facture dépasse la date d\'échéance' },
    { id: 'order_created', label: '📝 Nouvelle commande', description: 'Quand une commande est créée' }
  ];

  const actions = [
    { id: 'notification', label: '🔔 Notification' },
    { id: 'email', label: '📧 Email' },
    { id: 'api_call', label: '🔌 API Call' }
  ];

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px' }}>⚡ Workflows Automatisés</h1>
            <button onClick={() => setShowCreator(true)} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>+ Nouveau workflow</button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {workflows.map(w => (
              <div key={w.id} style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px' }}>{w.icon} {w.name}</h3>
                  <span style={{ color: w.isActive ? '#10b981' : '#64748b', fontSize: '12px' }}>{w.isActive ? '● Actif' : '○ Inactif'}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>🔔 {triggers.find(t => t.id === w.trigger)?.label}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {w.actions?.map((a, i) => <span key={i} style={{ background: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#94a3b8' }}>{actions.find(ac => ac.id === a.type)?.label}</span>)}
                </div>
              </div>
            ))}
          </div>

          {showCreator && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '500px' }}>
                <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Créer un workflow</h2>
                <input type="text" placeholder="Nom" value={newWorkflow.name} onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
                <select value={newWorkflow.trigger} onChange={e => setNewWorkflow({ ...newWorkflow, trigger: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                  {triggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {actions.map(a => (
                    <button key={a.id} onClick={() => setNewWorkflow({ ...newWorkflow, actions: [...newWorkflow.actions, { type: a.id }] })} style={{ background: '#1e293b', color: '#94a3b8', padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>+ {a.label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={createWorkflow} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                  <button onClick={() => setShowCreator(false)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
