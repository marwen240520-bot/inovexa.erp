'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Package, Users, ShoppingCart, Factory, Truck, Bot, Settings, Bell, Calendar, Shield, UserCog, ShoppingBag, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Finance', icon: Wallet, href: '/dashboard/finance/invoices' },
  { name: 'Inventory', icon: Package, href: '/dashboard/inventory/products' },
  { name: 'HR', icon: Users, href: '/dashboard/hr/employees' },
  { name: 'Sales', icon: ShoppingCart, href: '/dashboard/sales/customers' },
  { name: 'Production', icon: Factory, href: '/dashboard/production/bom' },
  { name: 'Purchasing', icon: ShoppingBag, href: '/dashboard/purchasing/orders' },
  { name: 'Logistics', icon: Truck, href: '/dashboard/logistics/shipments' },
  { name: 'Quality', icon: CheckCircle, href: '/dashboard/production/quality' },
  { name: 'AI Assistant', icon: Bot, href: '/dashboard/ai' },
  { name: 'Users', icon: UserCog, href: '/dashboard/users' },
  { name: 'Roles', icon: Shield, href: '/dashboard/users/roles' },
  { name: 'Notifications', icon: Bell, href: '/dashboard/notifications' },
  { name: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-gray-800 min-h-screen border-r border-gray-700 fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Inovexa-AI</h2>
        <p className="text-gray-500 text-xs mt-1">ERP System v3.0 - Complete</p>
      </div>
      <nav className="p-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={index} href={item.href} className={'flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition ' + (isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white')}>
              <Icon size={20} /><span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg mt-4 text-red-400 hover:bg-gray-700 transition">
          <LogOut size={20} /><span className="text-sm font-medium">Déconnexion</span>
        </button>
      </nav>
    </div>
  );
}
