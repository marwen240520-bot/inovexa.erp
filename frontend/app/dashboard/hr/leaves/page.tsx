"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function LeavesPage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/hr/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLeaves(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const requestLeave = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchLeaves();
        setMessage('✅ Demande de congé envoyée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const approveLeave = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/hr/leaves/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchLeaves();
    setMessage('✅ Congé approuvé');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>📅 Planning & Congés</h1>
              <p style={{ color: '#94a3b8' }}>Gestion des congés et absences</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { startDate: '', endDate: '', type: 'vacation', reason: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              Demander un congé
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Employé</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Début</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fin</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{l.employeeName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{l.type === 'vacation' ? 'Vacances' : l.type === 'sick' ? 'Maladie' : 'Autre'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: l.status === 'approved' ? 'rgba(16,185,129,0.2)' : l.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'approved' ? '#10b981' : l.status === 'rejected' ? '#f87171' : '#f59e0b', padding: '4px 12px', borderRadius: '20px' }}>
                        {l.status === 'approved' ? 'Approuvé' : l.status === 'rejected' ? 'Refusé' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {l.status === 'pending' && (
                        <button onClick={() => approveLeave(l.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
                          Approuver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
