"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStudents(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createStudent = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchStudents();
        setMessage('✅ Étudiant ajouté avec succès !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>👨‍🎓 Gestion des Étudiants</h1>
              <p style={{ color: '#94a3b8' }}>Suivez le parcours de vos étudiants</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', email: '', phone: '', level: '', registrationDate: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvel étudiant
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Niveau</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date inscription</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                 </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{s.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.email}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.phone || '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.level || '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{s.registrationDate ? new Date(s.registrationDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: s.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: s.active ? '#10b981' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                        {s.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucun étudiant</p>}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>👨‍🎓 Nouvel étudiant</h2>
              <input type="text" placeholder="Nom complet" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="email" placeholder="Email" value={modal.form.email || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="tel" placeholder="Téléphone" value={modal.form.phone || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Niveau (ex: Licence, Master...)" value={modal.form.level || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, level: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date d'inscription" value={modal.form.registrationDate || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, registrationDate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createStudent} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
