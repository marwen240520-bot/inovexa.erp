import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

    const product = await this.productRepository.findOne({ where: { id: data.productId } });
    if (!product) {
      throw new NotFoundException('Produit non trouve');
    }

    // Auto-création du fournisseur si le nom saisi n'existe pas dans le module Fournisseurs
    const supplier = await this.ensureSupplierExists(userId, data.supplierName);

    const purchase = this.purchaseRepository.create({
      ...data,
      supplierName: supplier ? supplier.name : (data.supplierName || null),
      userId,
      productName: product.name,
      total: (data.unitPrice || 0) * (data.quantity || 1)
    });
    const savedPurchase = await this.purchaseRepository.save(purchase);

    // ✅ Mettre à jour le stock du produit après un achat
    product.quantity = (product.quantity || 0) + (data.quantity || 0);
    await this.productRepository.save(product);

    return {
      ...savedPurchase,
      newStock: product.quantity
    };
  }

  async updateStatus(id: number, userId: number, status: string) {
    const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
    if (!purchase) throw new NotFoundException('Achat non trouve');
    purchase.status = status;
    return this.purchaseRepository.save(purchase);
  }

  async delete(id: number, userId: number) {
    const purchase = await this.findOne(id, userId);

    // ✅ Rétablir le stock si l'achat est supprimé
    const product = await this.productRepository.findOne({ where: { id: purchase.productId } });
    if (product) {
      product.quantity = Math.max(0, (product.quantity || 0) - (purchase.quantity || 0));
      await this.productRepository.save(product);
    }

    await this.purchaseRepository.delete(id);
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
        await this.purchaseRepository.save(purchase);

        // Même règle que la création manuelle : un achat augmente le stock
        product.quantity = (product.quantity || 0) + quantity;
        await this.productRepository.save(product);
        success++;
      } catch (e) {
        details.push({ row: i + 2, error: errorMessage(e) });
      }
    }
    return buildImportResult('achat(s)', processed, success, details);
  }

}
