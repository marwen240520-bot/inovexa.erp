"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPatients(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createPatient = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchPatients();
        setMessage('✅ Patient ajouté avec succès !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>👨‍⚕️ Gestion des Patients</h1>
              <p style={{ color: '#94a3b8' }}>Suivez le dossier médical de vos patients</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', email: '', phone: '', birthDate: '', bloodType: '', allergies: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau patient
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date naissance</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Groupe sanguin</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Allergies</th>
                 </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{p.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.email}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.phone || '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.bloodType || '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.allergies || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucun patient</p>}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '500px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>👨‍⚕️ Nouveau patient</h2>
              <input type="text" placeholder="Nom complet" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="email" placeholder="Email" value={modal.form.email || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="tel" placeholder="Téléphone" value={modal.form.phone || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date de naissance" value={modal.form.birthDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, birthDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.bloodType || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, bloodType: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Groupe sanguin</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <textarea placeholder="Allergies" value={modal.form.allergies || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, allergies: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '80px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createPatient} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
