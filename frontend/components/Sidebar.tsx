"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, CSSProperties } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDeviceHint } from "@/contexts/DeviceContext";
import { MODULES_CHANGED_EVENT, SESSION_CLEARED_EVENT, clearSession, isPlatformAdmin } from "@/lib/session";
import { moduleLabel } from "@/lib/sectorLabels";
import { prefetchRouteData } from "@/lib/routeData";
import { useCompanyProfile } from "@/lib/company-profile";

// ─── SVG Icon Library ─────────────────────────────────────────────────────────
const Icon = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const EXTRA_LABELS: Record<string, Record<string, string>> = {
  "common.pos": { fr: "Caisse (POS)", en: "Checkout (POS)", es: "Caja (TPV)" },
  "common.objectives": { fr: "Objectifs", en: "Goals", es: "Objetivos" },
  "common.appointments": { fr: "Rendez-vous", en: "Appointments", es: "Citas" },
  "common.projects": { fr: "Projets", en: "Projects", es: "Proyectos" },
  "common.more": { fr: "Plus", en: "More", es: "Más" },
  "common.menu": { fr: "Menu", en: "Menu", es: "Menú" },
  // Entrées du menu du tableau de bord (un libellé par entrée : fr / en / es)
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard", es: "Panel" },
  "nav.clients": { fr: "Clients", en: "Customers", es: "Clientes" },
  "nav.crm": { fr: "CRM", en: "CRM", es: "CRM" },
  "nav.orders": { fr: "Commandes", en: "Orders", es: "Pedidos" },
  "nav.sales": { fr: "Ventes", en: "Sales", es: "Ventas" },
  "nav.invoices": { fr: "Factures", en: "Invoices", es: "Facturas" },
  "nav.posSessions": { fr: "Sessions de caisse", en: "Cash sessions", es: "Sesiones de caja" },
  "nav.products": { fr: "Produits", en: "Products", es: "Productos" },
  "nav.suggestions": { fr: "Suggestions", en: "Suggestions", es: "Sugerencias" },
  "nav.categories": { fr: "Catégories", en: "Categories", es: "Categorías" },
  "nav.stock": { fr: "Stock", en: "Stock", es: "Stock" },
  "nav.suppliers": { fr: "Fournisseurs", en: "Suppliers", es: "Proveedores" },
  "nav.purchases": { fr: "Achats", en: "Purchases", es: "Compras" },
  "nav.shipments": { fr: "Expéditions", en: "Shipments", es: "Envíos" },
  "nav.carriers": { fr: "Transporteurs", en: "Carriers", es: "Transportistas" },
  "nav.logisticsAnalytics": { fr: "Analyses", en: "Analytics", es: "Análisis" },
  "nav.overview": { fr: "Vue d'ensemble", en: "Overview", es: "Resumen" },
  "nav.income": { fr: "Revenus", en: "Income", es: "Ingresos" },
  "nav.expenses": { fr: "Dépenses", en: "Expenses", es: "Gastos" },
  "nav.cashflow": { fr: "Trésorerie", en: "Cash flow", es: "Tesorería" },
  "nav.balanceSheet": { fr: "Bilan", en: "Balance sheet", es: "Balance general" },
  "nav.budget": { fr: "Budget", en: "Budget", es: "Presupuesto" },
  "nav.ratios": { fr: "Ratios", en: "Ratios", es: "Ratios" },
  "nav.accounting": { fr: "Comptabilité", en: "Accounting", es: "Contabilidad" },
  "nav.journal": { fr: "Journal", en: "Journal", es: "Diario" },
  "nav.trialBalance": { fr: "Balance comptable", en: "Trial balance", es: "Balance de comprobación" },
  "nav.incomeStatement": { fr: "Résultat", en: "Income statement", es: "Resultados" },
  "nav.vat": { fr: "TVA", en: "VAT", es: "IVA" },
  "nav.bank": { fr: "Banque", en: "Bank", es: "Banco" },
  "nav.documents": { fr: "Documents", en: "Documents", es: "Documentos" },
  "nav.payments": { fr: "Paiements", en: "Payments", es: "Pagos" },
  "nav.employees": { fr: "Employés", en: "Employees", es: "Empleados" },
  "nav.payroll": { fr: "Paie", en: "Payroll", es: "Nóminas" },
  "nav.leaves": { fr: "Congés", en: "Leave", es: "Vacaciones" },
  "nav.analytics": { fr: "Analyses", en: "Analytics", es: "Análisis" },
  "nav.reports": { fr: "Rapports", en: "Reports", es: "Informes" },
  "nav.reportsGenerate": { fr: "Générer", en: "Generate", es: "Generar" },
  "nav.reportsSaved": { fr: "Enregistrés", en: "Saved", es: "Guardados" },
  "nav.reportsBusiness": { fr: "Business", en: "Business", es: "Negocio" },
  "nav.aiDashboard": { fr: "Dashboard", en: "Dashboard", es: "Panel" },
  "nav.aiChat": { fr: "Chat IA", en: "AI chat", es: "Chat IA" },
  "nav.aiForecasts": { fr: "Prévisions", en: "Forecasts", es: "Previsiones" },
  "nav.aiRecommendations": { fr: "Recommandations", en: "Recommendations", es: "Recomendaciones" },
  "nav.aiAnalytics": { fr: "Analyses", en: "Analytics", es: "Análisis" },
  "nav.profile": { fr: "Profil", en: "Profile", es: "Perfil" },
  "nav.profileInfo": { fr: "Infos", en: "Info", es: "Datos" },
  "nav.profileSecurity": { fr: "Sécurité", en: "Security", es: "Seguridad" },
  "nav.profileActivity": { fr: "Activité", en: "Activity", es: "Actividad" },
  "nav.company": { fr: "Société", en: "Company", es: "Empresa" },
  "nav.settings": { fr: "Paramètres", en: "Settings", es: "Configuración" },
  "nav.billing": { fr: "Abonnement", en: "Subscription", es: "Suscripción" },
  "nav.carrierStats": { fr: "Statistiques", en: "Statistics", es: "Estadísticas" },
  // Espace de l'administrateur de la plateforme
  "admin.overview": { fr: "Tableau de bord", en: "Overview", es: "Panel" },
  "admin.accounts": { fr: "Comptes clients", en: "Customer accounts", es: "Cuentas de clientes" },
  "admin.payments": { fr: "Paiements", en: "Payments", es: "Pagos" },
  "admin.plans": { fr: "Formules et tarifs", en: "Plans and pricing", es: "Planes y precios" },
  "admin.sectors": { fr: "Secteurs et suggestions", en: "Sectors and suggestions", es: "Sectores y sugerencias" },
  "admin.platformSettings": { fr: "Réglages de la plateforme", en: "Platform settings", es: "Ajustes de la plataforma" },
  "admin.audit": { fr: "Journal d’activité", en: "Activity log", es: "Registro de actividad" },
  // Titres des sections de la barre latérale
  "nav.groups.sales": { fr: "Ventes & clients", en: "Sales & customers", es: "Ventas y clientes" },
  "nav.groups.products": { fr: "Produits & stock", en: "Products & stock", es: "Productos y stock" },
  "nav.groups.purchasing": { fr: "Achats", en: "Purchasing", es: "Compras" },
  "nav.groups.logistics": { fr: "Logistique", en: "Logistics", es: "Logística" },
  "nav.groups.finance": { fr: "Finance", en: "Finance", es: "Finanzas" },
  "nav.groups.hr": { fr: "RH", en: "HR", es: "RR. HH." },
  "nav.groups.insights": { fr: "Pilotage", en: "Insights", es: "Seguimiento" },
  "nav.groups.ai": { fr: "Assistant IA", en: "AI assistant", es: "Asistente IA" },
  "nav.groups.account": { fr: "Compte", en: "Account", es: "Cuenta" },
};

const ICONS: Record<string, React.ReactElement> = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </Icon>
  ),
  products: (
    <Icon>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </Icon>
  ),
  categories: (
    <Icon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="12" y2="13"/>
    </Icon>
  ),
  stock: (
    <Icon>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </Icon>
  ),
  pos: (
    <Icon>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <rect x="8" y="6" width="8" height="4" rx="1"/>
      <line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>
      <line x1="8" y1="18" x2="8.01" y2="18"/><line x1="12" y1="18" x2="16" y2="18"/>
    </Icon>
  ),
  objectives: (
    <Icon>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </Icon>
  ),
  sales: (
    <Icon>
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </Icon>
  ),
  purchases: (
    <Icon>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </Icon>
  ),
  orders: (
    <Icon>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </Icon>
  ),
  clients: (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </Icon>
  ),
  suppliers: (
    <Icon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </Icon>
  ),
  invoices: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </Icon>
  ),
  hr: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </Icon>
  ),
  finance: (
    <Icon>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </Icon>
  ),
  logistics: (
    <Icon>
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </Icon>
  ),
  appointments: (
    <Icon>
      <rect x="3" y="4.5" width="18" height="17" rx="2"/>
      <line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 15.5 11.2 17.7 15.2 13.5"/>
    </Icon>
  ),
  projects: (
    <Icon>
      <rect x="3" y="4" width="5" height="16" rx="1.2"/>
      <rect x="9.5" y="4" width="5" height="10.5" rx="1.2"/>
      <rect x="16" y="4" width="5" height="13.5" rx="1.2"/>
    </Icon>
  ),
  ai: (
    <Icon>
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="12" y2="17"/>
    </Icon>
  ),
  analytics: (
    <Icon>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </Icon>
  ),
  profile: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </Icon>
  ),
  adminClients: (
    <Icon>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </Icon>
  ),
  adminModules: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M17.5 14v7M14 17.5h7"/>
    </Icon>
  ),
  shipments: (
    <Icon>
      <rect x="9" y="11" width="14" height="10" rx="1"/>
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </Icon>
  ),
  // ── Icônes des entrées ajoutées avec les sous-menus (style Feather / Lucide, tracé 24×24) ──
  crm: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <polyline points="17 11 19 13 23 9"/>
    </Icon>
  ),
  sessions: (
    <Icon>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </Icon>
  ),
  suggestions: (
    <Icon>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </Icon>
  ),
  barChart: (
    <Icon>
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </Icon>
  ),
  trendingUp: (
    <Icon>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </Icon>
  ),
  trendingDown: (
    <Icon>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </Icon>
  ),
  banknote: (
    <Icon>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    </Icon>
  ),
  columns: (
    <Icon>
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>
    </Icon>
  ),
  pieChart: (
    <Icon>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </Icon>
  ),
  gauge: (
    <Icon>
      <path d="m12 14 4-4"/>
      <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
    </Icon>
  ),
  calculator: (
    <Icon>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="16" y1="14" x2="16" y2="18"/>
      <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/>
    </Icon>
  ),
  journal: (
    <Icon>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </Icon>
  ),
  scale: (
    <Icon>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </Icon>
  ),
  receipt: (
    <Icon>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5v-11"/>
    </Icon>
  ),
  landmark: (
    <Icon>
      <line x1="3" y1="22" x2="21" y2="22"/>
      <line x1="6" y1="18" x2="6" y2="11"/>
      <line x1="10" y1="18" x2="10" y2="11"/>
      <line x1="14" y1="18" x2="14" y2="11"/>
      <line x1="18" y1="18" x2="18" y2="11"/>
      <polygon points="12 2 20 7 4 7"/>
    </Icon>
  ),
  files: (
    <Icon>
      <path d="M20 7h-3a2 2 0 0 1-2-2V2"/>
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/>
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/>
    </Icon>
  ),
  creditCard: (
    <Icon>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
    </Icon>
  ),
  wallet: (
    <Icon>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </Icon>
  ),
  filePlus: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </Icon>
  ),
  bookmark: (
    <Icon>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </Icon>
  ),
  briefcase: (
    <Icon>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </Icon>
  ),
  messageCircle: (
    <Icon>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </Icon>
  ),
  lineChart: (
    <Icon>
      <path d="M3 3v18h18"/>
      <path d="m19 9-5 5-4-4-3 3"/>
    </Icon>
  ),
  sparkles: (
    <Icon>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </Icon>
  ),
  info: (
    <Icon>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </Icon>
  ),
  shield: (
    <Icon>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </Icon>
  ),
  history: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </Icon>
  ),
  building: (
    <Icon>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </Icon>
  ),
  repeat: (
    <Icon>
      <path d="m17 2 4 4-4 4"/>
      <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
      <path d="m7 22-4-4 4-4"/>
      <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </Icon>
  ),
  menu: (
    <Icon d="M3 12h18M3 6h18M3 18h18"/>
  ),
  close: (
    <Icon d="M18 6L6 18M6 6l12 12"/>
  ),
  logout: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </Icon>
  ),
  chevron: (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  phone?: string;
  modules?: Record<string, boolean>;
  /** Secteur d'activité de la société : il donne leur nom à certains modules (« Réservations », « Chantiers »…). */
  sector?: string | null;
}

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  textSecondary: string;
  navText?: string;
  text?: string;
  border: string;
  gradient: string;
  mode?: "light" | "dark";
}

// `gate` : module de l'abonnement qui autorise l'entrée (par défaut, son propre id).
// `also` : préfixes d'adresses qui allument aussi l'entrée (sous-pages d'un même module).
// `exact` : adresses exactes qui allument aussi l'entrée (anciennes adresses d'entrée d'un module, ex. /dashboard/accounting).
// `children` : sous-menu. L'entrée est alors un parent dépliable, sans page propre (`path` vide).
interface NavItem {
  id: string;
  gate?: string;
  path: string;
  label: string;
  iconKey: string;
  also?: string[];
  exact?: string[];
  children?: NavItem[];
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ─── Menu du tableau de bord ──────────────────────────────────────────────────
// Chaque entrée mène à sa propre page. Les entrées sont rangées par section ; une section dont aucune
// entrée n'est active dans l'abonnement n'est pas affichée, et un parent sans enfant visible non plus.
// Pour déplacer une entrée, déplacez simplement sa ligne d'une section à l'autre.
const CLIENT_TOP: NavItem[] = [
  { id: "dashboard", path: "/dashboard", label: "nav.dashboard", iconKey: "dashboard" },
];

const CLIENT_GROUPS: NavGroup[] = [
  {
    id: "sales", label: "nav.groups.sales", items: [
      { id: "clients",      path: "/dashboard/clients",      label: "nav.clients",         iconKey: "clients" },
      { id: "crm",          gate: "clients", path: "/dashboard/crm", label: "nav.crm",      iconKey: "crm" },
      { id: "appointments", path: "/dashboard/appointments", label: "common.appointments", iconKey: "appointments" },
      { id: "orders",       path: "/dashboard/orders",       label: "nav.orders",          iconKey: "orders" },
      { id: "sales",        path: "/dashboard/sales",        label: "nav.sales",           iconKey: "sales" },
      { id: "sales-invoices", gate: "invoices", path: "/dashboard/invoices", label: "nav.invoices", iconKey: "invoices" },
      { id: "pos",          path: "/dashboard/pos",          label: "common.pos",          iconKey: "pos" },
      { id: "pos-sessions", gate: "pos", path: "/dashboard/pos/sessions", label: "nav.posSessions", iconKey: "sessions" },
    ],
  },
  {
    id: "products", label: "nav.groups.products", items: [
      { id: "products",    path: "/dashboard/products",    label: "nav.products",    iconKey: "products" },
      { id: "suggestions", gate: "products", path: "/dashboard/products/suggestions", label: "nav.suggestions", iconKey: "suggestions" },
      { id: "categories",  path: "/dashboard/categories",  label: "nav.categories",  iconKey: "categories" },
      { id: "stock",       path: "/dashboard/stock",       label: "nav.stock",       iconKey: "stock" },
    ],
  },
  {
    id: "purchasing", label: "nav.groups.purchasing", items: [
      { id: "suppliers", path: "/dashboard/suppliers", label: "nav.suppliers", iconKey: "suppliers" },
      { id: "purchases", path: "/dashboard/purchases", label: "nav.purchases", iconKey: "purchases" },
    ],
  },
  {
    id: "logistics", label: "nav.groups.logistics", items: [
      { id: "logistics-shipments", gate: "logistics", path: "/dashboard/logistics/shipments", label: "nav.shipments",         iconKey: "shipments" },
      { id: "logistics-carriers",  gate: "logistics", path: "/dashboard/logistics/carriers",  label: "nav.carriers",          iconKey: "logistics" },
      { id: "logistics-analytics", gate: "logistics", path: "/dashboard/logistics/analytics", label: "nav.logisticsAnalytics", iconKey: "barChart" },
    ],
  },
  {
    id: "finance", label: "nav.groups.finance", items: [
      { id: "finance-overview", gate: "finance", path: "/dashboard/finance",          label: "nav.overview",     iconKey: "finance" },
      { id: "finance-income",   gate: "finance", path: "/dashboard/finance/income",   label: "nav.income",       iconKey: "trendingUp" },
      { id: "finance-expenses", gate: "finance", path: "/dashboard/finance/expenses", label: "nav.expenses",     iconKey: "trendingDown" },
      { id: "finance-cashflow", gate: "finance", path: "/dashboard/finance/cashflow", label: "nav.cashflow",     iconKey: "banknote" },
      { id: "finance-balance",  gate: "finance", path: "/dashboard/finance/balance",  label: "nav.balanceSheet", iconKey: "columns" },
      { id: "finance-budget",   gate: "finance", path: "/dashboard/finance/budget",   label: "nav.budget",       iconKey: "pieChart" },
      { id: "finance-ratios",   gate: "finance", path: "/dashboard/finance/ratios",   label: "nav.ratios",       iconKey: "gauge" },
      { id: "finance-invoices", gate: "finance", path: "/dashboard/finance/invoices", label: "nav.invoices",     iconKey: "invoices" },
      {
        id: "accounting", gate: "finance", path: "", label: "nav.accounting", iconKey: "calculator", children: [
          { id: "accounting-journal", gate: "finance", path: "/dashboard/accounting/journal", label: "nav.journal",         iconKey: "journal", exact: ["/dashboard/accounting"] },
          { id: "accounting-balance", gate: "finance", path: "/dashboard/accounting/balance", label: "nav.trialBalance",    iconKey: "scale" },
          { id: "accounting-result",  gate: "finance", path: "/dashboard/accounting/result",  label: "nav.incomeStatement", iconKey: "barChart" },
          { id: "accounting-vat",     gate: "finance", path: "/dashboard/accounting/vat",     label: "nav.vat",             iconKey: "receipt" },
          { id: "accounting-bank",    gate: "finance", path: "/dashboard/accounting/bank",    label: "nav.bank",            iconKey: "landmark" },
        ],
      },
      { id: "documents", gate: "invoices", path: "/dashboard/documents",          label: "nav.documents", iconKey: "files" },
      { id: "payments",  gate: "invoices", path: "/dashboard/documents/payments", label: "nav.payments",  iconKey: "creditCard" },
    ],
  },
  {
    id: "hr", label: "nav.groups.hr", items: [
      { id: "hr-employees", gate: "hr", path: "/dashboard/hr",         label: "nav.employees", iconKey: "hr" },
      { id: "hr-payroll",   gate: "hr", path: "/dashboard/hr/payroll", label: "nav.payroll",   iconKey: "wallet" },
    ],
  },
  {
    id: "insights", label: "nav.groups.insights", items: [
      { id: "analytics", path: "/dashboard/analytics", label: "nav.analytics", iconKey: "analytics" },
      {
        id: "reports", gate: "reports", path: "", label: "nav.reports", iconKey: "reports", children: [
          { id: "reports-generate", gate: "reports", path: "/dashboard/reports/generate", label: "nav.reportsGenerate", iconKey: "filePlus", exact: ["/dashboard/reports"] },
          { id: "reports-saved",    gate: "reports", path: "/dashboard/reports/saved",    label: "nav.reportsSaved",    iconKey: "bookmark" },
          { id: "reports-business", gate: "reports", path: "/dashboard/reports/business", label: "nav.reportsBusiness", iconKey: "briefcase" },
        ],
      },
      { id: "objectives", path: "/dashboard/objectives", label: "common.objectives", iconKey: "objectives" },
      { id: "projects",   path: "/dashboard/projects",   label: "common.projects",   iconKey: "projects" },
    ],
  },
  {
    id: "ai", label: "nav.groups.ai", items: [
      { id: "ai-dashboard",       gate: "ai", path: "/dashboard/ai",                 label: "nav.aiDashboard",       iconKey: "ai" },
      { id: "ai-chat",            gate: "ai", path: "/dashboard/ai/chat",            label: "nav.aiChat",            iconKey: "messageCircle" },
      { id: "ai-forecasts",       gate: "ai", path: "/dashboard/ai/forecasts",       label: "nav.aiForecasts",       iconKey: "lineChart" },
      { id: "ai-recommendations", gate: "ai", path: "/dashboard/ai/recommendations", label: "nav.aiRecommendations", iconKey: "sparkles" },
      { id: "ai-analytics",       gate: "ai", path: "/dashboard/ai/analytics",       label: "nav.aiAnalytics",       iconKey: "pieChart" },
    ],
  },
  {
    id: "account", label: "nav.groups.account", items: [
      {
        id: "profile", gate: "profile", path: "", label: "nav.profile", iconKey: "profile", children: [
          { id: "profile-info",     gate: "profile", path: "/dashboard/profile",          label: "nav.profileInfo",     iconKey: "info" },
          { id: "profile-security", gate: "profile", path: "/dashboard/profile/security", label: "nav.profileSecurity", iconKey: "shield" },
          { id: "profile-activity", gate: "profile", path: "/dashboard/profile/activity", label: "nav.profileActivity", iconKey: "history" },
        ],
      },
      { id: "company",  gate: "settings", path: "/dashboard/company",  label: "nav.company",  iconKey: "building" },
      { id: "settings", path: "/dashboard/settings", label: "nav.settings", iconKey: "settings" },
      { id: "billing",  gate: "profile",  path: "/dashboard/billing",  label: "nav.billing",  iconKey: "repeat" },
    ],
  },
];

// Espace de l'administrateur de la plateforme : mêmes entrées qu'avant, hors abonnement.
const ADMIN_TOP: NavItem[] = [
  { id: "adminOverview", path: "/admin",          label: "admin.overview",         iconKey: "dashboard" },
  { id: "adminAccounts", path: "/admin/accounts", label: "admin.accounts",         iconKey: "adminClients" },
  { id: "adminPayments", path: "/admin/payments", label: "admin.payments",         iconKey: "finance" },
  { id: "adminPlans",    path: "/admin/plans",    label: "admin.plans",            iconKey: "orders" },
  { id: "adminSectors",  path: "/admin/sectors",  label: "admin.sectors",          iconKey: "categories" },
  { id: "adminSettings", path: "/admin/settings", label: "admin.platformSettings", iconKey: "adminModules" },
  { id: "adminAudit",    path: "/admin/audit",    label: "admin.audit",            iconKey: "reports" },
];
const ADMIN_ACCOUNT: NavItem[] = [
  { id: "profile",  path: "/dashboard/profile",  label: "common.profile",  iconKey: "profile" },
  { id: "settings", path: "/dashboard/settings", label: "common.settings", iconKey: "settings" },
];

// Un transporteur qui ouvre le tableau de bord retrouve ici le même menu que dans son espace (/transporteur).
const CARRIER_TOP: NavItem[] = [
  { id: "carrier-dashboard", path: "/transporteur/dashboard", label: "nav.dashboard", iconKey: "dashboard" },
  { id: "carrier-shipments", path: "/transporteur/shipments", label: "nav.shipments", iconKey: "shipments" },
];
const CARRIER_ACCOUNT: NavItem[] = [
  { id: "carrier-profile",  path: "/transporteur/profile",       label: "nav.profile",      iconKey: "profile" },
  { id: "carrier-stats",    path: "/transporteur/profile/stats", label: "nav.carrierStats", iconKey: "barChart" },
  { id: "carrier-settings", path: "/transporteur/settings",      label: "nav.settings",     iconKey: "settings" },
];

/** Entrées sans sous-menu, dans l'ordre d'affichage (les parents sont remplacés par leurs enfants). */
function leafItems(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => (i.children ? leafItems(i.children) : [i]));
}

const FONT_STACK = "var(--font-poppins), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BRAND_FONT = "var(--font-orbitron), var(--font-poppins), 'Arial Black', sans-serif";

// Sections et sous-menus ouverts (clé « sub:<id> » pour un sous-menu). Au chargement, Ventes & clients, Produits & stock
// et Achats sont ouvertes, ainsi que la section et le sous-menu de la page ouverte. Ce que l'utilisateur ouvre ou ferme
// est conservé pendant la navigation, puis l'état initial revient au rechargement.
const DEFAULT_OPEN_GROUPS: Record<string, boolean> = { sales: true, products: true, purchasing: true };
let sidebarOpenGroups: Record<string, boolean> = { ...DEFAULT_OPEN_GROUPS };

let sidebarCachedUser: User | null = null;
let sidebarCachedModules: Record<string, boolean> | null = null;
let modulesRefreshed = false;

if (typeof window !== "undefined") {
  // Connexion ou déconnexion faite ailleurs (page de connexion, profil, paramètres…) : on oublie le compte précédent,
  // sinon le compte suivant voyait les modules de l'autre dans la barre latérale.
  window.addEventListener(SESSION_CLEARED_EVENT, () => {
    sidebarCachedUser = null;
    sidebarCachedModules = null;
    modulesRefreshed = false;
    sidebarOpenGroups = { ...DEFAULT_OPEN_GROUPS };
  });
}

const MODULES_STORAGE_KEY = "sidebar_modules";
function readStoredModules(userId?: string | number): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(MODULES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || String(parsed.userId) !== String(userId) || typeof parsed.modules !== "object") return null;
    return parsed.modules;
  } catch { return null; }
}
function storeModules(userId: string | number, modules: Record<string, boolean>) {
  try { localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify({ userId, modules })); } catch { /* ignoré */ }
}


export function getCachedModules(): Record<string, boolean> | null {
  return sidebarCachedModules;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { theme, themeId } = useTheme();
  const { features } = useCompanyProfile();

  const [user, setUser] = useState<User | null>(sidebarCachedUser);
  const [userModules, setUserModules] = useState<Record<string, boolean> | null>(sidebarCachedModules);
  const [loading, setLoading] = useState(sidebarCachedModules === null);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [localTheme, setLocalTheme] = useState<ThemeColors | null>(theme);
  const [mounted, setMounted] = useState(false);
  const isMobileHint = useDeviceHint();
  const [isMobile, setIsMobile] = useState(isMobileHint);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const prefetched = useRef<Set<string>>(new Set());
  const hoverTimer = useRef<number | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => sidebarOpenGroups);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLocalTheme(theme); }, [theme, themeId]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Tiroir ouvert : la page ne défile pas derrière, et le bouton flottant de l'assistant s'efface (il masquait les sections).
    if (mobileMoreOpen) { document.body.style.overflow = "hidden"; document.body.dataset.ixNavDrawer = "open"; }
    else { document.body.style.overflow = ""; delete document.body.dataset.ixNavDrawer; }
    return () => { document.body.style.overflow = ""; delete document.body.dataset.ixNavDrawer; };
  }, [mobileMoreOpen]);

  const normalizeModules = (data: any): Record<string, boolean> | null => {
    if (!data) return null;
    if (Array.isArray(data)) {
      const m: Record<string, boolean> = {};
      data.forEach((id) => { m[String(id)] = true; });
      return m;
    }
    if (data.modules && typeof data.modules === "object") return data.modules;
    if (typeof data === "object") return data;
    return null;
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userData) {
      try {
        const u = JSON.parse(userData);
        setUser(u); sidebarCachedUser = u;
        const known = sidebarCachedModules || normalizeModules(u.modules) || readStoredModules(u.id);
        if (known) { setUserModules(known); sidebarCachedModules = known; setLoading(false); }
        if (u.id && token && !modulesRefreshed) { modulesRefreshed = true; fetchUserModules(u.id, token); }
        else setLoading(false);
      } catch { setLoading(false); }
    } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le client vient de changer son secteur ou ses modules (Abonnement › Mes modules) : le menu suit tout de suite.
  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ modules?: Record<string, boolean>; sector?: string | null }>).detail;
      if (!detail?.modules) return;
      sidebarCachedModules = detail.modules;
      setUserModules(detail.modules);
      if (detail.sector !== undefined) {
        setUser((prev) => {
          const next = prev ? { ...prev, sector: detail.sector } : prev;
          sidebarCachedUser = next;
          return next;
        });
      }
    };
    window.addEventListener(MODULES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MODULES_CHANGED_EVENT, onChange);
  }, []);

  const fetchUserModules = async (userId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const mods = normalizeModules(await res.json());
        if (mods) { setUserModules(mods); sidebarCachedModules = mods; storeModules(userId, mods); }
      }
    } catch {}
    setLoading(false);
  };

  const CORE_MODULES = ["dashboard", "profile", "settings"];
  const isModuleActive = (id: string) => {
    if (CORE_MODULES.includes(id)) return true;
    if (!userModules || Object.keys(userModules).length === 0) return true;
    if (id === "objectives") return userModules.objectives !== false;
    if (id === "pos") return userModules.pos !== undefined ? userModules.pos === true : (userModules.sales === true || userModules.purchases === true);
    return userModules[id] === true;
  };

  const role = user?.role;

  /**
   * Entrées autorisées par l'abonnement. Un parent (sous-menu) n'est gardé que s'il lui reste au moins un enfant.
   * Dans un pays où la paie n'existe pas encore, « Paie » devient « Congés » (la page ouvre alors les congés).
   */
  const keepAllowed = (items: NavItem[]): NavItem[] =>
    items.flatMap((item): NavItem[] => {
      if (item.children) {
        const kids = keepAllowed(item.children);
        return kids.length > 0 ? [{ ...item, children: kids }] : [];
      }
      if (!isModuleActive(item.gate ?? item.id)) return [];
      return [item.id === "hr-payroll" && !features.payroll ? { ...item, label: "nav.leaves" } : item];
    });

  const sections: { top: NavItem[]; groups: NavGroup[] } = isPlatformAdmin(role)
    ? { top: ADMIN_TOP, groups: [{ id: "account", label: "nav.groups.account", items: ADMIN_ACCOUNT }] }
    : role === "transporteur"
    ? { top: CARRIER_TOP, groups: [{ id: "account", label: "nav.groups.account", items: CARRIER_ACCOUNT }] }
    : {
        top: keepAllowed(CLIENT_TOP),
        groups: CLIENT_GROUPS.map((g) => ({ ...g, items: keepAllowed(g.items) })).filter((g) => g.items.length > 0),
      };

  // Entrées qui mènent à une page, dans l'ordre d'affichage (les sous-menus sont remplacés par leurs entrées) :
  // sert à la barre du bas mobile et au lien actif.
  const menuItems: NavItem[] = [...leafItems(sections.top), ...sections.groups.flatMap((g) => leafItems(g.items))];

  const pathMatches = (path: string) =>
    pathname === path || (path !== "/dashboard" && path !== "/admin" && !!pathname && pathname.startsWith(path + "/"));
  // Le lien le plus précis gagne : /dashboard/finance/income n'allume pas aussi « Vue d'ensemble ».
  // Un parent de sous-menu est actif quand l'un de ses enfants l'est.
  const isActiveItem = (item: NavItem): boolean => {
    if (item.children) return item.children.some(isActiveItem);
    if (item.exact?.some((p) => pathname === p)) return true;
    if (item.also?.some((p) => pathMatches(p))) return true;
    return pathMatches(item.path) && !menuItems.some((m) => m.path.length > item.path.length && pathMatches(m.path));
  };

  const activeGroupId = sections.groups.find((g) => g.items.some(isActiveItem))?.id ?? null;
  const activeParentId = sections.groups.flatMap((g) => g.items).find((i) => i.children && isActiveItem(i))?.id ?? null;

  // La section et le sous-menu de la page ouverte s'ouvrent d'eux-mêmes (au chargement et à chaque changement de page).
  useEffect(() => {
    if (!activeGroupId && !activeParentId) return;
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      if (activeGroupId && !prev[activeGroupId]) { next[activeGroupId] = true; changed = true; }
      if (activeParentId && !prev[`sub:${activeParentId}`]) { next[`sub:${activeParentId}`] = true; changed = true; }
      if (!changed) return prev;
      sidebarOpenGroups = next;
      return next;
    });
  }, [activeGroupId, activeParentId, pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      sidebarOpenGroups = next;
      return next;
    });
  };

  const prefetch = (path: string) => {
    if (path === pathname) return;
    prefetchRouteData(path);
    if (prefetched.current.has(path)) return;
    prefetched.current.add(path);
    try { router.prefetch(path, { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]); } catch { /* ignoré */ }
  };

  const hoverPrefetch = (path: string) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => prefetch(path), 90);
  };
  const cancelHoverPrefetch = () => {
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  };

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, _path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const token = localStorage.getItem("token");
    if (!token) { e.preventDefault(); router.push("/auth/login"); return; }
    if (isMobile) setMobileMoreOpen(false);
  };

  const handleNavigation = async (_path: string, _label: string) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    try {
      router.push(_path);
      if (isMobile) setMobileMoreOpen(false);
      setTimeout(() => setNavigationError(null), 3000);
    } catch (e: any) {
      setNavigationError(`Erreur navigation: ${e.message}`);
    }
  };

  const logout = () => {
    if (confirm(t("common.logoutWarning") || "Confirmer la déconnexion ?")) {
      clearSession();
      router.push("/");
    }
  };

  const getLabel = (key: string) => {
    // Rendez-vous et Projets portent le nom du métier : « Réservations » au restaurant, « Chantiers » dans le bâtiment…
    const bySector = key === "common.appointments" ? moduleLabel("appointments", user?.sector, language) : key === "common.projects" ? moduleLabel("projects", user?.sector, language) : null;
    if (bySector) return bySector;
    if (EXTRA_LABELS[key]) return EXTRA_LABELS[key][language] || EXTRA_LABELS[key].fr;
    try {
      const v = t(key);
      return v === key ? key.split(".").pop() ?? key : v;
    } catch {
      return key.split(".").pop() ?? key;
    }
  };

  const defaultStyles: ThemeColors = {
    background: "#f3f4f6",
    surface: "#ffffff",
    primary: "#4f46e5",
    textSecondary: "#6b7280",
    navText: "#111827",
    text: "#111827",
    border: "#e5e7eb",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    mode: "light",
  };

  const ct = localTheme || defaultStyles;
  const navText = ct.navText || ct.textSecondary;
  const groupText = ct.textSecondary;
  const brandText = ct.text || navText;
  const isDarkMode = ct.mode === "dark";
  const brandErpColor = isDarkMode ? "#C4B5FD" : "#6D28D9";

  const styles: Record<string, CSSProperties> = {
    mobileBottomNav: {
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: `${ct.surface}f7`,
      backdropFilter: "blur(20px)",
      borderTop: `1px solid ${ct.primary}26`,
      borderRadius: "24px 24px 0 0",
      padding: "0px 8px",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 1000,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
      fontFamily: FONT_STACK,
    },
    mobileNavBtn: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "3px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: "12px",
      flex: 1,
      transition: "all 0.2s ease",
      fontFamily: FONT_STACK,
    },
    mobileNavLabel: {
      fontSize: "11px",
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1,
      fontFamily: FONT_STACK,
    },
    mobileMoreOverlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(6px)",
      zIndex: 1001,
    },
    mobileMoreDrawer: {
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: `linear-gradient(180deg, ${ct.surface} 0%, ${ct.background} 100%)`,
      borderTop: `1px solid ${ct.primary}26`,
      borderRadius: "24px 24px 0 0",
      padding: "20px 16px 20px",
      zIndex: 1002,
      maxHeight: "75vh",
      overflowY: "auto",
      fontFamily: FONT_STACK,
    },
    mobileMoreHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px",
      paddingBottom: "4px",
    },
    mobileMoreTitle: {
      fontSize: "13px",
      fontWeight: 600,
      color: navText,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      fontFamily: FONT_STACK,
    },
    mobileGroupTitle: {
      padding: "12px 14px 6px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      color: groupText,
      fontFamily: FONT_STACK,
    },
    overlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 998,
    },
    sidebar: {
  width: "289px",
  background: ct.surface,
  position: "fixed",
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  zIndex: 1000,
  top: 0,
  insetInlineStart: 0,
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transform: "translateX(0)",
  fontFamily: FONT_STACK,
},

    header: { padding: "12px 16px 0px", flexShrink: 0 },
    logoWrapper: { display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" },
    logoImage: {
      width: "92px", height: "92px",
      display: "block", flexShrink: 0, objectFit: "contain",
      marginRight: "0px",
    },
    brandContainer: { flex: 1, minWidth: 0 },
    logoTitle: {
      fontFamily: BRAND_FONT,
      fontWeight: 900,
      fontSize: "clamp(14px, 2.3vh, 20px)",
      letterSpacing: "2px",
      color: brandText,
      whiteSpace: "nowrap",
      lineHeight: 1.05,
      margin: 0,
      WebkitTextStroke: "0.3px currentColor",
    },
    logoErp: {
      color: brandErpColor,
      fontSize: "0.7em",
      letterSpacing: "4px",
      fontWeight: 900,
      WebkitTextStroke: "0.3px currentColor",
    },
    logoRole: {
      fontSize: "10px",
      fontWeight: 500,
      letterSpacing: "0.04em",
      opacity: 1,
      marginTop: "1px",
      lineHeight: 1,
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontFamily: FONT_STACK,
    },

    headerDivider: {
      height: "1px",
      margin: "0px 16px 0",
      background: `${ct.primary}26`,
      border: "none",
      flexShrink: 0,
    },

    nav: { padding: "16px 10px 12px", flex: 1 },
    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 12px",
      paddingInlineStart: "14px",
      marginBottom: "2px",
      cursor: "pointer",
      textDecoration: "none",
      outlineOffset: "2px",
      borderRadius: "10px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
      fontFamily: FONT_STACK,
    },
    navLabel: {
      fontSize: "16px",
      fontWeight: 300,
      letterSpacing: "-0.01em",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontFamily: FONT_STACK,
    },
    groupHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "16px 12px 6px",
      paddingInlineStart: "14px",
      background: "transparent",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      textAlign: "start",
      transition: "color 0.2s ease",
      fontFamily: FONT_STACK,
    },
    groupLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontFamily: FONT_STACK,
    },
    groupDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      flexShrink: 0,
    },
    groupChevron: {
      display: "flex",
      flexShrink: 0,
      opacity: 0.75,
      transition: "transform 0.2s ease",
    },
    activeIndicator: {
      display: "none",
    },
    divider: { height: 0, margin: "12px 0" },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 12px",
      paddingInlineStart: "14px",
      background: "rgba(239,68,68,0.08)",
      color: "#f87171",
      border: "1px solid rgba(239,68,68,0.14)",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: 300,
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      fontFamily: FONT_STACK,
    },
    loadingContainer: {
      width: "282px",
      background: ct.background,
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: {
      width: "28px", height: "28px",
      border: `2px solid ${ct.border}`,
      borderTopColor: ct.primary,
      borderRadius: "50%",
      display: "none",
    },
    errorToast: {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(239,68,68,0.96)",
      color: "white",
      padding: "10px 20px",
      borderRadius: "10px",
      zIndex: 2000,
      fontSize: "13px",
      boxShadow: "0 8px 32px rgba(239,68,68,0.25)",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--theme-border)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontFamily: FONT_STACK,
    },
  };

  const hoverShift = "translateX(4px)";

  const handleMouseEnter = (itemId: string) => setHoveredItem(itemId);
  const handleMouseLeave = () => setHoveredItem(null);

  // Mobile : quatre entrées d'accès rapide dans la barre du bas, le reste dans le tiroir « Plus » (sections repliables).
  // Si le forfait n'inclut pas l'une des entrées préférées, la suivante dans l'ordre du menu prend sa place.
  const MOBILE_PRIMARY_PREFERRED = ["dashboard", "sales", "orders", "products"];
  const mobilePrimaryItems: NavItem[] = (() => {
    const picked = MOBILE_PRIMARY_PREFERRED
      .map((id) => menuItems.find((m) => m.id === id))
      .filter((m): m is NavItem => !!m);
    for (const m of menuItems) {
      if (picked.length >= 4) break;
      if (!picked.includes(m)) picked.push(m);
    }
    return picked.slice(0, 4);
  })();
  const mobilePrimaryIds = new Set(mobilePrimaryItems.map((m) => m.id));
  const withoutPrimary = (items: NavItem[]): NavItem[] =>
    items.flatMap((i): NavItem[] => {
      if (i.children) {
        const kids = withoutPrimary(i.children);
        return kids.length > 0 ? [{ ...i, children: kids }] : [];
      }
      return mobilePrimaryIds.has(i.id) ? [] : [i];
    });
  const mobileMoreTop = withoutPrimary(sections.top);
  const mobileMoreGroups = sections.groups
    .map((g) => ({ ...g, items: withoutPrimary(g.items) }))
    .filter((g) => g.items.length > 0);
  const mobileHasMore = mobileMoreTop.length > 0 || mobileMoreGroups.length > 0;

  /** Entrée du menu (ordinateur). `nested` : entrée d'un sous-menu, légèrement plus compacte. */
  const renderNavItem = (item: NavItem, nested = false) => {
    const isActive = isActiveItem(item);
    const isHovered = hoveredItem === item.path;
    const label = getLabel(item.label);
    const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
    const baseStyle: CSSProperties = nested
      ? { ...styles.navItem, padding: "7px 10px", paddingInlineStart: "10px", marginBottom: "1px" }
      : styles.navItem;

    const getNavItemStyle = (): CSSProperties => {
      if (isActive) {
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${ct.primary}1a 0%, ${ct.primary}0d 100%)`,
          color: ct.primary,
        };
      } else if (isHovered) {
        return {
          ...baseStyle,
          background: `${ct.primary}0f`,
          color: ct.primary,
          transform: hoverShift,
        };
      }
      return { ...baseStyle, background: "transparent", color: navText };
    };

    return (
      <Link
        key={item.path}
        href={item.path}
        prefetch={false}
        aria-current={isActive ? "page" : undefined}
        className="ix-nav-link"
        onClick={(e) => onNavClick(e, item.path)}
        onMouseEnter={() => { handleMouseEnter(item.path); hoverPrefetch(item.path); }}
        onFocus={() => prefetch(item.path)}
        onTouchStart={() => prefetch(item.path)}
        onMouseLeave={() => { handleMouseLeave(); cancelHoverPrefetch(); }}
        style={getNavItemStyle()}
      >
        <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
        <span style={nested ? { ...styles.navLabel, fontSize: "15px" } : styles.navLabel}>{label}</span>
      </Link>
    );
  };

  /** Parent dépliable (Comptabilité, Rapports, Profil) : un bouton, puis ses entrées en retrait. */
  const renderParent = (item: NavItem) => {
    const subKey = `sub:${item.id}`;
    const open = !!openGroups[subKey];
    const containsActive = isActiveItem(item);
    const isHovered = hoveredItem === subKey;
    const label = getLabel(item.label);
    const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
    const bodyId = `ix-nav-sub-${item.id}`;
    return (
      <div key={item.id}>
        <button
          type="button"
          className="ix-nav-link"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => toggleGroup(subKey)}
          onMouseEnter={() => handleMouseEnter(subKey)}
          onMouseLeave={handleMouseLeave}
          style={{
            ...styles.navItem,
            width: "100%",
            border: "none",
            textAlign: "start",
            background: containsActive ? `${ct.primary}12` : isHovered ? `${ct.primary}0f` : "transparent",
            color: containsActive || isHovered ? ct.primary : navText,
          }}
        >
          <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
          <span style={{ ...styles.navLabel, flex: 1, minWidth: 0 }}>{label}</span>
          <span aria-hidden="true" style={{ ...styles.groupChevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
            {ICONS.chevron}
          </span>
        </button>
        <div id={bodyId} role="group" aria-label={label} className="ix-nav-group-body" data-open={open ? "true" : "false"}>
          <div className="ix-nav-group-clip">
            <div className="ix-nav-group-items">
              <div style={{ marginInlineStart: "22px", paddingInlineStart: "6px", borderInlineStart: `1px solid ${ct.primary}26` }}>
                {item.children!.map((child) => renderNavItem(child, true))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEntry = (item: NavItem) => (item.children ? renderParent(item) : renderNavItem(item));

  const renderGroup = (group: NavGroup) => {
    const open = !!openGroups[group.id];
    const containsActive = group.id === activeGroupId;
    const hoverKey = `group:${group.id}`;
    const isHovered = hoveredItem === hoverKey;
    const headerId = `ix-nav-group-${group.id}-title`;
    const bodyId = `ix-nav-group-${group.id}`;
    const label = getLabel(group.label);

    return (
      <div key={group.id}>
        <button
          type="button"
          id={headerId}
          className="ix-nav-group-btn"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => toggleGroup(group.id)}
          onMouseEnter={() => handleMouseEnter(hoverKey)}
          onMouseLeave={handleMouseLeave}
          style={{ ...styles.groupHeader, color: isHovered ? ct.primary : groupText }}
        >
          <span style={styles.groupLabel}>{label}</span>
          {!open && containsActive && (
            <span aria-hidden="true" style={{ ...styles.groupDot, background: ct.primary }} />
          )}
          <span
            aria-hidden="true"
            style={{ ...styles.groupChevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            {ICONS.chevron}
          </span>
        </button>
        <div
          id={bodyId}
          role="group"
          aria-labelledby={headerId}
          className="ix-nav-group-body"
          data-open={open ? "true" : "false"}
        >
          <div className="ix-nav-group-clip">
            <div className="ix-nav-group-items">
              {group.items.map((item) => renderEntry(item))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /** Entrée du tiroir « Plus » (mobile). */
  const renderMobileMoreItem = (item: NavItem, nested = false) => {
    const isActive = isActiveItem(item);
    const label = getLabel(item.label);
    const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
    return (
      <Link
        key={item.path}
        href={item.path}
        prefetch={false}
        aria-current={isActive ? "page" : undefined}
        className="ix-nav-link"
        onClick={(e) => onNavClick(e, item.path)}
        onTouchStart={() => prefetch(item.path)}
        onFocus={() => prefetch(item.path)}
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: nested ? "10px 12px" : "12px 14px",
          marginBottom: "4px",
          borderRadius: "12px",
          background: isActive ? `linear-gradient(135deg, ${ct.primary}1a 0%, ${ct.primary}0d 100%)` : "transparent",
          color: isActive ? ct.primary : navText,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          fontFamily: FONT_STACK,
        }}
      >
        <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: "15px", fontWeight: isActive ? 600 : 400, fontFamily: FONT_STACK }}>{label}</span>
      </Link>
    );
  };

  const renderMobileParent = (item: NavItem) => {
    const subKey = `sub:${item.id}`;
    const open = !!openGroups[subKey];
    const containsActive = isActiveItem(item);
    const label = getLabel(item.label);
    const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
    return (
      <div key={item.id}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggleGroup(subKey)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px 14px",
            marginBottom: "4px",
            borderRadius: "12px",
            border: "none",
            textAlign: "start",
            background: containsActive ? `${ct.primary}12` : "transparent",
            color: containsActive ? ct.primary : navText,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
          <span style={{ flex: 1, fontSize: "15px", fontWeight: containsActive ? 600 : 400 }}>{label}</span>
          <span aria-hidden="true" style={{ ...styles.groupChevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
            {ICONS.chevron}
          </span>
        </button>
        {open && (
          <div role="group" aria-label={label} style={{ marginInlineStart: "20px", paddingInlineStart: "6px", borderInlineStart: `1px solid ${ct.primary}26` }}>
            {item.children!.map((child) => renderMobileMoreItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const renderMobileEntry = (item: NavItem) => (item.children ? renderMobileParent(item) : renderMobileMoreItem(item));

  const renderMobileGroup = (group: NavGroup) => {
    const label = getLabel(group.label);
    const open = !!openGroups[group.id];
    return (
      <div key={group.id} role="group" aria-label={label}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggleGroup(group.id)}
          style={{
            ...styles.mobileGroupTitle,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "start",
          }}
        >
          <span style={{ flex: 1 }}>{label}</span>
          {!open && group.id === activeGroupId && (
            <span aria-hidden="true" style={{ ...styles.groupDot, background: ct.primary }} />
          )}
          <span aria-hidden="true" style={{ ...styles.groupChevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
            {ICONS.chevron}
          </span>
        </button>
        {open && group.items.map((item) => renderMobileEntry(item))}
      </div>
    );
  };

  if (loading || !mounted) {
    if (isMobile) return null;
    return (
      <div style={styles.sidebar} aria-hidden="true">
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" width={92} height={92} style={styles.logoImage} />
            <div style={styles.brandContainer}>
              <div style={styles.logoTitle} lang="en" dir="ltr">
                INOVEXA <span style={styles.logoErp}>ERP</span>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.headerDivider} aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ix-nav-link:focus-visible, .ix-nav-group-btn:focus-visible { outline: 2px solid var(--theme-primary); outline-offset: 2px; }
        .ix-nav-link, .ix-nav-group-btn { -webkit-tap-highlight-color: transparent; }
        .ix-nav-group-body {
          display: grid; grid-template-rows: 1fr; opacity: 1; visibility: visible;
          transition: grid-template-rows 0.24s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, visibility 0s linear 0s;
        }
        .ix-nav-group-body[data-open="false"] {
          grid-template-rows: 0fr; opacity: 0; visibility: hidden;
          transition: grid-template-rows 0.24s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.16s ease, visibility 0s linear 0.24s;
        }
        .ix-nav-group-clip { min-height: 0; overflow: hidden; margin: 0 -8px; }
        .ix-nav-group-items { padding: 2px 8px; }
        @media (prefers-reduced-motion: reduce) {
          .ix-nav-group-body, .ix-nav-group-body[data-open="false"] { transition: none; }
        }
      ` }} />
      {navigationError && (
        <div onClick={() => setNavigationError(null)} style={styles.errorToast}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {navigationError}
          <span style={{ opacity: 0.6, marginInlineStart: "4px" }}>✕</span>
        </div>
      )}

      {mounted && isMobile && (
        <>
          {mobileMoreOpen && (
            <>
              <div style={styles.mobileMoreOverlay} onClick={() => setMobileMoreOpen(false)} />
              <div style={styles.mobileMoreDrawer}>
                <div style={styles.mobileMoreHeader}>
                  <span style={styles.mobileMoreTitle}>{getLabel("common.menu")}</span>
                  <button
                    type="button"
                    aria-label={getLabel("common.close")}
                    onClick={() => setMobileMoreOpen(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: navText, padding: "4px" }}
                  >
                    {ICONS.close}
                  </button>
                </div>
                {mobileMoreTop.map((item) => renderMobileEntry(item))}
                {mobileMoreGroups.map((group) => renderMobileGroup(group))}
                <div style={styles.divider} />
                <div
                  onClick={logout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(239,68,68,0.08)",
                    color: "#f87171",
                    cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.14)",
                    fontFamily: FONT_STACK,
                  }}
                >
                  <span style={{ display: "flex", flexShrink: 0 }}>{ICONS.logout}</span>
                  <span style={{ fontSize: "15px" }}>{getLabel("common.logout")}</span>
                </div>
              </div>
            </>
          )}

          <div style={styles.mobileBottomNav}>
            {mobilePrimaryItems.map((item) => {
              const isActive = isActiveItem(item);
              const label = getLabel(item.label);
              const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={false}
                  aria-current={isActive ? "page" : undefined}
                  className="ix-nav-link"
                  onClick={(e) => onNavClick(e, item.path)}
                  onTouchStart={() => prefetch(item.path)}
                  style={{
                    ...(styles.mobileNavBtn as CSSProperties),
                    textDecoration: "none",
                    color: isActive ? ct.primary : navText,
                  }}
                >
                  <div style={{
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "36px", height: "28px", borderRadius: "10px",
                    background: isActive ? `${ct.primary}18` : "transparent",
                  }}>
                    {icon}
                  </div>
                  <span style={{
                    ...(styles.mobileNavLabel as CSSProperties),
                    color: isActive ? ct.primary : navText,
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {mobileHasMore && (
              <button
                type="button"
                aria-expanded={mobileMoreOpen}
                onClick={() => setMobileMoreOpen((p) => !p)}
                style={{
                  ...(styles.mobileNavBtn as CSSProperties),
                  color: mobileMoreOpen ? ct.primary : navText,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "36px", height: "28px", borderRadius: "10px",
                  background: mobileMoreOpen ? `${ct.primary}18` : "transparent",
                  transition: "all 0.2s",
                }}>
                  {mobileMoreOpen ? ICONS.close : ICONS.menu}
                </div>
                <span style={{
                  ...(styles.mobileNavLabel as CSSProperties),
                  color: mobileMoreOpen ? ct.primary : navText,
                  fontWeight: mobileMoreOpen ? 600 : 400,
                }}>
                  {getLabel("common.more")}
                </span>
              </button>
            )}

            {!mobileHasMore && (
              <button
                onClick={logout}
                style={{ ...(styles.mobileNavBtn as CSSProperties), color: "#f87171" }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "36px", height: "28px", borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)",
                  transition: "all 0.2s",
                }}>
                  {ICONS.logout}
                </div>
                <span style={{ ...(styles.mobileNavLabel as CSSProperties), color: "#f87171" }}>
                  {getLabel("common.logout")}
                </span>
              </button>
            )}
          </div>
        </>
      )}

      {mounted && !isMobile && (
        <div style={styles.sidebar}>
          <div style={styles.header}>
            <div
              style={styles.logoWrapper}
              onClick={() => handleNavigation("/dashboard", "Dashboard")}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={styles.logoImage}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  border: `2px solid ${ct.surface}`,
                }} />
              </div>

              <div style={styles.brandContainer}>
                <div style={{ ...styles.logoTitle, textAlign: "left" }} lang="en">
                  INOVEXA <span style={styles.logoErp}>ERP</span>
                </div>
                <div style={{
                  ...styles.logoRole,
                  color: role === "admin" ? "#d97706" : role === "transporteur" ? "#10b981" : ct.primary,
                }}>
                  {role === "admin" && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  {role === "admin"
                    ? getLabel("admin.title")
                    : role === "transporteur"
                    ? getLabel("profile.transporter")
                    : getLabel("common.profile")}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.headerDivider} aria-hidden="true" />

          <nav style={styles.nav} aria-label={getLabel("common.menu")}>
            {sections.top.map((item) => renderEntry(item))}
            {sections.groups.map((group) => renderGroup(group))}
            <div style={styles.divider} />
            <div
              onClick={logout}
              style={styles.logoutBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                e.currentTarget.style.transform = hoverShift;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}>{ICONS.logout}</span>
              <span>{getLabel("common.logout")}</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
