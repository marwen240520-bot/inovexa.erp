"use client";
import { useState } from 'react';

export default function WhatIfSimulator() {
  const [scenario, setScenario] = useState({
    priceChange: 0,
    costChange: 0,
    marketingBudget: 1000,
    newCustomers: 0
  });
  const [results, setResults] = useState(null);

  const simulate = () => {
    const currentRevenue = 125000;
    const currentProfit = 80000;
    
    const newRevenue = currentRevenue * (1 + scenario.priceChange / 100) * (1 + scenario.newCustomers / 100);
    const newCost = currentRevenue * 0.36 * (1 - scenario.costChange / 100);
    const newProfit = newRevenue - newCost - scenario.marketingBudget;
    const roi = ((newProfit - currentProfit) / scenario.marketingBudget * 100).toFixed(1);
    
    setResults({
      revenue: Math.round(newRevenue),
      profit: Math.round(newProfit),
      growth: ((newProfit - currentProfit) / currentProfit * 100).toFixed(1),
      roi
    });
  };

  return (
    <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>🔮 Simulateur "What-If"</h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Testez l'impact de vos décisions</p>

      <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
        <div><label style={{ color: '#94a3b8' }}>Variation des prix (%)</label>
        <input type="range" min="-20" max="50" value={scenario.priceChange} onChange={e => setScenario({...scenario, priceChange: parseInt(e.target.value)})} style={{ width: '100%' }} />
        <div style={{ color: 'white' }}>{scenario.priceChange > 0 ? '+' : ''}{scenario.priceChange}%</div></div>
        
        <div><label style={{ color: '#94a3b8' }}>Réduction des coûts (%)</label>
        <input type="range" min="0" max="30" value={scenario.costChange} onChange={e => setScenario({...scenario, costChange: parseInt(e.target.value)})} style={{ width: '100%' }} />
        <div style={{ color: 'white' }}>-{scenario.costChange}%</div></div>
        
        <div><label style={{ color: '#94a3b8' }}>Nouveaux clients</label>
        <input type="range" min="0" max="100" value={scenario.newCustomers} onChange={e => setScenario({...scenario, newCustomers: parseInt(e.target.value)})} style={{ width: '100%' }} />
        <div style={{ color: 'white' }}>+{scenario.newCustomers} clients</div></div>
        
        <div><label style={{ color: '#94a3b8' }}>Budget marketing (€)</label>
        <input type="range" min="0" max="5000" step="100" value={scenario.marketingBudget} onChange={e => setScenario({...scenario, marketingBudget: parseInt(e.target.value)})} style={{ width: '100%' }} />
        <div style={{ color: 'white' }}>{scenario.marketingBudget}€</div></div>
      </div>

      <button onClick={simulate} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '24px' }}>Simuler</button>

      {results && (
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><div style={{ color: '#94a3b8' }}>CA projeté</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{results.revenue}€</div></div>
            <div><div style={{ color: '#94a3b8' }}>Bénéfice</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: results.growth > 0 ? '#10b981' : '#ef4444' }}>{results.profit}€</div></div>
            <div><div style={{ color: '#94a3b8' }}>Croissance</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: results.growth > 0 ? '#10b981' : '#ef4444' }}>{results.growth}%</div></div>
            <div><div style={{ color: '#94a3b8' }}>ROI marketing</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{results.roi}%</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
