import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class RFMService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async analyzeCustomers(): Promise<any> {
    const customers = await this.customerRepository.find();
    const results = [];

    for (const customer of customers) {
      const orders = await this.orderRepository.find({
        where: { customerId: customer.id }
      });
      
      const recency = orders.length > 0 
        ? Math.floor((Date.now() - new Date(orders[orders.length - 1]?.createdAt).getTime()) / (1000 * 3600 * 24))
        : 999;
      
      const frequency = orders.length;
      const monetary = orders.reduce((s, o) => s + (o.total || 0), 0);
      
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        recency,
        frequency,
        monetary,
        score: (Math.max(0, 100 - recency) + frequency * 20 + monetary / 100) / 3
      });
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
}
