import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProductionOrder } from './entities/production-order.entity';
import { Product } from '../products/product.entity';
import { StockService } from '../stock/stock.service';
import { round } from '../../common/money';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder)
    private productionRepository: Repository<ProductionOrder>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly stock: StockService,
  ) {}

  /** Nettoie produit fini et nomenclature reçus du client. */
  private async normalize(userId: number, data: any) {
    const out: any = { ...data };
    if ('productId' in out) {
      const id = Number(out.productId);
      if (!id) out.productId = null;
      else {
        const p = await this.ds.getRepository(Product).findOne({ where: { id, userId } });
        if (!p) throw new BadRequestException('Produit fini introuvable.');
        out.productId = p.id;
        if (!out.productName) out.productName = p.name;
      }
    }
    if ('components' in out) {
      const list = Array.isArray(out.components) ? out.components : [];
      const cleaned: Array<{ productId: number; quantity: number }> = [];
      for (const c of list) {
        const pid = Number(c?.productId), qty = Number(c?.quantity);
        if (!pid || !(qty > 0)) continue;
        if (out.productId && pid === out.productId) throw new BadRequestException('Un produit ne peut pas être son propre composant.');
        const p = await this.ds.getRepository(Product).findOne({ where: { id: pid, userId } });
        if (!p) throw new BadRequestException(`Composant introuvable (#${pid}).`);
        cleaned.push({ productId: pid, quantity: round(qty, 3) });
      }
      out.components = cleaned.length ? cleaned : null;
    }
    delete out.stockedQuantity; delete out.userId; delete out.id;
    return out;
  }

  /**
   * Entrée en stock de la quantité nouvellement produite et sortie des composants (nomenclature × quantité).
   * Appelé à chaque avancement ; ne traite que la différence avec ce qui est déjà en stock.
   */
  private async syncStock(em: EntityManager, order: ProductionOrder, actorId: number | null) {
    const produced = round(Number(order.completedQuantity) || 0, 3);
    const delta = round(produced - (Number(order.stockedQuantity) || 0), 3);
    if (delta <= 0) return;
    for (const c of order.components || []) {
      await this.stock.move(em, {
        userId: order.userId, productId: c.productId, quantity: -round(c.quantity * delta, 3), reason: 'production_consumption',
        refType: 'production_order', refId: order.id, note: `Consommation OF ${order.orderNumber}`, actorId,
      });
    }
    if (order.productId) {
      await this.stock.move(em, {
        userId: order.userId, productId: order.productId, quantity: delta, reason: 'production',
        refType: 'production_order', refId: order.id, note: `Production OF ${order.orderNumber}`, actorId,
      });
    }
    order.stockedQuantity = produced;
  }

  async findAll(userId: number) {
    return this.productionRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.productionRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Ordre de fabrication non trouvé');
    return order;
  }

  async create(userId: number, data: any) {
    const count = await this.productionRepository.count({ where: { userId } });
    const orderNumber = `PO-${(count + 1).toString().padStart(4, '0')}`;
    const input = await this.normalize(userId, data);
    const order = this.productionRepository.create({
      ...input,
      userId,
      orderNumber,
      progress: 0,
      completedQuantity: 0,
      stockedQuantity: 0,
    });
    return this.productionRepository.save(order);
  }

  async update(id: number, userId: number, data: any, actorId: number | null = null) {
    const input = await this.normalize(userId, data);
    return this.ds.transaction(async (em) => {
      const order = await em.getRepository(ProductionOrder).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException('Ordre de production non trouvé');
      Object.assign(order, input);
      await this.syncStock(em, order, actorId);
      return em.getRepository(ProductionOrder).save(order);
    });
  }

  async updateStatus(id: number, userId: number, status: string, actorId: number | null = null) {
    return this.ds.transaction(async (em) => {
      const order = await em.getRepository(ProductionOrder).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException('Ordre de production non trouvé');
      order.status = status;
      if (status === 'completed') {
        order.progress = 100;
        order.completedQuantity = order.quantity;
        order.endDate = new Date();
      }
      await this.syncStock(em, order, actorId);
      return em.getRepository(ProductionOrder).save(order);
    });
  }

  async updateProgress(id: number, userId: number, progress: number, actorId: number | null = null) {
    return this.ds.transaction(async (em) => {
      const order = await em.getRepository(ProductionOrder).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException('Ordre de production non trouvé');
      order.progress = progress;
      order.completedQuantity = Math.floor((progress / 100) * order.quantity);
      if (progress >= 100) {
        order.status = 'completed';
        order.endDate = new Date();
      } else if (progress > 0 && order.status === 'pending') {
        order.status = 'in_progress';
      }
      await this.syncStock(em, order, actorId);
      return em.getRepository(ProductionOrder).save(order);
    });
  }

  async delete(id: number, userId: number) {
    const order = await this.findOne(id, userId);
    await this.productionRepository.delete(id);
    return { success: true };
  }
}
