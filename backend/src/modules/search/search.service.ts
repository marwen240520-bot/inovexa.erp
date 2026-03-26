import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Employee } from '../employees/employee.entity';
import { Customer } from '../customers/customer.entity';
import { Order } from '../orders/order.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async search(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();
    
    const products = await this.productRepository
      .createQueryBuilder('p')
      .where('LOWER(p.name) LIKE :query', { query: `%${lowerQuery}%` })
      .orWhere('LOWER(p.sku) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    const invoices = await this.invoiceRepository
      .createQueryBuilder('i')
      .where('LOWER(i.customerName) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    const employees = await this.employeeRepository
      .createQueryBuilder('e')
      .where('LOWER(e.firstName) LIKE :query', { query: `%${lowerQuery}%` })
      .orWhere('LOWER(e.lastName) LIKE :query', { query: `%${lowerQuery}%` })
      .orWhere('LOWER(e.email) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    const customers = await this.customerRepository
      .createQueryBuilder('c')
      .where('LOWER(c.name) LIKE :query', { query: `%${lowerQuery}%` })
      .orWhere('LOWER(c.email) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    const orders = await this.orderRepository
      .createQueryBuilder('o')
      .where('LOWER(o.customerName) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    const suppliers = await this.supplierRepository
      .createQueryBuilder('s')
      .where('LOWER(s.name) LIKE :query', { query: `%${lowerQuery}%` })
      .orWhere('LOWER(s.email) LIKE :query', { query: `%${lowerQuery}%` })
      .take(10)
      .getMany();
    
    return {
      query,
      products: products.map(p => ({ type: 'product', id: p.id, name: p.name, sku: p.sku })),
      invoices: invoices.map(i => ({ type: 'invoice', id: i.id, customerName: i.customerName, amount: i.amountTTC })),
      employees: employees.map(e => ({ type: 'employee', id: e.id, name: `${e.firstName} ${e.lastName}`, email: e.email })),
      customers: customers.map(c => ({ type: 'customer', id: c.id, name: c.name, email: c.email })),
      orders: orders.map(o => ({ type: 'order', id: o.id, customerName: o.customerName, total: o.total })),
      suppliers: suppliers.map(s => ({ type: 'supplier', id: s.id, name: s.name, email: s.email })),
      total: products.length + invoices.length + employees.length + customers.length + orders.length + suppliers.length
    };
  }
}

