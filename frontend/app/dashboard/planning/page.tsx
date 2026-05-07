"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PlanningPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchPlanning();
  }, []);

  const fetchPlanning = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/planning', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTasks(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createTask = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchPlanning();
        setMessage('✅ Tâche planifiée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/planning/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchPlanning();
    setMessage('✅ Statut mis à jour');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  const pending = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>📅 Planification</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos tâches et plannings</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { title: '', assignedTo: '', startDate: '', endDate: '', priority: 'medium' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle tâche
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>⏳ À faire ({pending.length})</h2>
              {pending.map(task => (
                <div key={task.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ color: 'white', margin: 0 }}>{task.title}</h3>
                    <span style={{ background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981', padding: '4px 8px', borderRadius: '8px', fontSize: '10px' }}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>Assigné à: {task.assignedTo}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ color: '#666', fontSize: '10px' }}>{new Date(task.startDate).toLocaleDateString()} → {new Date(task.endDate).toLocaleDateString()}</span>
                    <button onClick={() => updateStatus(task.id, 'completed')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                      Terminer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>✅ Terminées ({completed.length})</h2>
              {completed.map(task => (
                <div key={task.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '12px', opacity: 0.7 }}>
                  <h3 style={{ color: '#94a3b8', margin: 0, textDecoration: 'line-through' }}>{task.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📅 Nouvelle tâche</h2>
              <input type="text" placeholder="Titre" value={modal.form.title || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, title: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Assigné à" value={modal.form.assignedTo || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, assignedTo: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date début" value={modal.form.startDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, startDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date fin" value={modal.form.endDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, endDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.priority || 'medium'} onChange={e => setModal({ ...modal, form: { ...modal.form, priority: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createTask} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
