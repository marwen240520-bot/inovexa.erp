import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrder } from './entities/production-order.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder)
    private productionRepository: Repository<ProductionOrder>,
  ) {}

  async findAll(userId: number) {
    return this.productionRepository.find({ where: { userId: userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number, userId: number) {
    const order = await this.productionRepository.findOne({ where: { id: id, userId: userId } });
    if (!order) throw new NotFoundException('Ordre non trouvé');
    return order;
  }

  async create(userId: number, data: any) {
    const count = await this.productionRepository.count({ where: { userId: userId } });
    const orderNumber = `PO-${(count + 1).toString().padStart(4, '0')}`;
    const newOrder = this.productionRepository.create({ ...data, userId: userId, orderNumber, progress: 0 });
    return this.productionRepository.save(newOrder);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const order = await this.findOne(id, userId);
    (order as any).status = status;
    if (status === 'completed') {
      (order as any).progress = 100;
    }
    return this.productionRepository.save(order);
  }

  async updateProgress(id: number, userId: number, progress: number) {
    const order = await this.findOne(id, userId);
    (order as any).progress = progress;
    if (progress >= 100) {
      (order as any).status = 'completed';
    } else if (progress > 0 && (order as any).status !== 'completed') {
      (order as any).status = 'in_progress';
    }
    return this.productionRepository.save(order);
  }

  async delete(id: number, userId: number) {
    const order = await this.findOne(id, userId);
    await this.productionRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const orders = await this.findAll(userId);
    const total = orders.length;
    const pending = orders.filter(o => (o as any).status === 'pending').length;
    const inProgress = orders.filter(o => (o as any).status === 'in_progress').length;
    const completed = orders.filter(o => (o as any).status === 'completed').length;
    const cancelled = orders.filter(o => (o as any).status === 'cancelled').length;
    return { total, pending, inProgress, completed, cancelled };
  }
}
