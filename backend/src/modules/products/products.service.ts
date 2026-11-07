// products.service.ts
import { VAT_RATES } from '../../common/fiscal';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { StockService } from '../stock/stock.service';

import { toNumber } from '../../common/import-utils';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectDataSource()
    private dataSource: DataSource,
    private stock: StockService,
  ) {}

  /** Crée le produit ; son stock de départ entre dans le journal des mouvements (type « opening »). */
  private async createWithOpeningStock(userId: number, productData: any, costPrice?: number) {
    const openingQty = this.parseNumber(productData.quantity);
    return this.dataSource.transaction(async (em) => {
      const saved = await em.save(Product, em.create(Product, { ...productData, quantity: 0, avgCost: 0 }) as unknown as Product);
      if (openingQty > 0) {
        await this.stock.move(em, {
          userId, productId: saved.id, quantity: openingQty, reason: 'opening', type: 'opening',
          unitCost: costPrice !== undefined && Number.isFinite(costPrice) ? costPrice : undefined, note: 'Stock initial',
        });
      }
      return (await em.findOne(Product, { where: { id: saved.id } })) as Product;
    });
  }

  async findAll(userId: number) {
    return this.productRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepository.findOne({
      where: { id, userId },
    });
    if (!product) throw new NotFoundException('Produit non trouvé');
    return product;
  }

  async create(userId: number, data: any) {
    const productData = {
      name: data.name,
      sku: data.sku || '',
      price: this.parseNumber(data.price),
      quantity: this.parseNumber(data.quantity),
      categoryId: this.parseCategoryId(data.categoryId),
      imageUrl: this.cleanImage(data.imageUrl),
      ...this.erpFields(data),
      userId: userId,
    };
    return this.createWithOpeningStock(userId, productData, this.optionalCost(data));
  }

  /** Champs ERP d'un produit (TVA, unité, seuil d'alerte, code-barres, service/stockable, lots), validés. */
  private erpFields(data: any): Record<string, any> {
    const out: Record<string, any> = {};
    if (!data || typeof data !== 'object') return out;
    if (data.vatRate !== undefined && data.vatRate !== null && data.vatRate !== '') {
      const v = Number(data.vatRate);
      if (!(VAT_RATES as readonly number[]).includes(v)) throw new BadRequestException(`Taux de TVA invalide (${VAT_RATES.join(', ')} %).`);
      out.vatRate = v;
    }
    if (data.minStock !== undefined && data.minStock !== null && data.minStock !== '') {
      const m = Number(data.minStock);
      if (!Number.isFinite(m) || m < 0) throw new BadRequestException('Seuil d’alerte invalide.');
      out.minStock = m;
    }
    if (data.unit !== undefined) out.unit = String(data.unit || 'pce').slice(0, 20);
    if (data.barcode !== undefined) out.barcode = data.barcode ? String(data.barcode).slice(0, 60) : null;
    if (data.isStockable !== undefined) out.isStockable = data.isStockable === true || data.isStockable === 'true';
    if (data.trackLots !== undefined) out.trackLots = data.trackLots === true || data.trackLots === 'true';
    return out;
  }

  async importProducts(userId: number, products: any[]) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException('Aucun produit à importer');
    }

    // Log de debug : afficher la première ligne reçue
    console.log('[ProductsService] Premier produit reçu:', JSON.stringify(products[0]));

    let success = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (let i = 0; i < products.length; i++) {
      const data = products[i];

      try {
        if (!data || typeof data !== 'object') {
          throw new Error('Ligne invalide');
        }

        // Chercher le nom même si la casse est différente
        const name = this.findField(data, ['name', 'Name', 'NAME', 'nom', 'Nom', 'NOM', 'libelle', 'libellé']);
        if (!name || String(name).trim() === '') {
          throw new Error(
            `Nom du produit manquant (clés reçues: ${Object.keys(data).join(', ')})`
          );
        }

        const sku = this.findField(data, ['sku', 'SKU', 'Sku', 'reference', 'référence', 'ref']);
        const price = this.findField(data, ['price', 'Price', 'PRICE', 'prix', 'Prix', 'PRIX']);
        const quantity = this.findField(data, ['quantity', 'Quantity', 'QUANTITY', 'quantite', 'quantité', 'stock', 'qty']);
        const categoryId = this.findField(data, ['categoryId', 'category_id', 'categorieId', 'categorie_id']);
        const image = this.findField(data, ['imageUrl', 'image_url', 'image', 'photo', 'picture', 'url image', 'lien image', 'image url']);

        const productData = {
          name: String(name).trim(),
          sku: sku ? String(sku).trim() : '',
          price: this.parseNumber(price),
          quantity: this.parseNumber(quantity),
          categoryId: this.parseCategoryId(categoryId),
          imageUrl: this.cleanImage(image),
          userId: userId,
        };

        await this.createWithOpeningStock(userId, productData, this.optionalCost(data));
        success++;
      } catch (error) {
        errors++;
        errorDetails.push({
          row: i + 2,
          name: data?.name || data?.Name || data?.nom || '',
          sku: data?.sku || data?.SKU || '',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return {
      success,
      errors,
      total: products.length,
      errorDetails: errorDetails.slice(0, 10),
      message: `${success} produit(s) importé(s), ${errors} erreur(s)`,
    };
  }

  async update(id: number, userId: number, data: any) {
    const product = await this.findOne(id, userId);
    // On n'autorise pas la modification de l'identité / du propriétaire ni du stock (calculé par achats et ventes)
    // Le coût moyen (avgCost) est calculé par le module Stock : il ne se modifie pas ici.
    const { quantity, avgCost: _avg, id: _id, userId: _userId, user: _user, category: _category, createdAt: _c, updatedAt: _u, vatRate: _v, minStock: _m, unit: _un, barcode: _b, isStockable: _s, trackLots: _t, ...updateData } = data || {};
    if ('imageUrl' in updateData) updateData.imageUrl = this.cleanImage(updateData.imageUrl);
    Object.assign(product, updateData, this.erpFields(data));
    return this.productRepository.save(product);
  }

  async delete(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.productRepository.delete(id);
    return { success: true };
  }

  // ==================== Helpers privés ====================

  /**
   * Cherche un champ dans l'objet en essayant plusieurs noms possibles
   * (insensible à la casse en plus).
   */
  private findField(data: any, candidates: string[]): any {
    if (!data || typeof data !== 'object') return undefined;

    // 1) Correspondance exacte
    for (const c of candidates) {
      if (data[c] !== undefined) return data[c];
    }

    // 2) Correspondance insensible à la casse
    const lowerCandidates = candidates.map(c => c.toLowerCase());
    for (const key of Object.keys(data)) {
      if (lowerCandidates.includes(key.toLowerCase())) {
        return data[key];
      }
    }

    return undefined;
  }

  /** Taille maximale d'une photo stockée (en caractères) : ~1,4 Mo en base64 */
  private static readonly MAX_IMAGE_LENGTH = 1_900_000;

  /**
   * Accepte uniquement une image encodée (data:image/png|jpeg|webp|gif;base64,…) ou un lien http(s).
   * Tout le reste (javascript:, data:text/html, fichier, trop volumineux…) est refusé.
   * Valeur vide -> null (suppression de la photo).
   */
  private cleanImage(value: any): string | null {
    if (value === null || value === undefined) return null;
    const v = String(value).trim();
    if (v === '' || v === 'null' || v === 'undefined') return null;
    if (v.length > ProductsService.MAX_IMAGE_LENGTH) {
      throw new BadRequestException('Image trop volumineuse (réduisez-la avant l\'envoi)');
    }
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(v)) return v;
    if (/^https?:\/\/[^\s<>"']+$/i.test(v)) return v;
    throw new BadRequestException('Format d\'image non pris en charge (utilisez PNG, JPEG, WebP ou GIF)');
  }

  /** Prix d'achat facultatif fourni à la création (« costPrice » / « prix d'achat ») : coût initial du stock. */
  private optionalCost(data: any): number | undefined {
    const raw = this.findField(data, ['costPrice', 'cost_price', 'cost', "prix d'achat", 'prix achat', 'prix_achat', 'cout', 'coût']);
    if (raw === undefined || raw === null || raw === '') return undefined;
    const n = toNumber(raw, NaN);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  private parseNumber(value: any): number {
    // Tolère « 1 200,50 € », « 12,5 », « 1.200,50 »...
    return toNumber(value, 0);
  }

  private parseCategoryId(value: any): number | null {
    if (
      value === null || value === undefined || value === '' ||
      value === 'null' || value === 'undefined'
    ) {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
}