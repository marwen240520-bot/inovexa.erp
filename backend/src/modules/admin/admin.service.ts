import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  private sanitizeDate(date: any): string | null {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  }

  async getAllClients() {
    return this.userRepository.find({
      where: { role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt']
    });
  }

  async getClientById(id: number) {
    const client = await this.userRepository.findOne({
      where: { id: id, role: 'client' }
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
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
    
    const now = new Date();
    const subscriptionEnd = new Date();
    const duration = Math.max(1, body.subscriptionDuration || 30);
    subscriptionEnd.setDate(now.getDate() + duration);
    
    const newClient = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone || '',
      role: 'client',
      subscriptionStart: now.toISOString(),
      subscriptionEnd: subscriptionEnd.toISOString(),
      isActive: true
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
        subscriptionEnd: newClient.subscriptionEnd
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
    
    // Gestion de la date de fin d'abonnement
    if (body.subscriptionEnd) {
      const sanitizedDate = this.sanitizeDate(body.subscriptionEnd);
      (client as any).subscriptionEnd = sanitizedDate;
    }
    
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
    
    let currentDate = client.subscriptionEnd ? new Date(client.subscriptionEnd) : new Date();
    const daysToAdd = Math.max(1, days || 30);
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    (client as any).subscriptionEnd = currentDate.toISOString();
    await this.userRepository.save(client);
    
    return { success: true, message: `Abonnement prolongé de ${daysToAdd} jours`, newEnd: client.subscriptionEnd };
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
    
    return { totalClients, activeClients };
  }
}
