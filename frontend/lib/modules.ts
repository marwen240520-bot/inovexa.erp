// Service de synchronisation des modules entre admin et client

const API_URL = 'http://localhost:3001';

export async function fetchUserModules() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  
  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      return user.enabledModules || [];
    }
  } catch(e) { console.error(e); }
  return [];
}

export async function updateLocalUserModules() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      return user.enabledModules || [];
    }
  } catch(e) { console.error(e); }
  return [];
}

export function getEnabledModules() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.enabledModules || [];
}

export function isModuleEnabled(moduleId) {
  const enabled = getEnabledModules();
  return enabled.includes(moduleId);
}

export const allModules = [
  { id: 'rh', name: 'Ressources Humaines', icon: '👨‍💼', description: 'Gestion administrative, paie, congés, recrutement', color: '#8b5cf6', path: '/dashboard/rh' },
  { id: 'finance', name: 'Finance & Comptabilité', icon: '💰', description: 'Comptabilité, trésorerie, facturation, reporting IA', color: '#10b981', path: '/dashboard/finance' },
  { id: 'supply', name: 'Supply Chain & Stocks', icon: '📦', description: 'Multi-dépôts, alertes stock, traçabilité', color: '#f59e0b', path: '/dashboard/supply' },
  { id: 'production', name: 'Production & Industrie', icon: '🏭', description: 'Nomenclatures, ordres de fabrication', color: '#ef4444', path: '/dashboard/production' },
  { id: 'purchasing', name: 'Achats & Approvisionnements', icon: '🛒', description: 'Commandes fournisseurs, évaluations', color: '#3b82f6', path: '/dashboard/purchasing' },
  { id: 'sales', name: 'Ventes & Facturation', icon: '📈', description: 'Devis, facturation, relances auto', color: '#ec489a', path: '/dashboard/sales' },
  { id: 'logistics', name: 'Logistique & Transport', icon: '🚚', description: 'Expéditions, suivi livraisons, tournées', color: '#14b8a6', path: '/dashboard/logistics' },
  { id: 'bi', name: 'Business Intelligence & IA', icon: '🤖', description: 'Tableaux de bord, prédictions, assistant IA', color: '#a855f7', path: '/dashboard/bi' }
];

export function getActiveModules() {
  const enabled = getEnabledModules();
  return allModules.filter(m => enabled.includes(m.id));
}
