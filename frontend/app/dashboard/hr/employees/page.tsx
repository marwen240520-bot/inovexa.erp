'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Table from '@/components/tables/Table';
import Modal from '@/components/modals/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ employee_number: '', first_name: '', last_name: '', email: '', phone: '', position: '', department: '', salary: 0 });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try { const res = await api.get('hr/employees'); setEmployees(res.data); } catch (error) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) { await api.put(hr/employees/, formData); toast.success('Employé modifié'); }
      else { await api.post('hr/employees', formData); toast.success('Employé créé'); }
      setIsModalOpen(false); setEditingEmployee(null); setFormData({ employee_number: '', first_name: '', last_name: '', email: '', phone: '', position: '', department: '', salary: 0 }); fetchEmployees();
    } catch (error) { toast.error('Erreur'); }
  };

  const handleDelete = async (employee: Employee) => { if (confirm('Supprimer ?')) { try { await api.delete(hr/employees/); toast.success('Supprimé'); fetchEmployees(); } catch (error) { toast.error('Erreur'); } } };

  const columns = [
    { key: 'employee_number', label: 'Matricule' },
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'position', label: 'Poste' },
    { key: 'department', label: 'Département' },
    { key: 'salary', label: 'Salaire', render: (val: number) => formatCurrency(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex"><Sidebar /><div className="ml-64 flex-1 p-8"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-white">Employés</h1><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={18} /> Nouvel employé</button></div><Table columns={columns} data={employees} onEdit={setEditingEmployee} onDelete={handleDelete} /><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Modifier employé' : 'Nouvel employé'}><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Matricule" value={formData.employee_number} onChange={(e) => setFormData({...formData, employee_number: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required /><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Prénom" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="px-3 py-2 bg-gray-700 rounded-lg text-white" required /><input type="text" placeholder="Nom" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="px-3 py-2 bg-gray-700 rounded-lg text-white" required /></div><input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="Poste" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="text" placeholder="Département" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><input type="number" placeholder="Salaire" value={formData.salary} onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /><button type="submit" className="w-full py-2 bg-purple-600 rounded-lg">{editingEmployee ? 'Modifier' : 'Créer'}</button></form></Modal></div></div>
  );
}
