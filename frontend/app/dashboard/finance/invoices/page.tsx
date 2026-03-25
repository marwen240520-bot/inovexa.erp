'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/export';
import Sidebar from '@/components/layout/Sidebar';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_id: string;
  total: number;
  status?: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    customer_id: '',
    total: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('finance/invoices');
      setInvoices(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('sales/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Erreur chargement clients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await api.put(`finance/invoices/${editingInvoice.id}`, formData);
        toast.success('Facture modifiée');
      } else {
        await api.post('finance/invoices', formData);
        toast.success('Facture créée');
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
      setFormData({ invoice_number: '', invoice_date: '', due_date: '', customer_id: '', total: 0 });
      fetchInvoices();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (confirm('Supprimer cette facture ?')) {
      try {
        await api.delete(`finance/invoices/${invoice.id}`);
        toast.success('Facture supprimée');
        fetchInvoices();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      customer_id: invoice.customer_id,
      total: invoice.total,
    });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    exportToExcel(invoices, 'factures');
    toast.success('Export Excel réussi');
  };

  const columns = [
    { key: 'invoice_number', label: 'N° Facture' },
    { key: 'invoice_date', label: 'Date', render: (val: string) => formatDate(val) },
    { key: 'due_date', label: 'Échéance', render: (val: string) => formatDate(val) },
    { key: 'total', label: 'Total', render: (val: number) => formatCurrency(val) },
    { key: 'status', label: 'Statut', render: (val: string) => (
      <span className={'px-2 py-1 rounded text-xs ' + (val === 'paid' ? 'bg-green-600' : val === 'overdue' ? 'bg-red-600' : 'bg-yellow-600')}>
        {val === 'paid' ? 'Payée' : val === 'overdue' ? 'En retard' : 'En attente'}
      </span>
    ) },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar />
        <div className="ml-64 flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Factures</h1>
          <div className="flex gap-3">
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <FileSpreadsheet size={18} /> Excel
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus size={18} /> Nouvelle facture
            </button>
          </div>
        </div>
        <Table columns={columns} data={invoices} onEdit={handleEdit} onDelete={handleDelete} />
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingInvoice(null); setFormData({ invoice_number: '', invoice_date: '', due_date: '', customer_id: '', total: 0 }); }} title={editingInvoice ? 'Modifier facture' : 'Nouvelle facture'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-gray-300 mb-2">N° Facture</label><input type="text" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
            <div><label className="block text-gray-300 mb-2">Date facture</label><input type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
            <div><label className="block text-gray-300 mb-2">Échéance</label><input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
            <div><label className="block text-gray-300 mb-2">Client</label><select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required><option value="">Sélectionner un client</option>{customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
            <div><label className="block text-gray-300 mb-2">Total</label><input type="number" step="0.01" value={formData.total} onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
            <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{editingInvoice ? 'Modifier' : 'Créer'}</button>
          </form>
        </Modal>
      </div>
    </div>
  );
}