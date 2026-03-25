'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ shipment_number: '', tracking_number: '', status: 'pending' });

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    try { const res = await api.get('logistics/shipments'); setShipments(res.data); } catch (error) { toast.error('Erreur'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('logistics/shipments', formData);
      toast.success('Expédition créée');
      setIsModalOpen(false);
      setFormData({ shipment_number: '', tracking_number: '', status: 'pending' });
      fetchShipments();
    } catch (error) { toast.error('Erreur'); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'delivered') return <span className="px-2 py-1 rounded text-xs bg-green-600">Livré</span>;
    if (status === 'shipped') return <span className="px-2 py-1 rounded text-xs bg-blue-600">Expédié</span>;
    return <span className="px-2 py-1 rounded text-xs bg-yellow-600">En attente</span>;
  };

  const columns = [
    { key: 'shipment_number', label: 'N° Expédition' },
    { key: 'tracking_number', label: 'N° Tracking' },
    { key: 'status', label: 'Statut', render: (val: string) => getStatusBadge(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Expéditions</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouvelle expédition</button></div><Table columns={columns} data={shipments} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle expédition"><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="N° Expédition" value={formData.shipment_number} onChange={(e) => setFormData({...formData, shipment_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="N° Tracking" value={formData.tracking_number} onChange={(e) => setFormData({...formData, tracking_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="pending">En attente</option><option value="shipped">Expédié</option><option value="delivered">Livré</option></select><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">Créer</button></form></Modal></div></div>
  );
}
