import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

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

  async create(userId: number, data: any) {
    const supplier = this.supplierRepository.create({ 
      ...data, 
      userId,
      totalPurchases: data.totalPurchases || 0,
      status: data.status || 'active'
    });
    return this.supplierRepository.save(supplier);
  }

  // ⭐ NOUVELLE METHODE: Import multiple
  async importSuppliers(userId: number, suppliersData: any[]) {
    let success = 0;
    let errors = 0;

    for (const supplierData of suppliersData) {
      try {
        const supplier = this.supplierRepository.create({
          userId: userId,
          name: supplierData.name || supplierData.supplierName || "Fournisseur inconnu",
          contact: supplierData.contact || supplierData.contactPerson || "",
          email: supplierData.email || "",
          phone: supplierData.phone || "",
          address: supplierData.address || "",
          totalPurchases: parseFloat(supplierData.totalPurchases) || 0,
          status: supplierData.status || "active"
        });
        
        await this.supplierRepository.save(supplier);
        success++;
      } catch (error) {
        errors++;
        console.error('Erreur import fournisseur:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: suppliersData.length };
  }

  async update(id: number, userId: number, data: any) {
    const supplier = await this.findOne(id, userId);
    Object.assign(supplier, data);
    return this.supplierRepository.save(supplier);
  }

  async delete(id: number, userId: number) {
    const supplier = await this.findOne(id, userId);
    await this.supplierRepository.delete(id);
    return { success: true };
  }
}