"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    if (userData) setUser(JSON.parse(userData));
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [invoicesRes, projectsRes] = await Promise.all([
        fetch('http://localhost:3001/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/projects', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🌐 Mon espace client</h1>
            <p style={{ color: '#94a3b8' }}>Bienvenue {user?.name}, voici vos informations</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📁</div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Projets en cours</h3>
              <div style={{ fontSize: '28px', color: '#667eea', fontWeight: 'bold' }}>{projects.length}</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🧾</div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Factures impayées</h3>
              <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{invoices.filter(i => i.status !== 'paid').length}</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Notifications</h3>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>3</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', marginBottom: '24px' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>📁 Mes projets</h2>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '16px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{p.description}</div>
                  </div>
                  <div style={{ background: p.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: p.status === 'completed' ? '#10b981' : '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {p.status === 'completed' ? 'Terminé' : 'En cours'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>🧾 Mes factures</h2>
            {invoices.map(i => (
              <div key={i.id} style={{ padding: '16px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white' }}>Facture #{i.id}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(i.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>{i.amountTTC} €</div>
                  <div>
                    <span style={{ background: i.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: i.status === 'paid' ? '#10b981' : '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                      {i.status === 'paid' ? 'Payée' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
