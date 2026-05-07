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

  async create(userId: number, data: any) {
    const client = this.clientRepository.create({
      ...data,
      userId,
      totalSpent: data.totalSpent || 0,
      status: data.status || 'active'
    });
    return this.clientRepository.save(client);
  }

  // ⭐ METHODE D'IMPORT MULTIPLE
  async importClients(userId: number, clientsData: any[]) {
    let success = 0;
    let errors = 0;
    const errorDetails = [];

    for (const clientData of clientsData) {
      try {
        // Nettoyer et valider les données
        const client = this.clientRepository.create({
          userId: userId,
          name: clientData.name || clientData.clientName || "Client inconnu",
          email: clientData.email,
          phone: clientData.phone || "",
          address: clientData.address || "",
          totalSpent: parseFloat(clientData.totalSpent) || 0,
          status: clientData.status || "active"
        });
        
        await this.clientRepository.save(client);
        success++;
      } catch (error) {
        errors++;
        errorDetails.push({
          data: clientData,
          error: error.message
        });
        console.error('Erreur import client:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: clientsData.length, errorDetails };
  }

  async update(id: number, userId: number, data: any) {
    const client = await this.findOne(id, userId);
    Object.assign(client, {
      ...data,
      totalSpent: data.totalSpent !== undefined ? data.totalSpent : client.totalSpent,
      status: data.status || client.status
    });
    return this.clientRepository.save(client);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const client = await this.findOne(id, userId);
    client.status = status;
    return this.clientRepository.save(client);
  }

  async delete(id: number, userId: number) {
    const client = await this.findOne(id, userId);
    await this.clientRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const clients = await this.findAll(userId);
    const totalSpent = clients.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      totalSpent: totalSpent
    };
  }
}