import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async findAll(userId: number) {
    return this.orderRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number, userId: number) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Commande non trouvée');
    return order;
  }

  async create(userId: number, data: Partial<Order>) {
    const order = this.orderRepository.create({ ...data, userId });
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
}
