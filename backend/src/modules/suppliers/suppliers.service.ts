import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

import { pick, toText, toNumber, toDate, normalizeStatus, ACTIVE_STATUS, isEmptyRow, buildImportResult, errorMessage, ImportErrorDetail } from '../../common/import-utils';
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  /** Somme des achats par fournisseur (clé = nom en minuscules). */
  private async getPurchaseTotalsBySupplierName(userId: number): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    try {
      const rows: Array<{ name: string; total: string }> =
        await this.supplierRepository.manager.query(
          `SELECT LOWER("supplierName") AS name, COALESCE(SUM(total), 0) AS total
           FROM purchases
           WHERE "userId" = $1 AND "supplierName" IS NOT NULL AND status != 'cancelled'
           GROUP BY LOWER("supplierName")`,
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
    const suppliers = await this.supplierRepository.find({ where: { userId } });
    // Total achats dynamique : calculé en temps réel depuis la page Achats
    const totals = await this.getPurchaseTotalsBySupplierName(userId);
    return suppliers.map(s => ({
      ...s,
      totalPurchases: totals.get((s.name || '').toLowerCase()) ?? 0,
    }));
  }

  async findOne(id: number, userId: number) {
    const supplier = await this.supplierRepository.findOne({ where: { id, userId } });
    if (!supplier) throw new NotFoundException('Fournisseur non trouvé');
    return supplier;
  }

  async create(userId: number, data: Partial<Supplier>) {
    const supplier = this.supplierRepository.create({ ...data, userId });
    return this.supplierRepository.save(supplier);
  }

  async update(id: number, userId: number, data: Partial<Supplier>) {
    const supplier = await this.findOne(id, userId);
    Object.assign(supplier, data);
    return this.supplierRepository.save(supplier);
  }

  async delete(id: number, userId: number) {
    const supplier = await this.findOne(id, userId);
    await this.supplierRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const suppliers = await this.findAll(userId);
    const active = suppliers.filter(s => s.status === 'active').length;
    const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
    
    return { total: suppliers.length, active, totalPurchases };
  }

  async importSuppliers(userId: number, rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Aucun fournisseur à importer');
    const details: ImportErrorDetail[] = [];
    let success = 0;
    let processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isEmptyRow(row)) continue;
      processed++;
      try {
        const name = toText(pick(row, ['name', 'nom', 'fournisseur', 'nom fournisseur', 'raison sociale', 'societe', 'entreprise', 'company', 'supplier']));
        if (!name) throw new Error(`Nom du fournisseur manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);
        const entity = this.supplierRepository.create({
          userId,
          name,
          contact: toText(pick(row, ['contact', 'personne contact', 'interlocuteur', 'responsable'])) || undefined,
          email: toText(pick(row, ['email', 'e-mail', 'mail', 'courriel', 'adresse email'])) || '',
          phone: toText(pick(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm', 'portable'])) || undefined,
          address: toText(pick(row, ['address', 'adresse', 'ville'])) || undefined,
          totalPurchases: toNumber(pick(row, ['totalPurchases', 'total purchases', 'total achats', 'total'])),
          status: normalizeStatus(pick(row, ['status', 'statut', 'etat']), ACTIVE_STATUS, 'active'),
        });
        await this.supplierRepository.save(entity);
        success++;
      } catch (e) {
        details.push({ row: i + 2, error: errorMessage(e) });
      }
    }
    return buildImportResult('fournisseur(s)', processed, success, details);
  }

}
