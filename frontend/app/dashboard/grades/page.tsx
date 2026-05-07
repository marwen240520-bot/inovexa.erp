"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function GradesPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [studentsRes, coursesRes, gradesRes] = await Promise.all([
        fetch('http://localhost:3001/students', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/grades', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (gradesRes.ok) setGrades(await gradesRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const addGrade = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchData();
        setMessage('✅ Note ajoutée !');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const getAverage = (studentId) => {
    const studentGrades = grades.filter(g => g.studentId === studentId);
    if (studentGrades.length === 0) return '-';
    const avg = studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length;
    return avg.toFixed(1);
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px' }}>📝 Notes et évaluations</h1>
              <p style={{ color: '#94a3b8' }}>Suivez les résultats des étudiants</p>
            </div>
            <button onClick={() => setModal({ open: true, form: { studentId: '', courseId: '', value: 0, coefficient: 1 } })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Ajouter une note
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Étudiant</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Cours</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Note</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Coefficient</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const studentGrades = grades.filter(g => g.studentId === s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '12px', color: 'white' }}>{s.name}</td>
                      <td style={{ padding: '12px' }}>
                        {studentGrades.map(g => {
                          const course = courses.find(c => c.id === g.courseId);
                          return <div key={g.id} style={{ color: '#94a3b8', marginBottom: '4px' }}>{course?.name || '-'}</div>;
                        })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {studentGrades.map(g => (
                          <div key={g.id} style={{ color: g.value >= 10 ? '#10b981' : '#ef4444', marginBottom: '4px' }}>{g.value}/20</div>
                        ))}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {studentGrades.map(g => (
                          <div key={g.id} style={{ color: '#94a3b8', marginBottom: '4px' }}>{g.coefficient}</div>
                        ))}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ color: getAverage(s.id) >= 10 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {getAverage(s.id)}/20
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>📝 Ajouter une note</h2>
              <select value={modal.form.studentId || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, studentId: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner un étudiant</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={modal.form.courseId || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, courseId: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner un cours</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Note (/20)" value={modal.form.value || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, value: parseFloat(e.target.value) } })} step="0.5" style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Coefficient" value={modal.form.coefficient || 1} onChange={e => setModal({ ...modal, form: { ...modal.form, coefficient: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={addGrade} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enregistrer</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
