import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { SavedReport } from './entities/saved-report.entity';

/** Les colonnes « decimal » arrivent en texte : toujours convertir avant d'additionner (sinon « 0 » + « 12.50 » = « 012.50 »). */
const num = (v: unknown) => Number(v) || 0;
const round2 = (n: number) => Math.round(n * 100) / 100;
const MAX_SAVED = 200;
const MAX_BYTES = 500_000;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(SavedReport)
    private savedRepository: Repository<SavedReport>,
  ) {}

  private parseDate(value: string | undefined, endOfDay: boolean): Date | null {
    if (!value) return null;
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Date invalide (format AAAA-MM-JJ).');
    return d;
  }

  async getSalesReport(userId: number, start?: string, end?: string) {
    const from = this.parseDate(start, false);
    const to = this.parseDate(end, true);
    const all = await this.saleRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    const sales = all.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return (!from || t >= from.getTime()) && (!to || t <= to.getTime());
    });
    const total = round2(sales.filter((s) => s.status !== 'cancelled').reduce((sum, s) => sum + num(s.total), 0));
    return { type: 'sales', generatedAt: new Date(), period: { start: from, end: to }, total, count: sales.length, items: sales };
  }

  async getInventoryReport(userId: number) {
    const products = await this.productRepository.find({ where: { userId } });
    const stocked = products.filter((p) => p.isStockable !== false);
    // Deux valeurs distinctes : au coût moyen (valeur comptable du stock) et au prix de vente (chiffre d'affaires potentiel).
    const valueAtCost = round2(stocked.reduce((sum, p) => sum + num(p.avgCost) * num(p.quantity), 0));
    const valueAtPrice = round2(stocked.reduce((sum, p) => sum + num(p.price) * num(p.quantity), 0));
    return { type: 'inventory', generatedAt: new Date(), totalProducts: products.length, totalValue: valueAtPrice, valueAtPrice, valueAtCost, items: products };
  }

  async getClientsReport(userId: number) {
    const clients = await this.clientRepository.find({ where: { userId } });
    return { type: 'clients', generatedAt: new Date(), total: clients.length, items: clients };
  }

  /** `withSalaries` = false pour un membre d'équipe sans droit RH : il voit l'effectif, pas les salaires. */
  async getEmployeesReport(userId: number, withSalaries = true) {
    const employees = await this.employeeRepository.find({ where: { userId } });
    if (!withSalaries) {
      const items = employees.map((e) => ({ id: e.id, name: e.name, position: e.position, department: e.department, status: e.status }));
      return { type: 'employees', generatedAt: new Date(), total: employees.length, totalSalary: null, items };
    }
    const totalSalary = round2(employees.reduce((sum, e) => sum + num(e.salary), 0));
    return { type: 'employees', generatedAt: new Date(), total: employees.length, totalSalary, items: employees };
  }

  async getLogisticsReport(userId: number) {
    const shipments = await this.shipmentRepository.find({ where: { clientId: userId }, order: { createdAt: 'DESC' } });
    const count = (status: string) => shipments.filter((s) => s.status === status).length;
    return {
      type: 'logistics', generatedAt: new Date(), total: shipments.length,
      pending: count('pending'), inTransit: count('in_transit'), delivered: count('delivered'), cancelled: count('cancelled'),
      amount: round2(shipments.reduce((sum, s) => sum + num(s.amount), 0)),
      items: shipments,
    };
  }

  // ───────────── Rapports enregistrés (en base, par société) ─────────────

  async getSavedReports(userId: number) {
    return this.savedRepository.find({ where: { userId }, order: { createdAt: 'DESC' }, take: MAX_SAVED });
  }

  async saveReport(userId: number, name: string, type: string, data: any) {
    const cleanName = String(name ?? '').trim();
    const cleanType = String(type ?? '').trim();
    if (!cleanName || cleanName.length > 160) throw new BadRequestException('Nom du rapport requis (160 caractères maximum).');
    if (!cleanType || cleanType.length > 40) throw new BadRequestException('Type de rapport requis.');
    if (data !== undefined && data !== null && JSON.stringify(data).length > MAX_BYTES) {
      throw new BadRequestException('Rapport trop volumineux pour être enregistré : réduisez la période ou exportez-le en fichier.');
    }
    if ((await this.savedRepository.count({ where: { userId } })) >= MAX_SAVED) {
      throw new BadRequestException(`Vous avez déjà ${MAX_SAVED} rapports enregistrés : supprimez-en avant d’en ajouter.`);
    }
    const report = await this.savedRepository.save(this.savedRepository.create({ userId, name: cleanName, type: cleanType, data: data ?? null }));
    return { success: true, message: 'Rapport sauvegardé', report };
  }

  async deleteSavedReport(id: number, userId: number) {
    const res = await this.savedRepository.delete({ id, userId });
    if (!res.affected) throw new NotFoundException('Rapport non trouvé');
    return { success: true, message: 'Rapport supprimé' };
  }
}
