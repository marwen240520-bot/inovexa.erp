'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function BOMPage() {
  const [bom, setBom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', name: '', version: '' });

  useEffect(() => { fetchBOM(); }, []);

  const fetchBOM = async () => {
    try {
      const res = await api.get('/production/bom');
      setBom(res.data);
    } catch (error) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/bom', formData);
      toast.success('BOM créée');
      setIsModalOpen(false);
      setFormData({ product_id: '', name: '', version: '' });
      fetchBOM();
    } catch (error) { toast.error('Erreur'); }
  };

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'product_id', label: 'Produit ID' },
    { key: 'version', label: 'Version' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Nomenclatures (BOM)</h1>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouvelle BOM</button>
        </div>
        <Table columns={columns} data={bom} />
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle BOM">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Produit ID" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required />
            <input type="text" placeholder="Nom" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required />
            <input type="text" placeholder="Version" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" />
            <button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">Créer</button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
