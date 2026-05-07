import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async getSalesReport(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const total = sales.reduce((s, item) => s + (item.total || 0), 0);
    return { sales, total, count: sales.length };
  }

  async getInventoryReport(userId: number) {
    const products = await this.productRepository.find({ where: { userId } });
    const lowStock = products.filter(p => (p.quantity || 0) < 10).length;
    const totalValue = products.reduce((s, p) => s + (p.price * (p.quantity || 0)), 0);
    return { products, lowStock, totalValue };
  }
}
