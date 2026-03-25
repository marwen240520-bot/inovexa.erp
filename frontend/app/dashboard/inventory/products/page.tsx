'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface Product {
  id: string;
  sku: string;
  name: string;
  selling_price: number;
  purchase_price: number;
  unit: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ sku: '', name: '', selling_price: 0, purchase_price: 0, unit: 'pcs' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const res = await api.get('inventory/products'); setProducts(res.data); } catch (error) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) { await api.put(inventory/products/, formData); toast.success('Produit modifié'); }
      else { await api.post('inventory/products', formData); toast.success('Produit créé'); }
      setIsModalOpen(false); setEditingProduct(null); setFormData({ sku: '', name: '', selling_price: 0, purchase_price: 0, unit: 'pcs' }); fetchProducts();
    } catch (error) { toast.error('Erreur'); }
  };

  const handleDelete = async (product: Product) => { if (confirm('Supprimer ?')) { try { await api.delete(inventory/products/); toast.success('Supprimé'); fetchProducts(); } catch (error) { toast.error('Erreur'); } } };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Nom' },
    { key: 'selling_price', label: 'Prix vente', render: (val: number) => formatCurrency(val) },
    { key: 'purchase_price', label: 'Prix achat', render: (val: number) => formatCurrency(val) },
    { key: 'unit', label: 'Unité' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Produits</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouveau produit</button></div><Table columns={columns} data={products} onEdit={setEditingProduct} onDelete={handleDelete} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Modifier produit' : 'Nouveau produit'}><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="SKU" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="Nom" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="number" placeholder="Prix vente" value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="number" placeholder="Prix achat" value={formData.purchase_price} onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="pcs">Pièce</option><option value="kg">Kg</option><option value="l">Litre</option></select><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">{editingProduct ? 'Modifier' : 'Créer'}</button></form></Modal></div></div>
  );
}
