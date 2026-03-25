import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';
import { Supplier } from './entities/supplier.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.find({ relations: ['category', 'stocks'] });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['category', 'stocks'] });
    if (!product) throw new NotFoundException('Produit non trouvé');
    return product;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    await this.findProductById(id);
    await this.productRepository.update(id, data);
    return this.findProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);
    await this.productRepository.remove(product);
  }

  async getStockStatus(): Promise<any> {
    const stocks = await this.stockRepository.find({ relations: ['product'] });
    const lowStock = stocks.filter(s => s.quantity <= (s.reorder_level || 0));
    const outOfStock = stocks.filter(s => s.quantity <= 0);
    
    return {
      totalProducts: await this.productRepository.count(),
      totalStockValue: stocks.reduce((sum, s) => sum + (s.quantity * (s.product?.selling_price || 0)), 0),
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
    };
  }

  async findAllSuppliers(): Promise<Supplier[]> {
    return this.supplierRepository.find();
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find();
  }
}
