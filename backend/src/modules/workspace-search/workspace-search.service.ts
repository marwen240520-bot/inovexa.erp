import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { Product } from '../products/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Order } from '../orders/entities/order.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Shipment } from '../logistics/entities/shipment.entity';

export type SearchType =
  | 'clients' | 'suppliers' | 'products' | 'categories' | 'invoices'
  | 'sales' | 'purchases' | 'orders' | 'employees' | 'shipments';

export interface SearchHit {
  type: SearchType;
  id: number;
  title: string;
  subtitle: string;
  /** Page de l'application où le résultat se trouve */
  path: string;
}

const MIN_LENGTH = 2;
const money = (n: unknown) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
const join = (...parts: Array<string | number | null | undefined>) =>
  parts.filter((p) => p !== null && p !== undefined && String(p).trim() !== '').join(' · ');

/**
 * Recherche transversale dans l'espace d'un utilisateur : clients, fournisseurs, produits,
 * catégories, factures, ventes, achats, commandes, employés et expéditions.
 * Chaque requête est limitée aux données de l'utilisateur connecté.
 */
@Injectable()
export class WorkspaceSearchService {
  constructor(
    @InjectRepository(Client) private clients: Repository<Client>,
    @InjectRepository(Supplier) private suppliers: Repository<Supplier>,
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Category) private categories: Repository<Category>,
    @InjectRepository(Invoice) private invoices: Repository<Invoice>,
    @InjectRepository(Sale) private sales: Repository<Sale>,
    @InjectRepository(Purchase) private purchases: Repository<Purchase>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(Shipment) private shipments: Repository<Shipment>,
  ) {}

  async search(userId: number, rawQuery: string, rawLimit?: number): Promise<{ query: string; total: number; results: SearchHit[] }> {
    const query = (rawQuery || '').trim().slice(0, 80);
    if (query.length < MIN_LENGTH) return { query, total: 0, results: [] };
    const limit = Math.min(Math.max(Number(rawLimit) || 5, 1), 10);

    // ILIKE : insensible à la casse ; on neutralise les jokers saisis par l'utilisateur
    const like = ILike(`%${query.replace(/[\\%_]/g, '\\$&')}%`);
    const mine = { userId } as any;
    const any = (fields: string[]) => fields.map((f) => ({ ...mine, [f]: like }));

    const run = async <T>(label: string, job: Promise<T[]>): Promise<T[]> => {
      try { return await job; } catch (e: any) {
        // Une table absente ou un module non configuré ne doit pas casser toute la recherche
        console.error(`[WorkspaceSearch] ${label} :`, e?.message || e);
        return [];
      }
    };

    const [clients, suppliers, products, categories, invoices, sales, purchases, orders, employees, shipments] = await Promise.all([
      run('clients', this.clients.find({ where: any(['name', 'email', 'phone', 'address']), take: limit, order: { id: 'DESC' } })),
      run('suppliers', this.suppliers.find({ where: any(['name', 'contact', 'email', 'phone', 'address']), take: limit, order: { id: 'DESC' } })),
      run('products', this.products.find({ where: any(['name', 'sku']), take: limit, order: { id: 'DESC' } })),
      run('categories', this.categories.find({ where: any(['name', 'description']), take: limit, order: { id: 'DESC' } })),
      run('invoices', this.invoices.find({ where: any(['reference', 'operationNumber', 'clientName', 'supplierName', 'description']), take: limit, order: { id: 'DESC' } })),
      run('sales', this.sales.find({ where: any(['productName', 'clientName']), take: limit, order: { id: 'DESC' } })),
      run('purchases', this.purchases.find({ where: any(['productName', 'supplierName']), take: limit, order: { id: 'DESC' } })),
      run('orders', this.orders.find({ where: any(['productName', 'clientName']), take: limit, order: { id: 'DESC' } })),
      run('employees', this.employees.find({ where: any(['name', 'email', 'position', 'department', 'phone']), take: limit, order: { id: 'DESC' } })),
      // Les expéditions sont rattachées au client par `clientId` (= id de l'utilisateur)
      run('shipments', this.shipments.find({
        where: ['trackingNumber', 'clientName', 'address', 'carrier'].map((f) => ({ clientId: userId, [f]: like } as any)),
        take: limit, order: { id: 'DESC' },
      })),
    ]);

    const results: SearchHit[] = [
      ...clients.map((c): SearchHit => ({ type: 'clients', id: c.id, title: c.name, subtitle: join(c.email, c.phone), path: '/dashboard/clients' })),
      ...suppliers.map((s): SearchHit => ({ type: 'suppliers', id: s.id, title: s.name, subtitle: join(s.contact, s.email, s.phone), path: '/dashboard/suppliers' })),
      ...products.map((p): SearchHit => ({ type: 'products', id: p.id, title: p.name, subtitle: join(p.sku && `SKU ${p.sku}`, money(p.price), `stock ${p.quantity ?? 0}`), path: '/dashboard/products' })),
      ...categories.map((c): SearchHit => ({ type: 'categories', id: c.id, title: c.name, subtitle: join(c.description), path: '/dashboard/categories' })),
      ...invoices.map((i): SearchHit => ({ type: 'invoices', id: i.id, title: i.reference || i.operationNumber, subtitle: join(i.clientName || i.supplierName, money(i.amount), i.status), path: '/dashboard/invoices' })),
      ...sales.map((s): SearchHit => ({ type: 'sales', id: s.id, title: s.productName || `Vente #${s.id}`, subtitle: join(s.clientName, money(s.total), s.status), path: '/dashboard/sales' })),
      ...purchases.map((p): SearchHit => ({ type: 'purchases', id: p.id, title: p.productName || `Achat #${p.id}`, subtitle: join(p.supplierName, money(p.total), p.status), path: '/dashboard/purchases' })),
      ...orders.map((o): SearchHit => ({ type: 'orders', id: o.id, title: o.productName || `Commande #${o.id}`, subtitle: join(o.clientName, money(o.total), o.status), path: '/dashboard/orders' })),
      ...employees.map((e): SearchHit => ({ type: 'employees', id: e.id, title: e.name, subtitle: join(e.position, e.department, e.email), path: '/dashboard/hr' })),
      ...shipments.map((s): SearchHit => ({ type: 'shipments', id: s.id, title: s.trackingNumber, subtitle: join(s.clientName, s.carrier, s.status), path: '/dashboard/logistics' })),
    ];
    return { query, total: results.length, results };
  }
}
