"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/employees', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEmployees(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createEmployee = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchEmployees();
        setMessage({ text: '✅ Employé ajouté !', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const deleteEmployee = async (id) => {
    if (confirm('Supprimer cet employé ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/employees/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchEmployees();
      setMessage({ text: '✅ Employé supprimé', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    }
  };

  const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0);

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px' }}>👔 Gestion des Employés</h1>
            <button onClick={() => setModal({ open: true, form: { firstName: '', lastName: '', email: '', position: '', salary: 0 } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>+ Nouvel employé</button>
          </div>

          {message.text && (
            <div style={{ background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, color: message.type === 'success' ? '#10b981' : '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px' }}>
              <div style={{ color: '#94a3b8' }}>Total employés</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{employees.length}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px' }}>
              <div style={{ color: '#94a3b8' }}>Masse salariale</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{totalSalary}€</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Prénom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Poste</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Salaire</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{e.firstName}</td>
                    <td style={{ padding: '12px', color: 'white' }}>{e.lastName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.email}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.position}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{e.salary}€</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => deleteEmployee(e.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>🗑️</button>
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
              <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Ajouter un employé</h2>
              <input type="text" placeholder="Prénom" value={modal.form.firstName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, firstName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Nom" value={modal.form.lastName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, lastName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="email" placeholder="Email" value={modal.form.email || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Poste" value={modal.form.position || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, position: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Salaire (€)" value={modal.form.salary || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, salary: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createEmployee} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
