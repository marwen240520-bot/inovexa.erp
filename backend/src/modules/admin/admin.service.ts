import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllClients() {
    return this.userRepository.find({
      where: { role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
    });
  }

  async getClientById(id: number) {
    const client = await this.userRepository.findOne({
      where: { id, role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async getClientModules(id: number) {
    const client = await this.userRepository.findOne({
      where: { id, role: 'client' },
      select: ['id', 'modules']
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client.modules || {};
  }

  async updateClientModules(id: number, modules: Record<string, boolean>) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.modules = modules;
    await this.userRepository.save(client);
    
    return { 
      success: true, 
      message: 'Modules mis à jour avec succès',
      modules: client.modules
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
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + body.subscriptionDuration);
    
    const client = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone,
      role: 'client',
      subscriptionStart: new Date(),
      subscriptionEnd,
      isActive: true,
      modules: {}
    });
    
    await this.userRepository.save(client);
    
    return {
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        companyName: client.companyName,
        subscriptionEnd: client.subscriptionEnd,
        modules: client.modules
      }
    };
  }

  async updateClient(id: number, body: any) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    delete body.modules;
    delete body.businessCategory;
    
    Object.assign(client, body);
    await this.userRepository.save(client);
    
    return { success: true, message: 'Client mis à jour' };
  }

  async extendSubscription(id: number, days: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    const newEnd = new Date(client.subscriptionEnd);
    newEnd.setDate(newEnd.getDate() + days);
    client.subscriptionEnd = newEnd;
    await this.userRepository.save(client);
    
    return { 
      success: true, 
      message: `Abonnement prolongé de ${days} jours`,
      newEnd: newEnd 
    };
  }

  async deleteClient(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    await this.userRepository.delete(id);
    return { success: true, message: 'Client supprimé' };
  }

  async toggleClientStatus(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.isActive = !client.isActive;
    await this.userRepository.save(client);
    
    return { success: true, isActive: client.isActive };
  }

  async getAdminStats() {
    const totalClients = await this.userRepository.count({ where: { role: 'client' } });
    const activeClients = await this.userRepository.count({ where: { role: 'client', isActive: true } });
    
    return { totalClients, activeClients };
  }
}