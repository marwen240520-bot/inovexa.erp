'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  credit_limit: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', tax_number: '', credit_limit: 0 });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { const res = await api.get('sales/customers'); setCustomers(res.data); } catch (error) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) { await api.put(sales/customers/, formData); toast.success('Client modifié'); }
      else { await api.post('sales/customers', formData); toast.success('Client créé'); }
      setIsModalOpen(false); setEditingCustomer(null); setFormData({ name: '', email: '', phone: '', address: '', tax_number: '', credit_limit: 0 }); fetchCustomers();
    } catch (error) { toast.error('Erreur'); }
  };

  const handleDelete = async (customer: Customer) => { if (confirm('Supprimer ?')) { try { await api.delete(sales/customers/); toast.success('Supprimé'); fetchCustomers(); } catch (error) { toast.error('Erreur'); } } };

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'credit_limit', label: 'Crédit', render: (val: number) => formatCurrency(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Clients</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouveau client</button></div><Table columns={columns} data={customers} onEdit={setEditingCustomer} onDelete={handleDelete} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Modifier client' : 'Nouveau client'}><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Nom" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="Adresse" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="N° Fiscal" value={formData.tax_number} onChange={(e) => setFormData({...formData, tax_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="number" placeholder="Limite crédit" value={formData.credit_limit} onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">{editingCustomer ? 'Modifier' : 'Créer'}</button></form></Modal></div></div>
  );
}
