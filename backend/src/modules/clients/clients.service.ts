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

  /** Somme des ventes par client (clé = nom du client en minuscules). */
  private async getSalesTotalsByClientName(userId: number): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    try {
      const rows: Array<{ name: string; total: string }> =
        await this.clientRepository.manager.query(
          `SELECT LOWER("clientName") AS name, COALESCE(SUM(total), 0) AS total
           FROM sales
           WHERE "userId" = $1 AND "clientName" IS NOT NULL AND status != 'cancelled'
           GROUP BY LOWER("clientName")`,
          [userId],
        );
      for (const row of rows) {
        if (row.name) map.set(row.name, Number(row.total) || 0);
      }
    } catch (e) {
      // En cas d'erreur SQL, on retombe sur les valeurs stockées
    }
    return map;
  }

  async findAll(userId: number) {
    const clients = await this.clientRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    // Total dépensé dynamique : calculé en temps réel depuis la page Ventes
    const totals = await this.getSalesTotalsByClientName(userId);
    return clients.map(c => ({
      ...c,
      totalSpent: totals.get((c.name || '').toLowerCase()) ?? 0,
    }));
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
