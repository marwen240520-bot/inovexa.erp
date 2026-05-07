"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function CRMPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setClients(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createClient = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchClients();
        setMessage('✅ Client ajouté au CRM !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>👥 CRM - Gestion de la Relation Client</h1>
              <p style={{ color: '#94a3b8' }}>Suivez et gérez l'ensemble de vos relations clients</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', email: '', phone: '', address: '', company: '' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau contact
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un client par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white' }}
            />
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Société</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {filteredClients.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{c.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.email}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.phone || '-'}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{c.company || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => setSelectedClient(c)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', marginRight: '5px', cursor: 'pointer' }}>
                        📧
                      </button>
                      <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
                        📞
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucun contact dans le CRM</p>}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Nouveau contact</h2>
              <input type="text" placeholder="Nom complet" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="email" placeholder="Email" value={modal.form.email || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="tel" placeholder="Téléphone" value={modal.form.phone || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Société" value={modal.form.company || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, company: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <textarea placeholder="Adresse" value={modal.form.address || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, address: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '80px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createClient} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {selectedClient && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedClient(null)}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '400px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>📧 Envoyer un email</h2>
              <input type="email" value={selectedClient.email} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} readOnly />
              <textarea placeholder="Votre message..." style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '120px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Envoyer</button>
                <button onClick={() => setSelectedClient(null)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
