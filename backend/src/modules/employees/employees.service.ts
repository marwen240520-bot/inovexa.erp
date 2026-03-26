import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employees } from './employees.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employees)
    private repository: Repository<Employees>,
  ) {}

  async findAll(): Promise<Employees[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Employees | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Employees>): Promise<Employees> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async update(id: string, data: Partial<Employees>): Promise<Employees | null> {
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
