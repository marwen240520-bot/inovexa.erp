// products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(userId: number) {
    return this.productRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepository.findOne({ where: { id, userId } });
    if (!product) throw new NotFoundException('Produit non trouvé');
    return product;
  }

  async create(userId: number, data: any) {
    // ✅ SUPPRIMER quantity du traitement
    // Laisser la base de données utiliser la valeur par défaut (0)
    const productData = {
      name: data.name,
      sku: data.sku || '',
      price: parseFloat(data.price) || 0,
      categoryId: data.categoryId || null,
      userId: userId
    };
    
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  async update(id: number, userId: number, data: any) {
    const product = await this.findOne(id, userId);
    // ✅ SUPPRIMER quantity des données de mise à jour
    const { quantity, ...updateData } = data;
    Object.assign(product, updateData);
    return this.productRepository.save(product);
  }

  async delete(id: number, userId: number) {
    const product = await this.findOne(id, userId);
    await this.productRepository.delete(id);
    return { success: true };
  }
}