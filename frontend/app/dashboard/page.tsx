'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    finance: { totalRevenue: 0, totalInvoices: 0 },
    inventory: { totalProducts: 0, lowStock: 0 },
    hr: { totalEmployees: 0, pendingLeaves: 0 },
    sales: { totalCustomers: 0, conversionRate: 0 }
  });

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [finance, inventory, hr, sales] = await Promise.all([
        api.get('/finance/dashboard').then(res => res.data),
        api.get('/inventory/stock/status').then(res => res.data),
        api.get('/hr/dashboard').then(res => res.data),
        api.get('/sales/dashboard').then(res => res.data),
      ]);
      setStats({ finance, inventory, hr, sales });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Chargement...</div></div>;
  if (!user) return null;

  const modules = [
    { name: 'Finance', icon: '💰', href: '/dashboard/finance/invoices', stats: stats.finance.totalRevenue?.toLocaleString() + ' DT' },
    { name: 'Inventory', icon: '📦', href: '/dashboard/inventory/products', stats: stats.inventory.totalProducts + ' produits' },
    { name: 'HR', icon: '👥', href: '/dashboard/hr/employees', stats: stats.hr.totalEmployees + ' employés' },
    { name: 'Sales', icon: '📈', href: '/dashboard/sales/customers', stats: stats.sales.totalCustomers + ' clients' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Déconnexion</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6"><p className="text-purple-200 text-sm">Chiffre d'affaires</p><p className="text-3xl font-bold text-white mt-2">{stats.finance.totalRevenue?.toLocaleString()} DT</p></div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6"><p className="text-blue-200 text-sm">Produits en stock</p><p className="text-3xl font-bold text-white mt-2">{stats.inventory.totalProducts}</p></div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6"><p className="text-green-200 text-sm">Employés</p><p className="text-3xl font-bold text-white mt-2">{stats.hr.totalEmployees}</p></div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6"><p className="text-orange-200 text-sm">Clients</p><p className="text-3xl font-bold text-white mt-2">{stats.sales.totalCustomers}</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {modules.map((module, i) => (
            <Link key={i} href={module.href} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition">
              <div className="text-4xl mb-4">{module.icon}</div>
              <h4 className="text-lg font-semibold text-white">{module.name}</h4>
              <p className="text-2xl font-bold text-white mt-2">{module.stats}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
