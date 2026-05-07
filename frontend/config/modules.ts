// Configuration des modules par catégorie d'entreprise
export const modulesByCategory = {
  // PME - Modules généraux
  pme: {
    name: "PME",
    icon: "🏪",
    modules: [
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion administrative, paie, congés, recrutement", enabled: true, path: "/dashboard/hr" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Comptabilité, trésorerie, facturation, reporting IA", enabled: true, path: "/dashboard/finance" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Multi-dépôts, alertes stock, traçabilité", enabled: true, path: "/dashboard/stock" },
      { id: "production", name: "Production & Industrie", icon: "🏭", description: "Nomenclatures, ordres de fabrication", enabled: true, path: "/dashboard/production" },
      { id: "purchases", name: "Achats & Approvisionnements", icon: "🛒", description: "Commandes fournisseurs, évaluations", enabled: true, path: "/dashboard/purchases" },
      { id: "sales", name: "Ventes & Facturation", icon: "📈", description: "Devis, facturation, relances auto", enabled: true, path: "/dashboard/sales" },
      { id: "logistics", name: "Logistique & Transport", icon: "🚚", description: "Expéditions, suivi livraisons, tournées", enabled: true, path: "/dashboard/deliveries" },
      { id: "ai", name: "Business Intelligence & IA", icon: "🤖", description: "Tableaux de bord, prédictions, assistant IA", enabled: true, path: "/dashboard/ai" }
    ]
  },
  // Commerce
  commerce: {
    name: "Commerce",
    icon: "🛍️",
    modules: [
      { id: "sales", name: "Ventes & Facturation", icon: "📈", description: "Gestion des ventes et factures", enabled: true, path: "/dashboard/sales" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Gestion des stocks avancée", enabled: true, path: "/dashboard/stock" },
      { id: "purchases", name: "Achats & Approvisionnements", icon: "🛒", description: "Commandes fournisseurs", enabled: true, path: "/dashboard/purchases" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" },
      { id: "logistics", name: "Logistique & Transport", icon: "🚚", description: "Gestion des livraisons", enabled: true, path: "/dashboard/deliveries" }
    ]
  },
  // Restaurant
  restaurant: {
    name: "Restaurant",
    icon: "🍽️",
    modules: [
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel", enabled: true, path: "/dashboard/hr" },
      { id: "sales", name: "Ventes & Commandes", icon: "📈", description: "Prise de commandes", enabled: true, path: "/dashboard/sales" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Gestion des stocks cuisine", enabled: true, path: "/dashboard/stock" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" }
    ]
  },
  // Industrie
  industrie: {
    name: "Industrie",
    icon: "🏭",
    modules: [
      { id: "production", name: "Production & Industrie", icon: "🏭", description: "Gestion de production", enabled: true, path: "/dashboard/production" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Gestion des stocks matière", enabled: true, path: "/dashboard/stock" },
      { id: "purchases", name: "Achats & Approvisionnements", icon: "🛒", description: "Commandes fournisseurs", enabled: true, path: "/dashboard/purchases" },
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel", enabled: true, path: "/dashboard/hr" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" }
    ]
  },
  // Services
  services: {
    name: "Services",
    icon: "🧑‍💼",
    modules: [
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel", enabled: true, path: "/dashboard/hr" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" },
      { id: "ai", name: "Business Intelligence & IA", icon: "🤖", description: "Reporting et analyses", enabled: true, path: "/dashboard/ai" }
    ]
  },
  // E-commerce
  ecommerce: {
    name: "E-commerce",
    icon: "🛒",
    modules: [
      { id: "sales", name: "Ventes & Facturation", icon: "📈", description: "Gestion des ventes en ligne", enabled: true, path: "/dashboard/sales" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Gestion des stocks", enabled: true, path: "/dashboard/stock" },
      { id: "logistics", name: "Logistique & Transport", icon: "🚚", description: "Gestion des livraisons", enabled: true, path: "/dashboard/deliveries" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" }
    ]
  },
  // BTP
  btp: {
    name: "BTP",
    icon: "🏗️",
    modules: [
      { id: "production", name: "Production & Industrie", icon: "🏭", description: "Gestion des chantiers", enabled: true, path: "/dashboard/production" },
      { id: "supply", name: "Supply Chain & Stocks", icon: "📦", description: "Gestion des matériaux", enabled: true, path: "/dashboard/stock" },
      { id: "purchases", name: "Achats & Approvisionnements", icon: "🛒", description: "Commandes fournisseurs", enabled: true, path: "/dashboard/purchases" },
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel", enabled: true, path: "/dashboard/hr" }
    ]
  },
  // Santé
  sante: {
    name: "Santé",
    icon: "🏥",
    modules: [
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel médical", enabled: true, path: "/dashboard/hr" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" },
      { id: "ai", name: "Business Intelligence & IA", icon: "🤖", description: "Analyses et reporting", enabled: true, path: "/dashboard/ai" }
    ]
  },
  // Éducation
  education: {
    name: "Éducation",
    icon: "🎓",
    modules: [
      { id: "hr", name: "Ressources Humaines", icon: "👨‍💼", description: "Gestion du personnel", enabled: true, path: "/dashboard/hr" },
      { id: "finance", name: "Finance & Comptabilité", icon: "💰", description: "Gestion financière", enabled: true, path: "/dashboard/finance" },
      { id: "ai", name: "Business Intelligence & IA", icon: "🤖", description: "Analyses académiques", enabled: true, path: "/dashboard/ai" }
    ]
  }
};

// Fonction pour obtenir les modules d'une catégorie
export function getModulesByCategory(categoryId) {
  return modulesByCategory[categoryId] || modulesByCategory.pme;
}

// Fonction pour vérifier si un module est activé
export function isModuleEnabled(categoryId, moduleId) {
  const category = modulesByCategory[categoryId];
  if (!category) return false;
  const module = category.modules.find(m => m.id === moduleId);
  return module ? module.enabled : false;
}
