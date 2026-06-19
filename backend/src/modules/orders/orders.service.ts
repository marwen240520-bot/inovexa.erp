import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

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
