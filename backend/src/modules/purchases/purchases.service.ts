import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    }
    
    return this.purchaseRepository.find({ 
      where, 
      relations: ['product'],
      order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: number, userId: number) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId }, relations: ['product'] });
    if (!purchase) throw new NotFoundException('Achat non trouvé');
    return purchase;
  }

  async create(userId: number, data: any) {
    // Vérifier que productId est fourni
    if (!data.productId) {
      throw new BadRequestException('Le produit est requis');
    }
    
    // Vérifier que le produit existe
    const product = await this.productRepository.findOne({ where: { id: data.productId } });
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    
    const purchase = this.purchaseRepository.create({ 
      ...data, 
      userId,
      productName: product.name,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    return this.purchaseRepository.save(purchase);
  }

  async delete(id: number, userId: number) {
    const purchase = await this.findOne(id, userId);
    await this.purchaseRepository.delete(id);
    return { success: true };
  }
}
