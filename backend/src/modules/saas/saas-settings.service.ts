import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Plan, PlatformSettings } from './entities/saas.entity';
import { Sector, SectorCategory, SectorItem, ServiceOffer } from './entities/sector.entity';
import { MailService } from '../../common/mail/mail.service';
import { DEFAULT_PAYMENT_METHODS, DEFAULT_PLANS, DEFAULT_SECTORS, DEFAULT_SERVICE_OFFERS, DefaultCategory, PAYMENT_METHODS, basisFor } from './saas-defaults';

const CACHE_MS = 30_000;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Réglages de la plateforme (durée d'essai, instructions de paiement, contacts) + création du contenu de départ. */
@Injectable()
export class SaasSettingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Saas');
  private cache: { at: number; value: PlatformSettings } | null = null;

  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly mail: MailService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedDefaults();
    } catch (e: any) {
      // Le serveur doit démarrer même si le contenu de départ n'a pas pu être créé (il sera retenté au prochain démarrage).
      this.logger.warn(`Contenu de départ non créé : ${e?.message || e}`);
    }
  }

  async get(fresh = false): Promise<PlatformSettings> {
    if (!fresh && this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value;
    const repo = this.ds.getRepository(PlatformSettings);
    let row = await repo.findOne({ where: { id: 1 } });
    if (!row) {
      await this.ds.query(`INSERT INTO "platform_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING`);
      row = (await repo.findOne({ where: { id: 1 } }))!;
    }
    this.cache = { at: Date.now(), value: row };
    return row;
  }

  /** Identifiant client Google (public par nature) ; null = connexion Google non configurée. */
  googleClientId(): string | null {
    return (process.env.GOOGLE_CLIENT_ID || '').trim() || null;
  }

  async update(patch: Record<string, any>): Promise<PlatformSettings> {
    const current = await this.get(true);
    const next: Partial<PlatformSettings> = {};
    const int = (key: string, min: number, max: number) => {
      if (patch[key] === undefined) return;
      const v = Number(patch[key]);
      if (!Number.isInteger(v) || v < min || v > max) throw new BadRequestException(`Valeur invalide pour ${key} (${min} à ${max}).`);
      (next as any)[key] = v;
    };
    const text = (key: string, max: number) => {
      if (patch[key] === undefined) return;
      const v = patch[key] === null ? '' : String(patch[key]).trim();
      if (v.length > max) throw new BadRequestException(`Texte trop long pour ${key} (${max} caractères maximum).`);
      (next as any)[key] = v || null;
    };
    int('trialHours', 1, 24 * 90);
    int('trialReminderHours', 1, 24 * 30);
    int('renewalReminderDays', 1, 60);
    text('paymentInstructions', 4000);
    text('supportEmail', 160);
    text('supportPhone', 40);
    text('supportWhatsapp', 40);
    if (next.supportEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next.supportEmail)) throw new BadRequestException('Email de support invalide.');
    if (patch.requireEmailVerification !== undefined) next.requireEmailVerification = patch.requireEmailVerification === true;
    // Sans serveur d'envoi, personne ne recevrait le lien de confirmation : tous les nouveaux comptes resteraient bloqués.
    if (next.requireEmailVerification && !this.mail.isConfigured()) throw new BadRequestException('Configurez d’abord l’envoi d’emails (variables SMTP) avant d’exiger la confirmation de l’adresse.');
    if (patch.currency !== undefined) {
      if (!/^[A-Z]{3}$/.test(String(patch.currency))) throw new BadRequestException('Devise invalide (code ISO à 3 lettres).');
      next.currency = String(patch.currency);
    }
    if (patch.vatRate !== undefined) {
      const v = Number(patch.vatRate);
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new BadRequestException('Taux de TVA invalide.');
      next.vatRate = v;
    }
    if (patch.paymentMethods !== undefined) {
      const list = Array.isArray(patch.paymentMethods) ? patch.paymentMethods.map(String) : [];
      const bad = list.filter((m) => !(PAYMENT_METHODS as readonly string[]).includes(m));
      if (bad.length) throw new BadRequestException(`Moyen de paiement inconnu : ${bad.join(', ')}.`);
      next.paymentMethods = Array.from(new Set(list));
    }
    await this.ds.getRepository(PlatformSettings).update({ id: current.id }, next);
    this.cache = null;
    return this.get(true);
  }

  /** Crée une seule fois les formules, secteurs, suggestions et prestations de départ (voir saas-defaults.ts). */
  async seedDefaults(): Promise<{ seeded: boolean }> {
    await this.get(true);
    return this.ds.transaction(async (em) => {
      // Verrou sur la ligne des réglages : deux instances qui démarrent ensemble ne créent pas le contenu en double.
      const [row] = await em.query(`SELECT "defaultsSeeded" FROM "platform_settings" WHERE "id" = 1 FOR UPDATE`);
      if (!row || row.defaultsSeeded) return { seeded: false };

      for (const p of DEFAULT_PLANS) {
        if (await em.findOne(Plan, { where: { code: p.code } })) continue;
        await em.save(Plan, em.create(Plan, { ...p, isPublic: false, isActive: true } as any));
      }
      for (let i = 0; i < DEFAULT_SECTORS.length; i++) {
        const s = DEFAULT_SECTORS[i];
        if (await em.findOne(Sector, { where: { code: s.code } })) continue;
        const sector = await em.save(Sector, em.create(Sector, {
          code: s.code, name: s.name, nameEn: s.nameEn, nameAr: s.nameAr, description: s.description,
          modules: s.modules, recommendations: s.recommendations, isActive: true, sortOrder: i + 1,
        }));
        await this.seedCategories(em, sector.id, s.categories, null);
      }
      for (let i = 0; i < DEFAULT_SERVICE_OFFERS.length; i++) {
        const o = DEFAULT_SERVICE_OFFERS[i];
        await em.save(ServiceOffer, em.create(ServiceOffer, {
          ...o, isPublic: false, isActive: true, sortOrder: i + 1,
          basis: o.price === null ? 'Sur devis, selon le volume de données.' : 'Proposition de tarif à valider par l’administrateur.',
        } as any));
      }
      await em.update(PlatformSettings, { id: 1 }, { defaultsSeeded: true, paymentMethods: DEFAULT_PAYMENT_METHODS });
      this.cache = null;
      this.logger.log('Contenu de départ créé : formules (brouillon), secteurs, suggestions, prestations (brouillon).');
      return { seeded: true };
    });
  }

  private async seedCategories(em: EntityManager, sectorId: number, categories: DefaultCategory[], parentId: number | null) {
    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      const saved = await em.save(SectorCategory, em.create(SectorCategory, {
        sectorId, parentId, name: cat.name, description: cat.description || null, isActive: true, sortOrder: c + 1,
      }));
      for (let i = 0; i < cat.items.length; i++) {
        const item = cat.items[i];
        const kind = item.kind || 'product';
        const selling = item.price !== undefined ? item.price : item.cost !== undefined && item.margin !== undefined ? round3(item.cost * (1 + item.margin / 100)) : null;
        await em.save(SectorItem, em.create(SectorItem, {
          sectorId, categoryId: saved.id, kind, name: item.name, description: item.description || null, unit: item.unit || (kind === 'service' ? 'prestation' : 'pièce'),
          purchasePrice: item.cost ?? null, sellingPrice: selling, marginPct: item.margin ?? null, vatRate: null,
          trackLots: !!item.lots, basis: basisFor(item), isActive: true, sortOrder: i + 1,
        }));
      }
      if (cat.children?.length) await this.seedCategories(em, sectorId, cat.children, saved.id);
    }
  }
}
