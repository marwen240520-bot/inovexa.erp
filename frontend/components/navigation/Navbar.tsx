"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Accueil', href: '/', icon: '🏠', current: pathname === '/' },
    { name: 'Catégories', href: '/categories', icon: '🏷️', current: pathname === '/categories' },
    { name: 'Fonctionnalités', href: '/#features', icon: '📦', current: false },
    { name: 'Blog', href: '/blog', icon: '📰', current: pathname === '/blog' },
    { name: 'Avantages', href: '/#advantages', icon: '🎯', current: false },
    { name: 'Contact', href: '/#contact', icon: '📞', current: false },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (href.startsWith('/#')) {
      const id = href.substring(2);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = href;
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: scrolled ? 'rgba(17, 17, 17, 0.95)' : 'rgba(17, 17, 17, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(34, 34, 34, 0.5)',
      transition: 'all 0.3s'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src="/logo.png" style={{ width: '32px', height: '32px' }} alt="Logo" />
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Inovexa ERP</span>
        </Link>

        {/* Desktop Menu */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              style={{
                color: item.current ? '#667eea' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: item.current ? '600' : '400',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.target.style.color = '#667eea'}
              onMouseLeave={(e) => e.target.style.color = item.current ? '#667eea' : '#94a3b8'}
            >
              <span>{item.icon}</span>
              {item.name}
            </a>
          ))}
          <Link
            href="/auth/login"
            style={{
              background: '#667eea',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#764ba2'}
            onMouseLeave={(e) => e.target.style.background = '#667eea'}
          >
            Se connecter
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: '#111',
          borderTop: '1px solid #222',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              style={{
                color: item.current ? '#667eea' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '16px',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </a>
          ))}
          <Link
            href="/auth/login"
            style={{
              background: '#667eea',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '30px',
              textDecoration: 'none',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            Se connecter
          </Link>
        </div>
      )}
    </nav>
  );
}
