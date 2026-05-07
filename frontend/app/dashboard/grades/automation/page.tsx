"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AutomationPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/automation/workflows', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setWorkflows(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const toggleWorkflow = async (id, active) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/automation/workflows/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active })
    });
    fetchWorkflows();
    setMessage(active ? '✅ Workflow désactivé' : '✅ Workflow activé');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>🤖 Automatisation</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos workflows automatisés</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', trigger: '', action: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau workflow
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {workflows.map(wf => (
              <div key={wf.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: 'white', margin: 0 }}>{wf.name}</h3>
                  <span style={{ background: wf.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: wf.active ? '#10b981' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {wf.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>🔔 Déclencheur</div>
                  <div style={{ color: 'white' }}>{wf.trigger}</div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>⚡ Action</div>
                  <div style={{ color: 'white' }}>{wf.action}</div>
                </div>
                <button onClick={() => toggleWorkflow(wf.id, wf.active)} style={{ width: '100%', padding: '10px', background: wf.active ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {wf.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>🤖 Nouveau workflow</h2>
              <input type="text" placeholder="Nom du workflow" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.trigger || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, trigger: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner un déclencheur</option>
                <option value="Nouvelle commande">Nouvelle commande</option>
                <option value="Stock faible">Stock faible</option>
                <option value="Nouveau client">Nouveau client</option>
                <option value="Facture impayée">Facture impayée</option>
              </select>
              <select value={modal.form.action || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, action: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner une action</option>
                <option value="Envoyer email">Envoyer email</option>
                <option value="Notification push">Notification push</option>
                <option value="Créer tâche">Créer tâche</option>
                <option value="Mettre à jour stock">Mettre à jour stock</option>
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setModal({ open: false, form: {} }); }} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
