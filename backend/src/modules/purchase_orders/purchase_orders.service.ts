import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './purchase_order.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private repository: Repository<PurchaseOrder>,
  ) {}

  async findAll(): Promise<PurchaseOrder[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<PurchaseOrder | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const order = this.repository.create(data);
    return this.repository.save(order);
  }

  async update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deliver(id: string): Promise<PurchaseOrder | null> {
    await this.repository.update(id, { status: 'delivered' });
    return this.findOne(id);
  }
}
