import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payments } from './payments.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payments)
    private repository: Repository<Payments>,
  ) {}

  async findAll(): Promise<Payments[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Payments | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Payments>): Promise<Payments> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async update(id: string, data: Partial<Payments>): Promise<Payments | null> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getStats(): Promise<any> {
    const items = await this.repository.find();
    const total = items.length;
    const active = items.filter(i => i.status === 'active' || i.status === 'paid' || i.status === 'delivered').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    return { total, active, pending, totalAmount };
  }
}
