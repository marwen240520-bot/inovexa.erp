// products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    return product;
  }

  async create(userId: number, data: any) {
    const productData = {
      name: data.name,
      sku: data.sku || '',
      price: parseFloat(data.price) || 0,
      quantity: Number(data.quantity) || 0,
      categoryId: data.categoryId || null,
      userId: userId,
    };

    const product = this.productRepository.create(productData);

    return this.productRepository.save(product);
  }

  async importProducts(userId: number, products: any[]) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException('Aucun produit à importer');
    }

    let success = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (let i = 0; i < products.length; i++) {
      const data = products[i];

      try {
        if (!data.name) {
          throw new Error('Nom du produit manquant');
        }

        const productData = {
          name: String(data.name).trim(),
          sku: data.sku ? String(data.sku).trim() : '',
          price: parseFloat(data.price) || 0,
          quantity: Number(data.quantity) || 0,
          categoryId:
            data.categoryId !== undefined &&
            data.categoryId !== null &&
            data.categoryId !== ''
              ? Number(data.categoryId)
              : null,
          userId: userId,
        };

        const product = this.productRepository.create(productData);

        await this.productRepository.save(product);

        success++;
      } catch (error) {
        errors++;

        errorDetails.push({
          row: i + 2,
          name: data?.name || '',
          sku: data?.sku || '',
          error:
            error instanceof Error
              ? error.message
              : 'Erreur inconnue',
        });
      }
    }

    return {
      success,
      errors,
      total: products.length,
      errorDetails,
      message: `${success} produit(s) importé(s), ${errors} erreur(s)`,
    };
  }

  async update(id: number, userId: number, data: any) {
    const product = await this.findOne(id, userId);

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