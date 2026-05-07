"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAppointments(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createAppointment = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchAppointments();
        setMessage('✅ Rendez-vous programmé !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3001/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchAppointments();
    setMessage(`✅ Rendez-vous ${status === 'confirmed' ? 'confirmé' : 'annulé'}`);
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  const today = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString());
  const upcoming = appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.date) < new Date());

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>📅 Rendez-vous</h1>
              <p style={{ color: '#94a3b8' }}>Gérez vos rendez-vous médicaux</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { patientName: '', doctor: '', date: '', time: '', reason: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau rendez-vous
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '24px', color: '#667eea', fontWeight: 'bold' }}>{today.length}</div>
              <div style={{ color: '#94a3b8' }}>Aujourd'hui</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
              <div style={{ fontSize: '24px', color: '#10b981', fontWeight: 'bold' }}>{upcoming.length}</div>
              <div style={{ color: '#94a3b8' }}>À venir</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 'bold' }}>{past.length}</div>
              <div style={{ color: '#94a3b8' }}>Passés</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Médecin</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Heure</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Motif</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{a.patientName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{a.doctor}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{a.time}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{a.reason}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: a.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : a.status === 'cancelled' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: a.status === 'confirmed' ? '#10b981' : a.status === 'cancelled' ? '#f87171' : '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                        {a.status === 'confirmed' ? 'Confirmé' : a.status === 'cancelled' ? 'Annulé' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {a.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => updateStatus(a.id, 'confirmed')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Confirmer</button>
                          <button onClick={() => updateStatus(a.id, 'cancelled')} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Annuler</button>
                        </div>
                      )}
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
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📅 Nouveau rendez-vous</h2>
              <input type="text" placeholder="Nom du patient" value={modal.form.patientName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, patientName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Médecin" value={modal.form.doctor || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, doctor: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date" value={modal.form.date || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, date: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="time" placeholder="Heure" value={modal.form.time || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, time: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Motif" value={modal.form.reason || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, reason: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createAppointment} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Programmer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
