import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  /** Si un nom de client est saisi et n'existe pas encore, le crée dans le module Clients. */
  private async ensureClientExists(userId: number, clientName?: string): Promise<Client | null> {
    const name = (clientName || '').trim();
    if (!name) return null;
    const existing = await this.clientRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('LOWER(c.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) return existing;
    const client = this.clientRepository.create({ userId, name, email: '' });
    return this.clientRepository.save(client);
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
    
    return this.saleRepository.find({ 
      where, 
      order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: number, userId: number) {
    const sale = await this.saleRepository.findOne({ where: { id, userId } });
    if (!sale) throw new NotFoundException('Vente non trouvée');
    return sale;
  }

  async create(userId: number, data: any) {
    const product = await this.productRepository.findOne({ 
      where: { id: data.productId, userId } 
    });
    
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    
    if ((product.quantity || 0) < (data.quantity || 0)) {
      throw new BadRequestException(`Stock insuffisant pour ${product.name}. Disponible: ${product.quantity || 0}, Demandé: ${data.quantity}`);
    }
    
    product.quantity = (product.quantity || 0) - (data.quantity || 0);
    await this.productRepository.save(product);
    
    // Auto-création du client si le nom saisi n'existe pas dans le module Clients
    const client = await this.ensureClientExists(userId, data.clientName);
    
    const sale = this.saleRepository.create({ 
      ...data, 
      clientName: client ? client.name : (data.clientName || null),
      userId,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    const savedSale = await this.saleRepository.save(sale);
    
    return {
      ...savedSale,
      newStock: product.quantity
    };
  }

  async updateStatus(id: number, userId: number, status: string) {
    const sale = await this.findOne(id, userId);
    sale.status = status;
    return this.saleRepository.save(sale);
  }

  async delete(id: number, userId: number) {
    const sale = await this.findOne(id, userId);
    
    const product = await this.productRepository.findOne({ 
      where: { id: sale.productId, userId } 
    });
    
    if (product) {
      product.quantity = (product.quantity || 0) + (sale.quantity || 0);
      await this.productRepository.save(product);
    }
    
    await this.saleRepository.delete(id);
    return { success: true, message: 'Vente supprimée, stock rétabli' };
  }

  async getStats(userId: number) {
    const sales = await this.findAll(userId);
    const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const paid = sales.filter(s => s.status === 'paid').length;
    const pending = sales.filter(s => s.status === 'pending').length;
    const cancelled = sales.filter(s => s.status === 'cancelled').length;
    
    return {
      total: sales.length,
      totalAmount: total,
      averageAmount: sales.length > 0 ? total / sales.length : 0,
      paid,
      pending,
      cancelled
    };
  }

  async importSales(userId: number, salesData: any[]) {
    let success = 0;
    let errors = 0;
    
    for (const data of salesData) {
      try {
        const product = await this.productRepository.findOne({ 
          where: { id: data.productId, userId } 
        });
        
        if (!product) {
          errors++;
          continue;
        }
        
        if ((product.quantity || 0) < (data.quantity || 0)) {
          errors++;
          continue;
        }
        
        product.quantity = (product.quantity || 0) - (data.quantity || 0);
        await this.productRepository.save(product);
        
        // Auto-création du client importé s'il n'existe pas
        const client = await this.ensureClientExists(userId, data.clientName);
        
        const sale = this.saleRepository.create({
          ...data,
          clientName: client ? client.name : (data.clientName || null),
          userId,
          total: (data.unitPrice || 0) * (data.quantity || 1)
        });
        await this.saleRepository.save(sale);
        success++;
      } catch (e) {
        errors++;
      }
    }
    
    return { success, errors };
  }
}
