"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function TimesheetPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/timesheet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEntries(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createEntry = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchEntries();
        setMessage('✅ Temps enregistré !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>⏱️ Suivi du temps</h1>
              <p style={{ color: '#94a3b8' }}>Enregistrez vos heures de travail</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { project: '', description: '', hours: 0, date: '', billable: true } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle entrée
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{totalHours}h</div>
              <div style={{ color: '#94a3b8' }}>Heures totales</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{billableHours}h</div>
              <div style={{ color: '#94a3b8' }}>Heures facturables</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{entries.length}</div>
              <div style={{ color: '#94a3b8' }}>Entrées</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Projet</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Heures</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Facturable</th>
                  </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(e.date).toLocaleDateString()} </td>
                    <td style={{ padding: '12px', color: 'white' }}>{e.project}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.description}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#10b981' }}>{e.hours}h</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {e.billable ? <span style={{ color: '#10b981' }}>✅</span> : <span style={{ color: '#94a3b8' }}>❌</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>⏱️ Nouvelle entrée</h2>
              <input type="text" placeholder="Projet" value={modal.form.project || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, project: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Description" value={modal.form.description || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Heures" value={modal.form.hours || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, hours: parseFloat(e.target.value) } })} step="0.5" style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date" value={modal.form.date || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, date: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <label style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input type="checkbox" checked={modal.form.billable !== false} onChange={e => setModal({ ...modal, form: { ...modal.form, billable: e.target.checked } })} />
                Facturable
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createEntry} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enregistrer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
