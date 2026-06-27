"use client";
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';

export default function CategoriesPage() {
  const categories = [
    {
      id: 'pme',
      name: 'PME',
      icon: '🏪',
      color: '#667eea',
      description: 'Gestion globale simple et intelligente',
      features: ['Finance', 'CRM', 'Stock', 'Dashboard', 'BI', 'Abonnements SaaS', 'Automatisation'],
      modules: [
        { name: 'Dashboard', icon: '📊', desc: 'Tableau de bord personnalisable' },
        { name: 'Finance', icon: '💰', desc: 'Gestion financière complète' },
        { name: 'CRM', icon: '👥', desc: 'Gestion de la relation client' },
        { name: 'Stock', icon: '📦', desc: 'Gestion des stocks' },
        { name: 'BI', icon: '📈', desc: 'Business Intelligence' },
        { name: 'Abonnements', icon: '☁️', desc: 'Gestion des abonnements SaaS' }
      ]
    },
    {
      id: 'commerce',
      name: 'Commerce',
      icon: '🛍️',
      color: '#10b981',
      description: 'Optimiser ventes + gestion stock',
      features: ['Stock avancé', 'Codes-barres', 'Multi-dépôts', 'Promotions', 'Ventes', 'Facturation'],
      modules: [
        { name: 'Stock avancé', icon: '📊', desc: 'Gestion multi-dépôts' },
        { name: 'Codes-barres', icon: '📱', desc: 'Scan de produits' },
        { name: 'Promotions', icon: '🏷️', desc: 'Gestion des offres' },
        { name: 'Ventes', icon: '💰', desc: 'Enregistrement des ventes' },
        { name: 'Facturation', icon: '🧾', desc: 'Gestion des factures' }
      ]
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: '🍽️',
      color: '#f59e0b',
      description: 'Rapidité service + contrôle coûts',
      features: ['Tables', 'Commandes', 'Menu', 'Stock', 'Personnel', 'Rapports journaliers'],
      modules: [
        { name: 'Gestion des tables', icon: '🪑', desc: 'Plan des tables' },
        { name: 'Commandes', icon: '📝', desc: 'Prise de commandes' },
        { name: 'Menu', icon: '📋', desc: 'Gestion de la carte' },
        { name: 'Stock cuisine', icon: '🍽️', desc: 'Gestion des ingrédients' },
        { name: 'Personnel', icon: '👥', desc: 'Gestion des employés' }
      ]
    },
    {
      id: 'industrie',
      name: 'Industrie',
      icon: '🏭',
      color: '#ef4444',
      description: 'Optimiser production et performance',
      features: ['Production', 'Stock', 'Finance', 'Planification', 'Qualité', 'Maintenance'],
      modules: [
        { name: 'Production', icon: '🏭', desc: 'Suivi de production' },
        { name: 'Planification', icon: '📅', desc: 'Planning production' },
        { name: 'Qualité', icon: '✅', desc: 'Contrôle qualité' },
        { name: 'Maintenance', icon: '🔧', desc: 'Maintenance préventive' },
        { name: 'Stock matière', icon: '📦', desc: 'Gestion des matières' }
      ]
    },
    {
      id: 'logistique',
      name: 'Logistique',
      icon: '🚚',
      color: '#3b82f6',
      description: 'Suivi efficace des livraisons',
      features: ['Livraisons', 'Tracking', 'Tournées', 'Flotte', 'Clients', 'Stock'],
      modules: [
        { name: 'Livraisons', icon: '🚚', desc: 'Gestion des livraisons' },
        { name: 'Tracking', icon: '📍', desc: 'Suivi en temps réel' },
        { name: 'Optimisation tournées', icon: '🗺️', desc: 'Calcul itinéraires' },
        { name: 'Flotte', icon: '🚛', desc: 'Gestion des véhicules' },
        { name: 'Clients', icon: '👥', desc: 'Carnet d\'adresses' }
      ]
    },
    {
      id: 'services',
      name: 'Services',
      icon: '🧑‍💼',
      color: '#8b5cf6',
      description: 'Gestion clients + projets',
      features: ['CRM', 'Projets', 'Tâches', 'Suivi temps', 'Reporting', 'Portail client'],
      modules: [
        { name: 'CRM', icon: '👥', desc: 'Gestion des clients' },
        { name: 'Projets', icon: '📁', desc: 'Gestion des projets' },
        { name: 'Tâches', icon: '✅', desc: 'Suivi des tâches' },
        { name: 'Suivi temps', icon: '⏱️', desc: 'Temps passé par projet' },
        { name: 'Portail client', icon: '🌐', desc: 'Espace client' }
      ]
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      icon: '🛒',
      color: '#ec489a',
      description: 'Automatisation vente en ligne',
      features: ['Ventes', 'Paiements', 'Catalogue', 'Stock', 'Marketing', 'Analytics'],
      modules: [
        { name: 'Ventes', icon: '💰', desc: 'Gestion des ventes' },
        { name: 'Paiements', icon: '💳', desc: 'Gestion des paiements' },
        { name: 'Catalogue', icon: '📦', desc: 'Gestion des produits' },
        { name: 'Marketing', icon: '📢', desc: 'Campagnes marketing' },
        { name: 'Analytics', icon: '📈', desc: 'Analyse des ventes' }
      ]
    },
    {
      id: 'btp',
      name: 'BTP',
      icon: '🏗️',
      color: '#f97316',
      description: 'Contrôle projets + coûts',
      features: ['Chantiers', 'Projets', 'Finance', 'Matériaux', 'Planning', 'Fournisseurs'],
      modules: [
        { name: 'Chantiers', icon: '🏗️', desc: 'Gestion des chantiers' },
        { name: 'Projets', icon: '📁', desc: 'Gestion des projets' },
        { name: 'Matériaux', icon: '🏭', desc: 'Gestion des matériaux' },
        { name: 'Planning', icon: '📅', desc: 'Planning travaux' },
        { name: 'Fournisseurs', icon: '🏭', desc: 'Gestion fournisseurs' }
      ]
    },
    {
      id: 'sante',
      name: 'Santé',
      icon: '🏥',
      color: '#14b8a6',
      description: 'Organisation soins',
      features: ['Patients', 'Rendez-vous', 'Dossiers', 'Facturation', 'Planning', 'Prescriptions'],
      modules: [
        { name: 'Patients', icon: '👨‍⚕️', desc: 'Gestion des patients' },
        { name: 'Rendez-vous', icon: '📅', desc: 'Gestion des RDV' },
        { name: 'Dossiers médicaux', icon: '📋', desc: 'Historique médical' },
        { name: 'Prescriptions', icon: '💊', desc: 'Gestion des ordonnances' },
        { name: 'Facturation', icon: '🧾', desc: 'Facturation soins' }
      ]
    },
    {
      id: 'education',
      name: 'Éducation',
      icon: '🎓',
      color: '#a855f7',
      description: 'Gestion académique',
      features: ['Étudiants', 'Cours', 'Notes', 'Finance', 'Planning', 'Portail étudiant'],
      modules: [
        { name: 'Étudiants', icon: '👨‍🎓', desc: 'Gestion des étudiants' },
        { name: 'Cours', icon: '📚', desc: 'Gestion des cours' },
        { name: 'Notes', icon: '📝', desc: 'Suivi des notes' },
        { name: 'Emploi du temps', icon: '📅', desc: 'Planning cours' },
        { name: 'Portail étudiant', icon: '🌐', desc: 'Espace étudiant' }
      ]
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <Navbar />
      
      <div style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏷️</div>
            <h1 style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>Modules ERP par catégorie</h1>
            <p style={{ color: '#94a3b8', fontSize: '18px' }}>
              Découvrez les modules adaptés à chaque secteur d'activité
            </p>
          </div>

          {categories.map((cat, idx) => (
            <div key={cat.id} id={cat.id} style={{ marginBottom: '80px', scrollMarginTop: '80px' }}>
              <div style={{ 
                background: `linear-gradient(135deg, ${cat.color}20 0%, #111 100%)`,
                borderRadius: '24px',
                padding: '32px',
                border: `1px solid ${cat.color}30`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '48px' }}>{cat.icon}</div>
                  <div>
                    <h2 style={{ color: 'white', fontSize: '28px', margin: 0 }}>{cat.name}</h2>
                    <p style={{ color: '#94a3b8', margin: '8px 0 0 0' }}>{cat.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
                  {cat.features.map((feature, i) => (
                    <span key={i} style={{ background: `${cat.color}20`, color: cat.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>
                      {feature}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {cat.modules.map((module, i) => (
                    <div key={i} style={{ background: '#1a1a1a', borderRadius: '16px', padding: '20px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '28px' }}>{module.icon}</div>
                        <h3 style={{ color: 'white', margin: 0 }}>{module.name}</h3>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{module.desc}</p>
                    </div>
                  ))}
                </div>

                <Link 
                  href="/auth/login" 
                  style={{ 
                    display: 'inline-block',
                    background: cat.color,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Essayer {cat.name} →
                </Link>
              </div>
            </div>
          ))}
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
