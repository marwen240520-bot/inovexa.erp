'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function QualityPage() {
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ work_order_id: '', product_id: '', inspection_date: new Date().toISOString().split('T')[0], status: 'pending', score: 0, remarks: '' });

  useEffect(() => { fetchQualities(); }, []);

  const fetchQualities = async () => { try { const res = await api.get('production/quality'); setQualities(res.data); } catch (error) { toast.error('Erreur'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('production/quality', formData); toast.success('Contrôle créé'); setIsModalOpen(false); setFormData({ work_order_id: '', product_id: '', inspection_date: new Date().toISOString().split('T')[0], status: 'pending', score: 0, remarks: '' }); fetchQualities(); } catch (error) { toast.error('Erreur'); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'passed') return <span className="px-2 py-1 rounded text-xs bg-green-600">Passé</span>;
    if (status === 'failed') return <span className="px-2 py-1 rounded text-xs bg-red-600">Échoué</span>;
    return <span className="px-2 py-1 rounded text-xs bg-yellow-600">En attente</span>;
  };

  const columns = [
    { key: 'work_order_id', label: 'OF ID' },
    { key: 'inspection_date', label: 'Date', render: (val: string) => formatDate(val) },
    { key: 'status', label: 'Statut', render: (val: string) => getStatusBadge(val) },
    { key: 'score', label: 'Score', render: (val: number) => val ? val + '%' : '-' },
    { key: 'remarks', label: 'Remarques' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Contrôle Qualité</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouveau contrôle</button></div><Table columns={columns} data={qualities} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau contrôle"><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="ID OF" value={formData.work_order_id} onChange={(e) => setFormData({...formData, work_order_id: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="ID Produit" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="date" value={formData.inspection_date} onChange={(e) => setFormData({...formData, inspection_date: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="pending">En attente</option><option value="passed">Passé</option><option value="failed">Échoué</option></select><input type="number" placeholder="Score (0-100)" value={formData.score} onChange={(e) => setFormData({...formData, score: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><textarea placeholder="Remarques" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" rows={3} /><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">Créer</button></form></Modal></div></div>
  );
}
