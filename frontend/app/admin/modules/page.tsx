"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

// --- SVG Icons ----------------------------------------------------------------
const icons = {
  // Module icons
  dashboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  products: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  categories: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  stock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  sales: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  purchases: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  orders: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  clients: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  suppliers: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  invoices: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  hr: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  finance: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  logistics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  production: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  ai: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </svg>
  ),
  reports: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  analytics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  profile: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  // UI icons
  checkCircle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  xCircle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  save: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  loader: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  mail: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  building: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  modules: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  successIcon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  errorIcon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
};

// Category SVG icons
const categoryIcons: Record<string, JSX.Element> = {
  principal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  commerce: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  crm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  finance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  rh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logistics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  production: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  ai: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

// --- Types --------------------------------------------------------------------

interface Client {
  id: number;
  name: string;
  email: string;
  companyName?: string;
}

interface Module {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  category: string;
  enabled: boolean;
}

export default function AdminModulesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [animateCards, setAnimateCards] = useState<boolean>(false);

  // Liste de tous les modules disponibles
  const allModules = [
    { id: "dashboard",   name: "Dashboard",             icon: icons.dashboard,   description: "Tableau de bord principal",  category: "principal"  },
    { id: "products",    name: "Produits",               icon: icons.products,    description: "Gestion des produits",       category: "commerce"   },
    { id: "categories",  name: "Cat�gories",             icon: icons.categories,  description: "Gestion des cat�gories",     category: "commerce"   },
    { id: "stock",       name: "Stock",                  icon: icons.stock,       description: "Gestion du stock",           category: "commerce"   },
    { id: "sales",       name: "Ventes",                 icon: icons.sales,       description: "Gestion des ventes",         category: "commerce"   },
    { id: "purchases",   name: "Achats",                 icon: icons.purchases,   description: "Gestion des achats",         category: "commerce"   },
    { id: "orders",      name: "Commandes",              icon: icons.orders,      description: "Gestion des commandes",      category: "commerce"   },
    { id: "clients",     name: "Clients",                icon: icons.clients,     description: "Gestion des clients",        category: "crm"        },
    { id: "suppliers",   name: "Fournisseurs",           icon: icons.suppliers,   description: "Gestion des fournisseurs",   category: "crm"        },
    { id: "invoices",    name: "Factures",               icon: icons.invoices,    description: "Gestion des factures",       category: "finance"    },
    { id: "hr",          name: "Ressources Humaines",    icon: icons.hr,          description: "Gestion RH",                 category: "rh"         },
    { id: "finance",     name: "Finance",                icon: icons.finance,     description: "Gestion financi�re",         category: "finance"    },
    { id: "logistics",   name: "Logistique",             icon: icons.logistics,   description: "Gestion logistique",         category: "logistics"  },
    { id: "production",  name: "Production",             icon: icons.production,  description: "Gestion production",         category: "production" },
    { id: "ai",          name: "Assistant IA",           icon: icons.ai,          description: "Intelligence artificielle",  category: "ai"         },
    { id: "reports",     name: "Rapports",               icon: icons.reports,     description: "G�n�ration de rapports",     category: "analytics"  },
    { id: "analytics",   name: "Analytics",              icon: icons.analytics,   description: "Analyses avanc�es",          category: "analytics"  },
    { id: "profile",     name: "Mon Profil",             icon: icons.profile,     description: "Profil utilisateur",         category: "user"       },
    { id: "settings",    name: "Param�tres",             icon: icons.settings,    description: "Configuration",              category: "user"       },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) router.push("/auth/login");
    if (user.role !== "admin") router.push("/dashboard");
    fetchClients();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/admin/clients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedClient(data[0]);
        loadClientModules(data[0].id);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const loadClientModules = async (clientId: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${clientId}/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const modulesWithStatus = allModules.map(module => ({
          ...module,
          enabled: data[module.id] !== false
        }));
        setModules(modulesWithStatus);
      } else {
        setModules(allModules.map(m => ({ ...m, enabled: true })));
      }
    } catch(e) { console.error(e); }
  };

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const toggleAllModules = (enabled: boolean) => {
    setModules(modules.map(m => ({ ...m, enabled })));
  };

  const saveModules = async () => {
    if (!selectedClient) return;
    setSaving(true);
    const token = localStorage.getItem("token");
    const modulesConfig = {};
    modules.forEach(m => { modulesConfig[m.id] = m.enabled; });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${selectedClient.id}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ modules: modulesConfig })
      });
      if (res.ok) {
        showMessage(`Modules mis � jour pour ${selectedClient.name}`, "success");
      } else {
        showMessage("Erreur lors de la sauvegarde", "error");
      }
    } catch(e) {
      showMessage("Erreur de connexion", "error");
    }
    setSaving(false);
  };

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const onClientChange = (client: Client) => {
    setSelectedClient(client);
    loadClientModules(client.id);
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = modules.filter(m => m.enabled).length;
  const totalModules = modules.length;
  const progress = totalModules > 0 ? (enabledCount / totalModules) * 100 : 0;

  // Grouper les modules par cat�gorie
  const groupedModules = modules.reduce((acc: Record<string, Module[]>, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {});

  const categoryNames: Record<string, { label: string; icon: JSX.Element }> = {
    principal:  { label: "Principal",              icon: categoryIcons.principal  },
    commerce:   { label: "Commerce",               icon: categoryIcons.commerce   },
    crm:        { label: "CRM",                    icon: categoryIcons.crm        },
    finance:    { label: "Finance",                icon: categoryIcons.finance    },
    rh:         { label: "Ressources Humaines",    icon: categoryIcons.rh         },
    logistics:  { label: "Logistique",             icon: categoryIcons.logistics  },
    production: { label: "Production",             icon: categoryIcons.production },
    ai:         { label: "Intelligence Artificielle", icon: categoryIcons.ai      },
    analytics:  { label: "Analytics",              icon: categoryIcons.analytics  },
    user:       { label: "Utilisateur",            icon: categoryIcons.user       },
  };

  if (loading) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #1a1a1a", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <style>{`
              @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes fadeInUp   { from { opacity: 0; transform: translateY(20px);  } to { opacity: 1; transform: translateY(0); } }
              @keyframes pulse      { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
              @keyframes spin       { to { transform: rotate(360deg); } }
            `}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: "white", fontSize: "28px", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#667eea" }}>{icons.modules}</span>
                  Gestion des Modules
                </h1>
                <p style={{ color: "#94a3b8", marginTop: "4px" }}>Activez ou d�sactivez les modules pour chaque client</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              color: messageType === "success" ? "#10b981" : "#f87171",
              padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
              textAlign: "center", animation: "fadeInUp 0.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              {messageType === "success" ? icons.successIcon : icons.errorIcon}
              {message}
            </div>
          )}

          {/* S�lection du client */}
          <div style={{
            background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
            borderRadius: "20px", padding: "24px", border: "1px solid #222",
            marginBottom: "32px", animation: `fadeInUp 0.5s ease`, opacity: animateCards ? 1 : 0
          }}>
            <label style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              {icons.users}
              S�lectionner un client
            </label>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const client = clients.find(c => c.id === parseInt(e.target.value));
                  if (client) onClientChange(client);
                }}
                style={{ flex: 2, padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white", minWidth: "250px" }}
              >
                <option value="">S�lectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
              <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                  {icons.search}
                </span>
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "12px 12px 12px 38px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {selectedClient && (
              <div style={{ marginTop: "16px", padding: "12px", background: "#1a1a1a", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <span style={{ color: "#667eea", display: "flex", alignItems: "center", gap: "5px" }}>
                      {icons.mail} {selectedClient.email}
                    </span>
                    {selectedClient.companyName && (
                      <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                        {icons.building} {selectedClient.companyName}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleAllModules(true)}
                      style={{ background: "#10b981", color: "white", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                    >
                      {icons.checkCircle} Tout activer
                    </button>
                    <button
                      onClick={() => toggleAllModules(false)}
                      style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                    >
                      {icons.xCircle} Tout d�sactiver
                    </button>
                    <button
                      onClick={saveModules}
                      disabled={saving}
                      style={{ background: "#667eea", color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                    >
                      {saving ? icons.loader : icons.save}
                      {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barre de progression des modules */}
          {selectedClient && (
            <div style={{
              background: "#111", borderRadius: "16px", padding: "20px", border: "1px solid #222",
              marginBottom: "24px", animation: `fadeInUp 0.5s ease 0.1s`, opacity: animateCards ? 1 : 0
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Modules activ�s</span>
                <span style={{ color: "#10b981", fontWeight: "bold" }}>{enabledCount}/{totalModules} ({Math.round(progress)}%)</span>
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: "10px", height: "8px" }}>
                <div style={{ width: `${progress}%`, background: "linear-gradient(90deg, #667eea, #764ba2)", height: "8px", borderRadius: "10px", transition: "width 0.5s" }}></div>
              </div>
            </div>
          )}

          {/* Liste des modules par cat�gorie */}
          {selectedClient && (
            <div style={{ animation: `fadeInUp 0.5s ease 0.2s`, opacity: animateCards ? 1 : 0 }}>
              {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category} style={{ marginBottom: "32px" }}>
                  <h2 style={{ color: "white", fontSize: "18px", marginBottom: "16px", borderLeft: `3px solid #667eea`, paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#667eea" }}>
                      {categoryIcons[category]}
                    </span>
                    {categoryNames[category]?.label || category}
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                    {(categoryModules as Module[]).map((module, idx) => (
                      <div
                        key={module.id}
                        style={{
                          background: module.enabled ? "#111" : "#0a0a0a",
                          borderRadius: "12px", padding: "16px",
                          border: `1px solid ${module.enabled ? "#667eea" : "#333"}`,
                          opacity: module.enabled ? 1 : 0.6,
                          transition: "all 0.3s", cursor: "pointer",
                          animation: `fadeInUp 0.3s ease ${idx * 0.02}s`
                        }}
                        onClick={() => toggleModule(module.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <div style={{ color: module.enabled ? "#667eea" : "#555", flexShrink: 0 }}>
                            {module.icon}
                          </div>
                          <div>
                            <div style={{ color: "white", fontWeight: "bold" }}>{module.name}</div>
                            <div style={{ color: "#94a3b8", fontSize: "11px" }}>{module.description}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: module.enabled ? "#10b981" : "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                            {module.enabled ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Activ�
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                </svg>
                                D�sactiv�
                              </>
                            )}
                          </span>
                          {/* Toggle switch */}
                          <div style={{
                            width: "40px", height: "20px",
                            background: module.enabled ? "#667eea" : "#333",
                            borderRadius: "10px", position: "relative", transition: "background 0.3s"
                          }}>
                            <div style={{
                              width: "16px", height: "16px", background: "white",
                              borderRadius: "8px", position: "absolute", top: "2px",
                              left: module.enabled ? "22px" : "2px", transition: "left 0.3s"
                            }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!selectedClient && (
            <div style={{
              background: "#111", borderRadius: "20px", padding: "60px",
              textAlign: "center", border: "1px solid #222", animation: `fadeInUp 0.5s ease`
            }}>
              <div style={{ marginBottom: "16px", color: "#667eea", display: "flex", justifyContent: "center" }}>
                {icons.arrowLeft}
              </div>
              <p style={{ color: "#94a3b8" }}>S�lectionnez un client pour g�rer ses modules</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
