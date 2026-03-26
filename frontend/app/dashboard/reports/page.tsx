"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('products');
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchData();
  }, [reportType]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/${reportType}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    let csv = Object.keys(data[0]).join(',') + '\n';
    data.forEach(item => {
      const values = Object.values(item).map(v => {
        if (typeof v === 'object') return JSON.stringify(v);
        if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
        return v;
      });
      csv += values.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Export réussi !');
  };

  const exportToPDF = () => {
    window.print();
  };

  const getReportTitle = () => {
    const titles = {
      products: 'Rapport des Produits',
      invoices: 'Rapport des Factures',
      orders: 'Rapport des Commandes',
      employees: 'Rapport des Employés',
      suppliers: 'Rapport des Fournisseurs',
      clients: 'Rapport des Clients'
    };
    return titles[reportType] || 'Rapport';
  };

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  const totalAmount = data.reduce((sum, item) => sum + (item.amount || item.total || item.price || item.salary || 0), 0);
  const totalCount = data.length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📄 Rapports</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Générez et exportez vos rapports personnalisés</p>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
              <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ background: '#1e293b', color: 'white', padding: '10px 16px', border: '1px solid #334155', borderRadius: '10px' }}>
                <option value="products">Produits</option>
                <option value="invoices">Factures</option>
                <option value="orders">Commandes</option>
                <option value="employees">Employés</option>
                <option value="suppliers">Fournisseurs</option>
                <option value="clients">Clients</option>
              </select>
              <button onClick={exportToExcel} style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                📊 Exporter Excel
              </button>
              <button onClick={exportToPDF} style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                📄 Exporter PDF
              </button>
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>{getReportTitle()}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: '#94a3b8' }}>Total</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{totalCount}</div>
              </div>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: '#94a3b8' }}>Montant total</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{totalAmount}€</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                    {data[0] && Object.keys(data[0]).slice(0, 5).map(key => (
                      <th key={key} style={{ padding: '12px', textAlign: 'left' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 20).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      {Object.values(item).slice(0, 5).map((val, j) => (
                        <td key={j} style={{ padding: '12px', color: '#94a3b8' }}>
                          {typeof val === 'object' ? JSON.stringify(val).substring(0, 50) : String(val).substring(0, 50)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune donnée disponible</p>}
              {data.length > 20 && <p style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>Affichage des 20 premiers résultats sur {data.length}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
