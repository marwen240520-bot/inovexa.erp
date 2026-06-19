import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(userId: number, period?: string) {
    let where: any = { userId };
    
    if (period === 'week') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'month') {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'year') {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      where.createdAt = Between(startDate, new Date());
    }
    
    return this.purchaseRepository.find({ 
      where, 
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
    if (!purchase) throw new NotFoundException('Achat non trouvé');
    return purchase;
  }

  async create(userId: number, data: any) {
    const product = await this.productRepository.findOne({ 
      where: { id: data.productId, userId } 
    });
    
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    
    product.quantity = (product.quantity || 0) + (data.quantity || 0);
    await this.productRepository.save(product);
    
    const purchase = this.purchaseRepository.create({ 
      ...data, 
      userId,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    const savedPurchase = await this.purchaseRepository.save(purchase);
    
    return {
      ...savedPurchase,
      newStock: product.quantity
    };
  }

  async updateStatus(id: number, userId: number, status: string) {
    const purchase = await this.findOne(id, userId);
    purchase.status = status;
    return this.purchaseRepository.save(purchase);
  }

  async importPurchases(userId: number, purchases: any[]) {
    let success = 0;
    let errors = 0;
    
    for (const purchase of purchases) {
      try {
        const product = await this.productRepository.findOne({ 
          where: { id: purchase.productId, userId } 
        });
        
        if (!product) {
          errors++;
          continue;
        }
        
        product.quantity = (product.quantity || 0) + (purchase.quantity || 0);
        await this.productRepository.save(product);
        
        const newPurchase = this.purchaseRepository.create({
          ...purchase,
          userId,
          total: (purchase.unitPrice || 0) * (purchase.quantity || 1)
        });
        await this.purchaseRepository.save(newPurchase);
        success++;
      } catch(e) {
        errors++;
      }
    }
    
    return { success, errors, total: purchases.length };
  }

  async delete(id: number, userId: number) {
    const purchase = await this.findOne(id, userId);
    
    const product = await this.productRepository.findOne({ 
      where: { id: purchase.productId, userId } 
    });
    
    if (product) {
      product.quantity = (product.quantity || 0) - (purchase.quantity || 0);
      await this.productRepository.save(product);
    }
    
    await this.purchaseRepository.delete(id);
    return { success: true, message: 'Achat supprimé, stock diminué' };
  }

  async getStats(userId: number) {
    const purchases = await this.findAll(userId);
    const total = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const average = total > 0 ? totalAmount / total : 0;
    const pending = purchases.filter(p => p.status === 'pending').length;
    const delivered = purchases.filter(p => p.status === 'delivered').length;
    
    return { total, amount: totalAmount, average, pending, delivered };
  }
}
