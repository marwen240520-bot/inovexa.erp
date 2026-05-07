import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

const DEFAULT_MODULES = {
  dashboard: true, products: true, categories: true, stock: true,
  sales: true, purchases: true, orders: true, clients: true,
  suppliers: true, invoices: true, hr: true, finance: true,
  logistics: true, production: true, ai: true, reports: true,
  analytics: true, profile: true, settings: true
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllClients() {
    const clients = await this.userRepository.find({
      where: { role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
    });
    
    return clients.map(client => ({
      ...client,
      modules: client.modules ? JSON.parse(client.modules) : DEFAULT_MODULES
    }));
  }

  async getClientById(id: number) {
    const client = await this.userRepository.findOne({
      where: { id: id, role: 'client' }
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    return {
      ...client,
      modules: client.modules ? JSON.parse(client.modules) : DEFAULT_MODULES
    };
  }

  async createClient(body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
    subscriptionDuration: number;
  }) {
    const existingUser = await this.userRepository.findOne({ 
      where: { email: body.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }
    
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + body.subscriptionDuration);
    
    const newClient = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone,
      role: 'client',
      subscriptionStart: new Date(),
      subscriptionEnd: subscriptionEnd,
      isActive: true,
      modules: JSON.stringify(DEFAULT_MODULES)
    });
    
    await this.userRepository.save(newClient);
    
    return {
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: newClient.id,
        email: newClient.email,
        name: newClient.name,
        companyName: newClient.companyName,
        subscriptionEnd: newClient.subscriptionEnd,
        modules: DEFAULT_MODULES
      }
    };
  }

  async updateClient(id: number, body: any) {
    const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    if (body.email && body.email !== client.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: body.email } 
      });
      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé par un autre compte');
      }
    }
    
    if (body.name) client.name = body.name;
    if (body.companyName) client.companyName = body.companyName;
    if (body.phone) client.phone = body.phone;
    if (body.email) client.email = body.email;
    if (body.subscriptionEnd) client.subscriptionEnd = new Date(body.subscriptionEnd);
    
    await this.userRepository.save(client);
    
    return { success: true, message: 'Client mis à jour' };
  }

  async updateClientModules(id: number, modules: any) {
    const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.modules = JSON.stringify(modules);
    await this.userRepository.save(client);
    
    return { success: true, message: 'Modules mis à jour' };
  }

  async extendSubscription(id: number, days: number) {
    const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    const newEnd = new Date(client.subscriptionEnd);
    newEnd.setDate(newEnd.getDate() + days);
    client.subscriptionEnd = newEnd;
    await this.userRepository.save(client);
    
    return { success: true, message: `Abonnement prolongé de ${days} jours`, newEnd };
  }

  async deleteClient(id: number) {
    const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    await this.userRepository.delete(id);
    return { success: true, message: 'Client supprimé' };
  }

  async toggleClientStatus(id: number) {
    const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.isActive = !client.isActive;
    await this.userRepository.save(client);
    
    return { success: true, isActive: client.isActive };
  }

  async getAdminStats() {
    const totalClients = await this.userRepository.count({ where: { role: 'client' } });
    const activeClients = await this.userRepository.count({ where: { role: 'client', isActive: true } });
    const expiredClients = await this.userRepository.count({ 
      where: { role: 'client', subscriptionEnd: new Date() } 
    });
    
    return { totalClients, activeClients, expiredClients };
  }
}
