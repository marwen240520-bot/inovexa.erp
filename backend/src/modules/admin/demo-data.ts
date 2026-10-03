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

/** Nombre d'éléments de démonstration créés dans CHAQUE module d'un nouveau client. */
export const DEMO_ITEMS_PER_MODULE = 20;

const N = DEMO_ITEMS_PER_MODULE;
const pad = (n: number, size = 3) => String(n).padStart(size, '0');
const pick = <T>(list: T[], i: number): T => list[i % list.length];
const range = (count: number) => Array.from({ length: count }, (_, i) => i);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Date située `days` jours avant aujourd'hui (pour que les graphiques aient des données). */
const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};
/** Répartit 20 éléments sur ~6 mois : 0, 9, 18 ... jours. */
const spread = (i: number) => daysAgo(i * 9 + 1);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

// ───────────────────────── Jeux de données ─────────────────────────

const CATEGORIES = [
  'Informatique', 'Téléphonie', 'Électroménager', 'Mobilier de bureau', 'Papeterie',
  'Alimentation', 'Boissons', 'Hygiène', 'Vêtements', 'Chaussures',
  'Sport & Loisirs', 'Jouets', 'Bricolage', 'Jardin', 'Automobile',
  'Santé', 'Beauté', 'Livres', 'Éclairage', 'Emballage',
];

// [nom, prix, stock]  (quelques stocks bas pour alimenter les alertes)
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

const FIRST_NAMES = ['Ahmed', 'Sarra', 'Mohamed', 'Leila', 'Youssef', 'Amel', 'Karim', 'Nadia', 'Walid', 'Ines'];
const LAST_NAMES = ['Ben Ali', 'Trabelsi', 'Gharbi', 'Mejri', 'Jebali', 'Haddad', 'Chaabane', 'Bouzid', 'Ferchichi', 'Sassi'];

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
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

// ───────────────────────── Génération ─────────────────────────

export interface DemoDataSummary {
  perModule: number;
  modules: Record<string, number>;
  total: number;
}

/**
 * Crée DEMO_ITEMS_PER_MODULE éléments dans chaque module pour le client `userId`.
 * À appeler dans une transaction : tout est créé ou rien.
 */
export async function seedDemoData(manager: EntityManager, userId: number): Promise<DemoDataSummary> {
  const created: Record<string, number> = {};
  const mark = (key: string, rows: unknown[]) => { created[key] = rows.length; };

  // 1. Catégories
  const categories = await manager.save(
    Category,
    CATEGORIES.slice(0, N).map((name, i) =>
      manager.create(Category, { userId, name, description: `Catégorie ${name}`, createdAt: spread(N - 1 - i) }),
    ),
  );
  mark('categories', categories);

  // 2. Produits (liés aux catégories)
  const products = await manager.save(
    Product,
    PRODUCTS.slice(0, N).map(([name, price, quantity], i) =>
      manager.create(Product, {
        userId,
        categoryId: categories[i % categories.length].id,
        name,
        sku: `SKU-${pad(i + 1)}`,
        price,
        quantity,
        createdAt: spread(N - 1 - i),
      }),
    ),
  );
  mark('products', products);

  // 3. Clients
  const clients = await manager.save(
    Client,
    CLIENT_NAMES.slice(0, N).map((name, i) =>
      manager.create(Client, {
        userId,
        name,
        email: `contact@${slug(name)}.tn`,
        phone: `${pick([20, 22, 24, 25, 28, 50, 52, 55, 90, 98], i)}${pad(100 + i * 37 % 900)}${pad(i * 53 % 1000)}`.slice(0, 8),
        address: `${10 + i} rue de la République, ${pick(CITIES, i)}`,
        totalSpent: round2(300 + ((i * 731) % 4200)),
        status: i % 7 === 6 ? 'inactive' : 'active',
        createdAt: spread(N - 1 - i),
      }),
    ),
  );
  mark('clients', clients);

  // 4. Fournisseurs
  const suppliers = await manager.save(
    Supplier,
    SUPPLIER_NAMES.slice(0, N).map((name, i) =>
      manager.create(Supplier, {
        userId,
        name,
        contact: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`,
        email: `commercial@${slug(name)}.com`,
        phone: `${pick([71, 72, 73, 74, 75], i)}${pad(200 + i * 41 % 800)}${pad(i * 67 % 1000)}`.slice(0, 8),
        address: `Zone industrielle ${i + 1}, ${pick(CITIES, i + 2)}`,
        totalPurchases: round2(500 + ((i * 977) % 9000)),
        status: i % 9 === 8 ? 'inactive' : 'active',
        createdAt: spread(N - 1 - i),
      }),
    ),
  );
  mark('suppliers', suppliers);

  // Plan commun ventes / achats / dépenses.
  // RÈGLE : pour chaque ligne i, vente > achat + dépense, afin que le bénéfice soit positif
  // quel que soit le regroupement (jour, mois, trimestre, année) et dans tous les modules
  // (tableau de bord, finance, rapports, analyses).
  //   achat   <= 40 % de la vente   (quantité achetée <= 60 % de la quantité vendue, coût 35-40 % du prix)
  //   dépense <= 17 % de la vente
  const plan = range(N).map((i) => {
    const product = products[(i * 3) % products.length];
    const price = Number(product.price);
    const target = 600 + ((i * 337) % 2400); // chiffre d'affaires visé : 600 à 3 000
    const quantity = Math.min(40, Math.max(1, Math.round(target / price)));
    const total = round2(quantity * price);
    return { i, product, price, quantity, total, date: spread(N - 1 - i) };
  });

  // 5. Ventes
  const sales = await manager.save(
    Sale,
    plan.map(({ i, product, price, quantity, total, date }) =>
      manager.create(Sale, {
        userId,
        productId: product.id,
        clientName: clients[i % clients.length].name,
        productName: product.name,
        quantity,
        unitPrice: price,
        total,
        status: pick(SALE_STATUSES, i),
        createdAt: date,
      }),
    ),
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
  );
  mark('purchases', purchases);

  // 7. Commandes
  const orders = await manager.save(
    Order,
    range(N).map((i) => {
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
        status: pick(ORDER_STATUSES, i),
        createdAt: spread(N - 1 - i),
      });
    }),
  );
  mark('orders', orders);

  // 8. Factures (numéros d'opération uniques à l'échelle de la base)
  const invoices = await manager.save(
    Invoice,
    range(N).map((i) => {
      const isDebit = i % 4 !== 3; // 3 factures sur 4 sont des ventes (débit)
      const product = products[(i * 5) % products.length];
      const quantity = 1 + (i % 4);
      const unitPrice = Number(product.price);
      const subtotalHT = round2(quantity * unitPrice);
      const taxRate = 20;
      const taxAmount = round2((subtotalHT * taxRate) / 100);
      const client = clients[i % clients.length];
      const supplier = suppliers[i % suppliers.length];
      const issued = spread(N - 1 - i);
      const due = new Date(issued);
      due.setDate(due.getDate() + 30);
      return manager.create(Invoice, {
        userId,
        operationNumber: `OP-${userId}-${pad(i + 1, 4)}`,
        reference: `FAC-${issued.getFullYear()}-${pad(i + 1)}`,
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
        paymentTerms: 'Net 30',
        notes: 'Facture de démonstration',
        status: pick(['paid', 'paid', 'pending', 'paid', 'overdue'], i),
        paymentMethod: pick(['paid', 'paid', 'pending', 'paid', 'overdue'], i) === 'paid' ? pick(['transfer', 'card', 'cash', 'check', 'mobile', 'draft'], i) : null,
        createdAt: issued,
      });
    }),
  );
  mark('invoices', invoices);

  // 9. Services (départements) puis employés
  const departments = await manager.save(
    Department,
    DEPARTMENTS.slice(0, N).map((name, i) =>
      manager.create(Department, { userId, name, description: `Service ${name}`, createdAt: spread(N - 1 - i) }),
    ),
  );
  mark('departments', departments);

  const employees = await manager.save(
    Employee,
    range(N).map((i) => {
      const hired = daysAgo(120 + i * 55);
      const nowIso = new Date().toISOString();
      return manager.create(Employee, {
        userId,
        name: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i * 3 + 1)}`,
        email: `${slug(pick(FIRST_NAMES, i))}.${slug(pick(LAST_NAMES, i * 3 + 1))}${i + 1}@entreprise.tn`,
        position: POSITIONS[i],
        department: departments[i % departments.length].name,
        salary: 1200 + ((i * 213) % 3300),
        phone: `${pick([20, 22, 24, 25, 28, 50, 52, 55, 90, 98], i + 4)}${pad(300 + i * 29 % 700)}${pad(i * 71 % 1000)}`.slice(0, 8),
        hireDate: isoDay(hired),
        status: i % 8 === 7 ? 'on_leave' : 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }),
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
  );
  mark('expenses', expenses);

  const year = new Date().getFullYear();
  const budgets = await manager.save(
    Budget,
    range(N).map((i) =>
      manager.create(Budget, {
        userId,
        category: EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
        amount: 2000 + ((i * 457) % 18000),
        year: i < 10 ? year : year - 1,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
      }),
    ),
  );
  mark('budgets', budgets);

  const bankAccounts = await manager.save(
    BankAccount,
    range(N).map((i) =>
      manager.create(BankAccount, {
        userId,
        name: `${pick(BANK_NAMES, i)} ${i < 10 ? 'Courant' : 'Épargne'}`,
        type: i < 10 ? 'checking' : 'savings',
        balance: round2(1500 + ((i * 3917) % 48000)),
        accountNumber: `${pad(10 + i, 2)}${pad(userId % 1000)}${pad(i * 7919 % 100000, 5)}`,
        iban: `TN59${pad(10 + i, 2)}${pad(userId % 1000)}${pad(i * 7919 % 10000000, 7)}0000${pad(i, 2)}`,
      }),
    ),
  );
  mark('bank_accounts', bankAccounts);

  // 11. Expéditions (rattachées au client via clientId = id de l'utilisateur)
  const shipments = await manager.save(
    Shipment,
    range(N).map((i) => {
      const created = spread(N - 1 - i);
      const eta = new Date(created);
      eta.setDate(eta.getDate() + 3 + (i % 4));
      return manager.create(Shipment, {
        clientId: userId,
        transporteurId: null as any,
        trackingNumber: `TRK-${userId}-${pad(i + 1, 4)}`,
        clientName: clients[i % clients.length].name,
        address: `${20 + i} avenue Habib Bourguiba, ${pick(CITIES, i + 1)}`,
        phone: clients[i % clients.length].phone,
        carrier: pick(CARRIERS, i),
        amount: round2(8 + ((i * 13) % 60)),
        status: pick(SHIPMENT_STATUSES, i),
        estimatedDelivery: eta,
        createdAt: created,
      });
    }),
  );
  mark('shipments', shipments);

  // 12. Objectifs : calculés d'après les ventes de démo, pour que les barres de progression soient parlantes
  const today = new Date();
  const thisYear = today.getFullYear();
  const inYear = <T extends { date: Date }>(rows: T[]) => rows.filter((r) => r.date.getFullYear() === thisYear);
  const revenueYear = inYear(plan).reduce((s, p) => s + p.total, 0);
  const costYear = purchases.filter((p) => new Date(p.createdAt).getFullYear() === thisYear).reduce((s, p) => s + Number(p.total), 0);
  const quarter = periodBounds('quarter', today);
  const salesInQuarter = plan.filter((p) => p.date.toISOString().slice(0, 10) >= quarter.start && p.date.toISOString().slice(0, 10) <= quarter.end).length;
  const roundUp = (n: number, step: number) => Math.max(step, Math.ceil(n / step) * step);
  const yearRange = periodBounds('year', today), month = periodBounds('month', today), q = quarter;
  const objectives = await manager.save(
    Objective,
    [
      { title: "Chiffre d'affaires de l'année", metric: 'revenue', period: 'year', ...{ startDate: yearRange.start, endDate: yearRange.end }, targetValue: roundUp(revenueYear * 1.25, 1000) },
      { title: "Bénéfice de l'année", metric: 'profit', period: 'year', ...{ startDate: yearRange.start, endDate: yearRange.end }, targetValue: roundUp((revenueYear - costYear) * 1.1, 500) },
      { title: 'Ventes du trimestre', metric: 'sales_count', period: 'quarter', ...{ startDate: q.start, endDate: q.end }, targetValue: Math.max(5, salesInQuarter + 4) },
      { title: 'Nouveaux clients du mois', metric: 'new_clients', period: 'month', ...{ startDate: month.start, endDate: month.end }, targetValue: 5 },
      { title: 'Recruter 2 commerciaux', metric: 'manual', period: 'year', ...{ startDate: yearRange.start, endDate: yearRange.end }, targetValue: 2, currentValue: 1, unit: 'recrutements' },
      { title: 'Ouvrir un second point de vente', metric: 'manual', period: 'year', ...{ startDate: yearRange.start, endDate: yearRange.end }, targetValue: 1, currentValue: 0, unit: 'ouverture' },
    ].map((o) => manager.create(Objective, { userId, ...o })),
  );
  mark('objectives', objectives);

  const total = Object.values(created).reduce((a, b) => a + b, 0);
  return { perModule: N, modules: created, total };
}
