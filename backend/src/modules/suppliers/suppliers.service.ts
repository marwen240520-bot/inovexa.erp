import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suppliers } from './suppliers.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Suppliers)
    private repository: Repository<Suppliers>,
  ) {}

  async findAll(): Promise<Suppliers[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Suppliers | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Suppliers>): Promise<Suppliers> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async update(id: string, data: Partial<Suppliers>): Promise<Suppliers | null> {
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
