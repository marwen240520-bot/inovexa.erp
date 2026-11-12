import { EntityManager } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { Product } from '../products/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense } from '../finance/entities/expense.entity';
import { Budget } from '../finance/entities/budget.entity';
import { BankAccount } from '../finance/entities/bank-account.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { Objective } from '../objectives/entities/objective.entity';
import { periodBounds } from '../objectives/objectives.service';
import { DEMO_PRODUCT_IMAGES } from './demo-product-images';

export type DemoModuleKey =
  | 'categories' | 'products' | 'clients' | 'suppliers' | 'finance_flow' | 'orders' | 'invoices'
  | 'departments' | 'employees' | 'budgets' | 'bank_accounts' | 'shipments' | 'objectives';

/** Nombre de mois couverts par les données de démonstration (le dernier élément date d'hier). */
export const DEMO_MONTHS = 13;

/**
 * Fourchette [min, max] d'éléments créés pour chaque module d'un nouveau client (tirage au hasard).
 * Les flux (ventes / achats / dépenses) sont les plus volumineux : 30 à 40 lignes par mois sur 13 mois.
 */
export const DEMO_RANGES: Record<DemoModuleKey, [number, number]> = {
  finance_flow: [390, 520], // ventes, achats et dépenses (même nombre chacun)
  orders: [260, 390],
  invoices: [260, 390],
  clients: [150, 250],
  products: [150, 250],
  shipments: [150, 250],
  suppliers: [100, 150],
  employees: [100, 150],
  categories: [30, 60],
  departments: [30, 60],
  budgets: [30, 60],
  bank_accounts: [30, 60],
  objectives: [30, 60],
};

/** Bornes globales (toutes fourchettes confondues) — conservées pour le code qui lit ces constantes. */
export const DEMO_MIN_ITEMS = Math.min(...Object.values(DEMO_RANGES).map(([a]) => a));
export const DEMO_MAX_ITEMS = Math.max(...Object.values(DEMO_RANGES).map(([, b]) => b));
/** Valeur minimale (conservée pour compatibilité avec le code qui lisait l'ancienne constante). */
export const DEMO_ITEMS_PER_MODULE = DEMO_MIN_ITEMS;

export interface DemoOptions {
  /** Générateur aléatoire (Math.random par défaut) — injectable pour les tests. */
  random?: () => number;
  /** Nombre d'éléments imposé pour un module (sinon tirage dans DEMO_RANGES).
   *  `finance_flow` = ventes, achats et dépenses (liés entre eux pour garantir un bénéfice positif). */
  counts?: Partial<Record<DemoModuleKey, number>>;
}

const pad = (n: number, size = 3) => String(n).padStart(size, '0');
const pick = <T>(list: T[], i: number): T => list[i % list.length];
const range = (count: number) => Array.from({ length: count }, (_, i) => i);
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Insertion par lots : évite des requêtes trop longues avec plusieurs centaines de lignes. */
const CHUNK = { chunk: 100 };

/** Date située `days` jours avant aujourd'hui (pour que les graphiques aient des données). */
const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};

/** Nombre de jours entre aujourd'hui et la même date il y a DEMO_MONTHS mois. */
const periodDays = (): number => {
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - DEMO_MONTHS);
  return Math.round((today.getTime() - start.getTime()) / 86_400_000);
};

/** Répartit `n` éléments sur les DEMO_MONTHS derniers mois : l'élément 0 est le plus ancien, le dernier date d'hier. */
const dateAt = (i: number, n: number): Date => {
  const span = periodDays() - 1;
  return daysAgo(1 + Math.round(((n - 1 - i) * span) / Math.max(1, n - 1)));
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Saisonnalité du chiffre d'affaires (janvier → décembre) : creux en hiver, pics l'été et en fin d'année. */
const SEASONALITY = [0.85, 0.8, 0.95, 1.0, 1.05, 1.1, 1.2, 1.15, 0.95, 1.0, 1.1, 1.3];

// ───────────────────────── Jeux de données ─────────────────────────

const CATEGORIES = [
  'Informatique', 'Téléphonie', 'Électroménager', 'Mobilier de bureau', 'Papeterie',
  'Alimentation', 'Boissons', 'Hygiène', 'Vêtements', 'Chaussures',
  'Sport & Loisirs', 'Jouets', 'Bricolage', 'Jardin', 'Automobile',
  'Santé', 'Beauté', 'Livres', 'Éclairage', 'Emballage',
];

// [nom, prix, stock]  (quelques stocks bas pour alimenter les alertes)
// Chaque produit a une vraie photo (lien Unsplash) : DEMO_PRODUCT_IMAGES suit le même ordre que cette liste.
const PRODUCTS: [string, number, number][] = [
  ['Ordinateur portable 15"', 1450, 12], ['Smartphone 128 Go', 890, 25], ['Réfrigérateur 300 L', 1190, 6],
  ['Bureau ajustable', 420, 9], ['Ramette papier A4 (x5)', 24.9, 140], ['Café moulu 1 kg', 18.5, 80],
  ['Eau minérale (pack 6)', 4.2, 300], ['Gel hydroalcoolique 500 ml', 6.9, 4], ['Chemise coton homme', 39, 55],
  ['Baskets running', 79, 30], ['Tapis de yoga', 22, 45], ['Puzzle 1000 pièces', 14.5, 3],
  ['Perceuse sans fil 18V', 119, 18], ['Tondeuse électrique', 249, 7], ['Huile moteur 5L', 46, 60],
  ['Thermomètre infrarouge', 29, 2], ['Crème hydratante 50 ml', 17.9, 90], ['Roman policier poche', 9.9, 120],
  ['Lampe LED bureau', 34, 40], ['Carton d\'emballage (x50)', 38, 15],
];

const CLIENT_NAMES = [
  'Société Alpha', 'Maison Beaulieu', 'Atelier Carthage', 'Boutique Médina', 'Groupe Horizon',
  'Délices du Sud', 'TechnoPlus', 'Librairie Al Kitab', 'Pharmacie Centrale', 'Garage Moderne',
  'Hôtel Les Jasmins', 'Cabinet Ben Salah', 'Restaurant La Marsa', 'Épicerie Fine Zitouna', 'Studio Pixel',
  'Clinique Avicenne', 'Bâtiment & Co', 'Transports Rapides', 'Agence Voyages Sahara', 'École Les Oliviers',
];

const SUPPLIER_NAMES = [
  'Global Distribution', 'Tunis Import-Export', 'Euro Supplies', 'Mediterranea Foods', 'Tech Wholesale',
  'Papeterie Générale', 'AgroSud', 'Mobilier Pro', 'Cosmétiques du Monde', 'Auto Pièces Plus',
  'Textiles Sahel', 'Plastiques & Emballages', 'Énergie Verte', 'Outillage Industriel', 'Boissons Atlas',
  'Santé Distribution', 'Sport Équipement', 'Jouets Express', 'Lumière Design', 'Librairie Grossiste',
];

// 20 prénoms × 20 noms = 400 combinaisons sans doublon (voir la formule dans la génération des employés)
const FIRST_NAMES = [
  'Ahmed', 'Sarra', 'Mohamed', 'Leila', 'Youssef', 'Amel', 'Karim', 'Nadia', 'Walid', 'Ines',
  'Hichem', 'Rania', 'Sami', 'Olfa', 'Mehdi', 'Salma', 'Anis', 'Hela', 'Bilel', 'Yasmine',
];
const LAST_NAMES = [
  'Ben Ali', 'Trabelsi', 'Gharbi', 'Mejri', 'Jebali', 'Haddad', 'Chaabane', 'Bouzid', 'Ferchichi', 'Sassi',
  'Hammami', 'Khelifi', 'Mansouri', 'Dridi', 'Zouari', 'Ayari', 'Ben Amor', 'Jlassi', 'Karray', 'Masmoudi',
];

const DEPARTMENTS = [
  'Direction générale', 'Ressources humaines', 'Finance', 'Comptabilité', 'Commercial',
  'Marketing', 'Logistique', 'Production', 'Achats', 'Qualité',
  'Informatique', 'Juridique', 'Maintenance', 'Recherche & Développement', 'Service client',
  'Export', 'Import', 'Sécurité', 'Formation', 'Communication',
];

const POSITIONS = [
  'Directeur', 'Responsable RH', 'Directeur financier', 'Comptable', 'Commercial senior',
  'Chargé de marketing', 'Responsable logistique', 'Chef de production', 'Acheteur', 'Responsable qualité',
  'Développeur', 'Juriste', 'Technicien', 'Ingénieur R&D', 'Conseiller clientèle',
  'Responsable export', 'Responsable import', 'Agent de sécurité', 'Formateur', 'Chargé de communication',
];

const EXPENSE_CATEGORIES = [
  'Loyer', 'Électricité & eau', 'Internet & téléphone', 'Fournitures de bureau', 'Transport',
  'Marketing', 'Salaires', 'Assurance', 'Maintenance', 'Frais bancaires',
];
const VENDORS = ['STEG', 'Tunisie Telecom', 'SONEDE', 'Bureau Vallée', 'Poulina', 'Orange', 'Amen Assurances', 'Total Énergies', 'Facebook Ads', 'Banque de Tunis'];
const PAYMENT_METHODS = ['Virement', 'Carte bancaire', 'Chèque', 'Espèces', 'Prélèvement'];

const CITIES = ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte', 'Gabès', 'Kairouan', 'Monastir', 'Ariana', 'Ben Arous'];
const CARRIERS = ['Aramex', 'DHL', 'Rapid-Poste', 'Tunisia Express', 'FedEx'];
const SHIPMENT_STATUSES = ['pending', 'in_transit', 'delivered', 'delivered', 'in_transit'];
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'delivered'];
const SALE_STATUSES = ['completed', 'completed', 'pending', 'completed', 'completed'];
const PURCHASE_STATUSES = ['received', 'received', 'pending', 'received', 'ordered'];
const BANK_NAMES = ['Banque de Tunis', 'BIAT', 'Attijari Bank', 'Amen Bank', 'STB', 'BH Bank', 'UIB', 'ATB', 'BNA', 'Zitouna'];

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

// ───────────────────────── Variantes (pour dépasser les 20 éléments de base) ─────────────────────────

const CATEGORY_VARIANTS = ['Entrée de gamme', 'Premium', 'Accessoires', 'Professionnel', 'Occasion', 'Éco', 'Import'];
const PRODUCT_SERIES = ['Série B', 'Série C', 'Série D', 'Série E', 'Série F', 'Série G', 'Série H', 'Série J', 'Série K', 'Série L', 'Série M', 'Série N'];
const POSITION_LEVELS = ['junior', 'confirmé', 'senior', 'principal', 'expert', 'stagiaire', 'adjoint', 'chef d\'équipe'];

/** Nom unique pour le i-ème élément : les 20 premiers gardent leur nom d'origine, les suivants reçoivent un suffixe. */
const variantName = (base: string[], i: number, suffix: (round: number, i: number) => string) => {
  const round = Math.floor(i / base.length);
  const name = base[i % base.length];
  return round === 0 ? name : `${name}${suffix(round, i)}`;
};
/** Suffixe ville ; au-delà de 10 tours, on ajoute un numéro pour garder des noms uniques. */
const cityVariant = (round: number, i: number) => {
  const city = CITIES[(round * 3 + i) % CITIES.length];
  const lap = Math.floor((round - 1) / CITIES.length);
  return lap === 0 ? ` ${city}` : ` ${city} ${lap + 1}`;
};

// ───────────────────────── Génération ─────────────────────────

export interface DemoDataSummary {
  /** Moyenne arrondie d'éléments par module */
  perModule: number;
  min: number;
  max: number;
  modules: Record<string, number>;
  total: number;
}

/**
 * Crée les éléments de démonstration du client `userId` (volumes tirés au hasard dans DEMO_RANGES, module par module),
 * répartis sur les DEMO_MONTHS derniers mois. À appeler dans une transaction : tout est créé ou rien.
 *
 * Ventes, achats et dépenses forment un seul flux (même nombre de lignes, mêmes dates) : pour chaque ligne,
 * vente > achat + dépense, donc le bénéfice est positif quel que soit le regroupement (jour, mois, année).
 * Le chiffre d'affaires suit une tendance de croissance (~+35 % sur la période) et une saisonnalité mensuelle.
 */
export async function seedDemoData(manager: EntityManager, userId: number, options: DemoOptions = {}): Promise<DemoDataSummary> {
  const random = options.random || Math.random;
  const count = (key: DemoModuleKey): number => {
    const forced = options.counts?.[key];
    if (forced !== undefined) return Math.max(1, Math.round(forced));
    const [min, max] = DEMO_RANGES[key];
    return min + Math.floor(random() * (max - min + 1));
  };
  const created: Record<string, number> = {};
  const mark = (key: string, rows: unknown[]) => { created[key] = rows.length; };

  // 1. Catégories
  const nCategories = count('categories');
  const categories = await manager.save(
    Category,
    range(nCategories).map((i) => {
      const name = variantName(CATEGORIES, i, (r) => {
        const variant = CATEGORY_VARIANTS[(r - 1) % CATEGORY_VARIANTS.length];
        const lap = Math.floor((r - 1) / CATEGORY_VARIANTS.length);
        return lap === 0 ? ` — ${variant}` : ` — ${variant} ${lap + 1}`;
      });
      return manager.create(Category, { userId, name, description: `Catégorie ${name}`, createdAt: dateAt(i, nCategories) });
    }),
    CHUNK,
  );
  mark('categories', categories);

  // 2. Produits (liés aux catégories)
  const nProducts = count('products');
  const products = await manager.save(
    Product,
    range(nProducts).map((i) => {
      const [baseName, basePrice, baseStock] = PRODUCTS[i % PRODUCTS.length];
      const round = Math.floor(i / PRODUCTS.length);
      const series = PRODUCT_SERIES[(round - 1) % PRODUCT_SERIES.length];
      const lap = Math.floor((round - 1) / PRODUCT_SERIES.length);
      const name = round === 0 ? baseName : `${baseName} · ${series}${lap === 0 ? '' : ` ${lap + 1}`}`;
      // Les séries suivantes sont un peu plus chères (+8 % par série, plafonné à +90 %)
      const price = round === 0 ? basePrice : round2(basePrice * (1 + Math.min(0.9, 0.08 * round)));
      // quelques stocks bas ou nuls pour alimenter les alertes
      const quantity = round === 0 ? baseStock : i % 9 === 4 ? i % 5 : Math.max(0, baseStock + ((i * 17) % 45) - 10);
      return manager.create(Product, {
        userId,
        categoryId: categories[i % categories.length].id,
        name,
        sku: `SKU-${pad(i + 1, 4)}`,
        price,
        quantity,
        imageUrl: DEMO_PRODUCT_IMAGES[i % DEMO_PRODUCT_IMAGES.length],
        createdAt: dateAt(i, nProducts),
      });
    }),
    CHUNK,
  );
  mark('products', products);

  // 3. Clients (arrivée progressive sur 13 mois → courbe « nouveaux clients » réaliste)
  const nClients = count('clients');
  const clients = await manager.save(
    Client,
    range(nClients).map((i) => {
      const name = variantName(CLIENT_NAMES, i, cityVariant);
      return manager.create(Client, {
        userId,
        name,
        email: `contact@${slug(name)}.tn`,
        phone: `${pick([20, 22, 24, 25, 28, 50, 52, 55, 90, 98], i)}${pad(100 + i * 37 % 900)}${pad(i * 53 % 1000)}`.slice(0, 8),
        address: `${10 + (i % 190)} rue de la République, ${pick(CITIES, i)}`,
        totalSpent: round2(300 + ((i * 731) % 4200)),
        status: i % 7 === 6 ? 'inactive' : 'active',
        createdAt: dateAt(i, nClients),
      });
    }),
    CHUNK,
  );
  mark('clients', clients);

  // 4. Fournisseurs
  const nSuppliers = count('suppliers');
  const suppliers = await manager.save(
    Supplier,
    range(nSuppliers).map((i) => {
      const name = variantName(SUPPLIER_NAMES, i, cityVariant);
      return manager.create(Supplier, {
        userId,
        name,
        contact: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`,
        email: `commercial@${slug(name)}.com`,
        phone: `${pick([71, 72, 73, 74, 75], i)}${pad(200 + i * 41 % 800)}${pad(i * 67 % 1000)}`.slice(0, 8),
        address: `Zone industrielle ${i + 1}, ${pick(CITIES, i + 2)}`,
        totalPurchases: round2(500 + ((i * 977) % 9000)),
        status: i % 9 === 8 ? 'inactive' : 'active',
        createdAt: dateAt(i, nSuppliers),
      });
    }),
    CHUNK,
  );
  mark('suppliers', suppliers);

  // Plan commun ventes / achats / dépenses.
  // RÈGLE : pour chaque ligne i, vente > achat + dépense, afin que le bénéfice soit positif
  // quel que soit le regroupement (jour, mois, trimestre, année) et dans tous les modules
  // (tableau de bord, finance, rapports, analyses).
  //   achat   <= 40 % de la vente   (quantité achetée <= 60 % de la quantité vendue, coût 35-40 % du prix)
  //   dépense <= 17 % de la vente
  const nFlow = count('finance_flow');
  const plan = range(nFlow).map((i) => {
    const date = dateAt(i, nFlow);
    const product = products[(i * 3) % products.length];
    const price = Number(product.price);
    const growth = 0.85 + (0.3 * i) / Math.max(1, nFlow - 1); // +35 % entre le premier et le dernier mois
    const season = SEASONALITY[date.getMonth()];
    const target = (600 + ((i * 337) % 2400)) * growth * season; // chiffre d'affaires visé : ~400 à ~4 000
    const quantity = Math.min(50, Math.max(1, Math.round(target / price)));
    const total = round2(quantity * price);
    return { i, product, price, quantity, total, date };
  });

  // 5. Ventes
  const sales = await manager.save(
    Sale,
    plan.map(({ i, product, price, quantity, total, date }) =>
      manager.create(Sale, {
        userId,
        productId: product.id,
        clientName: clients[(i * 7) % clients.length].name,
        productName: product.name,
        quantity,
        unitPrice: price,
        total,
        status: pick(SALE_STATUSES, i),
        createdAt: date,
      }),
    ),
    CHUNK,
  );
  mark('sales', sales);

  // 6. Achats (même produit que la vente correspondante, coût nettement inférieur)
  const purchases = await manager.save(
    Purchase,
    plan.map(({ i, product, price, quantity, date }) => {
      const purchaseQty = Math.max(1, Math.floor(quantity * 0.6));
      const unitPrice = round2(price * (0.35 + 0.01 * (i % 6)));
      return manager.create(Purchase, {
        userId,
        productId: product.id,
        productName: product.name,
        supplierName: suppliers[i % suppliers.length].name,
        quantity: purchaseQty,
        unitPrice,
        total: round2(purchaseQty * unitPrice),
        status: pick(PURCHASE_STATUSES, i),
        createdAt: date,
      });
    }),
    CHUNK,
  );
  mark('purchases', purchases);

  // 7. Commandes
  const nOrders = count('orders');
  const orders = await manager.save(
    Order,
    range(nOrders).map((i) => {
      const product = products[(i * 11) % products.length];
      const quantity = 1 + ((i * 2) % 6);
      const unitPrice = Number(product.price);
      return manager.create(Order, {
        userId,
        clientName: clients[(i * 3) % clients.length].name,
        productName: product.name,
        quantity,
        unitPrice,
        total: round2(quantity * unitPrice),
        // les commandes récentes sont plus souvent en attente / confirmées
        status: i >= nOrders - 15 ? pick(['pending', 'confirmed', 'shipped'], i) : pick(ORDER_STATUSES, i),
        createdAt: dateAt(i, nOrders),
      });
    }),
    CHUNK,
  );
  mark('orders', orders);

  // 8. Factures (numéros d'opération uniques à l'échelle de la base)
  const nInvoices = count('invoices');
  const yearCounters: Record<number, number> = {};
  const invoices = await manager.save(
    Invoice,
    range(nInvoices).map((i) => {
      const isDebit = i % 4 !== 3; // 3 factures sur 4 sont des ventes (débit)
      const product = products[(i * 5) % products.length];
      const quantity = 1 + (i % 4);
      const unitPrice = Number(product.price);
      const subtotalHT = round2(quantity * unitPrice);
      const taxRate = 20;
      const taxAmount = round2((subtotalHT * taxRate) / 100);
      const client = clients[i % clients.length];
      const supplier = suppliers[i % suppliers.length];
      const issued = dateAt(i, nInvoices);
      const due = new Date(issued);
      due.setDate(due.getDate() + 30);
      // une facture non réglée dont l'échéance est passée est en retard ; les récentes restent en attente
      const dueSoon = due.getTime() > Date.now();
      const status = dueSoon ? pick(['paid', 'pending', 'pending'], i) : pick(['paid', 'paid', 'paid', 'paid', 'overdue'], i);
      // numérotation FAC-AAAA-NNNN qui repart à 1 chaque année
      const fy = issued.getFullYear();
      yearCounters[fy] = (yearCounters[fy] || 0) + 1;
      return manager.create(Invoice, {
        userId,
        operationNumber: `OP-${userId}-${pad(i + 1, 4)}`,
        reference: `FAC-${fy}-${pad(yearCounters[fy], 4)}`,
        type: isDebit ? 'debit' : 'credit',
        clientId: isDebit ? client.id : null,
        supplierId: isDebit ? null : supplier.id,
        clientName: isDebit ? client.name : null,
        supplierName: isDebit ? null : supplier.name,
        clientEmail: isDebit ? client.email : null,
        clientAddress: isDebit ? client.address : null,
        clientPhone: isDebit ? client.phone : null,
        description: `${isDebit ? 'Vente' : 'Achat'} de ${product.name}`,
        // Champs attendus par l'aperçu / l'impression des factures : unitPriceHT, totalHT, totalTTC
        items: [{ description: product.name, quantity, unitPriceHT: unitPrice, totalHT: subtotalHT, totalTTC: round2(subtotalHT * 1.2) }],
        subtotalHT,
        taxRate,
        taxAmount,
        amount: round2(subtotalHT + taxAmount),
        dueDate: due,
        paymentTerms: '30 jours',
        notes: null,
        status,
        paymentMethod: status === 'paid' ? pick(['transfer', 'card', 'cash', 'check', 'mobile', 'draft'], i) : null,
        createdAt: issued,
      });
    }),
    CHUNK,
  );
  mark('invoices', invoices);

  // 9. Services (départements) puis employés
  const nDepartments = count('departments');
  const departments = await manager.save(
    Department,
    range(nDepartments).map((i) => {
      const name = variantName(DEPARTMENTS, i, cityVariant);
      return manager.create(Department, { userId, name, description: `Service ${name}`, createdAt: dateAt(i, nDepartments) });
    }),
    CHUNK,
  );
  mark('departments', departments);

  const nEmployees = count('employees');
  const nowIso = new Date().toISOString();
  const employees = await manager.save(
    Employee,
    range(nEmployees).map((i) => {
      // Embauches étalées sur ~8 ans, dont une partie dans les 13 derniers mois
      const hired = i % 5 === 0 ? daysAgo(10 + ((i * 37) % (periodDays() - 10))) : daysAgo(400 + ((i * 97) % 2500));
      // prénom = i mod 20 ; nom décalé à chaque tour (pgcd(21, 20) = 1) → 400 combinaisons uniques
      const q = Math.floor(i / FIRST_NAMES.length);
      const first = pick(FIRST_NAMES, i);
      const last = pick(LAST_NAMES, q * (FIRST_NAMES.length + 1) + (i % FIRST_NAMES.length));
      const level = Math.floor(i / POSITIONS.length);
      return manager.create(Employee, {
        userId,
        name: `${first} ${last}`,
        email: `${slug(first)}.${slug(last)}${i + 1}@entreprise.tn`,
        position: level === 0 ? POSITIONS[i % POSITIONS.length] : `${POSITIONS[i % POSITIONS.length]} ${POSITION_LEVELS[(level - 1) % POSITION_LEVELS.length]}`,
        department: departments[i % departments.length].name,
        salary: 1200 + ((i * 213) % 3300),
        phone: `${pick([20, 22, 24, 25, 28, 50, 52, 55, 90, 98], i + 4)}${pad(300 + i * 29 % 700)}${pad(i * 71 % 1000)}`.slice(0, 8),
        hireDate: isoDay(hired),
        status: i % 8 === 7 ? 'on_leave' : 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }),
    CHUNK,
  );
  mark('employees', employees);

  // 10. Finance : dépenses, budgets, comptes bancaires
  // Dépense = 10 à 17 % de la vente du même jour (colonnes numériques = entiers : on arrondit).
  const expenses = await manager.save(
    Expense,
    plan.map(({ i, total, date }) => {
      const taxRate = 19;
      const amount = Math.max(60, Math.round(total * (0.10 + 0.01 * (i % 8))));
      const amountHT = Math.round(amount / (1 + taxRate / 100));
      const label = EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length];
      return manager.create(Expense, {
        userId,
        category: label,
        description: `${label} - ${pick(VENDORS, i)}`,
        amountHT,
        taxRate,
        taxAmount: amount - amountHT,
        amount,
        date,
        paymentMethod: pick(PAYMENT_METHODS, i),
        vendor: pick(VENDORS, i),
        invoiceNumber: `F-${userId}-${pad(i + 1, 4)}`,
      });
    }),
    CHUNK,
  );
  mark('expenses', expenses);

  // Budgets : année en cours et année précédente (les 13 mois de données couvrent les deux)
  const year = new Date().getFullYear();
  const nBudgets = count('budgets');
  const budgets = await manager.save(
    Budget,
    range(nBudgets).map((i) =>
      manager.create(Budget, {
        userId,
        category: EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
        amount: 2000 + ((i * 457) % 18000),
        year: year - (i % 2),
        department: departments[i % departments.length].name,
      }),
    ),
    CHUNK,
  );
  mark('budgets', budgets);

  const nBank = count('bank_accounts');
  const bankAccounts = await manager.save(
    BankAccount,
    range(nBank).map((i) => {
      const savings = i % 3 === 2;
      return manager.create(BankAccount, {
        userId,
        name: `${pick(BANK_NAMES, i)} ${savings ? 'Épargne' : 'Courant'} ${pad(Math.floor(i / BANK_NAMES.length) + 1, 2)}`,
        type: savings ? 'savings' : 'checking',
        balance: round2(1500 + ((i * 3917) % 48000)),
        accountNumber: `${pad(10 + i, 3)}${pad(userId % 1000)}${pad(i * 7919 % 100000, 5)}`,
        iban: `TN59${pad(10 + i, 3)}${pad(userId % 1000)}${pad(i * 7919 % 10000000, 7)}0000${pad(i, 3)}`,
      });
    }),
    CHUNK,
  );
  mark('bank_accounts', bankAccounts);

  // 11. Expéditions (rattachées au client via clientId = id de l'utilisateur)
  const nShipments = count('shipments');
  const shipments = await manager.save(
    Shipment,
    range(nShipments).map((i) => {
      const createdAt = dateAt(i, nShipments);
      const eta = new Date(createdAt);
      eta.setDate(eta.getDate() + 3 + (i % 4));
      // les envois anciens sont livrés ; seuls les plus récents restent en attente / en transit
      const status = eta.getTime() < Date.now() - 2 * 86_400_000 ? (i % 23 === 11 ? 'in_transit' : 'delivered') : pick(SHIPMENT_STATUSES, i);
      return manager.create(Shipment, {
        clientId: userId,
        transporteurId: null as any,
        trackingNumber: `TRK-${userId}-${pad(i + 1, 4)}`,
        clientName: clients[i % clients.length].name,
        address: `${20 + (i % 180)} avenue Habib Bourguiba, ${pick(CITIES, i + 1)}`,
        phone: clients[i % clients.length].phone,
        carrier: pick(CARRIERS, i),
        amount: round2(8 + ((i * 13) % 60)),
        status,
        estimatedDelivery: eta,
        createdAt,
      });
    }),
    CHUNK,
  );
  mark('shipments', shipments);

  // 12. Objectifs : calculés d'après les données de démo, pour que les barres de progression soient parlantes
  const nObjectives = count('objectives');
  const objectives = await manager.save(
    Objective,
    buildDemoObjectives(nObjectives, { sales, purchases, clients, orders, invoices, shipments }).map((o) => manager.create(Objective, { userId, ...o })),
    CHUNK,
  );
  mark('objectives', objectives);

  const values = Object.values(created);
  const total = values.reduce((a, b) => a + b, 0);
  return { perModule: Math.round(total / values.length), min: Math.min(...values), max: Math.max(...values), modules: created, total };
}

// ───────────────────────── Objectifs de démonstration ─────────────────────────

type ObjectiveSeed = {
  title: string; metric: string; period: string; startDate: string; endDate: string;
  targetValue: number; currentValue?: number; unit?: string | null;
};

const METRIC_TITLES: Record<string, string> = {
  revenue: "Chiffre d'affaires", profit: 'Bénéfice', sales_count: 'Ventes réalisées', new_clients: 'Nouveaux clients',
  orders_count: 'Commandes reçues', purchases_count: "Nombre d'achats", average_basket: 'Panier moyen',
  invoices_paid_amount: 'Factures encaissées', shipments_delivered: 'Livraisons effectuées',
};
const MONEY = ['revenue', 'profit', 'average_basket', 'invoices_paid_amount'];

// [titre, unité, cible, progression actuelle en % de la cible]
const MANUAL_GOALS: Array<[string, string, number, number]> = [
  ['Recruter des commerciaux', 'recrutements', 3, 0.34], ['Ouvrir un point de vente', 'ouverture', 1, 0],
  ['Lancer la boutique en ligne', 'lancement', 1, 0.5], ['Obtenir la certification ISO 9001', 'certification', 1, 0],
  ['Former les équipes', 'formations', 8, 0.75], ['Signer des contrats cadres', 'contrats', 6, 0.5],
  ['Satisfaction clients', 'points', 90, 0.92], ['Numériser les archives', 'dossiers', 600, 0.64],
  ['Visiter les clients stratégiques', 'visites', 40, 0.65], ['Organiser un salon professionnel', 'événement', 1, 1],
  ['Renouveler le parc informatique', 'postes', 14, 0.36], ['Réduire les impayés', 'dossiers', 25, 0.8],
  ['Négocier avec les fournisseurs', 'accords', 10, 0.4], ['Publier du contenu marketing', 'publications', 48, 0.58],
  ['Mettre à jour le catalogue', 'références', 120, 1],
];
const MANUAL_SCOPES = ['cette année', 'ce trimestre', 'trimestre prochain'];

function buildDemoObjectives(
  target: number,
  data: { sales: any[]; purchases: any[]; clients: any[]; orders: any[]; invoices: any[]; shipments: any[] },
): ObjectiveSeed[] {
  const today = new Date();
  const y = today.getUTCFullYear(), m = today.getUTCMonth();
  const todayIso = isoDay(today);
  const inRange = (d: any, a: string, b: string) => { const x = isoDay(new Date(d)); return x >= a && x <= b; };
  const month = (offset: number) => periodBounds('month', new Date(Date.UTC(y, m + offset, 15)));
  const quarter = (offset: number) => periodBounds('quarter', new Date(Date.UTC(y, m + offset * 3, 15)));
  const year = periodBounds('year', today);
  const lastYear = periodBounds('year', new Date(Date.UTC(y - 1, 6, 15)));

  const actual = (metric: string, a: string, b: string): number => {
    const sales = data.sales.filter((s) => inRange(s.createdAt, a, b));
    const revenue = sales.reduce((t, s) => t + Number(s.total), 0);
    const cost = data.purchases.filter((p) => inRange(p.createdAt, a, b)).reduce((t, p) => t + Number(p.total), 0);
    switch (metric) {
      case 'revenue': return revenue;
      case 'profit': return revenue - cost;
      case 'sales_count': return sales.length;
      case 'average_basket': return sales.length ? revenue / sales.length : 0;
      case 'new_clients': return data.clients.filter((c) => inRange(c.createdAt, a, b)).length;
      case 'orders_count': return data.orders.filter((o) => inRange(o.createdAt, a, b)).length;
      case 'purchases_count': return data.purchases.filter((p) => inRange(p.createdAt, a, b)).length;
      case 'invoices_paid_amount': return data.invoices.filter((i) => i.status === 'paid' && inRange(i.createdAt, a, b)).reduce((t, i) => t + Number(i.amount), 0);
      case 'shipments_delivered': return data.shipments.filter((s) => s.status === 'delivered' && inRange(s.createdAt, a, b)).length;
      default: return 0;
    }
  };
  const nice = (metric: string, v: number): number => {
    if (!MONEY.includes(metric)) return Math.max(2, Math.ceil(v));
    const step = v > 50000 ? 1000 : v > 5000 ? 500 : v > 500 ? 100 : 50;
    return Math.max(step, Math.ceil(v / step) * step);
  };
  const monthLabel = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const quarterLabel = (iso: string) => `T${Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1} ${iso.slice(0, 4)}`;

  // Passé : objectifs tantôt atteints, tantôt manqués ; en cours : à suivre ; futur : à venir
  const PAST = [0.82, 1.18, 0.95, 1.3, 0.7, 1.08];
  const auto: ObjectiveSeed[] = [];
  const make = (metric: string, period: string, b: { start: string; end: string }, label: string, k: number) => {
    const a = actual(metric, b.start, b.end);
    let t: number;
    if (b.end < todayIso) t = nice(metric, a * PAST[((k % PAST.length) + PAST.length) % PAST.length] || 3); // période terminée
    else if (b.start > todayIso) t = nice(metric, (a || actual(metric, year.start, todayIso) / Math.max(1, m + 1)) * 1.1 || 5); // à venir
    else t = nice(metric, Math.max(a * 1.5, a + (MONEY.includes(metric) ? 500 : 3))); // en cours
    auto.push({ title: `${METRIC_TITLES[metric]} — ${label}`, metric, period, startDate: b.start, endDate: b.end, targetValue: t, currentValue: 0, unit: null });
  };
  const MONTH_METRICS = ['revenue', 'profit', 'sales_count', 'new_clients', 'orders_count'];
  const QUARTER_METRICS = ['revenue', 'profit', 'sales_count', 'orders_count', 'new_clients', 'invoices_paid_amount'];

  // Ordre de priorité (si le nombre d'objectifs est limité, on garde d'abord les plus utiles) :
  // 1. Objectifs de l'année en cours
  ['revenue', 'profit', 'sales_count', 'average_basket', 'new_clients', 'invoices_paid_amount', 'shipments_delivered', 'purchases_count']
    .forEach((metric, k) => {
      const a = actual(metric, year.start, year.end);
      auto.push({ title: `${METRIC_TITLES[metric]} — ${y}`, metric, period: 'year', startDate: year.start, endDate: year.end, targetValue: nice(metric, a * (1.25 - 0.03 * k) || 10), currentValue: 0, unit: null });
    });
  // 2. Trimestre et mois en cours, puis suivants
  [0, 1].forEach((off) => QUARTER_METRICS.forEach((metric, k) => { const b = quarter(off); make(metric, 'quarter', b, quarterLabel(b.start), k + off + 1); }));
  [0, 1].forEach((off) => MONTH_METRICS.forEach((metric, k) => { const b = month(off); make(metric, 'month', b, monthLabel(b.start), k + off + 6); }));
  [0, 1].forEach((off) => ['purchases_count', 'shipments_delivered', 'average_basket'].forEach((metric, k) => { const b = month(off); make(metric, 'month', b, monthLabel(b.start), k + off + 2); }));
  // 3. Historique sur 13 mois : mois passés et trimestres passés, du plus récent au plus ancien
  for (let off = 1; off <= DEMO_MONTHS - 1; off++) {
    MONTH_METRICS.forEach((metric, k) => { const b = month(-off); make(metric, 'month', b, monthLabel(b.start), k - off + 6); });
    if (off % 3 === 1 && off <= DEMO_MONTHS - 1) {
      const qOff = -Math.ceil(off / 3);
      QUARTER_METRICS.forEach((metric, k) => { const b = quarter(qOff); make(metric, 'quarter', b, quarterLabel(b.start), k + qOff + 1); });
    }
  }
  // 4. Bilan de l'année précédente (partiellement couverte par les 13 mois)
  ['revenue', 'profit', 'sales_count', 'new_clients'].forEach((metric, k) => make(metric, 'year', lastYear, String(y - 1), k));

  // Objectifs libres : mêmes 15 objectifs sur 3 horizons
  const manual: ObjectiveSeed[] = [];
  MANUAL_SCOPES.forEach((scope, s) => {
    const b = s === 0 ? year : quarter(s - 1);
    MANUAL_GOALS.forEach(([title, unit, goal, progress]) => {
      const current = Math.round(goal * Math.min(1, progress * (s === 2 ? 0 : 1) + (s === 1 ? 0.1 : 0)));
      manual.push({ title: `${title} (${scope})`, metric: 'manual', period: s === 0 ? 'year' : 'quarter', startDate: b.start, endDate: b.end, targetValue: goal, currentValue: current, unit });
    });
  });

  // Mélange déterministe : on garde ~70 % d'objectifs automatiques (au plus 'auto.length') et le reste en objectifs libres
  const manualCount = Math.min(manual.length, Math.max(Math.round(target * 0.3), target - auto.length));
  const autoCount = Math.min(auto.length, target - manualCount);
  // On répartit les objectifs libres (un sur ~3) entre les automatiques pour un affichage varié
  const list: ObjectiveSeed[] = [];
  let ai = 0, mi = 0;
  while (list.length < autoCount + manualCount) {
    const wantManual = mi < manualCount && (ai >= autoCount || (list.length + 1) % 3 === 0);
    if (wantManual) list.push(manual[mi++]); else if (ai < autoCount) list.push(auto[ai++]); else list.push(manual[mi++]);
  }
  return list;
}
