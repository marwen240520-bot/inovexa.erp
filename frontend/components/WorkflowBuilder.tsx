"use client";
import { useState, useEffect } from 'react';

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    trigger: 'new_order',
    action: 'send_notification',
    isActive: true,
    description: ''
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/workflows', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setWorkflows(await res.json());
  };

  const createWorkflow = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newWorkflow)
    });
    setShowModal(false);
    fetchWorkflows();
    setNewWorkflow({ name: '', trigger: 'new_order', action: 'send_notification', isActive: true, description: '' });
  };

  const deleteWorkflow = async (id) => {
    if (confirm('Supprimer ce workflow ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/workflows/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchWorkflows();
    }
  };

  const triggers = [
    { value: 'new_order', label: '📝 Nouvelle commande', icon: '📝' },
    { value: 'low_stock', label: '⚠️ Stock bas', icon: '⚠️' },
    { value: 'invoice_due', label: '💰 Facture à échéance', icon: '💰' },
    { value: 'new_customer', label: '👥 Nouveau client', icon: '👥' },
    { value: 'payment_received', label: '💳 Paiement reçu', icon: '💳' }
  ];

  const actions = [
    { value: 'send_notification', label: '🔔 Envoyer notification', icon: '🔔' },
    { value: 'send_email', label: '📧 Envoyer email', icon: '📧' },
    { value: 'create_invoice', label: '📄 Créer facture', icon: '📄' },
    { value: 'update_stock', label: '📦 Mettre à jour stock', icon: '📦' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'white' }}>⚡ Automatisations (Workflows)</h2>
        <button onClick={() => setShowModal(true)} style={{ background: '#667eea', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
          + Nouvelle automatisation
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {workflows.map(w => (
          <div key={w.id} style={{ background: '#111', padding: '16px', borderRadius: '12px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>
                  {triggers.find(t => t.value === w.trigger)?.icon || '⚙️'}
                </span>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{w.name}</span>
                <span style={{ background: w.isActive ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>
                  {w.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                {triggers.find(t => t.value === w.trigger)?.label} → {actions.find(a => a.value === w.action)?.label}
              </div>
              {w.description && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{w.description}</div>}
            </div>
            <button onClick={() => deleteWorkflow(w.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
              🗑️
            </button>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Aucune automatisation. Créez votre première règle !
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '500px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Nouvelle automatisation</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'block' }}>Nom</label>
              <input type="text" placeholder="Ex: Alerte stock bas" value={newWorkflow.name} onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'block' }}>Déclencheur</label>
              <select value={newWorkflow.trigger} onChange={e => setNewWorkflow({ ...newWorkflow, trigger: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                {triggers.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'block' }}>Action</label>
              <select value={newWorkflow.action} onChange={e => setNewWorkflow({ ...newWorkflow, action: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                {actions.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'block' }}>Description (optionnel)</label>
              <textarea placeholder="Description de l'automatisation" value={newWorkflow.description} onChange={e => setNewWorkflow({ ...newWorkflow, description: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '80px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                <input type="checkbox" checked={newWorkflow.isActive} onChange={e => setNewWorkflow({ ...newWorkflow, isActive: e.target.checked })} />
                Activer cette automatisation
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createWorkflow} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
