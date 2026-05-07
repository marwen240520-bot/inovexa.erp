"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MedicalPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
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

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📋 Dossiers médicaux</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Consultez les dossiers médicaux des patients</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {patients.map(p => (
              <div key={p.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', cursor: 'pointer' }} onClick={() => setSelectedPatient(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '32px' }}>👨‍⚕️</div>
                  <div>
                    <h3 style={{ color: 'white', margin: 0 }}>{p.name}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : 'Date non renseignée'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '10px' }}>Groupe sanguin</div>
                    <div style={{ color: 'white', fontSize: '14px' }}>{p.bloodType || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '10px' }}>Allergies</div>
                    <div style={{ color: 'white', fontSize: '14px' }}>{p.allergies || '-'}</div>
                  </div>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>📝 Dernières notes</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{p.medicalHistory?.substring(0, 100) || 'Aucune note médicale'}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedPatient && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedPatient(null)}>
              <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '550px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ color: 'white', marginBottom: '24px' }}>📋 Dossier médical</h2>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Nom complet</div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{selectedPatient.name}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Date de naissance</div>
                    <div style={{ color: 'white' }}>{selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Groupe sanguin</div>
                    <div style={{ color: 'white' }}>{selectedPatient.bloodType || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Email</div>
                    <div style={{ color: 'white' }}>{selectedPatient.email}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Téléphone</div>
                    <div style={{ color: 'white' }}>{selectedPatient.phone || '-'}</div>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Allergies</div>
                  <div style={{ color: '#f87171' }}>{selectedPatient.allergies || 'Aucune allergie connue'}</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Antécédents médicaux</div>
                  <div style={{ color: 'white', background: '#1a1a1a', padding: '12px', borderRadius: '10px' }}>{selectedPatient.medicalHistory || 'Aucun antécédent'}</div>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
