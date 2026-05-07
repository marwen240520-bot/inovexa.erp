"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

// Configuration des catégories et modules par défaut
const defaultCategories = {
  pme: {
    id: 'pme',
    name: 'PME',
    icon: '🏪',
    color: '#667eea',
    description: 'Gestion globale simple et intelligente',
    modules: [
      { id: 'hr', name: 'Ressources Humaines', icon: '👨‍💼', description: 'Gestion administrative, paie, congés, recrutement', enabled: true, path: '/dashboard/hr' },
      { id: 'finance', name: 'Finance & Comptabilité', icon: '💰', description: 'Comptabilité, trésorerie, facturation, reporting IA', enabled: true, path: '/dashboard/finance' },
      { id: 'supply', name: 'Supply Chain & Stocks', icon: '📦', description: 'Multi-dépôts, alertes stock, traçabilité', enabled: true, path: '/dashboard/stock' },
      { id: 'production', name: 'Production & Industrie', icon: '🏭', description: 'Nomenclatures, ordres de fabrication', enabled: true, path: '/dashboard/production' },
      { id: 'purchases', name: 'Achats & Approvisionnements', icon: '🛒', description: 'Commandes fournisseurs, évaluations', enabled: true, path: '/dashboard/purchases' },
      { id: 'sales', name: 'Ventes & Facturation', icon: '📈', description: 'Devis, facturation, relances auto', enabled: true, path: '/dashboard/sales' },
      { id: 'logistics', name: 'Logistique & Transport', icon: '🚚', description: 'Expéditions, suivi livraisons, tournées', enabled: true, path: '/dashboard/deliveries' },
      { id: 'ai', name: 'Business Intelligence & IA', icon: '🤖', description: 'Tableaux de bord, prédictions, assistant IA', enabled: true, path: '/dashboard/ai' }
    ]
  }
};

export function CategoryProvider({ children }) {
  const [category, setCategory] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientModules, setClientModules] = useState({});

  useEffect(() => {
    const savedCategory = localStorage.getItem('businessCategory');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (savedCategory && defaultCategories[savedCategory]) {
      setCategory(savedCategory);
      setModules(defaultCategories[savedCategory].modules);
    } else if (user.businessCategory && defaultCategories[user.businessCategory]) {
      setCategory(user.businessCategory);
      setModules(defaultCategories[user.businessCategory].modules);
    }
    
    // Charger les modules personnalisés du client
    if (user.id && user.role === 'client') {
      loadClientModules(user.id);
    }
    
    setLoading(false);
  }, []);

  const loadClientModules = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/admin/clients/${userId}/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const modulesData = await res.json();
        setClientModules(modulesData);
        
        // Mettre à jour l'état des modules
        setModules(prevModules => 
          prevModules.map(module => ({
            ...module,
            enabled: modulesData[module.id] !== undefined ? modulesData[module.id] : module.enabled
          }))
        );
      }
    } catch(e) { console.error(e); }
  };

  const getModules = () => {
    return modules;
  };

  const getCategoryInfo = () => {
    return defaultCategories[category] || null;
  };

  const updateCategory = (newCategory) => {
    if (defaultCategories[newCategory]) {
      setCategory(newCategory);
      setModules(defaultCategories[newCategory].modules);
      localStorage.setItem('businessCategory', newCategory);
    }
  };

  return (
    <CategoryContext.Provider value={{
      category,
      modules,
      loading,
      updateCategory,
      getCategoryInfo,
      getModules
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
