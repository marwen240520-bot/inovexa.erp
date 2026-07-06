import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  /** Si un nom de fournisseur est saisi et n'existe pas encore, le crée dans le module Fournisseurs. */
  private async ensureSupplierExists(userId: number, supplierName?: string): Promise<Supplier | null> {
    const name = (supplierName || '').trim();
    if (!name) return null;
    const existing = await this.supplierRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('LOWER(s.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) return existing;
    const supplier = this.supplierRepository.create({ userId, name, email: '' });
    return this.supplierRepository.save(supplier);
  }

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
    if (!purchase) throw new NotFoundException('Achat non trouve');
    return purchase;
  }

  async create(userId: number, data: any) {
    if (!data.productId) {
      throw new BadRequestException('Le produit est requis');
    }

    const product = await this.productRepository.findOne({ where: { id: data.productId } });
    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    // Auto-création du fournisseur si le nom saisi n'existe pas dans le module Fournisseurs
    const supplier = await this.ensureSupplierExists(userId, data.supplierName);

    const purchase = this.purchaseRepository.create({
      ...data,
      supplierName: supplier ? supplier.name : (data.supplierName || null),
      userId,
      productName: product.name,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    const savedPurchase = await this.purchaseRepository.save(purchase);

    // ✅ Mettre à jour le stock du produit après un achat
    product.quantity = (product.quantity || 0) + (data.quantity || 0);
    await this.productRepository.save(product);

    return {
      ...savedPurchase,
      newStock: product.quantity
    };
  }

  async updateStatus(id: number, userId: number, status: string) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
    if (!purchase) throw new NotFoundException('Achat non trouve');
    purchase.status = status;
    return this.purchaseRepository.save(purchase);
  }

  async delete(id: number, userId: number) {
    const purchase = await this.findOne(id, userId);

    // ✅ Rétablir le stock si l'achat est supprimé
    const product = await this.productRepository.findOne({ where: { id: purchase.productId } });
    if (product) {
      product.quantity = Math.max(0, (product.quantity || 0) - (purchase.quantity || 0));
      await this.productRepository.save(product);
    }

    await this.purchaseRepository.delete(id);
    return { success: true, message: 'Achat supprimé, stock rétabli' };
  }
}
