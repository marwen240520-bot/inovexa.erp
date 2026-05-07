"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/hr/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEmployees(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createEmployee = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchEmployees();
        setMessage('✅ Employé ajouté !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>👥 Personnel</h1>
              <p style={{ color: '#94a3b8' }}>Gestion administrative du personnel</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', email: '', position: '', department: '', hireDate: '', salary: 0 } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvel employé
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Poste</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Département</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Salaire</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{e.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.email}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.position}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{e.department}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#10b981' }}>{e.salary} €</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>✏️</button>
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
