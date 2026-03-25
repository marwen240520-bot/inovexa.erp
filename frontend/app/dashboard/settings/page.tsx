'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await api.post('/auth/change-password', { current: passwordData.current, new: passwordData.new });
      toast.success('Mot de passe modifié');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error('Erreur lors du changement');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Paramètres</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Profil</h2>
            <div className="space-y-4">
              <div><label className="block text-gray-400 text-sm">Nom</label><p className="text-white">{user?.firstName} {user?.lastName}</p></div>
              <div><label className="block text-gray-400 text-sm">Email</label><p className="text-white">{user?.email}</p></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Changer mot de passe</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <input type="password" placeholder="Mot de passe actuel" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required />
              <input type="password" placeholder="Nouveau mot de passe" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required />
              <input type="password" placeholder="Confirmer" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" required />
              <button type="submit" className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Changer</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
