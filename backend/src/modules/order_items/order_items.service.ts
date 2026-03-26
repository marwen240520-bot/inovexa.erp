import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order_item.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private repository: Repository<OrderItem>,
  ) {}

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    return this.repository.find({ where: { orderId }, relations: ['product'] });
  }

  async create(data: Partial<OrderItem>): Promise<OrderItem> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
