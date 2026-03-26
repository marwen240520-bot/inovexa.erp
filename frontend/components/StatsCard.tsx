"use client";
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function StatsCard({ title, value, icon, color, change, period }) {
  const isPositive = change > 0;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(255,255,255,0.05)',
      transition: 'transform 0.3s, box-shadow 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', color: '#94a3b8' }}>{title}</span>
        <span style={{ fontSize: '32px', color: color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          {Math.abs(change)}%
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{period}</span>
      </div>
    </div>
  );
}
