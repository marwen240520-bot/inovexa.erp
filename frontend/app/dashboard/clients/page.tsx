"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { showToast } from '@/components/ToastProvider';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) router.push('/auth/login');
    const u = JSON.parse(userData || '{}');
    setUser(u);
    
    // Seul l'admin peut accéder à cette page
    if (u.role !== 'admin') {
      router.push('/dashboard');
      showToast.error('Accès non autorisé');
      return;
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/clients', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setClients(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createClient = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(modal.form)
    });
    if (res.ok) {
      setModal({ open: false, form: {} });
      fetchClients();
      showToast.success('Client ajouté');
      
      // Créer un compte utilisateur pour le client
      const userRes = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: modal.form.email,
          password: modal.form.password || 'Client123!',
          firstName: modal.form.name.split(' ')[0] || 'Client',
          lastName: modal.form.name.split(' ')[1] || '',
          role: 'user',
          clientId: (await res.json()).id,
          duration: modal.form.duration
        })
      });
      if (userRes.ok) showToast.success('Compte client créé');
    }
  };

  const deleteClient = async (id) => {
    if (confirm('Supprimer ce client ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/clients/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchClients();
      showToast.success('Client supprimé');
    }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  if (user?.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px' }}>👑 Gestion des Clients</h1>
            <button onClick={() => setModal({ open: true, form: { name: '', email: '', phone: '', company: '', duration: 30, password: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>+ Nouveau client</button>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Société</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Durée</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{c.name} </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.email} </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.phone || '-'} </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.company || '-'} </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.duration || 30} jours</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => deleteClient(c.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '480px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Ajouter un client</h2>
              <input type="text" placeholder="Nom complet" value={modal.form.name} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="email" placeholder="Email" value={modal.form.email} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Téléphone" value={modal.form.phone} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Société" value={modal.form.company} onChange={e => setModal({ ...modal, form: { ...modal.form, company: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Durée du compte (jours)" value={modal.form.duration} onChange={e => setModal({ ...modal, form: { ...modal.form, duration: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="password" placeholder="Mot de passe (défaut: Client123!)" value={modal.form.password} onChange={e => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '24px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createClient} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
