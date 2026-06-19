import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(userId: number) {
    return this.supplierRepository.find({ where: { userId } });
  }

  async findOne(id: number, userId: number) {
    const supplier = await this.supplierRepository.findOne({ where: { id, userId } });
    if (!supplier) throw new NotFoundException('Fournisseur non trouvé');
    return supplier;
  }

  async create(userId: number, data: Partial<Supplier>) {
    const supplier = this.supplierRepository.create({ ...data, userId });
    return this.supplierRepository.save(supplier);
  }

  async update(id: number, userId: number, data: Partial<Supplier>) {
    const supplier = await this.findOne(id, userId);
    Object.assign(supplier, data);
    return this.supplierRepository.save(supplier);
  }

  async delete(id: number, userId: number) {
    const supplier = await this.findOne(id, userId);
    await this.supplierRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const suppliers = await this.findAll(userId);
    const active = suppliers.filter(s => s.status === 'active').length;
    const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
    
    return { total: suppliers.length, active, totalPurchases };
  }
}
