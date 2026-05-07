"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCourses(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createCourse = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchCourses();
        setMessage('✅ Cours ajouté !');
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
              <h1 style={{ color: 'white', fontSize: '28px' }}>📚 Cours</h1>
              <p style={{ color: '#94a3b8' }}>Gérez les cours et programmes</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { name: '', teacher: '', schedule: '', duration: '', credits: 0 } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau cours
            </button>
          </div>

          {message && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {courses.map(c => (
              <div key={c.id} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📚</div>
                <h3 style={{ color: 'white', marginBottom: '8px' }}>{c.name}</h3>
                <div style={{ color: '#94a3b8', marginBottom: '8px' }}>👨‍🏫 {c.teacher}</div>
                <div style={{ color: '#94a3b8', marginBottom: '8px' }}>⏰ {c.schedule}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <span style={{ color: '#10b981' }}>{c.duration} heures</span>
                  <span style={{ color: '#f59e0b' }}>{c.credits} crédits</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📚 Nouveau cours</h2>
              <input type="text" placeholder="Nom du cours" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Enseignant" value={modal.form.teacher || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, teacher: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="Horaire (ex: Lundi 14h-16h)" value={modal.form.schedule || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, schedule: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Durée (heures)" value={modal.form.duration || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, duration: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Crédits ECTS" value={modal.form.credits || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, credits: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createCourse} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
