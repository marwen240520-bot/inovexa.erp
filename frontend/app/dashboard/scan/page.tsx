"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ScanPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [documentType, setDocumentType] = useState('invoice');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setScanning(true);
      const text = "Facture n° INV-001\nClient: Tech SARL\nTotal: 1250€";
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: documentType, text })
      });
      if (res.ok) setResult(await res.json());
      setScanning(false);
    }
  };

  const createFromScan = () => {
    alert(`✅ Création automatique de ${documentType} lancée !`);
    setResult(null);
    setFile(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '32px' }}>📄 Scan IA de documents</h1>

          <div style={{ background: '#111', borderRadius: '20px', padding: '32px', border: '1px solid #222', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📎</div>
            <h2 style={{ color: 'white', marginBottom: '12px' }}>Glissez-déposez un document</h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Facture, commande, reçu...</p>
            
            <select value={documentType} onChange={e => setDocumentType(e.target.value)} style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white', marginBottom: '20px' }}>
              <option value="invoice">📄 Facture</option>
              <option value="order">📝 Commande</option>
            </select>
            
            <button onClick={() => fileInputRef.current.click()} style={{ background: '#667eea', color: 'white', padding: '12px 32px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              📁 Sélectionner un fichier
            </button>
            <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} />

            {scanning && <p style={{ marginTop: '32px', color: '#94a3b8' }}>Analyse du document en cours...</p>}

            {result && (
              <div style={{ marginTop: '32px', background: '#1e293b', padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ color: '#10b981', marginBottom: '16px' }}>✅ Document analysé</h3>
                {Object.entries(result.extracted).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8' }}>{key}:</span>
                    <span style={{ color: 'white' }}>{val || '—'}</span>
                  </div>
                ))}
                <button onClick={createFromScan} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  📝 Créer {documentType}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
