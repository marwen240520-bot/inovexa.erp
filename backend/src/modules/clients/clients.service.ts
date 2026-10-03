import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

import { pick, toText, toNumber, toDate, normalizeStatus, ACTIVE_STATUS, isEmptyRow, buildImportResult, errorMessage, ImportErrorDetail } from '../../common/import-utils';
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

  async importClients(userId: number, rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Aucun client à importer');
    const details: ImportErrorDetail[] = [];
    let success = 0;
    let processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isEmptyRow(row)) continue;
      processed++;
      try {
        const name = toText(pick(row, ['name', 'nom', 'client', 'nom client', 'raison sociale', 'societe', 'entreprise', 'company', 'full name']));
        if (!name) throw new Error(`Nom du client manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);
        const entity = this.clientRepository.create({
          userId,
          name,
          email: toText(pick(row, ['email', 'e-mail', 'mail', 'courriel', 'adresse email'])) || '',
          phone: toText(pick(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm', 'portable'])) || undefined,
          address: toText(pick(row, ['address', 'adresse', 'ville'])) || undefined,
          totalSpent: toNumber(pick(row, ['totalSpent', 'total spent', 'total depense', 'montant total', 'total'])),
          status: normalizeStatus(pick(row, ['status', 'statut', 'etat']), ACTIVE_STATUS, 'active'),
        });
        await this.clientRepository.save(entity);
        success++;
      } catch (e) {
        details.push({ row: i + 2, error: errorMessage(e) });
      }
    }
    return buildImportResult('client(s)', processed, success, details);
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
