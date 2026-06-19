import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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

  async search(userId: number, searchTerm: string) {
    if (!searchTerm) {
      return this.findAll(userId);
    }
    return this.productRepository.find({
      where: [
        { userId, name: Like(`%${searchTerm}%`) },
        { userId, sku: Like(`%${searchTerm}%`) }
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepository.findOne({ where: { id, userId } });
    if (!product) throw new NotFoundException('Produit non trouvé');
    return product;
  }

  async create(userId: number, data: Partial<Product>) {
    const product = this.productRepository.create({ ...data, userId });
    return this.productRepository.save(product);
  }

  async update(id: number, userId: number, data: Partial<Product>) {
    const product = await this.findOne(id, userId);
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async delete(id: number, userId: number) {
    const product = await this.findOne(id, userId);
    await this.productRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const products = await this.findAll(userId);
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    const lowStock = products.filter(p => (p.quantity || 0) < 10).length;
    const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
    
    return { total: products.length, totalValue, lowStock, outOfStock };
  }
}
