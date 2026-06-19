import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class ReportsService {
  private savedReports: any[] = [];

  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async getSalesReport(userId: number, start?: string, end?: string) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    return { type: "sales", generatedAt: new Date(), total, count: sales.length, items: sales };
  }

  async getInventoryReport(userId: number) {
    const products = await this.productRepository.find({ where: { userId } });
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0);
    return { type: "inventory", generatedAt: new Date(), totalProducts: products.length, totalValue, items: products };
  }

  async getClientsReport(userId: number) {
    const clients = await this.clientRepository.find({ where: { userId } });
    return { type: "clients", generatedAt: new Date(), total: clients.length, items: clients };
  }

  async getEmployeesReport(userId: number) {
    const employees = await this.employeeRepository.find({ where: { userId } });
    const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    return { type: "employees", generatedAt: new Date(), total: employees.length, totalSalary, items: employees };
  }

  async getLogisticsReport(userId: number) {
    return { type: "logistics", generatedAt: new Date(), total: 0, items: [] };
  }

  // Rapports sauvegardés
  async getSavedReports(userId: number) {
    return this.savedReports.filter(r => r.userId === userId);
  }

  async saveReport(userId: number, name: string, type: string, data: any) {
    const report = {
      id: Date.now(),
      userId,
      name,
      type,
      data,
      createdAt: new Date()
    };
    this.savedReports.push(report);
    return { success: true, message: 'Rapport sauvegardé', report };
  }

  async deleteSavedReport(id: number, userId: number) {
    const index = this.savedReports.findIndex(r => r.id === id && r.userId === userId);
    if (index !== -1) {
      this.savedReports.splice(index, 1);
      return { success: true, message: 'Rapport supprimé' };
    }
    return { success: false, message: 'Rapport non trouvé' };
  }
}
