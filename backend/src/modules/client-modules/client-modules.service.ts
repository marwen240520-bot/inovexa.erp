import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientModules } from './entities/client-modules.entity';

@Injectable()
export class ClientModulesService {
  constructor(
    @InjectRepository(ClientModules)
    private clientModulesRepository: Repository<ClientModules>,
  ) {}

  async getModulesByClient(clientId: number) {
    let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
    if (!modules) {
      modules = await this.createDefaultModules(clientId);
    }
    return modules;
  }

  async createDefaultModules(clientId: number) {
    const defaultModules = this.clientModulesRepository.create({
      clientId,
      dashboard: true,
      products: true,
      categories: true,
      stock: true,
      sales: true,
      purchases: true,
      orders: true,
      clients: true,
      suppliers: true,
      invoices: true,
      hr: true,
      finance: true,
      logistics: true,
      production: true,
      ai: true,
      reports: true,
      analytics: true,
      profile: true,
      settings: true,
    });
    return this.clientModulesRepository.save(defaultModules);
  }

  async updateModules(clientId: number, data: any) {
    let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
    if (!modules) {
      modules = await this.createDefaultModules(clientId);
    }
    
    const allowedFields = [
      'dashboard', 'products', 'categories', 'stock', 'sales', 'purchases',
      'orders', 'clients', 'suppliers', 'invoices', 'hr', 'finance',
      'logistics', 'production', 'ai', 'reports', 'analytics', 'profile', 'settings'
    ];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        modules[field] = data[field];
      }
    }
    
    return this.clientModulesRepository.save(modules);
  }

  async getAllModulesConfig() {
    return this.clientModulesRepository.find();
  }

  async getModuleStatus(clientId: number, moduleName: string) {
    const modules = await this.getModulesByClient(clientId);
    return modules[moduleName] !== undefined ? modules[moduleName] : true;
  }

  async resetModules(clientId: number) {
    let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
    if (modules) {
      await this.clientModulesRepository.delete(modules.id);
    }
    return this.createDefaultModules(clientId);
  }
}
