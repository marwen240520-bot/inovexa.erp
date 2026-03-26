"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/products', label: 'Produits', icon: '📦' },
    { path: '/dashboard/invoices', label: 'Factures', icon: '💰' },
    { path: '/dashboard/orders', label: 'Commandes', icon: '📝' },
    { path: '/dashboard/ai', label: 'IA Assistant', icon: '🤖' },
    { path: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
    { path: '/dashboard/reports', label: 'Rapports', icon: '📄' },
    { path: '/dashboard/settings', label: 'Paramètres', icon: '⚙️' }
  ];

  const adminMenu = { path: '/admin/clients', label: 'Admin - Clients', icon: '👑' };

  return (
    <div style={{ width: sidebarOpen ? '280px' : '80px', background: '#111', borderRight: '1px solid #222', transition: '0.3s', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" style={{ width: '32px', height: '32px' }} />
        {sidebarOpen && <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Inovexa ERP</span>}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
      <nav style={{ padding: '20px' }}>
        {menuItems.map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: '12px 16px', marginBottom: '8px', borderRadius: '12px', background: pathname === item.path ? 'rgba(102,126,234,0.2)' : 'transparent', color: pathname === item.path ? '#667eea' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </div>
        ))}
        {user?.role === 'admin' && (
          <div key={adminMenu.path} onClick={() => router.push(adminMenu.path)} style={{ padding: '12px 16px', marginTop: '20px', borderRadius: '12px', background: pathname === adminMenu.path ? 'rgba(102,126,234,0.2)' : 'transparent', color: pathname === adminMenu.path ? '#667eea' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #222', paddingTop: '20px' }}>
            <span>{adminMenu.icon}</span>
            {sidebarOpen && <span>{adminMenu.label}</span>}
          </div>
        )}
      </nav>
    </div>
  );
}
