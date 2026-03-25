'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ order_number: '', product: '', quantity: 0, status: 'planned' });

  useEffect(() => { fetchWorkOrders(); }, []);

  const fetchWorkOrders = async () => {
    try { const res = await api.get('/production/work-orders'); setWorkOrders(res.data); } catch (error) { toast.error('Erreur'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/work-orders', formData);
      toast.success('OF créé');
      setIsModalOpen(false);
      setFormData({ order_number: '', product: '', quantity: 0, status: 'planned' });
      fetchWorkOrders();
    } catch (error) { toast.error('Erreur'); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <span className="px-2 py-1 rounded text-xs bg-green-600">Terminé</span>;
    if (status === 'in_progress') return <span className="px-2 py-1 rounded text-xs bg-blue-600">En cours</span>;
    return <span className="px-2 py-1 rounded text-xs bg-yellow-600">Planifié</span>;
  };

  const columns = [
    { key: 'order_number', label: 'N° OF' },
    { key: 'product', label: 'Produit' },
    { key: 'quantity', label: 'Quantité' },
    { key: 'status', label: 'Statut', render: (val: string) => getStatusBadge(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Ordres de Fabrication</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouvel OF</button></div><Table columns={columns} data={workOrders} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvel OF"><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="N° OF" value={formData.order_number} onChange={(e) => setFormData({...formData, order_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="Produit" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="number" placeholder="Quantité" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="planned">Planifié</option><option value="in_progress">En cours</option><option value="completed">Terminé</option></select><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">Créer</button></form></Modal></div></div>
  );
}
