import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Quote } from './entities/quote.entity';
import { SalesOrder } from './entities/sales-order.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(SalesOrder)
    private orderRepository: Repository<SalesOrder>,
  ) {}

  async findAllCustomers(): Promise<Customer[]> {
    return this.customerRepository.find();
  }

  async findCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Client non trouvé');
    return customer;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const customer = this.customerRepository.create(data);
    return this.customerRepository.save(customer);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.findCustomerById(id);
    await this.customerRepository.update(id, data);
    return this.findCustomerById(id);
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.findCustomerById(id);
    await this.customerRepository.remove(customer);
  }

  async createQuote(data: Partial<Quote>): Promise<Quote> {
    const quote = this.quoteRepository.create(data);
    return this.quoteRepository.save(quote);
  }

  async getSalesStats(): Promise<any> {
    const totalCustomers = await this.customerRepository.count();
    const totalQuotes = await this.quoteRepository.count();
    const acceptedQuotes = await this.quoteRepository.count({ where: { status: 'accepted' } });
    const totalOrders = await this.orderRepository.count();
    
    return {
      totalCustomers,
      totalQuotes,
      conversionRate: totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0,
      totalOrders,
    };
  }
}
