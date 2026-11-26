// lib/catalog.ts
// Catalogue public d'Inovexa ERP : modules, secteurs d'activité, formules et moyens de paiement, en français, anglais
// et espagnol. Utilisé par la page d'accueil, les pages Produits et Tarifs, et l'écran d'inscription.
//
// ⚠️  Ce fichier est le pendant, côté site, de backend/src/modules/saas/saas-defaults.ts (contenu de départ de la
//     plateforme) : codes des secteurs, modules par secteur, formules et prix en dollars. Les deux se modifient ensemble.
//     Le site affiche les prix renvoyés par l'API (GET /public/plans) ; les valeurs ci-dessous servent de secours
//     quand l'API ne répond pas encore.
// Pas de "use client" : lisible par les composants serveur comme par le navigateur.

export type CatalogLang = "fr" | "en" | "es";
export type Localized = Record<CatalogLang, string>;

export const pick = (text: Localized, lang: string): string => text[(lang as CatalogLang)] ?? text.fr;

// ───────────────────────────── Modules ─────────────────────────────

export type CatalogModule =
  | "dashboard" | "products" | "categories" | "stock" | "sales" | "purchases" | "pos" | "orders" | "clients" | "suppliers"
  | "invoices" | "hr" | "finance" | "logistics" | "production" | "appointments" | "projects" | "ai" | "reports" | "analytics" | "objectives";

export const MODULE_INFO: Record<CatalogModule, { label: Localized; desc: Localized }> = {
  dashboard: {
    label: { fr: "Tableau de bord", en: "Dashboard", es: "Panel de control" },
    desc: {
      fr: "Chiffre d’affaires, ventes, stock et alertes en temps réel.",
      en: "Revenue, sales, stock and alerts in real time.",
      es: "Facturación, ventas, stock y alertas en tiempo real.",
    },
  },
  sales: {
    label: { fr: "Ventes", en: "Sales", es: "Ventas" },
    desc: {
      fr: "Suivi des ventes par client, par produit et par période.",
      en: "Sales tracked by customer, product and period.",
      es: "Seguimiento de ventas por cliente, producto y periodo.",
    },
  },
  orders: {
    label: { fr: "Commandes", en: "Orders", es: "Pedidos" },
    desc: {
      fr: "Commandes clients transformées en devis, bon de livraison ou facture.",
      en: "Customer orders turned into a quote, delivery note or invoice.",
      es: "Pedidos de clientes convertidos en presupuesto, albarán o factura.",
    },
  },
  invoices: {
    label: { fr: "Factures et devis", en: "Invoices and quotes", es: "Facturas y presupuestos" },
    desc: {
      fr: "Devis → bon de livraison → facture → avoir, règlements, PDF et fichier TEIF pour El Fatoora.",
      en: "Quote → delivery note → invoice → credit note, payments, PDF and TEIF file for El Fatoora.",
      es: "Presupuesto → albarán → factura → abono, cobros, PDF y archivo TEIF para El Fatoora.",
    },
  },
  clients: {
    label: { fr: "Clients et CRM", en: "Customers and CRM", es: "Clientes y CRM" },
    desc: {
      fr: "Fiche 360°, listes de prix, encours et relances.",
      en: "360° record, price lists, outstanding balances and reminders.",
      es: "Ficha 360°, listas de precios, saldos pendientes y recordatorios.",
    },
  },
  pos: {
    label: { fr: "Caisse", en: "Point of sale", es: "Caja" },
    desc: {
      fr: "Vente au comptoir, sessions de caisse, tickets numérotés et rapport Z.",
      en: "Counter sales, cash sessions, numbered receipts and Z report.",
      es: "Venta en mostrador, sesiones de caja, tiques numerados e informe Z.",
    },
  },
  purchases: {
    label: { fr: "Achats", en: "Purchases", es: "Compras" },
    desc: {
      fr: "Achats et réceptions qui mettent à jour le stock et le coût d’achat.",
      en: "Purchases and receipts that update stock and purchase cost.",
      es: "Compras y recepciones que actualizan el stock y el coste.",
    },
  },
  suppliers: {
    label: { fr: "Fournisseurs", en: "Suppliers", es: "Proveedores" },
    desc: {
      fr: "Conditions, échéances et historique des achats.",
      en: "Terms, due dates and purchase history.",
      es: "Condiciones, vencimientos e historial de compras.",
    },
  },
  products: {
    label: { fr: "Produits et services", en: "Products and services", es: "Productos y servicios" },
    desc: {
      fr: "Catalogue, prix, TVA par article, photos, import Excel ou CSV.",
      en: "Catalogue, prices, VAT per item, photos, Excel or CSV import.",
      es: "Catálogo, precios, IVA por artículo, fotos, importación Excel o CSV.",
    },
  },
  categories: {
    label: { fr: "Catégories", en: "Categories", es: "Categorías" },
    desc: {
      fr: "Familles de produits pour lire ventes et marges par catégorie.",
      en: "Product families to read sales and margins by category.",
      es: "Familias de productos para ver ventas y márgenes por categoría.",
    },
  },
  stock: {
    label: { fr: "Stock multi-dépôts", en: "Multi-warehouse stock", es: "Stock multialmacén" },
    desc: {
      fr: "Mouvements tracés, coût moyen pondéré, lots et péremption, seuils d’alerte, inventaires.",
      en: "Tracked movements, weighted average cost, batches and expiry, alert levels, stock counts.",
      es: "Movimientos trazados, coste medio ponderado, lotes y caducidad, umbrales de alerta, inventarios.",
    },
  },
  logistics: {
    label: { fr: "Logistique", en: "Logistics", es: "Logística" },
    desc: {
      fr: "Expéditions, transporteurs avec leur propre espace, suivi et taux de livraison.",
      en: "Shipments, carriers with their own portal, tracking and delivery rate.",
      es: "Envíos, transportistas con su propio espacio, seguimiento y tasa de entrega.",
    },
  },
  production: {
    label: { fr: "Production", en: "Production", es: "Producción" },
    desc: {
      fr: "Ordres de fabrication et nomenclatures : matières sorties, produits finis entrés en stock.",
      en: "Production orders and bills of materials: components out, finished goods into stock.",
      es: "Órdenes de fabricación y listas de materiales: salen componentes, entran productos terminados.",
    },
  },
  appointments: {
    label: { fr: "Rendez-vous et réservations", en: "Appointments and bookings", es: "Citas y reservas" },
    desc: {
      fr: "Agenda par praticien, salle, table ou pont d’atelier : un créneau ne se réserve qu’une fois.",
      en: "Calendar per practitioner, room, table or workshop bay: a slot can only be booked once.",
      es: "Agenda por profesional, sala, mesa o puesto de taller: cada franja se reserva una sola vez.",
    },
  },
  projects: {
    label: { fr: "Projets et chantiers", en: "Projects and job sites", es: "Proyectos y obras" },
    desc: {
      fr: "Budget, coût réel, tâches, échéances et avancement de chaque chantier ou mission.",
      en: "Budget, actual cost, tasks, deadlines and progress of each job site or assignment.",
      es: "Presupuesto, coste real, tareas, plazos y avance de cada obra o misión.",
    },
  },
  finance: {
    label: { fr: "Finance et comptabilité", en: "Finance and accounting", es: "Finanzas y contabilidad" },
    desc: {
      fr: "Dépenses, journaux, grand livre, balance, déclaration de TVA, rapprochement bancaire.",
      en: "Expenses, journals, general ledger, trial balance, VAT return, bank reconciliation.",
      es: "Gastos, diarios, libro mayor, balance, declaración de IVA, conciliación bancaria.",
    },
  },
  hr: {
    label: { fr: "RH et paie", en: "HR and payroll", es: "RR. HH. y nóminas" },
    desc: {
      fr: "Employés, congés, bulletins de paie avec CNSS et IRPP.",
      en: "Employees, leave, payslips with CNSS and IRPP (Tunisian payroll).",
      es: "Empleados, permisos, nóminas con CNSS e IRPP (nómina tunecina).",
    },
  },
  reports: {
    label: { fr: "Rapports", en: "Reports", es: "Informes" },
    desc: {
      fr: "Ventes, marges, balance âgée, valorisation du stock, exports Excel et PDF.",
      en: "Sales, margins, aged balance, stock valuation, Excel and PDF exports.",
      es: "Ventas, márgenes, saldos por antigüedad, valoración de stock, exportación a Excel y PDF.",
    },
  },
  analytics: {
    label: { fr: "Analyses", en: "Analytics", es: "Analítica" },
    desc: {
      fr: "Tendances, comparaisons et indicateurs par période.",
      en: "Trends, comparisons and indicators by period.",
      es: "Tendencias, comparaciones e indicadores por periodo.",
    },
  },
  objectives: {
    label: { fr: "Objectifs", en: "Objectives", es: "Objetivos" },
    desc: {
      fr: "Objectifs chiffrés et suivi de leur avancement.",
      en: "Numeric targets and progress tracking.",
      es: "Objetivos cuantificados y seguimiento de su avance.",
    },
  },
  ai: {
    label: { fr: "Assistant IA", en: "AI assistant", es: "Asistente IA" },
    desc: {
      fr: "Posez vos questions en langage courant : il répond à partir de vos données.",
      en: "Ask in plain language: it answers from your own data.",
      es: "Pregunte en lenguaje natural: responde a partir de sus propios datos.",
    },
  },
};

export const ALL_MODULES = Object.keys(MODULE_INFO) as CatalogModule[];

/** Regroupement des modules (même logique que la barre latérale de l'ERP). */
export const MODULE_GROUPS: Array<{ id: string; label: Localized; modules: CatalogModule[] }> = [
  {
    id: "commercial",
    label: { fr: "Vente et relation client", en: "Sales and customers", es: "Ventas y clientes" },
    modules: ["sales", "orders", "invoices", "clients", "pos", "appointments"],
  },
  {
    id: "supply",
    label: { fr: "Achats, stock et logistique", en: "Purchasing, stock and logistics", es: "Compras, stock y logística" },
    modules: ["purchases", "suppliers", "products", "categories", "stock", "logistics", "production"],
  },
  {
    id: "finance",
    label: { fr: "Finance, équipes et projets", en: "Finance, people and projects", es: "Finanzas, equipos y proyectos" },
    modules: ["finance", "hr", "projects"],
  },
  {
    id: "insights",
    label: { fr: "Pilotage et intelligence", en: "Steering and intelligence", es: "Dirección e inteligencia" },
    modules: ["dashboard", "reports", "analytics", "objectives", "ai"],
  },
];

// ───────────────────────────── Secteurs ─────────────────────────────

/** Modules utiles à toute société, quel que soit son secteur (comme BASE dans saas-defaults.ts) + le tableau de bord. */
const BASE: CatalogModule[] = ["dashboard", "products", "categories", "clients", "invoices", "finance", "reports", "analytics", "ai"];

export interface CatalogSector {
  code: string;
  name: Localized;
  desc: Localized;
  modules: CatalogModule[];
}

export const SECTORS: CatalogSector[] = [
  {
    code: "commerce",
    name: { fr: "Commerce et détail", en: "Commerce and retail", es: "Comercio minorista" },
    desc: {
      fr: "Boutiques, magasins et points de vente : caisse, stock et réassort.",
      en: "Shops and points of sale: checkout, stock and replenishment.",
      es: "Tiendas y puntos de venta: caja, stock y reposición.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "orders", "suppliers", "hr", "objectives"],
  },
  {
    code: "wholesale",
    name: { fr: "Gros et distribution", en: "Wholesale and distribution", es: "Mayoristas y distribución" },
    desc: {
      fr: "Grossistes et distributeurs : volumes, dépôts, tarifs revendeurs, tournées.",
      en: "Wholesalers and distributors: volumes, warehouses, reseller prices, delivery rounds.",
      es: "Mayoristas y distribuidores: volúmenes, almacenes, tarifas de revendedor, rutas.",
    },
    modules: [...BASE, "stock", "sales", "purchases", "orders", "suppliers", "logistics", "hr", "objectives"],
  },
  {
    code: "healthcare",
    name: { fr: "Santé et pharmacies", en: "Healthcare and pharmacies", es: "Salud y farmacias" },
    desc: {
      fr: "Pharmacies, parapharmacies, cabinets et fournisseurs médicaux : lots et dates de péremption.",
      en: "Pharmacies, practices and medical suppliers: batches and expiry dates.",
      es: "Farmacias, consultas y proveedores médicos: lotes y fechas de caducidad.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "suppliers", "hr", "appointments", "objectives"],
  },
  {
    code: "construction",
    name: { fr: "Construction et BTP", en: "Construction", es: "Construcción" },
    desc: {
      fr: "Entreprises de bâtiment et négoce de matériaux : devis, matériaux, main-d’œuvre.",
      en: "Builders and building-material traders: quotes, materials, labour.",
      es: "Constructoras y venta de materiales: presupuestos, materiales, mano de obra.",
    },
    modules: [...BASE, "stock", "sales", "purchases", "orders", "suppliers", "logistics", "hr", "projects", "objectives"],
  },
  {
    code: "education",
    name: { fr: "Éducation et formation", en: "Education and training", es: "Educación y formación" },
    desc: {
      fr: "Écoles privées et centres de formation : inscriptions, mensualités, formateurs.",
      en: "Private schools and training centres: enrolments, monthly fees, trainers.",
      es: "Colegios privados y centros de formación: matrículas, mensualidades, formadores.",
    },
    modules: [...BASE, "sales", "hr", "appointments", "objectives"],
  },
  {
    code: "restaurant",
    name: { fr: "Restaurants et cafés", en: "Restaurants and cafés", es: "Restaurantes y cafeterías" },
    desc: {
      fr: "Restaurants, cafés, pâtisseries et restauration rapide : carte, ingrédients, caisse.",
      en: "Restaurants, cafés, pastry shops and fast food: menu, ingredients, checkout.",
      es: "Restaurantes, cafeterías, pastelerías y comida rápida: carta, ingredientes, caja.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "suppliers", "hr", "appointments", "objectives"],
  },
  {
    code: "logistics",
    name: { fr: "Logistique et transport", en: "Logistics and transport", es: "Logística y transporte" },
    desc: {
      fr: "Transporteurs, messageries et entrepôts : expéditions, tournées, tarifs.",
      en: "Carriers, couriers and warehouses: shipments, rounds, rates.",
      es: "Transportistas, mensajería y almacenes: envíos, rutas, tarifas.",
    },
    modules: [...BASE, "logistics", "stock", "sales", "orders", "purchases", "suppliers", "hr", "objectives"],
  },
  {
    code: "manufacturing",
    name: { fr: "Industrie et fabrication", en: "Manufacturing and industry", es: "Industria y fabricación" },
    desc: {
      fr: "Ateliers et usines : matières premières, ordres de fabrication, produits finis, expéditions.",
      en: "Workshops and factories: raw materials, production orders, finished goods, shipments.",
      es: "Talleres y fábricas: materias primas, órdenes de fabricación, productos terminados, envíos.",
    },
    modules: [...BASE, "stock", "sales", "purchases", "orders", "suppliers", "logistics", "production", "hr", "objectives"],
  },
  {
    code: "services",
    name: { fr: "Services professionnels", en: "Professional services", es: "Servicios profesionales" },
    desc: {
      fr: "Cabinets, agences et indépendants : honoraires, contrats, relances.",
      en: "Firms, agencies and freelancers: fees, contracts, reminders.",
      es: "Despachos, agencias y autónomos: honorarios, contratos, recordatorios.",
    },
    modules: [...BASE, "sales", "hr", "appointments", "projects", "objectives"],
  },
  {
    code: "agrifood",
    name: { fr: "Agriculture et agroalimentaire", en: "Agriculture and agri-food", es: "Agricultura y agroalimentación" },
    desc: {
      fr: "Exploitations, huileries, conditionnement et transformation : récoltes, lots, fabrication, export.",
      en: "Farms, oil mills, packing and processing: harvests, batches, production, export.",
      es: "Explotaciones, almazaras, envasado y transformación: cosechas, lotes, fabricación, exportación.",
    },
    modules: [...BASE, "stock", "sales", "purchases", "orders", "suppliers", "logistics", "production", "hr", "objectives"],
  },
  {
    code: "automotive",
    name: { fr: "Automobile et pièces détachées", en: "Automotive and spare parts", es: "Automoción y recambios" },
    desc: {
      fr: "Magasins de pièces, garages et ateliers : références, stock, devis de réparation, main-d’œuvre.",
      en: "Parts shops, garages and workshops: part numbers, stock, repair quotes, labour.",
      es: "Tiendas de recambios y talleres: referencias, stock, presupuestos de reparación, mano de obra.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "orders", "suppliers", "hr", "appointments", "objectives"],
  },
  {
    code: "ecommerce",
    name: { fr: "Vente en ligne", en: "Online sales", es: "Venta en línea" },
    desc: {
      fr: "Boutiques en ligne et vente sur les réseaux sociaux : commandes, stock, colis et retours.",
      en: "Online shops and social selling: orders, stock, parcels and returns.",
      es: "Tiendas en línea y venta en redes sociales: pedidos, stock, paquetes y devoluciones.",
    },
    modules: [...BASE, "stock", "sales", "orders", "purchases", "suppliers", "logistics", "objectives"],
  },
  {
    code: "textile",
    name: { fr: "Textile et habillement", en: "Textile and clothing", es: "Textil y confección" },
    desc: {
      fr: "Ateliers de confection, façonniers et marques : tissus, fournitures, ordres de fabrication.",
      en: "Garment workshops, subcontractors and brands: fabrics, trims, production orders.",
      es: "Talleres de confección, maquila y marcas: tejidos, fornituras, órdenes de fabricación.",
    },
    modules: [...BASE, "stock", "sales", "purchases", "orders", "suppliers", "logistics", "production", "hr", "objectives"],
  },
  {
    code: "beauty",
    name: { fr: "Beauté et bien-être", en: "Beauty and wellness", es: "Belleza y bienestar" },
    desc: {
      fr: "Salons de coiffure, instituts, spas et parfumeries : prestations, produits et caisse.",
      en: "Hair salons, beauty institutes, spas and perfumeries: services, products and checkout.",
      es: "Peluquerías, centros de estética, spas y perfumerías: servicios, productos y caja.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "suppliers", "hr", "appointments", "objectives"],
  },
  {
    code: "other",
    name: { fr: "Autre activité", en: "Other businesses", es: "Otra actividad" },
    desc: {
      fr: "Tous les modules sont proposés : gardez ceux qui vous servent.",
      en: "Every module is offered: keep the ones you need.",
      es: "Se ofrecen todos los módulos: conserve los que necesite.",
    },
    modules: [...BASE, "stock", "sales", "pos", "purchases", "orders", "suppliers", "logistics", "production", "hr", "appointments", "projects", "objectives"],
  },
];

// ───────────────────────────── Formules ─────────────────────────────

export interface CatalogPlan {
  code: string;
  name: string;
  /** Prix hors taxes, en dollars (USD). */
  priceMonthly: number;
  priceAnnual: number;
  /** null = illimité. */
  maxUsers: number | null;
  /** null = tous les modules du secteur de la société. */
  modules: CatalogModule[] | null;
  highlight: boolean;
  tagline: Localized;
  features: Localized[];
}

/** Modules de la formule d'entrée (les modules de base — tableau de bord, profil, paramètres — sont toujours actifs). */
const STARTER_MODULES: CatalogModule[] = ["dashboard", "products", "categories", "stock", "sales", "pos", "purchases", "orders", "clients", "suppliers", "invoices", "appointments", "reports"];

export const PLANS: CatalogPlan[] = [
  {
    code: "starter", name: "Starter", priceMonthly: 15, priceAnnual: 150, maxUsers: 3, modules: STARTER_MODULES, highlight: false,
    tagline: {
      fr: "Pour démarrer : ventes, caisse, stock, agenda et facturation.",
      en: "To get started: sales, checkout, stock, calendar and invoicing.",
      es: "Para empezar: ventas, caja, stock, agenda y facturación.",
    },
    features: [
      { fr: "Jusqu’à 3 utilisateurs", en: "Up to 3 users", es: "Hasta 3 usuarios" },
      { fr: "Ventes, caisse, achats, commandes et stock", en: "Sales, checkout, purchases, orders and stock", es: "Ventas, caja, compras, pedidos y stock" },
      { fr: "Devis, factures, avoirs et règlements", en: "Quotes, invoices, credit notes and payments", es: "Presupuestos, facturas, abonos y cobros" },
      { fr: "Agenda : rendez-vous et réservations", en: "Calendar: appointments and bookings", es: "Agenda: citas y reservas" },
      { fr: "Fichier TEIF pour El Fatoora", en: "TEIF file for El Fatoora e-invoicing", es: "Archivo TEIF para El Fatoora" },
      { fr: "Rapports, exports Excel et PDF", en: "Reports, Excel and PDF exports", es: "Informes, exportación a Excel y PDF" },
      { fr: "Support par email", en: "Email support", es: "Soporte por correo" },
    ],
  },
  {
    code: "business", name: "Business", priceMonthly: 29, priceAnnual: 290, maxUsers: 10, modules: null, highlight: true,
    tagline: {
      fr: "Tous les modules de votre secteur pour une PME qui grandit.",
      en: "Every module of your sector for a growing business.",
      es: "Todos los módulos de su sector para una pyme en crecimiento.",
    },
    features: [
      { fr: "Jusqu’à 10 utilisateurs", en: "Up to 10 users", es: "Hasta 10 usuarios" },
      { fr: "Tous les modules de votre secteur", en: "Every module of your sector", es: "Todos los módulos de su sector" },
      { fr: "Comptabilité, TVA et rapprochement bancaire", en: "Accounting, VAT and bank reconciliation", es: "Contabilidad, IVA y conciliación bancaria" },
      { fr: "RH, congés et paie (CNSS, IRPP)", en: "HR, leave and payroll (CNSS, IRPP)", es: "RR. HH., permisos y nóminas (CNSS, IRPP)" },
      { fr: "Logistique, production, projets et objectifs", en: "Logistics, production, projects and objectives", es: "Logística, producción, proyectos y objetivos" },
      { fr: "Analyses et assistant IA", en: "Analytics and AI assistant", es: "Analítica y asistente IA" },
      { fr: "Support prioritaire", en: "Priority support", es: "Soporte prioritario" },
    ],
  },
  {
    code: "enterprise", name: "Enterprise", priceMonthly: 79, priceAnnual: 790, maxUsers: null, modules: null, highlight: false,
    tagline: {
      fr: "Utilisateurs illimités et accompagnement dédié.",
      en: "Unlimited users and dedicated support.",
      es: "Usuarios ilimitados y acompañamiento dedicado.",
    },
    features: [
      { fr: "Utilisateurs illimités", en: "Unlimited users", es: "Usuarios ilimitados" },
      { fr: "Tous les modules de votre secteur", en: "Every module of your sector", es: "Todos los módulos de su sector" },
      { fr: "Mise en service et reprise de données accompagnées", en: "Guided set-up and data migration", es: "Puesta en marcha y migración de datos acompañadas" },
      { fr: "Formation de vos équipes", en: "Training for your teams", es: "Formación de sus equipos" },
      { fr: "Interlocuteur dédié", en: "Dedicated contact", es: "Interlocutor dedicado" },
      { fr: "Paramétrage sur mesure (sur devis)", en: "Custom configuration (on quote)", es: "Configuración a medida (a consultar)" },
    ],
  },
];

/** Un module est-il compris dans une formule ? (null = tous) */
export const planIncludes = (plan: Pick<CatalogPlan, "modules">, module: CatalogModule): boolean => !plan.modules || plan.modules.includes(module);

/** Modules réellement ouverts pour un secteur et une formule : ceux du secteur, limités à ceux de la formule. */
export const modulesFor = (sector: CatalogSector, plan: Pick<CatalogPlan, "modules">): CatalogModule[] => sector.modules.filter((m) => planIncludes(plan, m));

// ───────────────────────────── Essai et paiement ─────────────────────────────

/** Durée de l'essai gratuit par défaut (réglable par l'administrateur : GET /public/config › trialHours). */
export const DEFAULT_TRIAL_HOURS = 72;
export const DEFAULT_VAT_RATE = 19;
/** Devise des formules (réglable par l'administrateur : GET /public/config › currency). */
export const DEFAULT_CURRENCY = "USD";

export const PAYMENT_METHOD_LABELS: Record<string, Localized> = {
  bank_transfer: { fr: "Virement bancaire", en: "Bank transfer", es: "Transferencia bancaria" },
  d17: { fr: "D17 (La Poste)", en: "D17 (Tunisian Post)", es: "D17 (Correos de Túnez)" },
  flouci: { fr: "Flouci", en: "Flouci", es: "Flouci" },
  edinar: { fr: "Carte e-Dinar", en: "e-Dinar card", es: "Tarjeta e-Dinar" },
  postal: { fr: "Mandat minute (La Poste)", en: "Postal money order", es: "Giro postal" },
  cheque: { fr: "Chèque", en: "Cheque", es: "Cheque" },
  cash: { fr: "Espèces", en: "Cash", es: "Efectivo" },
  card: { fr: "Carte bancaire", en: "Bank card", es: "Tarjeta bancaria" },
  other: { fr: "Autre", en: "Other", es: "Otro" },
};

/** L'abonnement se paie en ligne : carte bancaire (Visa, Mastercard, cartes tunisiennes) ou carte e-Dinar. */
export const ONLINE_PAYMENT_METHODS = ["card", "edinar"];

/** Moyens HORS LIGNE que l'administrateur peut activer en plus (comme DEFAULT_PAYMENT_METHODS côté serveur). */
export const DEFAULT_PAYMENT_METHODS = ["bank_transfer", "d17", "flouci", "cheque", "cash"];

/** « 3 jours », « 36 heures »… à partir de la durée d'essai en heures. */
export function trialLabel(hours: number, lang: string): string {
  const h = Number.isFinite(hours) && hours > 0 ? Math.round(hours) : DEFAULT_TRIAL_HOURS;
  const days = h / 24;
  if (Number.isInteger(days)) {
    if (lang === "en") return `${days} day${days > 1 ? "s" : ""}`;
    if (lang === "es") return `${days} día${days > 1 ? "s" : ""}`;
    return `${days} jour${days > 1 ? "s" : ""}`;
  }
  if (lang === "en") return `${h} hours`;
  if (lang === "es") return `${h} horas`;
  return `${h} heures`;
}
