import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bom } from './bom.entity';

@Injectable()
export class BomService {
  constructor(
    @InjectRepository(Bom)
    private repository: Repository<Bom>,
  ) {}

  async findAll(): Promise<Bom[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Bom | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Bom>): Promise<Bom> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async update(id: string, data: Partial<Bom>): Promise<Bom | null> {
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
