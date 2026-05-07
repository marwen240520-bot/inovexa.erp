"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PayrollPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/hr/payroll', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPayrolls(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const generatePayroll = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/hr/payroll/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPayrolls();
    setMessage('✅ Paie générée !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>💰 Paie & DSN</h1>
              <p style={{ color: '#94a3b8' }}>Paie automatisée et DSN</p>
            </div>
            <button onClick={generatePayroll} style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              Générer la paie
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Période</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total brut</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total net</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Employés</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{p.period}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>{p.grossAmount} €</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>{p.netAmount} €</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{p.employeeCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: p.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: p.status === 'paid' ? '#10b981' : '#f59e0b', padding: '4px 12px', borderRadius: '20px' }}>
                        {p.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
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
