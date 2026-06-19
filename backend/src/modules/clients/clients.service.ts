import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async findAll(userId: number) {
    return this.clientRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const client = await this.clientRepository.findOne({ where: { id, userId } });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async create(userId: number, data: Partial<Client>) {
    const client = this.clientRepository.create({ ...data, userId });
    return this.clientRepository.save(client);
  }

  async update(id: number, userId: number, data: Partial<Client>) {
    const client = await this.findOne(id, userId);
    Object.assign(client, data);
    return this.clientRepository.save(client);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const client = await this.findOne(id, userId);
    client.status = status;
    return this.clientRepository.save(client);
  }

  async importClients(userId: number, clients: any[]) {
    let success = 0;
    let errors = 0;
    
    for (const client of clients) {
      try {
        const newClient = this.clientRepository.create({ ...client, userId });
        await this.clientRepository.save(newClient);
        success++;
      } catch(e) {
        errors++;
      }
    }
    
    return { success, errors, total: clients.length };
  }

  async delete(id: number, userId: number) {
    const client = await this.findOne(id, userId);
    await this.clientRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const clients = await this.findAll(userId);
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;
    const totalSpent = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    
    return { total, active, inactive, totalSpent };
  }
}
