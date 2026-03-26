"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WorkflowVisualBuilder from '@/components/WorkflowVisualBuilder';
import WhatIfSimulator from '@/components/WhatIfSimulator';

export default function InnovationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workflows');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🚀 Innovations Inovexa</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Les fonctionnalités qui rendent votre ERP unique</p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #222' }}>
            <button onClick={() => setActiveTab('workflows')} style={{ padding: '12px 24px', background: activeTab === 'workflows' ? '#667eea' : 'transparent', color: activeTab === 'workflows' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              ⚡ Workflows visuels
            </button>
            <button onClick={() => setActiveTab('whatif')} style={{ padding: '12px 24px', background: activeTab === 'whatif' ? '#667eea' : 'transparent', color: activeTab === 'whatif' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🔮 Simulateur "What-If"
            </button>
            <button onClick={() => setActiveTab('rfm')} style={{ padding: '12px 24px', background: activeTab === 'rfm' ? '#667eea' : 'transparent', color: activeTab === 'rfm' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              📊 Analyse RFM
            </button>
          </div>

          {activeTab === 'workflows' && <WorkflowVisualBuilder />}
          {activeTab === 'whatif' && <WhatIfSimulator />}
          {activeTab === 'rfm' && (
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>📊 Segmentation clients (RFM)</h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Analysez vos clients par Récence, Fréquence et Montant</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px', marginBottom: '24px' }}>
                {['🌟 Champions', '⭐ Fidèles', '📈 Potentiels', '⚠️ À risque', '💀 Perdus'].map((segment, i) => (
                  <div key={i} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{segment.split(' ')[0]}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{segment}</div>
                    <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{Math.floor(Math.random() * 30)}</div>
                  </div>
                ))}
              </div>
              <button style={{ background: '#667eea', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Lancer l'analyse</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
