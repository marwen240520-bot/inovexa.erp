"use client";
import { useState } from 'react';

export default function WorkflowVisualBuilder() {
  const [nodes, setNodes] = useState([
    { id: 'trigger', type: 'trigger', label: 'Déclencheur', x: 100, y: 200, config: { trigger: 'new_order' } },
    { id: 'action', type: 'action', label: 'Action', x: 600, y: 200, config: { action: 'send_notification' } }
  ]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);

  const triggers = [
    { id: 'new_order', label: '📝 Nouvelle commande' },
    { id: 'low_stock', label: '⚠️ Stock bas' },
    { id: 'invoice_due', label: '💰 Facture due' },
    { id: 'new_customer', label: '👥 Nouveau client' },
    { id: 'payment_received', label: '💳 Paiement reçu' }
  ];

  const actions = [
    { id: 'send_notification', label: '🔔 Notification' },
    { id: 'send_email', label: '📧 Email' },
    { id: 'create_invoice', label: '📄 Créer facture' },
    { id: 'update_stock', label: '📦 Mettre à jour stock' },
    { id: 'call_webhook', label: '🔌 Appel Webhook' }
  ];

  const nodeTypes = {
    trigger: { bg: '#667eea', icon: '⚡', width: 180, height: 80 },
    action: { bg: '#10b981', icon: '🎯', width: 180, height: 80 }
  };

  const addNode = (type) => {
    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      label: type === 'trigger' ? 'Nouveau déclencheur' : 'Nouvelle action',
      x: 100 + nodes.length * 350,
      y: 200,
      config: {}
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const saveWorkflow = () => {
    const workflow = {
      id: Date.now(),
      name: `Workflow ${savedWorkflows.length + 1}`,
      nodes,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedWorkflows([...savedWorkflows, workflow]);
    alert('Workflow sauvegardé !');
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: '20px', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => addNode('trigger')} style={{ background: '#667eea', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>⚡ Ajouter déclencheur</button>
        <button onClick={() => addNode('action')} style={{ background: '#10b981', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🎯 Ajouter action</button>
        <button onClick={saveWorkflow} style={{ background: '#f59e0b', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>💾 Sauvegarder</button>
      </div>

      <div style={{ position: 'relative', minHeight: '400px', background: '#0f172a', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {nodes.slice(0, -1).map((node, i) => {
            const nextNode = nodes[i + 1];
            if (nextNode) {
              return (
                <line
                  key={`line-${i}`}
                  x1={node.x + nodeTypes[node.type].width / 2}
                  y1={node.y + nodeTypes[node.type].height / 2}
                  x2={nextNode.x + nodeTypes[nextNode.type].width / 2}
                  y2={nextNode.y + nodeTypes[nextNode.type].height / 2}
                  stroke="#667eea"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            }
            return null;
          })}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: nodeTypes[node.type].width,
              height: nodeTypes[node.type].height,
              background: nodeTypes[node.type].bg,
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
              boxShadow: selectedNode === node.id ? '0 0 0 2px white' : 'none'
            }}
            onClick={() => { setSelectedNode(node); setShowConfig(true); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '20px' }}>{nodeTypes[node.type].icon}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px' }}>×</button>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '8px', color: 'white' }}>{node.label}</div>
            {node.config.trigger && <div style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.7)' }}>{triggers.find(t => t.id === node.config.trigger)?.label}</div>}
            {node.config.action && <div style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.7)' }}>{actions.find(a => a.id === node.config.action)?.label}</div>}
          </div>
        ))}
      </div>

      {showConfig && selectedNode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}>Configurer {selectedNode.type}</h2>
            {selectedNode.type === 'trigger' && (
              <select value={selectedNode.config.trigger || ''} onChange={e => {
                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, trigger: e.target.value } } : n));
                setShowConfig(false);
              }} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner...</option>
                {triggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            )}
            {selectedNode.type === 'action' && (
              <select value={selectedNode.config.action || ''} onChange={e => {
                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, action: e.target.value } } : n));
                setShowConfig(false);
              }} style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }}>
                <option value="">Sélectionner...</option>
                {actions.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            )}
            <button onClick={() => setShowConfig(false)} style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {savedWorkflows.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ color: 'white', marginBottom: '12px' }}>📁 Workflows sauvegardés</h3>
          {savedWorkflows.map(w => (
            <div key={w.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'white' }}>{w.name}</span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>{w.createdAt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
