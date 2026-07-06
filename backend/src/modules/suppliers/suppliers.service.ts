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

  /** Somme des achats par fournisseur (clé = nom en minuscules). */
  private async getPurchaseTotalsBySupplierName(userId: number): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    try {
      const rows: Array<{ name: string; total: string }> =
        await this.supplierRepository.manager.query(
          `SELECT LOWER("supplierName") AS name, COALESCE(SUM(total), 0) AS total
           FROM purchases
           WHERE "userId" = $1 AND "supplierName" IS NOT NULL AND status != 'cancelled'
           GROUP BY LOWER("supplierName")`,
          [userId],
        );
      for (const row of rows) {
        if (row.name) map.set(row.name, Number(row.total) || 0);
      }
    } catch (e) {
      // En cas d'erreur SQL, on retombe sur les valeurs stockées
    }
    return map;
  }

  async findAll(userId: number) {
    const suppliers = await this.supplierRepository.find({ where: { userId } });
    // Total achats dynamique : calculé en temps réel depuis la page Achats
    const totals = await this.getPurchaseTotalsBySupplierName(userId);
    return suppliers.map(s => ({
      ...s,
      totalPurchases: totals.get((s.name || '').toLowerCase()) ?? 0,
    }));
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
