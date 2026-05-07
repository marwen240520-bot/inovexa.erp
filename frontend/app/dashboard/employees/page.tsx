"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) router.push('/auth/login');
    if (user.role !== 'client') router.push('/dashboard');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/client/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEmployees(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createEmployee = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/client/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      const data = await res.json();
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchEmployees();
        showMessage('✅ Employé créé avec succès !', 'success');
      } else {
        showMessage(`❌ ${data.error || 'Erreur lors de la création'}`, 'error');
      }
    } catch(e) { 
      showMessage('❌ Erreur de connexion au serveur', 'error');
    }
  };

  const toggleEmployee = async (id, isActive) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/client/employees/${id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEmployees();
        showMessage(isActive ? '✅ Employé désactivé' : '✅ Employé activé', 'success');
      }
    } catch(e) { console.error(e); }
  };

  const deleteEmployee = async (id) => {
    if (confirm('⚠️ Supprimer définitivement cet employé ?')) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:3001/client/employees/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchEmployees();
          showMessage('✅ Employé supprimé', 'success');
        }
      } catch(e) { console.error(e); }
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Chargement...</div>;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ color: '#667eea', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Retour au tableau de bord
          </Link>
          <h1 style={{ color: 'white', fontSize: '28px', marginTop: '16px' }}>👥 Gestion des employés</h1>
          <p style={{ color: '#94a3b8' }}>Créez des employés qui pourront gérer vos commandes</p>
        </div>

        {message && (
          <div style={{ 
            background: messageType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
            border: `1px solid ${messageType === 'success' ? '#10b981' : '#ef4444'}`, 
            color: messageType === 'success' ? '#10b981' : '#f87171', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '20px', 
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Total employés: </span>
            <span style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>{employees.length}</span>
          </div>
          <button 
            onClick={() => setModal({ open: true, form: { name: '', email: '', password: '', phone: '' } })}
            style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
          >
            + Nouvel employé
          </button>
        </div>

        <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Date création</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                   </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '16px', color: 'white' }}>{e.name}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{e.email}</td>
                    <td style={{ padding: '16px', color: '#94a3b8' }}>{e.phone || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        background: e.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', 
                        color: e.isActive ? '#10b981' : '#f87171', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px'
                      }}>
                        {e.isActive ? '🟢 Actif' : '🔴 Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => toggleEmployee(e.id, e.isActive)}
                          style={{ 
                            background: e.isActive ? '#f59e0b' : '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            padding: '6px 12px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {e.isActive ? '🔒 Désactiver' : '🔓 Activer'}
                        </button>
                        <button 
                          onClick={() => deleteEmployee(e.id)}
                          style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                Aucun employé pour le moment
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>ℹ️ Information</h3>
          <p style={{ color: '#94a3b8' }}>
            Les employés créés pourront se connecter avec leurs identifiants et auront accès uniquement au module de gestion des commandes.
            Ils pourront visualiser, créer et modifier les commandes de votre entreprise.
          </p>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>👥 Nouvel employé</h2>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Nom complet *</label>
              <input 
                type="text" 
                placeholder="Jean Dupont" 
                value={modal.form.name || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Email *</label>
              <input 
                type="email" 
                placeholder="employe@email.com" 
                value={modal.form.email || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Mot de passe *</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={modal.form.password || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Téléphone</label>
              <input 
                type="tel" 
                placeholder="+33 6 12 34 56 78" 
                value={modal.form.phone || ''} 
                onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} 
                style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createEmployee} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                Créer l'employé
              </button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
