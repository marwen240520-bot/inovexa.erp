import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { StockService } from '../stock/stock.service';
import { Purchase } from './entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Supplier } from '../suppliers/supplier.entity';

import { pick, toText, toNumber, toDate, normalizeStatus, ACTIVE_STATUS, isEmptyRow, buildImportResult, errorMessage, ImportErrorDetail } from '../../common/import-utils';
@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectDataSource()
    private dataSource: DataSource,
    private stock: StockService,
  ) {}

  /** Si un nom de fournisseur est saisi et n'existe pas encore, le crée dans le module Fournisseurs. */
  private async ensureSupplierExists(userId: number, supplierName?: string): Promise<Supplier | null> {
    const name = (supplierName || '').trim();
    if (!name) return null;
    const existing = await this.supplierRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('LOWER(s.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) return existing;
    const supplier = this.supplierRepository.create({ userId, name, email: '' });
    return this.supplierRepository.save(supplier);
  }

  async findAll(userId: number, period?: string) {
    let where: any = { userId };

    if (period === 'week') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'month') {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      where.createdAt = Between(startDate, new Date());
    }

    return this.purchaseRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId }, relations: ['product'] });
    if (!purchase) throw new NotFoundException('Achat non trouve');
    return purchase;
  }

  async create(userId: number, data: any) {
    if (!data.productId) {
      throw new BadRequestException('Le produit est requis');
    }

    // Auto-création du fournisseur si le nom saisi n'existe pas dans le module Fournisseurs
    const supplier = await this.ensureSupplierExists(userId, data.supplierName);

    return this.dataSource.transaction(async (em) => {
      const product = await em.findOne(Product, { where: { id: data.productId, userId } });
      if (!product) {
        throw new NotFoundException('Produit non trouve');
      }

      const { documentId: _ignored, ...input } = data || {};
      const purchase = em.create(Purchase, {
        ...input,
        supplierName: supplier ? supplier.name : (data.supplierName || null),
        userId,
        productName: product.name,
        total: (data.unitPrice || 0) * (data.quantity || 1),
      } as any) as unknown as Purchase;
      const savedPurchase = await em.save(Purchase, purchase);

      // ✅ Entrée en stock tracée dans le journal ; le prix d'achat alimente le coût moyen pondéré (CMUP).
      await this.stock.move(em, {
        userId, productId: product.id, quantity: Number(data.quantity || 0), reason: 'purchase', refType: 'purchase', refId: savedPurchase.id,
        unitCost: Number(data.unitPrice || 0), note: `Achat #${savedPurchase.id}${savedPurchase.supplierName ? ' — ' + savedPurchase.supplierName : ''}`,
      });
      const fresh = await em.findOne(Product, { where: { id: product.id } });

      return {
        ...savedPurchase,
        newStock: fresh ? fresh.quantity : product.quantity,
      };
    });
  }

  async updateStatus(id: number, userId: number, status: string) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
    if (!purchase) throw new NotFoundException('Achat non trouve');
    purchase.status = status;
    return this.purchaseRepository.save(purchase);
  }

  async delete(id: number, userId: number) {
    const purchase = await this.findOne(id, userId);
    if (purchase.documentId) {
      throw new BadRequestException('Cette ligne vient d’un bon de réception validé : corrigez-la par un avoir fournisseur, pas en la supprimant.');
    }

    await this.dataSource.transaction(async (em) => {
      // ✅ Rétablir le stock si l'achat est supprimé (sans jamais passer sous zéro)
      const product = await em.findOne(Product, { where: { id: purchase.productId, userId } });
      if (product) {
        const take = Math.min(Number(purchase.quantity || 0), Math.max(0, Number(product.quantity || 0)));
        if (take > 0) {
          await this.stock.move(em, {
            userId, productId: product.id, quantity: -take, reason: 'purchase_cancel', refType: 'purchase', refId: purchase.id,
            note: `Annulation de l'achat #${purchase.id}`,
          });
        }
      }
      await em.delete(Purchase, id);
    });
    return { success: true, message: 'Achat supprimé, stock rétabli' };
  }

  async importPurchases(userId: number, rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Aucun achat à importer');
    const details: ImportErrorDetail[] = [];
    let success = 0;
    let processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isEmptyRow(row)) continue;
      processed++;
      try {
        const quantity = toNumber(pick(row, ['quantity', 'quantite', 'qty', 'qte']), 1);
        if (quantity <= 0) throw new Error('Quantité invalide (doit être supérieure à 0)');

        const productId = toNumber(pick(row, ['productId', 'product id', 'id produit', 'produit id']), 0);
        const sku = toText(pick(row, ['sku', 'reference', 'ref', 'code']));
        const productName = toText(pick(row, ['productName', 'product name', 'product', 'produit', 'nom produit', 'article', 'designation', 'libelle']));
        let product: Product | null = null;
        if (productId) product = await this.productRepository.findOne({ where: { id: productId, userId } });
        if (!product && sku) product = await this.productRepository.findOne({ where: { sku, userId } });
        if (!product && productName) {
          product = await this.productRepository
            .createQueryBuilder('p')
            .where('p.userId = :userId', { userId })
            .andWhere('LOWER(p.name) = LOWER(:name)', { name: productName })
            .getOne();
        }
        if (!product) {
          throw new Error(`Produit introuvable (${productName || sku || productId || 'non renseigné'}). Importez ou créez d'abord vos produits.`);
        }

        // Prix unitaire, ou déduit du total, ou à défaut le prix du produit
        const total = toNumber(pick(row, ['total', 'montant', 'montant total', 'amount']), NaN);
        const unitPrice = toNumber(
          pick(row, ['unitPrice', 'unit price', 'prix unitaire', "prix d'achat", 'pu', 'prix', 'price']),
          Number.isFinite(total) ? total / quantity : Number(product.price) || 0,
        );
        const supplierName = toText(pick(row, ['supplierName', 'supplier name', 'supplier', 'fournisseur', 'nom fournisseur']));
        const supplier = await this.ensureSupplierExists(userId, supplierName || undefined);
        const date = toDate(pick(row, ['createdAt', 'date', 'date achat', 'purchase date']));

        const purchase = this.purchaseRepository.create({
          userId,
          productId: product.id,
          productName: product.name,
          supplierName: supplier ? supplier.name : supplierName || undefined,
          quantity,
          unitPrice,
          total: Math.round(unitPrice * quantity * 100) / 100,
          status: normalizeStatus(
            pick(row, ['status', 'statut', 'etat']),
            { received: ['recu', 'reçu', 'recue', 'reçue', 'livre', 'livré', 'received', 'delivered', 'paid', 'payee'], ordered: ['commande', 'commandé', 'ordered'], pending: ['en attente', 'pending'], cancelled: ['annule', 'annulé', 'cancelled', 'canceled'] },
            'pending',
          ),
          ...(date ? { createdAt: date } : {}),
        });
        // Même règle que la création manuelle : un achat augmente le stock (tracé dans le journal)
        await this.dataSource.transaction(async (em) => {
          const saved = await em.save(Purchase, purchase);
          await this.stock.move(em, { userId, productId: product!.id, quantity, reason: 'purchase', refType: 'purchase', refId: saved.id, unitCost: unitPrice, note: 'Import d\'achats' });
        });
        success++;
      } catch (e) {
        details.push({ row: i + 2, error: errorMessage(e) });
      }
    }
    return buildImportResult('achat(s)', processed, success, details);
  }

}
