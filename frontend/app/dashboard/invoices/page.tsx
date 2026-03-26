"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LanguageSelector from '@/components/LanguageSelector';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    setLanguage(localStorage.getItem('language') || 'fr');
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/invoices', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setInvoices(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createInvoice = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(modal.form)
    });
    setModal({ open: false, form: {} });
    fetchInvoices();
  };

  const texts = {
    fr: { title: "Factures Tunisiennes", add: "+ Nouvelle facture", client: "Client", matricule: "Matricule Fiscal", amount: "Montant HT", tva: "TVA", total: "Total TTC", banks: "Banques" },
    ar: { title: "الفواتير التونسية", add: "+ فاتورة جديدة", client: "العميل", matricule: "الرقم الضريبي", amount: "المبلغ", tva: "الضريبة", total: "المجموع", banks: "البنوك" },
    en: { title: "Tunisian Invoices", add: "+ New Invoice", client: "Client", matricule: "Tax ID", amount: "Amount", tva: "VAT", total: "Total", banks: "Banks" }
  };
  const t = texts[language] || texts.fr;

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ color: 'white', fontSize: '28px' }}>{t.title}</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <LanguageSelector />
            <button onClick={() => setModal({ open: true, form: {} })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>{t.add}</button>
          </div>
        </div>
        <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t.client}</th><th>{t.matricule}</th><th style={{ textAlign: 'right' }}>{t.amount}</th><th style={{ textAlign: 'right' }}>{t.tva}</th><th style={{ textAlign: 'right' }}>{t.total}</th><th>Actions</th>
             </tr></thead>
            <tbody>{invoices.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '12px', color: 'white' }}>{i.customerName}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{i.customerMatricule || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{i.amountHT}DT</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{i.amountTVA}DT</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{i.amountTTC}DT</td>
                <td style={{ padding: '12px', textAlign: 'center' }}><button style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>🗑️</button></td>
              </tr>
            ))}</tbody>
           </table>
        </div>
      </div>
      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '500px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}>{t.add}</h2>
            <input type="text" placeholder={t.client} value={modal.form.customerName || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, customerName: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            <input type="text" placeholder={t.matricule} value={modal.form.customerMatricule || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, customerMatricule: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            <input type="number" placeholder={t.amount} value={modal.form.amountHT || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, amountHT: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
            <select value={modal.form.tvaRate || 'standard'} onChange={e => setModal({ ...modal, form: { ...modal.form, tvaRate: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
              <option value="standard">TVA 19%</option><option value="reduced">TVA 13%</option><option value="superReduced">TVA 7%</option><option value="zero">TVA 0%</option>
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createInvoice} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Créer</button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
