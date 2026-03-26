"use client";
import { useState, useEffect } from 'react';

export default function LanguageSelector() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    setLanguage(localStorage.getItem('language') || 'fr');
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    window.location.reload();
  };

  const languages = [
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'ar', flag: '🇹🇳', name: 'العربية' },
    { code: 'en', flag: '🇬🇧', name: 'English' }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', background: '#1e293b', padding: '6px', borderRadius: '40px' }}>
      {languages.map(lang => (
        <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
          padding: '6px 14px', borderRadius: '32px', background: language === lang.code ? '#667eea' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: language === lang.code ? 'bold' : 'normal'
        }}>
          <span>{lang.flag}</span> {lang.name}
        </button>
      ))}
    </div>
  );
}
