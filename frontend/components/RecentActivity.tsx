"use client";
import { FaUserPlus, FaShoppingCart, FaFileInvoice, FaBoxOpen } from 'react-icons/fa';

export default function RecentActivity({ activities }) {
  const getIcon = (type) => {
    const icons = {
      user: <FaUserPlus />,
      order: <FaShoppingCart />,
      invoice: <FaFileInvoice />,
      product: <FaBoxOpen />
    };
    return icons[type] || <FaUserPlus />;
  };

  return (
    <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
      <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>📋 Activités récentes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map((act, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1e293b', borderRadius: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(102,126,234,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667eea' }}>
              {getIcon(act.type)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontSize: '14px', marginBottom: '4px' }}>{act.message}</p>
              <p style={{ color: '#64748b', fontSize: '11px' }}>{act.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
