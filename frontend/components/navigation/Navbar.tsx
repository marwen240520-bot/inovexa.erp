"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  current: boolean;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems: MenuItem[] = [
    { name: 'Accueil', href: '/', icon: '🏠', current: pathname === '/' },
    { name: 'Catégories', href: '/categories', icon: '🏷️', current: pathname === '/categories' },
    { name: 'Fonctionnalités', href: '/#features', icon: '📦', current: false },
    { name: 'Blog', href: '/blog', icon: '📰', current: pathname === '/blog' },
    { name: 'Avantages', href: '/#advantages', icon: '🎯', current: false },
    { name: 'Contact', href: '/#contact', icon: '📞', current: false },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, isCurrent: boolean) => {
    if (!isCurrent) {
      e.currentTarget.style.color = '#667eea';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>, isCurrent: boolean) => {
    e.currentTarget.style.color = isCurrent ? '#667eea' : '#94a3b8';
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = '#764ba2';
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = '#667eea';
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
                gap: '6px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => handleMouseEnter(e, item.current)}
              onMouseLeave={(e) => handleMouseLeave(e, item.current)}
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
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
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
                gap: '8px',
                cursor: 'pointer'
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