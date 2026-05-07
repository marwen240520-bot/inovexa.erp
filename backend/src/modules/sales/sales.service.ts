import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  async findAll(userId: number, period?: string) {
    console.log('🔍 userId reçu dans service:', userId);
    
    const query = this.saleRepository.createQueryBuilder('sale')
      .where('sale.userId = :userId', { userId })
      .orderBy('sale.createdAt', 'DESC');
    
    if (period === 'week') {
      query.andWhere(`sale.createdAt >= NOW() - INTERVAL '7 days'`);
    } else if (period === 'month') {
      query.andWhere(`sale.createdAt >= NOW() - INTERVAL '30 days'`);
    }
    
    const result = await query.getMany();
    console.log('📊 Ventes trouvées pour user', userId, ':', result.length);
    return result;
  }

  async findOne(id: number, userId: number) {
    const sale = await this.saleRepository.findOne({ 
      where: { id, userId } 
    });
    if (!sale) throw new NotFoundException('Vente non trouvée');
    return sale;
  }

  async create(userId: number, data: any) {
    const sale = this.saleRepository.create({ ...data, userId });
    return this.saleRepository.save(sale);
  }

  // ⭐ NOUVELLE METHODE: Import multiple
  async importSales(userId: number, salesData: any[]) {
    const results = {
      success: 0,
      errors: 0,
      total: salesData.length,
      errorDetails: []
    };

    for (const saleData of salesData) {
      try {
        // Nettoyer et valider les données
        const sale = this.saleRepository.create({
          userId: userId,
          clientName: saleData.clientName || saleData.client_name || "Client inconnu",
          productName: saleData.productName || saleData.product_name || "Produit inconnu",
          quantity: parseInt(saleData.quantity) || 1,
          unitPrice: parseFloat(saleData.unitPrice || saleData.unit_price || saleData.price) || 0,
          total: parseFloat(saleData.total) || (parseInt(saleData.quantity) || 1) * (parseFloat(saleData.unitPrice || saleData.price) || 0),
          status: saleData.status || "pending"
        });
        
        await this.saleRepository.save(sale);
        results.success++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          data: saleData,
          error: error.message
        });
        console.error('Erreur import vente:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${results.success} succès, ${results.errors} erreurs`);
    return results;
  }

  async update(id: number, userId: number, data: any) {
    const sale = await this.findOne(id, userId);
    Object.assign(sale, data);
    return this.saleRepository.save(sale);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const sale = await this.findOne(id, userId);
    sale.status = status;
    return this.saleRepository.save(sale);
  }

  async delete(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.saleRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const sales = await this.saleRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    const total = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    return { 
      total: sales.length, 
      amount: total, 
      average: sales.length > 0 ? total / sales.length : 0 
    };
  }
}