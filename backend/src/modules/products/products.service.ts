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

  async create(userId: number, data: Partial<Product>) {
    const product = this.productRepository.create({ ...data, userId });
    return this.productRepository.save(product);
  }

  // ⭐ NOUVELLE METHODE: Import multiple
  async importProducts(userId: number, productsData: any[]) {
    let success = 0;
    let errors = 0;

    for (const productData of productsData) {
      try {
        // Nettoyer et valider les données
        const product = this.productRepository.create({
          userId: userId,
          name: productData.name || productData.productName || "Produit sans nom",
          sku: productData.sku || "",
          price: parseFloat(productData.price) || 0,
          quantity: parseInt(productData.quantity) || 0,
          categoryId: productData.categoryId ? parseInt(productData.categoryId) : null
        });
        
        await this.productRepository.save(product);
        success++;
      } catch (error) {
        errors++;
        console.error('Erreur import produit:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: productsData.length };
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
    const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.quantity || 0)), 0);
    const lowStock = products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
    const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
    return { total: products.length, totalValue, lowStock, outOfStock };
  }
}