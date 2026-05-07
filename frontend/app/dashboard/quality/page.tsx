"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function QualityPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/quality/inspections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInspections(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createInspection = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/quality/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchInspections();
        setMessage('✅ Inspection enregistrée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  const passedInspections = inspections.filter(i => i.result === 'passed');
  const failedInspections = inspections.filter(i => i.result === 'failed');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>✅ Contrôle Qualité</h1>
              <p style={{ color: '#94a3b8' }}>Suivi des inspections et contrôles qualité</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { productName: '', batchNumber: '', inspector: '', result: 'pending' } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouvelle inspection
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{passedInspections.length}</div>
              <div style={{ color: '#94a3b8' }}>Inspections conformes</div>
            </div>
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>❌</div>
              <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: 'bold' }}>{failedInspections.length}</div>
              <div style={{ color: '#94a3b8' }}>Non-conformités</div>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Lot</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Inspecteur</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Résultat</th>
                 </tr>
              </thead>
              <tbody>
                {inspections.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{i.productName}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{i.batchNumber}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{i.inspector}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(i.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: i.result === 'passed' ? 'rgba(16,185,129,0.2)' : i.result === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: i.result === 'passed' ? '#10b981' : i.result === 'failed' ? '#ef4444' : '#f59e0b', padding: '4px 12px', borderRadius: '20px' }}>
                        {i.result === 'passed' ? 'Conforme' : i.result === 'failed' ? 'Non conforme' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inspections.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune inspection</p>}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>✅ Nouvelle inspection</h2>
              <input type="text" placeholder="Nom du produit" value={modal.form.productName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Numéro de lot" value={modal.form.batchNumber || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, batchNumber: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Inspecteur" value={modal.form.inspector || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, inspector: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="date" placeholder="Date" value={modal.form.date || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, date: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <select value={modal.form.result || 'pending'} onChange={e => setModal({ ...modal, form: { ...modal.form, result: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="pending">En attente</option>
                <option value="passed">Conforme</option>
                <option value="failed">Non conforme</option>
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createInspection} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enregistrer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
