// Configuration complète des catégories d'entreprise
export const categoriesConfig = {
  pme: {
    id: 'pme',
    name: 'PME (général)',
    icon: '🏪',
    color: '#667eea',
    description: 'Gestion globale simple et intelligente',
    modules: {
      main: [
        { id: 'finance', name: 'Finance', icon: '💰', description: 'Gestion financière' },
        { id: 'crm', name: 'CRM', icon: '👥', description: 'Gestion de la relation client' },
        { id: 'stock', name: 'Stock', icon: '📦', description: 'Gestion des stocks' },
        { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Tableau de bord' }
      ],
      advanced: [
        { id: 'bi', name: 'BI', icon: '📈', description: 'Business Intelligence' },
        { id: 'saas', name: 'Abonnements SaaS', icon: '☁️', description: 'Gestion des abonnements' },
        { id: 'rbac', name: 'Sécurité RBAC', icon: '🔐', description: 'Contrôle d\'accès' },
        { id: 'automation', name: 'Automatisation', icon: '🤖', description: 'Automatisation des processus' }
      ]
    },
    features: ['Gestion financière complète', 'CRM avancé', 'Tableaux de bord personnalisables', 'Rapports BI']
  },
  commerce: {
    id: 'commerce',
    name: 'Commerces / Magasins',
    icon: '🛍️',
    color: '#10b981',
    description: 'Optimiser ventes + gestion stock',
    modules: {
      main: [
        { id: 'stock', name: 'Stock', icon: '📦', description: 'Gestion des stocks' },
        { id: 'sales', name: 'Ventes', icon: '💰', description: 'Gestion des ventes' },
        { id: 'invoices', name: 'Facturation', icon: '🧾', description: 'Gestion des factures' }
      ],
      advanced: [
        { id: 'barcode', name: 'Codes-barres', icon: '📱', description: 'Scan de codes-barres' },
        { id: 'multiwarehouse', name: 'Multi-dépôts', icon: '🏭', description: 'Gestion multi-dépôts' },
        { id: 'promotions', name: 'Promotions', icon: '🏷️', description: 'Gestion des promotions' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Alertes et notifications' }
      ]
    },
    features: ['Scan de codes-barres', 'Gestion multi-dépôts', 'Campagnes promotionnelles', 'Alertes stock']
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurants / Cafés',
    icon: '🍽️',
    color: '#f59e0b',
    description: 'Rapidité service + contrôle coûts',
    modules: {
      main: [
        { id: 'orders', name: 'Commandes', icon: '📝', description: 'Prise de commandes' },
        { id: 'stock', name: 'Stock cuisine', icon: '🍽️', description: 'Gestion des ingrédients' },
        { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Tableau de bord' }
      ],
      advanced: [
        { id: 'tables', name: 'Gestion tables', icon: '🪑', description: 'Gestion des tables' },
        { id: 'hr', name: 'RH', icon: '👥', description: 'Gestion du personnel' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Alertes service' },
        { id: 'dailyReports', name: 'Rapports journaliers', icon: '📄', description: 'Rapports quotidiens' }
      ]
    },
    features: ['Plan des tables', 'Prise de commandes mobile', 'Gestion du personnel', 'Rapports journaliers']
  },
  industrie: {
    id: 'industrie',
    name: 'Industrie / Production',
    icon: '🏭',
    color: '#ef4444',
    description: 'Optimiser production et performance',
    modules: {
      main: [
        { id: 'production', name: 'Production', icon: '🏭', description: 'Suivi de production' },
        { id: 'stock', name: 'Stock matière', icon: '📦', description: 'Gestion des matières' },
        { id: 'finance', name: 'Finance', icon: '💰', description: 'Gestion financière' }
      ],
      advanced: [
        { id: 'planning', name: 'Planification', icon: '📅', description: 'Planification production' },
        { id: 'quality', name: 'Qualité', icon: '✅', description: 'Contrôle qualité' },
        { id: 'maintenance', name: 'Maintenance', icon: '🔧', description: 'Maintenance préventive' },
        { id: 'bi', name: 'BI avancé', icon: '📈', description: 'Business Intelligence' }
      ]
    },
    features: ['Planification de production', 'Contrôle qualité', 'Maintenance préventive', 'Indicateurs de performance']
  },
  logistique: {
    id: 'logistique',
    name: 'Logistique / Transport',
    icon: '🚚',
    color: '#3b82f6',
    description: 'Suivi efficace des livraisons',
    modules: {
      main: [
        { id: 'deliveries', name: 'Livraison', icon: '🚚', description: 'Gestion des livraisons' },
        { id: 'clients', name: 'Clients', icon: '👥', description: 'Gestion des clients' },
        { id: 'stock', name: 'Stock entrepôt', icon: '📦', description: 'Gestion des stocks' }
      ],
      advanced: [
        { id: 'tracking', name: 'Tracking temps réel', icon: '📍', description: 'Suivi en temps réel' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Alertes livraison' },
        { id: 'routes', name: 'Optimisation tournées', icon: '🗺️', description: 'Optimisation des trajets' }
      ]
    },
    features: ['Tracking GPS', 'Optimisation des tournées', 'Notifications en temps réel', 'Calcul de coûts']
  },
  services: {
    id: 'services',
    name: 'Sociétés de services',
    icon: '🧑‍💼',
    color: '#8b5cf6',
    description: 'Gestion clients + projets',
    modules: {
      main: [
        { id: 'crm', name: 'CRM', icon: '👥', description: 'Gestion des clients' },
        { id: 'finance', name: 'Finance', icon: '💰', description: 'Gestion financière' },
        { id: 'projects', name: 'Projets', icon: '📁', description: 'Gestion des projets' }
      ],
      advanced: [
        { id: 'tasks', name: 'Gestion tâches', icon: '✅', description: 'Suivi des tâches' },
        { id: 'reporting', name: 'Reporting', icon: '📄', description: 'Rapports d\'activité' },
        { id: 'automation', name: 'Automatisation', icon: '🤖', description: 'Automatisation' },
        { id: 'clientPortal', name: 'Portail client', icon: '🌐', description: 'Espace client' }
      ]
    },
    features: ['Gestion de projets', 'Suivi des tâches', 'Portail client', 'Facturation temps passé']
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛒',
    color: '#ec489a',
    description: 'Automatisation vente en ligne',
    modules: {
      main: [
        { id: 'sales', name: 'Ventes', icon: '💰', description: 'Gestion des ventes' },
        { id: 'payments', name: 'Paiement', icon: '💳', description: 'Gestion des paiements' },
        { id: 'stock', name: 'Stock', icon: '📦', description: 'Gestion des stocks' }
      ],
      advanced: [
        { id: 'api', name: 'Intégration API', icon: '🔌', description: 'API marketplace' },
        { id: 'marketing', name: 'Marketing', icon: '📢', description: 'Campagnes marketing' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Alertes clients' },
        { id: 'analytics', name: 'Analytics', icon: '📈', description: 'Analyse des ventes' }
      ]
    },
    features: ['Intégration API', 'Campagnes marketing', 'Analytics avancés', 'Gestion des paiements']
  },
  btp: {
    id: 'btp',
    name: 'Construction / BTP',
    icon: '🏗️',
    color: '#f97316',
    description: 'Contrôle projets + coûts',
    modules: {
      main: [
        { id: 'projects', name: 'Projets', icon: '🏗️', description: 'Gestion des chantiers' },
        { id: 'finance', name: 'Finance', icon: '💰', description: 'Gestion financière' },
        { id: 'hr', name: 'RH', icon: '👷', description: 'Gestion du personnel' }
      ],
      advanced: [
        { id: 'planning', name: 'Planning', icon: '📅', description: 'Planning travaux' },
        { id: 'stock', name: 'Stock matériaux', icon: '🏭', description: 'Gestion des matériaux' },
        { id: 'suppliers', name: 'Fournisseurs', icon: '🏭', description: 'Gestion fournisseurs' },
        { id: 'siteFollow', name: 'Suivi chantier', icon: '📸', description: 'Suivi d\'avancement' }
      ]
    },
    features: ['Gestion de chantiers', 'Planning travaux', 'Suivi des coûts', 'Gestion des matériaux']
  },
  sante: {
    id: 'sante',
    name: 'Cliniques / Santé',
    icon: '🏥',
    color: '#14b8a6',
    description: 'Organisation soins',
    modules: {
      main: [
        { id: 'patients', name: 'Patients', icon: '👨‍⚕️', description: 'Gestion des patients' },
        { id: 'hr', name: 'RH', icon: '👩‍⚕️', description: 'Gestion du personnel' },
        { id: 'invoices', name: 'Facturation', icon: '🧾', description: 'Facturation soins' }
      ],
      advanced: [
        { id: 'medicalRecords', name: 'Dossiers médicaux', icon: '📋', description: 'Dossiers patients' },
        { id: 'appointments', name: 'Planning', icon: '📅', description: 'Gestion des RDV' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Rappels RDV' },
        { id: 'security', name: 'Sécurité avancée', icon: '🔐', description: 'Confidentialité' }
      ]
    },
    features: ['Dossiers médicaux', 'Gestion des rendez-vous', 'Facturation CPAM', 'Rappels patients']
  },
  education: {
    id: 'education',
    name: 'Éducation / Formation',
    icon: '🎓',
    color: '#a855f7',
    description: 'Gestion académique',
    modules: {
      main: [
        { id: 'students', name: 'Étudiants', icon: '👨‍🎓', description: 'Gestion des étudiants' },
        { id: 'finance', name: 'Finance', icon: '💰', description: 'Gestion des paiements' },
        { id: 'hr', name: 'RH', icon: '👨‍🏫', description: 'Gestion des enseignants' }
      ],
      advanced: [
        { id: 'courses', name: 'Planning cours', icon: '📚', description: 'Emploi du temps' },
        { id: 'payments', name: 'Paiements', icon: '💳', description: 'Gestion des frais' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Alertes parents' },
        { id: 'studentPortal', name: 'Portail étudiant', icon: '🌐', description: 'Espace étudiant' }
      ]
    },
    features: ['Emploi du temps', 'Gestion des notes', 'Portail étudiant', 'Gestion des frais de scolarité']
  }
};

export type CategoryId = keyof typeof categoriesConfig;
