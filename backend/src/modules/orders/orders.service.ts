import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
import { Order } from './entities/order.entity';
import { DocumentsService, Actor } from '../documents/documents.service';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly documents: DocumentsService,
  ) {}

  /**
   * Transforme la commande en document commercial (brouillon) : devis, bon de livraison ou facture.
   * La ligne reprend le produit, la quantité et le prix de la commande ; la TVA est celle du produit.
   * Une commande ne donne qu'un seul document (voir `documentId`), qui suit ensuite le circuit habituel
   * (validation → numéro légal, stock, comptabilité).
   */
  async convert(actor: Actor, id: number, type: 'quote' | 'delivery_note' | 'invoice') {
    if (!['quote', 'delivery_note', 'invoice'].includes(type)) throw new BadRequestException('Type attendu : quote, delivery_note ou invoice.');
    const order = await this.findOne(id, actor.userId);
    if (order.documentId) throw new ConflictException(`Un document a déjà été créé pour cette commande (#${order.documentId}).`);
    if (order.status === 'cancelled') throw new BadRequestException('Commande annulée.');
    const product = order.productId ? await this.ds.getRepository(Product).findOne({ where: { id: order.productId, userId: actor.userId } }) : null;
    const [client] = order.clientId ? await this.ds.query(`SELECT "id" FROM "clients" WHERE "id" = $1 AND "userId" = $2`, [order.clientId, actor.userId]) : [null];
    const doc = await this.documents.create(actor, {
      type,
      partyId: client ? order.clientId : undefined,
      partyName: client ? undefined : order.clientName || 'Client',
      externalRef: `CMD-${order.id}`,
      notes: `Commande n° ${order.id} du ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`,
      lines: [{
        productId: product ? product.id : undefined,
        description: order.productName || product?.name || 'Article',
        quantity: Number(order.quantity) || 1,
        unitPriceHT: Number(order.unitPrice) || 0,
        vatRate: product ? Number(product.vatRate) : undefined,
      }],
    } as any);
    order.documentId = doc.id;
    if (order.status === 'pending') order.status = 'processing';
    await this.orderRepository.save(order);
    return { order, document: doc };
  }

  async findAll(userId: number, period?: string) {
    let where: any = { userId };
    
    if (period === 'week') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'month') {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'year') {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      where.createdAt = Between(startDate, new Date());
    }
    
    return this.orderRepository.find({ 
      where, 
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Commande non trouvée');
    return order;
  }

  async create(userId: number, data: Partial<Order>) {
    const order = this.orderRepository.create({ 
      ...data, 
      userId,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    return this.orderRepository.save(order);
  }

  async update(id: number, userId: number, data: Partial<Order>) {
    const order = await this.findOne(id, userId);
    Object.assign(order, data);
    if (data.unitPrice !== undefined || data.quantity !== undefined) {
      order.total = (order.unitPrice || 0) * (order.quantity || 1);
    }
    return this.orderRepository.save(order);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const order = await this.findOne(id, userId);
    order.status = status;
    return this.orderRepository.save(order);
  }

  async delete(id: number, userId: number) {
    const order = await this.findOne(id, userId);
    await this.orderRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const orders = await this.findAll(userId);
    const total = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    return { total, pending, processing, delivered, cancelled, totalAmount };
  }
}
