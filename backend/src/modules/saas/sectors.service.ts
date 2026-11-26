import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { User } from '../users/entities/user.entity';
import { VAT_RATES } from '../../common/fiscal';
import { Sector, SectorCategory, SectorItem, ServiceOffer } from './entities/sector.entity';
import { MODULE_KEYS } from './account-access';

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const DISCLAIMER = 'Valeurs indicatives données à titre d’exemple : ce ne sont pas des prix de marché. Chaque société fixe ses propres prix.';
const OFFER_CATEGORIES = ['setup', 'training', 'migration', 'support', 'module'];
const OFFER_UNITS = ['one_time', 'per_month', 'per_day', 'per_hour', 'per_user'];

const text = (v: any, max: number, label: string, required = false): string | null => {
  const s = v === null || v === undefined ? '' : String(v).trim();
  if (required && !s) throw new BadRequestException(`${label} : champ obligatoire.`);
  if (s.length > max) throw new BadRequestException(`${label} : ${max} caractères maximum.`);
  return s || null;
};
const money = (v: any, label: string): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) throw new BadRequestException(`${label} : montant invalide.`);
  return round3(n);
};

/** Secteurs d'activité : modules par défaut, catalogue de suggestions, prestations de l'éditeur. */
@Injectable()
export class SectorsService {
  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly products: ProductsService) {}

  // ───────────── Lecture (site public et ERP) ─────────────

  async list(scope: 'public' | 'all') {
    const sectors = await this.ds.getRepository(Sector).find({ where: scope === 'public' ? { isActive: true } : {}, order: { sortOrder: 'ASC', id: 'ASC' } });
    const counts: Array<{ sectorId: number; n: number }> = await this.ds.query(
      `SELECT "sectorId", COUNT(*)::int AS n FROM "sector_items" ${scope === 'public' ? 'WHERE "isActive" = true' : ''} GROUP BY "sectorId"`,
    );
    const by = new Map(counts.map((c) => [c.sectorId, c.n]));
    return sectors.map((s) => ({ ...s, itemCount: by.get(s.id) || 0 }));
  }

  /** Secteur + catégories (arbre) + suggestions + prestations de l'éditeur. */
  async detail(code: string, scope: 'public' | 'all') {
    const sector = await this.ds.getRepository(Sector).findOne({ where: scope === 'public' ? { code, isActive: true } : { code } });
    if (!sector) throw new NotFoundException('Secteur introuvable');
    const active = scope === 'public' ? { isActive: true } : {};
    const categories = await this.ds.getRepository(SectorCategory).find({ where: { sectorId: sector.id, ...active }, order: { sortOrder: 'ASC', id: 'ASC' } });
    const items = await this.ds.getRepository(SectorItem).find({ where: { sectorId: sector.id, ...active }, order: { sortOrder: 'ASC', id: 'ASC' } });
    const offers = await this.offers(scope, sector.code);
    const visible = new Set(categories.map((c) => c.id));
    return {
      sector,
      categories: categories.filter((c) => c.parentId === null || visible.has(c.parentId)),
      items: items.filter((i) => i.categoryId === null || visible.has(i.categoryId)),
      serviceOffers: offers,
      disclaimer: DISCLAIMER,
    };
  }

  /** Prestations de l'éditeur : celles du secteur + celles valables pour toutes les activités. */
  async offers(scope: 'public' | 'all', sectorCode?: string | null) {
    const qb = this.ds.getRepository(ServiceOffer).createQueryBuilder('o');
    if (scope === 'public') qb.where('o.isPublic = true AND o.isActive = true');
    if (sectorCode) qb.andWhere('(o.sectorCode IS NULL OR o.sectorCode = :code)', { code: sectorCode });
    return qb.orderBy('o.sectorCode', 'ASC', 'NULLS FIRST').addOrderBy('o.sortOrder', 'ASC').addOrderBy('o.id', 'ASC').getMany();
  }

  // ───────────── Copie de suggestions dans les produits d'une société ─────────────

  /**
   * Crée dans la société `userId` les produits correspondant aux suggestions choisies (avec leur catégorie).
   * Les suggestions restent dans le catalogue de la plateforme : la société reçoit une COPIE qu'elle modifie librement.
   */
  async importToCompany(userId: number, body: { itemIds?: number[]; overrides?: Record<string, { price?: number }> }) {
    const ids = Array.from(new Set((Array.isArray(body?.itemIds) ? body.itemIds : []).map(Number).filter((n) => Number.isInteger(n) && n > 0)));
    if (!ids.length) throw new BadRequestException('Choisissez au moins une suggestion.');
    if (ids.length > 200) throw new BadRequestException('200 suggestions au maximum par import.');
    const items = await this.ds.getRepository(SectorItem).find({ where: { id: In(ids), isActive: true } });
    if (!items.length) throw new NotFoundException('Suggestions introuvables');
    const sectorCats = await this.ds.getRepository(SectorCategory).find({ where: { id: In(items.map((i) => i.categoryId).filter((x): x is number => !!x)) } });
    const catName = new Map(sectorCats.map((c) => [c.id, c.name]));

    const catRepo = this.ds.getRepository(Category);
    const existingCats = await catRepo.find({ where: { userId } });
    const catByName = new Map(existingCats.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const existingProducts = await this.ds.getRepository(Product).find({ where: { userId }, select: ['id', 'name'] });
    const known = new Set(existingProducts.map((p) => p.name.trim().toLowerCase()));

    const created: Array<{ id: number; name: string }> = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    for (const item of items) {
      const key = item.name.trim().toLowerCase();
      if (known.has(key)) { skipped.push({ name: item.name, reason: 'Un produit porte déjà ce nom.' }); continue; }
      let categoryId: number | null = null;
      const name = item.categoryId ? catName.get(item.categoryId) : null;
      if (name) {
        categoryId = catByName.get(name.trim().toLowerCase()) ?? null;
        if (!categoryId) {
          const cat = await catRepo.save(catRepo.create({ userId, name, description: 'Créée depuis les suggestions de votre secteur' }));
          categoryId = cat.id;
          catByName.set(name.trim().toLowerCase(), cat.id);
        }
      }
      const override = body.overrides?.[String(item.id)]?.price;
      const price = override !== undefined && Number.isFinite(Number(override)) && Number(override) >= 0 ? round3(Number(override)) : item.sellingPrice ?? 0;
      const data: Record<string, any> = {
        name: item.name, sku: `SUG-${item.id}`, price, quantity: 0, categoryId, unit: item.unit,
        isStockable: item.kind !== 'service', trackLots: item.kind !== 'service' && item.trackLots,
      };
      if (item.vatRate !== null && (VAT_RATES as readonly number[]).includes(Number(item.vatRate))) data.vatRate = Number(item.vatRate);
      const product = await this.products.create(userId, data);
      // Coût d'achat indicatif repris comme coût de départ : il sera remplacé par le coût réel à la première entrée en stock.
      if (item.purchasePrice !== null && item.kind !== 'service') {
        await this.ds.getRepository(Product).update({ id: product.id, userId }, { avgCost: item.purchasePrice });
      }
      known.add(key);
      created.push({ id: product.id, name: product.name });
    }
    return { created: created.length, skipped: skipped.length, products: created, details: skipped, disclaimer: DISCLAIMER };
  }

  // ───────────── Administration ─────────────

  private cleanModules(v: any): string[] | null {
    if (v === null) return null;
    if (!Array.isArray(v)) throw new BadRequestException('Modules invalides.');
    const bad = v.filter((m) => !(MODULE_KEYS as readonly string[]).includes(String(m)));
    if (bad.length) throw new BadRequestException(`Module inconnu : ${bad.join(', ')}.`);
    return Array.from(new Set(v.map(String)));
  }

  private sectorPatch(dto: Record<string, any>, partial: boolean): Partial<Sector> {
    const out: Partial<Sector> = {};
    if (!partial || dto.code !== undefined) {
      const code = String(dto.code || '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{1,38}$/.test(code)) throw new BadRequestException('Code invalide : lettres minuscules, chiffres, tirets (2 à 39 caractères).');
      out.code = code;
    }
    if (!partial || dto.name !== undefined) out.name = text(dto.name, 120, 'Nom', true)!;
    if (dto.nameEn !== undefined) out.nameEn = text(dto.nameEn, 120, 'Nom (anglais)');
    if (dto.description !== undefined) out.description = text(dto.description, 500, 'Description');
    if (dto.modules !== undefined) out.modules = this.cleanModules(dto.modules);
    if (dto.recommendations !== undefined) out.recommendations = Array.isArray(dto.recommendations) ? dto.recommendations.map((r: any) => String(r).trim().slice(0, 300)).filter(Boolean).slice(0, 12) : null;
    if (dto.isActive !== undefined) out.isActive = dto.isActive === true;
    if (dto.sortOrder !== undefined) out.sortOrder = Math.trunc(Number(dto.sortOrder)) || 0;
    return out;
  }

  async createSector(dto: Record<string, any>) {
    const repo = this.ds.getRepository(Sector);
    const data = this.sectorPatch(dto, false);
    if (await repo.findOne({ where: { code: data.code } })) throw new ConflictException('Ce code de secteur existe déjà.');
    return repo.save(repo.create(data));
  }

  private async sectorById(id: number) {
    const sector = await this.ds.getRepository(Sector).findOne({ where: { id } });
    if (!sector) throw new NotFoundException('Secteur introuvable');
    return sector;
  }

  async updateSector(id: number, dto: Record<string, any>) {
    const repo = this.ds.getRepository(Sector);
    const sector = await this.sectorById(id);
    const data = this.sectorPatch(dto, true);
    if (data.code && data.code !== sector.code) {
      if (await repo.findOne({ where: { code: data.code } })) throw new ConflictException('Ce code de secteur existe déjà.');
      if (await this.ds.getRepository(User).count({ where: { sector: sector.code } })) throw new ConflictException('Des comptes sont rattachés à ce secteur : son code ne peut plus changer.');
      await this.ds.getRepository(ServiceOffer).update({ sectorCode: sector.code }, { sectorCode: data.code });
    }
    return repo.save({ ...sector, ...data });
  }

  async deleteSector(id: number) {
    const sector = await this.sectorById(id);
    if (await this.ds.getRepository(User).count({ where: { sector: sector.code } })) throw new ConflictException('Des comptes sont rattachés à ce secteur : désactivez-le au lieu de le supprimer.');
    await this.ds.transaction(async (em) => {
      await em.delete(SectorItem, { sectorId: id });
      await em.delete(SectorCategory, { sectorId: id });
      await em.delete(ServiceOffer, { sectorCode: sector.code });
      await em.delete(Sector, { id });
    });
    return { success: true };
  }

  async saveCategory(sectorId: number, id: number | null, dto: Record<string, any>) {
    await this.sectorById(sectorId);
    const repo = this.ds.getRepository(SectorCategory);
    const current = id ? await repo.findOne({ where: { id, sectorId } }) : null;
    if (id && !current) throw new NotFoundException('Catégorie introuvable');
    const out: Partial<SectorCategory> = current ? { ...current } : { sectorId };
    if (!current || dto.name !== undefined) out.name = text(dto.name, 120, 'Nom', true)!;
    if (dto.description !== undefined) out.description = text(dto.description, 300, 'Description');
    if (dto.parentId !== undefined) {
      const parentId = dto.parentId === null || dto.parentId === '' ? null : Number(dto.parentId);
      if (parentId !== null) {
        const parent = await repo.findOne({ where: { id: parentId, sectorId } });
        if (!parent || parent.id === id) throw new BadRequestException('Catégorie parente invalide.');
        if (parent.parentId !== null) throw new BadRequestException('Deux niveaux au maximum : catégorie puis sous-catégorie.');
      }
      out.parentId = parentId;
    }
    if (dto.isActive !== undefined) out.isActive = dto.isActive === true;
    if (dto.sortOrder !== undefined) out.sortOrder = Math.trunc(Number(dto.sortOrder)) || 0;
    return repo.save(repo.create(out));
  }

  async deleteCategory(sectorId: number, id: number) {
    const repo = this.ds.getRepository(SectorCategory);
    const cat = await repo.findOne({ where: { id, sectorId } });
    if (!cat) throw new NotFoundException('Catégorie introuvable');
    const children = await repo.find({ where: { parentId: id, sectorId } });
    const ids = [id, ...children.map((c) => c.id)];
    await this.ds.transaction(async (em) => {
      await em.delete(SectorItem, { sectorId, categoryId: In(ids) });
      await em.delete(SectorCategory, { id: In(ids) });
    });
    return { success: true, deletedCategories: ids.length };
  }

  async saveItem(sectorId: number, id: number | null, dto: Record<string, any>) {
    await this.sectorById(sectorId);
    const repo = this.ds.getRepository(SectorItem);
    const current = id ? await repo.findOne({ where: { id, sectorId } }) : null;
    if (id && !current) throw new NotFoundException('Suggestion introuvable');
    const out: Partial<SectorItem> = current ? { ...current } : { sectorId, kind: 'product', unit: 'pièce' };
    if (!current || dto.name !== undefined) out.name = text(dto.name, 160, 'Nom', true)!;
    if (dto.description !== undefined) out.description = text(dto.description, 400, 'Description');
    if (dto.kind !== undefined) {
      if (!['product', 'service'].includes(dto.kind)) throw new BadRequestException('Type invalide (product ou service).');
      out.kind = dto.kind;
    }
    if (dto.unit !== undefined) out.unit = text(dto.unit, 20, 'Unité') || 'pièce';
    if (dto.categoryId !== undefined) {
      const categoryId = dto.categoryId === null || dto.categoryId === '' ? null : Number(dto.categoryId);
      if (categoryId !== null && !(await this.ds.getRepository(SectorCategory).findOne({ where: { id: categoryId, sectorId } }))) throw new BadRequestException('Catégorie invalide.');
      out.categoryId = categoryId;
    }
    if (dto.purchasePrice !== undefined) out.purchasePrice = money(dto.purchasePrice, 'Coût d’achat');
    if (dto.sellingPrice !== undefined) out.sellingPrice = money(dto.sellingPrice, 'Prix de vente');
    if (dto.marginPct !== undefined) {
      const m = dto.marginPct === null || dto.marginPct === '' ? null : Number(dto.marginPct);
      if (m !== null && (!Number.isFinite(m) || m < -100 || m > 9999)) throw new BadRequestException('Marge invalide.');
      out.marginPct = m;
    }
    // Deux des trois valeurs suffisent : la troisième se déduit (marge = (vente − achat) / achat).
    const cost = out.purchasePrice ?? null, sell = out.sellingPrice ?? null, margin = out.marginPct ?? null;
    if (cost !== null && cost > 0 && dto.sellingPrice === undefined && dto.marginPct !== undefined && margin !== null) out.sellingPrice = round3(cost * (1 + margin / 100));
    else if (cost !== null && cost > 0 && sell !== null) out.marginPct = Math.round(((sell - cost) / cost) * 10000) / 100;
    if (dto.vatRate !== undefined) {
      const v = dto.vatRate === null || dto.vatRate === '' ? null : Number(dto.vatRate);
      if (v !== null && !(VAT_RATES as readonly number[]).includes(v)) throw new BadRequestException(`Taux de TVA invalide (${VAT_RATES.join(', ')} %).`);
      out.vatRate = v;
    }
    if (dto.trackLots !== undefined) out.trackLots = dto.trackLots === true;
    if (dto.basis !== undefined) out.basis = text(dto.basis, 300, 'Base de calcul');
    if (!out.basis) out.basis = 'Valeur indicative saisie par l’administrateur — à adapter.';
    if (dto.isActive !== undefined) out.isActive = dto.isActive === true;
    if (dto.sortOrder !== undefined) out.sortOrder = Math.trunc(Number(dto.sortOrder)) || 0;
    return repo.save(repo.create(out));
  }

  async deleteItem(sectorId: number, id: number) {
    const res = await this.ds.getRepository(SectorItem).delete({ id, sectorId });
    if (!res.affected) throw new NotFoundException('Suggestion introuvable');
    return { success: true };
  }

  async saveOffer(id: number | null, dto: Record<string, any>) {
    const repo = this.ds.getRepository(ServiceOffer);
    const current = id ? await repo.findOne({ where: { id } }) : null;
    if (id && !current) throw new NotFoundException('Prestation introuvable');
    const out: Partial<ServiceOffer> = current ? { ...current } : { category: 'setup', priceUnit: 'one_time' };
    if (!current || dto.name !== undefined) out.name = text(dto.name, 160, 'Nom', true)!;
    if (dto.description !== undefined) out.description = text(dto.description, 400, 'Description');
    if (dto.sectorCode !== undefined) {
      const code = dto.sectorCode ? String(dto.sectorCode) : null;
      if (code && !(await this.ds.getRepository(Sector).findOne({ where: { code } }))) throw new BadRequestException('Secteur inconnu.');
      out.sectorCode = code;
    }
    if (dto.category !== undefined) {
      if (!OFFER_CATEGORIES.includes(dto.category)) throw new BadRequestException('Catégorie de prestation invalide.');
      out.category = dto.category;
    }
    if (dto.priceUnit !== undefined) {
      if (!OFFER_UNITS.includes(dto.priceUnit)) throw new BadRequestException('Unité de prix invalide.');
      out.priceUnit = dto.priceUnit;
    }
    if (dto.price !== undefined) out.price = money(dto.price, 'Prix');
    if (dto.basis !== undefined) out.basis = text(dto.basis, 300, 'Base de calcul');
    for (const key of ['isPublic', 'isActive'] as const) if (dto[key] !== undefined) out[key] = dto[key] === true;
    if (dto.sortOrder !== undefined) out.sortOrder = Math.trunc(Number(dto.sortOrder)) || 0;
    return repo.save(repo.create(out));
  }

  async deleteOffer(id: number) {
    const res = await this.ds.getRepository(ServiceOffer).delete({ id });
    if (!res.affected) throw new NotFoundException('Prestation introuvable');
    return { success: true };
  }
}
