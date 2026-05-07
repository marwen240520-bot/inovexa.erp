"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPrescriptions(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createPrescription = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchPrescriptions();
        setMessage('✅ Prescription enregistrée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>💊 Prescriptions</h1>
              <p style={{ color: '#94a3b8' }}>Gérez les prescriptions médicales</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { patientName: '', medication: '', dosage: '', duration: '', doctor: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle prescription
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Médicament</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Posologie</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Durée</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Médecin</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                  </tr>
              </thead>
              <tbody>
                {prescriptions.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{p.patientName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.medication}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.dosage}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.duration} jours</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.doctor}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: p.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: p.active ? '#10b981' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                        {p.active ? 'En cours' : 'Terminée'}
                      </span>
                     </span>
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
              <h2 style={{ color: 'white', marginBottom: '24px' }}>💊 Nouvelle prescription</h2>
              <input type="text" placeholder="Nom du patient" value={modal.form.patientName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, patientName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Médicament" value={modal.form.medication || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, medication: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Posologie" value={modal.form.dosage || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, dosage: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Durée (jours)" value={modal.form.duration || 7} onChange={e => setModal({ ...modal, form: { ...modal.form, duration: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Médecin prescripteur" value={modal.form.doctor || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, doctor: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createPrescription} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enregistrer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
