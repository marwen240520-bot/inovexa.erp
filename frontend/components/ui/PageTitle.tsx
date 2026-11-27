"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Titre de l'onglet du navigateur pour chaque écran du tableau de bord : « Clients · Inovexa ERP » au lieu du même
 * « Inovexa-ERP » sur 56 pages (impossible de distinguer deux onglets ouverts, ni de retrouver une page dans l'historique).
 * Monté une seule fois dans app/layout.tsx : il couvre le tableau de bord, l'administration, l'espace transporteur et
 * les écrans de connexion / d'abonnement. Ces écrans sont privés (ou sans contenu à référencer) : le titre n'a pas besoin
 * d'être dans le HTML envoyé par le serveur. Les pages publiques ont leur propre titre (generateMetadata) : elles ne figurent
 * pas dans cette liste et ne sont pas modifiées.
 */

type Titles = { fr: string; en: string; es: string };

const TITLES: Array<[string, Titles]> = [
  // Onglets qui ont leur propre adresse : listés avant leur module (la première correspondance l'emporte).
  ["/dashboard/finance/income", { fr: "Finance – Revenus", en: "Finance – Income", es: "Finanzas – Ingresos" }],
  ["/dashboard/finance/expenses", { fr: "Finance – Dépenses", en: "Finance – Expenses", es: "Finanzas – Gastos" }],
  ["/dashboard/finance/cashflow", { fr: "Finance – Trésorerie", en: "Finance – Cash flow", es: "Finanzas – Tesorería" }],
  ["/dashboard/finance/balance", { fr: "Finance – Bilan", en: "Finance – Balance sheet", es: "Finanzas – Balance general" }],
  ["/dashboard/finance/budget", { fr: "Finance – Budget", en: "Finance – Budget", es: "Finanzas – Presupuesto" }],
  ["/dashboard/finance/ratios", { fr: "Finance – Ratios", en: "Finance – Ratios", es: "Finanzas – Ratios" }],
  ["/dashboard/finance/invoices", { fr: "Finance – Factures", en: "Finance – Invoices", es: "Finanzas – Facturas" }],
  ["/dashboard/accounting/journal", { fr: "Comptabilité – Journal", en: "Accounting – Journal", es: "Contabilidad – Diario" }],
  ["/dashboard/accounting/balance", { fr: "Comptabilité – Balance comptable", en: "Accounting – Trial balance", es: "Contabilidad – Balance de comprobación" }],
  ["/dashboard/accounting/result", { fr: "Comptabilité – Résultat", en: "Accounting – Income statement", es: "Contabilidad – Resultados" }],
  ["/dashboard/accounting/vat", { fr: "Comptabilité – TVA", en: "Accounting – VAT", es: "Contabilidad – IVA" }],
  ["/dashboard/accounting/bank", { fr: "Comptabilité – Banque", en: "Accounting – Bank", es: "Contabilidad – Banco" }],
  ["/dashboard/clients/overview", { fr: "Clients – Fiche 360°", en: "Customers – 360° profile", es: "Clientes – Ficha 360°" }],
  ["/dashboard/clients/followups", { fr: "Clients – À relancer", en: "Customers – Follow-ups", es: "Clientes – Recordatorios" }],
  ["/dashboard/clients/prices", { fr: "Clients – Listes de prix", en: "Customers – Price lists", es: "Clientes – Listas de precios" }],
  ["/dashboard/stock/levels", { fr: "Stock – Niveaux par dépôt", en: "Stock – Levels by warehouse", es: "Stock – Niveles por almacén" }],
  ["/dashboard/stock/warehouses", { fr: "Stock – Dépôts", en: "Stock – Warehouses", es: "Stock – Almacenes" }],
  ["/dashboard/stock/movements", { fr: "Stock – Mouvements", en: "Stock – Movements", es: "Stock – Movimientos" }],
  ["/dashboard/stock/lots", { fr: "Stock – Lots et péremption", en: "Stock – Lots & expiry", es: "Stock – Lotes y caducidad" }],
  ["/dashboard/stock/counts", { fr: "Stock – Inventaires", en: "Stock – Stock counts", es: "Stock – Inventarios" }],
  ["/dashboard/stock/alerts", { fr: "Stock – Alertes", en: "Stock – Alerts", es: "Stock – Alertas" }],
  ["/dashboard/stock/rotation", { fr: "Stock – Rotation", en: "Stock – Turnover", es: "Stock – Rotación" }],
  ["/dashboard/stock/valuation", { fr: "Stock – Valorisation", en: "Stock – Valuation", es: "Stock – Valoración" }],
  ["/dashboard/hr/payroll/settings", { fr: "Paie – Paramètres", en: "Payroll – Settings", es: "Nómina – Ajustes" }],
  ["/dashboard/hr/leaves", { fr: "RH – Congés", en: "HR – Leave", es: "RR. HH. – Vacaciones" }],
  ["/dashboard/reports/generate", { fr: "Rapports – Générer", en: "Reports – Generate", es: "Informes – Generar" }],
  ["/dashboard/reports/saved", { fr: "Rapports – Enregistrés", en: "Reports – Saved", es: "Informes – Guardados" }],
  ["/dashboard/ai/chat", { fr: "Assistant IA – Chat", en: "AI assistant – Chat", es: "Asistente IA – Chat" }],
  ["/dashboard/ai/forecasts", { fr: "Assistant IA – Prévisions", en: "AI assistant – Forecasts", es: "Asistente IA – Previsiones" }],
  ["/dashboard/ai/recommendations", { fr: "Assistant IA – Recommandations", en: "AI assistant – Recommendations", es: "Asistente IA – Recomendaciones" }],
  ["/dashboard/ai/analytics", { fr: "Assistant IA – Analyses", en: "AI assistant – Analytics", es: "Asistente IA – Análisis" }],
  ["/dashboard/profile/security", { fr: "Profil – Sécurité", en: "Profile – Security", es: "Perfil – Seguridad" }],
  ["/dashboard/profile/activity", { fr: "Profil – Activité", en: "Profile – Activity", es: "Perfil – Actividad" }],
  ["/dashboard/logistics/shipments", { fr: "Logistique – Expéditions", en: "Logistics – Shipments", es: "Logística – Envíos" }],
  ["/dashboard/logistics/carriers", { fr: "Logistique – Transporteurs", en: "Logistics – Carriers", es: "Logística – Transportistas" }],
  ["/dashboard/logistics/analytics", { fr: "Logistique – Analyses", en: "Logistics – Analytics", es: "Logística – Análisis" }],
  ["/dashboard/documents/payments", { fr: "Paiements", en: "Payments", es: "Pagos" }],
  ["/transporteur/profile/stats", { fr: "Statistiques", en: "Statistics", es: "Estadísticas" }],
  ["/transporteur/dashboard", { fr: "Tableau de bord", en: "Dashboard", es: "Panel" }],
  ["/dashboard/products/suggestions", { fr: "Suggestions secteur", en: "Sector suggestions", es: "Sugerencias del sector" }],
  ["/dashboard/pos/sessions", { fr: "Sessions de caisse", en: "Cash sessions", es: "Sesiones de caja" }],
  ["/dashboard/reports/business", { fr: "Rapports de gestion", en: "Management reports", es: "Informes de gestión" }],
  ["/dashboard/hr/payroll", { fr: "Paie", en: "Payroll", es: "Nómina" }],
  ["/dashboard/documents", { fr: "Documents", en: "Documents", es: "Documentos" }],
  ["/dashboard/invoices", { fr: "Factures", en: "Invoices", es: "Facturas" }],
  ["/dashboard/accounting", { fr: "Comptabilité", en: "Accounting", es: "Contabilidad" }],
  ["/dashboard/products", { fr: "Produits", en: "Products", es: "Productos" }],
  ["/dashboard/categories", { fr: "Catégories", en: "Categories", es: "Categorías" }],
  ["/dashboard/stock", { fr: "Stock", en: "Stock", es: "Stock" }],
  ["/dashboard/sales", { fr: "Ventes", en: "Sales", es: "Ventas" }],
  ["/dashboard/purchases", { fr: "Achats", en: "Purchases", es: "Compras" }],
  ["/dashboard/pos", { fr: "Caisse (POS)", en: "Checkout (POS)", es: "Caja (TPV)" }],
  ["/dashboard/orders", { fr: "Commandes", en: "Orders", es: "Pedidos" }],
  ["/dashboard/clients", { fr: "Clients", en: "Clients", es: "Clientes" }],
  ["/dashboard/suppliers", { fr: "Fournisseurs", en: "Suppliers", es: "Proveedores" }],
  ["/dashboard/hr", { fr: "Ressources humaines", en: "Human resources", es: "Recursos humanos" }],
  ["/dashboard/finance", { fr: "Finance", en: "Finance", es: "Finanzas" }],
  ["/dashboard/logistics", { fr: "Logistique", en: "Logistics", es: "Logística" }],
  ["/dashboard/appointments", { fr: "Rendez-vous", en: "Appointments", es: "Citas" }],
  ["/dashboard/projects", { fr: "Projets", en: "Projects", es: "Proyectos" }],
  ["/dashboard/ai", { fr: "Assistant IA", en: "AI assistant", es: "Asistente IA" }],
  ["/dashboard/reports", { fr: "Rapports", en: "Reports", es: "Informes" }],
  ["/dashboard/analytics", { fr: "Analyses", en: "Analytics", es: "Analítica" }],
  ["/dashboard/objectives", { fr: "Objectifs", en: "Goals", es: "Objetivos" }],
  ["/dashboard/profile", { fr: "Mon profil", en: "My profile", es: "Mi perfil" }],
  ["/dashboard/billing", { fr: "Abonnement", en: "Subscription", es: "Suscripción" }],
  ["/dashboard/company", { fr: "Fiche société", en: "Company profile", es: "Ficha de la empresa" }],
  ["/dashboard/settings", { fr: "Paramètres", en: "Settings", es: "Configuración" }],
  ["/dashboard", { fr: "Tableau de bord", en: "Dashboard", es: "Panel" }],
  ["/admin/accounts", { fr: "Comptes clients", en: "Customer accounts", es: "Cuentas de clientes" }],
  ["/admin/payments", { fr: "Paiements", en: "Payments", es: "Pagos" }],
  ["/admin/plans", { fr: "Formules et tarifs", en: "Plans and pricing", es: "Planes y precios" }],
  ["/admin/sectors", { fr: "Secteurs et suggestions", en: "Sectors and suggestions", es: "Sectores y sugerencias" }],
  ["/admin/settings", { fr: "Réglages de la plateforme", en: "Platform settings", es: "Ajustes de la plataforma" }],
  ["/admin/audit", { fr: "Journal d’activité", en: "Activity log", es: "Registro de actividad" }],
  ["/admin", { fr: "Administration", en: "Administration", es: "Administración" }],
  ["/auth/forgot-password", { fr: "Mot de passe oublié", en: "Forgot password", es: "Contraseña olvidada" }],
  ["/auth/verify-email", { fr: "Vérification de l’e-mail", en: "Verify your email", es: "Verificar el correo" }],
  ["/auth/register", { fr: "Créer un compte", en: "Create an account", es: "Crear una cuenta" }],
  ["/auth/login", { fr: "Connexion", en: "Sign in", es: "Iniciar sesión" }],
  ["/reset-password", { fr: "Nouveau mot de passe", en: "New password", es: "Nueva contraseña" }],
  ["/subscription", { fr: "Abonnement", en: "Subscription", es: "Suscripción" }],
  ["/transporteur/shipments", { fr: "Expéditions", en: "Shipments", es: "Envíos" }],
  ["/transporteur/profile", { fr: "Mon profil", en: "My profile", es: "Mi perfil" }],
  ["/transporteur/settings", { fr: "Paramètres", en: "Settings", es: "Configuración" }],
  ["/transporteur", { fr: "Espace transporteur", en: "Carrier area", es: "Área del transportista" }],
];

export function titleFor(pathname: string | null, language: string): string | null {
  if (!pathname) return null;
  const hit = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!hit) return null;
  const lang = (language || "fr").slice(0, 2) as keyof Titles;
  return hit[1][lang] || hit[1].fr;
}

const DEFAULT_TITLE = "Inovexa ERP";
/** Dernier titre posé par ce composant : permet de ne jamais laisser un titre périmé sur une page qui n'est pas dans la liste. */
let lastApplied: string | null = null;

export default function PageTitle() {
  const pathname = usePathname();
  const { language } = useLanguage();
  useEffect(() => {
    const label = titleFor(pathname, language);
    if (!label) {
      if (lastApplied && document.title === lastApplied) document.title = DEFAULT_TITLE;
      lastApplied = null;
      return;
    }
    const full = `${label} · ${DEFAULT_TITLE}`;
    const apply = () => {
      if (document.title !== full) document.title = full;
      lastApplied = full;
    };
    apply();
    // Next.js réécrit le <title> avec le titre par défaut dès que les métadonnées de la route arrivent, parfois après
    // l'hydratation ou après une navigation : sans surveillance, notre titre était perdu une fois sur deux.
    // On ne reprend la main que si le titre est redevenu le titre par défaut ; un titre propre à une page publique est laissé tel quel.
    const observer = new MutationObserver(() => {
      if (document.title === DEFAULT_TITLE) apply();
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, language]);
  return null;
}
