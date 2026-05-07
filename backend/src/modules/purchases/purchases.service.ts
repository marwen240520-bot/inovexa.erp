import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
  ) {}

  async findAll(userId: number, period?: string) {
    const query = this.purchaseRepository.createQueryBuilder('purchase')
      .where('purchase.userId = :userId', { userId })
      .orderBy('purchase.createdAt', 'DESC');
    
    if (period === 'week') {
      query.andWhere(`purchase.createdAt >= NOW() - INTERVAL '7 days'`);
    } else if (period === 'month') {
      query.andWhere(`purchase.createdAt >= NOW() - INTERVAL '30 days'`);
    }
    
    return query.getMany();
  }

  async findOne(id: number, userId: number) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
    if (!purchase) throw new NotFoundException('Achat non trouvé');
    return purchase;
  }

  async create(userId: number, data: any) {
    const purchase = this.purchaseRepository.create({ ...data, userId });
    return this.purchaseRepository.save(purchase);
  }

  // ⭐ NOUVELLE METHODE: Import multiple
  async importPurchases(userId: number, purchasesData: any[]) {
    let success = 0;
    let errors = 0;

    for (const purchaseData of purchasesData) {
      try {
        const purchase = this.purchaseRepository.create({
          userId: userId,
          supplierName: purchaseData.supplierName || purchaseData.supplier_name || "Fournisseur inconnu",
          productName: purchaseData.productName || purchaseData.product_name || "Produit inconnu",
          quantity: parseInt(purchaseData.quantity) || 1,
          unitPrice: parseFloat(purchaseData.unitPrice || purchaseData.unit_price || purchaseData.price) || 0,
          total: parseFloat(purchaseData.total) || (parseInt(purchaseData.quantity) || 1) * (parseFloat(purchaseData.unitPrice || purchaseData.price) || 0),
          status: purchaseData.status || "pending"
        });
        
        await this.purchaseRepository.save(purchase);
        success++;
      } catch (error) {
        errors++;
        console.error('Erreur import achat:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: purchasesData.length };
  }

  async update(id: number, userId: number, data: any) {
    const purchase = await this.findOne(id, userId);
    Object.assign(purchase, data);
    return this.purchaseRepository.save(purchase);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const purchase = await this.findOne(id, userId);
    purchase.status = status;
    return this.purchaseRepository.save(purchase);
  }

  async delete(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.purchaseRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const purchases = await this.findAll(userId);
    const total = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    return { 
      total, 
      count: purchases.length, 
      average: purchases.length > 0 ? total / purchases.length : 0,
      pending: purchases.filter(p => p.status === 'pending').length,
      delivered: purchases.filter(p => p.status === 'delivered').length
    };
  }
}