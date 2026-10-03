import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Product } from '../products/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { normalizePaymentMethod, toNumber } from '../../common/import-utils';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface PosLine { productId: number; quantity: number; unitPrice?: number }

/**
 * Caisse rapide : vendre ou acheter plusieurs produits en une seule opération.
 *
 * Mêmes règles que les modules Ventes / Achats (la vente retire du stock et refuse un stock insuffisant,
 * l'achat ajoute du stock, le client / fournisseur saisi est créé s'il n'existe pas), mais :
 *  - tout est enregistré dans UNE transaction : si une ligne échoue, rien n'est enregistré ;
 *  - les produits sont verrouillés pendant l'opération (pas de vente simultanée du même dernier article).
 */
@Injectable()
export class PosService {
  constructor(private readonly dataSource: DataSource) {}

  async checkout(userId: number, body: any) {
    const mode: 'sale' | 'purchase' | null = body?.mode === 'sale' ? 'sale' : body?.mode === 'purchase' ? 'purchase' : null;
    if (!mode) throw new BadRequestException("Mode invalide : « sale » (vente) ou « purchase » (achat)");

    const rawLines: any[] = Array.isArray(body?.lines) ? body.lines : [];
    if (rawLines.length === 0) throw new BadRequestException('Le panier est vide');
    if (rawLines.length > 100) throw new BadRequestException('Trop de lignes (100 maximum)');

    // Fusionne les lignes d'un même produit
    const merged = new Map<number, PosLine>();
    for (const l of rawLines) {
      const productId = Number(l?.productId);
      const quantity = Number(l?.quantity);
      if (!Number.isInteger(productId) || productId <= 0) throw new BadRequestException('Produit invalide');
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
        throw new BadRequestException('Quantité invalide (nombre entier entre 1 et 100 000)');
      }
      let unitPrice: number | undefined;
      if (l?.unitPrice !== undefined && l?.unitPrice !== null && l?.unitPrice !== '') {
        unitPrice = toNumber(l.unitPrice, NaN);
        if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 99_999_999) throw new BadRequestException('Prix unitaire invalide');
      }
      const prev = merged.get(productId);
      if (prev) { prev.quantity += quantity; if (unitPrice !== undefined) prev.unitPrice = unitPrice; }
      else merged.set(productId, { productId, quantity, unitPrice });
    }

    const counterpart = (typeof body?.counterpart === 'string' ? body.counterpart.trim() : '').slice(0, 120) || null;
    const paymentMethod = normalizePaymentMethod(body?.paymentMethod);

    return this.dataSource.transaction(async (manager) => {
      const ids = Array.from(merged.keys());
      const products = await manager.find(Product, { where: { id: In(ids), userId }, lock: { mode: 'pessimistic_write' } });
      if (products.length !== ids.length) throw new NotFoundException('Un des produits est introuvable');
      const byId = new Map(products.map((p) => [p.id, p]));

      // Vente : on vérifie TOUT le stock avant d'enregistrer quoi que ce soit
      if (mode === 'sale') {
        const short = ids
          .map((id) => ({ p: byId.get(id)!, qty: merged.get(id)!.quantity }))
          .filter(({ p, qty }) => (p.quantity || 0) < qty)
          .map(({ p, qty }) => `${p.name} (disponible : ${p.quantity || 0}, demandé : ${qty})`);
        if (short.length) throw new BadRequestException(`Stock insuffisant : ${short.join(' ; ')}`);
      }

      // Client / fournisseur saisi : créé s'il n'existe pas (comme dans les modules Ventes / Achats)
      let counterpartName = counterpart;
      if (counterpart) {
        if (mode === 'sale') {
          const existing = await manager.createQueryBuilder(Client, 'c').where('c.userId = :userId', { userId }).andWhere('LOWER(c.name) = LOWER(:name)', { name: counterpart }).getOne();
          if (existing) counterpartName = existing.name;
          else await manager.save(Client, manager.create(Client, { userId, name: counterpart, email: '' }));
        } else {
          const existing = await manager.createQueryBuilder(Supplier, 's').where('s.userId = :userId', { userId }).andWhere('LOWER(s.name) = LOWER(:name)', { name: counterpart }).getOne();
          if (existing) counterpartName = existing.name;
          else await manager.save(Supplier, manager.create(Supplier, { userId, name: counterpart, email: '' } as any));
        }
      }

      const lines: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; total: number; newStock: number }> = [];
      for (const id of ids) {
        const product = byId.get(id)!;
        const { quantity, unitPrice: given } = merged.get(id)!;
        const unitPrice = round2(given !== undefined ? given : Number(product.price) || 0);
        const total = round2(unitPrice * quantity);

        if (mode === 'sale') {
          await manager.save(Sale, manager.create(Sale, {
            userId, productId: product.id, productName: product.name, clientName: counterpartName || 'Client comptoir',
            quantity, unitPrice, total, status: 'completed', paymentMethod,
          } as any));
          product.quantity = (product.quantity || 0) - quantity;
        } else {
          await manager.save(Purchase, manager.create(Purchase, {
            userId, productId: product.id, productName: product.name, supplierName: counterpartName || undefined,
            quantity, unitPrice, total, status: 'received', paymentMethod,
          } as any));
          product.quantity = (product.quantity || 0) + quantity;
        }
        await manager.save(Product, product);
        lines.push({ productId: product.id, productName: product.name, quantity, unitPrice, total, newStock: product.quantity });
      }

      const now = new Date();
      const day = now.toISOString().slice(0, 10).replace(/-/g, '');
      return {
        success: true,
        mode,
        ticketNumber: `${mode === 'sale' ? 'V' : 'A'}-${day}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        counterpart: counterpartName || (mode === 'sale' ? 'Client comptoir' : null),
        paymentMethod,
        itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
        total: round2(lines.reduce((s, l) => s + l.total, 0)),
        lines,
        createdAt: now.toISOString(),
      };
    });
  }

  /** Totaux du jour (ventes et achats enregistrés depuis minuit, heure du serveur) */
  async today(userId: number) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const q = async (table: string) => {
      const r = await this.dataSource.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(total), 0)::float AS t FROM "${table}" WHERE "userId" = $1 AND "createdAt" >= $2`, [userId, start]);
      return { count: r[0].n as number, total: round2(r[0].t as number) };
    };
    const [sales, purchases] = await Promise.all([q('sales'), q('purchases')]);
    return { sales, purchases };
  }
}
