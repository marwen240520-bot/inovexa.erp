"use client";
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "Comment choisir le bon ERP pour votre entreprise",
      excerpt: "Découvrez les critères essentiels pour sélectionner la solution ERP adaptée à vos besoins.",
      date: "15 mars 2025",
      readTime: "5 min",
      category: "Conseils",
      icon: "📊"
    },
    {
      id: 2,
      title: "Les avantages de l'intelligence artificielle dans la gestion d'entreprise",
      excerpt: "L'IA révolutionne la façon dont les entreprises gèrent leurs opérations quotidiennes.",
      date: "10 mars 2025",
      readTime: "7 min",
      category: "IA",
      icon: "🤖"
    },
    {
      id: 3,
      title: "5 tendances ERP pour 2025",
      excerpt: "Les innovations qui vont transformer la gestion d'entreprise cette année.",
      date: "5 mars 2025",
      readTime: "4 min",
      category: "Tendances",
      icon: "📈"
    },
    {
      id: 4,
      title: "Optimisez votre chaîne logistique avec un ERP",
      excerpt: "Comment un ERP peut vous aider à gagner en efficacité et réduire vos coûts.",
      date: "28 février 2025",
      readTime: "6 min",
      category: "Logistique",
      icon: "🚚"
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <Navbar />
      
      <div style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📰</div>
            <h1 style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>Blog Inovexa</h1>
            <p style={{ color: '#94a3b8', fontSize: '18px' }}>
              Actualités, conseils et tendances sur la gestion d'entreprise
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            {articles.map(article => (
              <div key={article.id} style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden', transition: 'transform 0.2s' }}>
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{article.icon}</div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ background: '#1a1a1a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#667eea' }}>{article.category}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>{article.readTime}</span>
                  </div>
                  <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '12px', lineHeight: '1.4' }}>{article.title}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>{article.excerpt}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>{article.date}</span>
                    <a href={`/blog/${article.id}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px' }}>Lire la suite →</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/#contact" style={{ background: '#667eea', color: 'white', padding: '12px 32px', borderRadius: '40px', textDecoration: 'none', display: 'inline-block' }}>
              Contactez-nous pour plus d'informations
            </Link>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #222', padding: '48px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>© 2025 Inovexa ERP. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
