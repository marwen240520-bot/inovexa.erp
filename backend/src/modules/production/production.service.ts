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
    
    const order = this.productionRepository.create({ 
      ...data, 
      userId, 
      orderNumber,
      progress: 0,
      completedQuantity: 0
    });
    return this.productionRepository.save(order);
  }

  async update(id: number, userId: number, data: any) {
    const order = await this.findOne(id, userId);
    Object.assign(order, data);
    return this.productionRepository.save(order);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const order = await this.findOne(id, userId);
    order.status = status;
    if (status === 'completed') {
      order.progress = 100;
      order.completedQuantity = order.quantity;
      order.endDate = new Date();
    }
    return this.productionRepository.save(order);
  }

  async updateProgress(id: number, userId: number, progress: number) {
    const order = await this.findOne(id, userId);
    order.progress = progress;
    order.completedQuantity = Math.floor((progress / 100) * order.quantity);
    
    if (progress >= 100) {
      order.status = 'completed';
      order.endDate = new Date();
    } else if (progress > 0 && order.status === 'pending') {
      order.status = 'in_progress';
    }
    return this.productionRepository.save(order);
  }

  async delete(id: number, userId: number) {
    const order = await this.findOne(id, userId);
    await this.productionRepository.delete(id);
    return { success: true };
  }
}
