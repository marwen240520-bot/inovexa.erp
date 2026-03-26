"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import WorkflowVisualBuilder from '@/components/WorkflowVisualBuilder';
import WhatIfSimulator from '@/components/WhatIfSimulator';

export default function InnovationsPage() {
  const [activeTab, setActiveTab] = useState('workflows');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🚀 Innovations Inovexa</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Ce qui rend votre ERP unique</p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #222' }}>
            <button onClick={() => setActiveTab('workflows')} style={{ padding: '12px 24px', background: activeTab === 'workflows' ? '#667eea' : 'transparent', color: activeTab === 'workflows' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              ⚡ Workflows visuels
            </button>
            <button onClick={() => setActiveTab('whatif')} style={{ padding: '12px 24px', background: activeTab === 'whatif' ? '#667eea' : 'transparent', color: activeTab === 'whatif' ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🔮 Simulateur "What-If"
            </button>
          </div>

          {activeTab === 'workflows' && <WorkflowVisualBuilder />}
          {activeTab === 'whatif' && <WhatIfSimulator />}
        </div>
      </div>
    </div>
  );
}
