import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { IaChat } from './entities/ia-chat.entity';

const round2 = (n: number) => Math.round(n * 100) / 100;
/** Les colonnes « decimal » arrivent en texte : toujours convertir avant d'additionner. */
const num = (v: unknown) => Number(v) || 0;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const shiftMonth = (from: Date, delta: number) => new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + delta, 1));
/** Évolution en % de `previous` à `current` ; null quand il n'y a pas de base de comparaison (jamais un chiffre inventé). */
const growth = (current: number, previous: number): number | null => (previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null);

/**
 * Indicateurs simples calculés sur les données réelles de la société. Aucune valeur n'est fixée dans le code :
 * quand l'historique est trop court pour calculer, la réponse vaut null et dit pourquoi.
 */
@Injectable()
export class IaService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(IaChat)
    private iaChatRepository: Repository<IaChat>,
  ) {}

  async getChatHistory(userId: number) {
    return this.iaChatRepository.find({ where: { userId }, order: { createdAt: 'ASC' }, take: 50 });
  }

  async saveChatMessage(userId: number, role: string, content: string) {
    if (!['user', 'assistant'].includes(String(role))) throw new BadRequestException('Rôle invalide (user ou assistant).');
    const text = String(content ?? '');
    if (!text.trim() || text.length > 20_000) throw new BadRequestException('Message vide ou trop long (20 000 caractères maximum).');
    const message = this.iaChatRepository.create({ userId, role, content: text });
    return this.iaChatRepository.save(message);
  }

  async getAlerts(userId: number) {
    const products = await this.productRepository.find({ where: { userId } });
    const orders = await this.orderRepository.find({ where: { userId } });
    const invoices = await this.invoiceRepository.find({ where: { userId } });

    const alerts: any[] = [];
    // Seuil d'alerte propre à chaque produit ; les prestations (non stockées) ne comptent pas.
    const stocked = products.filter((p) => p.isStockable !== false);
    const outOfStockCount = stocked.filter((p) => num(p.quantity) <= 0).length;
    const lowStockCount = stocked.filter((p) => num(p.quantity) > 0 && num(p.quantity) <= num(p.minStock)).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const pendingInvoices = invoices.filter((i) => i.status === 'pending').length;

    if (lowStockCount > 0) alerts.push({ type: 'warning', message: `${lowStockCount} produit(s) en stock faible` });
    if (outOfStockCount > 0) alerts.push({ type: 'danger', message: `${outOfStockCount} produit(s) en rupture` });
    if (pendingOrders > 0) alerts.push({ type: 'info', message: `${pendingOrders} commande(s) en attente` });
    if (pendingInvoices > 0) alerts.push({ type: 'warning', message: `${pendingInvoices} facture(s) impayées` });

    return alerts;
  }

  /** Chiffre d'affaires par mois (ventes non annulées). */
  private async monthlySales(userId: number): Promise<Map<string, { total: number; count: number }>> {
    const sales = await this.saleRepository.find({ where: { userId } });
    const map = new Map<string, { total: number; count: number }>();
    for (const s of sales) {
      if (s.status === 'cancelled') continue;
      const key = monthKey(new Date(s.createdAt));
      const slot = map.get(key) || { total: 0, count: 0 };
      slot.total += num(s.total);
      slot.count += 1;
      map.set(key, slot);
    }
    return map;
  }

  /** Mois en cours comparé au mois précédent (l'ancien calcul mélangeait les années). */
  async getComparisonStats(userId: number) {
    const now = new Date();
    const current = monthKey(now);
    const previous = monthKey(shiftMonth(now, -1));
    const sales = await this.monthlySales(userId);
    const cur = sales.get(current) || { total: 0, count: 0 };
    const prev = sales.get(previous) || { total: 0, count: 0 };

    const purchases = await this.purchaseRepository.find({ where: { userId } });
    const bought = (key: string) => purchases.filter((p) => p.status !== 'cancelled' && monthKey(new Date(p.createdAt)) === key).reduce((sum, p) => sum + num(p.total), 0);
    const clients = await this.clientRepository.find({ where: { userId }, select: ['id', 'createdAt'] });
    const newClients = (key: string) => clients.filter((c) => monthKey(new Date(c.createdAt)) === key).length;

    return {
      period: { current, previous },
      salesGrowth: growth(cur.total, prev.total),
      clientGrowth: growth(newClients(current), newClients(previous)),
      // Marge brute simple : ventes − achats du mois (les charges ne sont pas comptées ici).
      profitGrowth: growth(cur.total - bought(current), prev.total - bought(previous)),
      avgOrderGrowth: growth(cur.count ? cur.total / cur.count : 0, prev.count ? prev.total / prev.count : 0),
      note: 'Évolutions calculées sur vos ventes et achats. null = pas de mois précédent comparable.',
    };
  }

  async exportAnalytics(userId: number) {
    const [sales, purchases, clients, products] = await Promise.all([
      this.saleRepository.find({ where: { userId } }),
      this.purchaseRepository.find({ where: { userId } }),
      this.clientRepository.count({ where: { userId } }),
      this.productRepository.count({ where: { userId } }),
    ]);
    const live = <T extends { status?: string }>(rows: T[]) => rows.filter((r) => r.status !== 'cancelled');
    return {
      generatedAt: new Date(),
      sales: { count: live(sales).length, total: round2(live(sales).reduce((sum, s) => sum + num(s.total), 0)) },
      purchases: { count: live(purchases).length, total: round2(live(purchases).reduce((sum, p) => sum + num(p.total), 0)) },
      clients,
      products,
    };
  }

  /** Les N derniers mois COMPLETS (le mois en cours, incomplet, est exclu), du plus ancien au plus récent. */
  private async completeMonths(userId: number, count: number): Promise<Array<{ month: string; total: number }>> {
    const sales = await this.monthlySales(userId);
    const now = new Date();
    const firstKey = Array.from(sales.keys()).sort()[0];
    const out: Array<{ month: string; total: number }> = [];
    for (let i = count; i >= 1; i--) {
      const key = monthKey(shiftMonth(now, -i));
      if (firstKey && key >= firstKey) out.push({ month: key, total: round2(sales.get(key)?.total || 0) });
    }
    return out;
  }

  /**
   * Estimation du mois prochain = moyenne des 3 derniers mois complets. Méthode volontairement simple et affichée :
   * ce n'est pas un modèle statistique, donc aucun « indice de confiance » n'est fourni.
   */
  async getPredictions(userId: number) {
    const months = await this.completeMonths(userId, 6);
    if (months.length < 2) {
      return { nextMonthSales: null, growthRate: null, confidence: null, basisMonths: months.length, method: null, reason: 'Historique insuffisant : il faut au moins deux mois complets de ventes.' };
    }
    const last = months.slice(-3);
    const before = months.slice(0, -3);
    const avg = (rows: Array<{ total: number }>) => (rows.length ? rows.reduce((sum, r) => sum + r.total, 0) / rows.length : 0);
    return {
      nextMonthSales: round2(avg(last)),
      growthRate: before.length ? growth(avg(last), avg(before)) : null,
      confidence: null,
      basisMonths: last.length,
      method: `Moyenne des ${last.length} derniers mois complets`,
      history: months,
    };
  }

  /** Projection sur 6 mois par tendance linéaire (moindres carrés) sur les 12 derniers mois complets au plus. */
  async getForecast(userId: number, period?: string, scenario?: string) {
    const months = await this.completeMonths(userId, 12);
    const base = { period: period || 'month', scenario: scenario || 'normal' };
    if (months.length < 3) {
      return { ...base, forecast: [], method: null, reason: 'Historique insuffisant : il faut au moins trois mois complets de ventes.', history: months };
    }
    const n = months.length;
    const xs = months.map((_, i) => i);
    const ys = months.map((m) => m.total);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const denom = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
    const slope = denom ? xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0) / denom : 0;
    const intercept = my - slope * mx;
    // Scénarios : la tendance est conservée telle quelle (normal), prudente (pente réduite de moitié si elle monte) ou optimiste.
    const factor = scenario === 'pessimistic' ? 0.5 : scenario === 'optimistic' ? 1.5 : 1;
    const adjusted = slope >= 0 ? slope * factor : slope / factor;
    const forecast: number[] = [];
    for (let i = 1; i <= 6; i++) forecast.push(Math.max(0, Math.round(intercept + slope * (n - 1) + adjusted * i)));
    return { ...base, forecast, method: `Tendance linéaire sur ${n} mois complets`, monthlyTrend: round2(adjusted), history: months };
  }
}
