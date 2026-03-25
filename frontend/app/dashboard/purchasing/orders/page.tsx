'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ order_number: '', supplier_id: '', total: 0, status: 'draft' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await api.get('/purchasing/orders'); setOrders(res.data); } catch (error) { toast.error('Erreur'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchasing/orders', formData);
      toast.success('Commande créée');
      setIsModalOpen(false);
      setFormData({ order_number: '', supplier_id: '', total: 0, status: 'draft' });
      fetchOrders();
    } catch (error) { toast.error('Erreur'); }
  };

  const getStatusBadge = (status: string) => {
    const colors = { draft: 'bg-gray-600', sent: 'bg-blue-600', received: 'bg-green-600', cancelled: 'bg-red-600' };
    const labels = { draft: 'Brouillon', sent: 'Envoyé', received: 'Reçu', cancelled: 'Annulé' };
    return <span className={'px-2 py-1 rounded text-xs ' + (colors[status as keyof typeof colors] || 'bg-gray-600')}>{(labels[status as keyof typeof labels] || status)}</span>;
  };

  const columns = [
    { key: 'order_number', label: 'N° Commande' },
    { key: 'supplier_id', label: 'Fournisseur ID' },
    { key: 'total', label: 'Total', render: (val: number) => val + ' TND' },
    { key: 'status', label: 'Statut', render: (val: string) => getStatusBadge(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Commandes Fournisseurs</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouvelle commande</button></div><Table columns={columns} data={orders} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle commande"><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="N° Commande" value={formData.order_number} onChange={(e) => setFormData({...formData, order_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="ID Fournisseur" value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="number" placeholder="Total" value={formData.total} onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="draft">Brouillon</option><option value="sent">Envoyé</option><option value="received">Reçu</option><option value="cancelled">Annulé</option></select><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">Créer</button></form></Modal></div></div>
  );
}
