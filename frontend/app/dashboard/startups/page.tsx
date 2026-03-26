"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LanguageSelector from '@/components/LanguageSelector';

export default function ' + ($page.Substring(0,1).ToUpper() + $page.Substring(1)) + 'Page() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    setLanguage(localStorage.getItem('language') || 'fr');
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/' + $page + '`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setItems(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const texts = {
    fr: { title: "Gestion des ' + $page + '", add: "+ Ajouter" },
    ar: { title: "إدارة ' + ($page === 'shops' ? 'المتاجر' : $page === 'restaurants' ? 'المطاعم' : $page === 'ecommerce' ? 'التجارة الإلكترونية' : 'الشركات الناشئة') + '", add: "+ إضافة" },
    en: { title: "' + $page + ' Management", add: "+ Add" }
  };
  const t = texts[language] || texts.fr;

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '28px' }}>{t.title}</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <LanguageSelector />
            <button style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>{t.add}</button>
          </div>
        </div>
        <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Module en développement - Bientôt disponible</p>
        </div>
      </div>
    </div>
  );
}
