import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Plan, PlatformSettings, SubscriptionPayment } from './entities/saas.entity';
import { Sector, SectorCategory, SectorItem, ServiceOffer } from './entities/sector.entity';
import { MailService } from '../../common/mail/mail.service';
import { User } from '../users/entities/user.entity';
import { CORE_MODULES } from './account-access';
import {
  CATALOG_V1, CATALOG_V2, CATALOG_VERSION, DEFAULT_PAYMENT_METHODS, DEFAULT_PLANS, DEFAULT_SECTORS, DEFAULT_SERVICE_OFFERS, DefaultCategory,
  DefaultSector, PAYMENT_METHODS, basisFor, newSectorOffersV2,
} from './saas-defaults';

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
    try {
      await this.upgradeDefaults();
    } catch (e: any) {
      this.logger.warn(`Mise à niveau du contenu de départ non faite : ${e?.message || e}`);
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

  /**
   * Le code de vérification par email est-il exigé à l'inscription ? Oui si le réglage est actif ET si le serveur sait
   * envoyer des emails : sans serveur d'envoi, personne ne recevrait son code et tous les nouveaux comptes resteraient
   * fermés. Dès que le SMTP est configuré, la règle s'applique d'elle-même.
   */
  verificationRequired(settings: Pick<PlatformSettings, 'requireEmailVerification'>): boolean {
    return settings.requireEmailVerification === true && this.mail.isConfigured();
  }

  /** Identifiant client Google (public par nature) ; null = connexion Google non configurée. */
  googleClientId(): string | null {
    return (process.env.GOOGLE_CLIENT_ID || '').trim() || null;
  }

  /**
   * Identifiants acceptés pour « Se connecter avec Apple » (APPLE_CLIENT_ID, séparés par des virgules) : d'abord
   * l'identifiant de service du site web, puis éventuellement celui d'une application mobile. Vide = non configuré.
   */
  appleClientIds(): string[] {
    return (process.env.APPLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  /** Identifiant de service Apple remis au navigateur (public par nature) ; null = connexion Apple non configurée. */
  appleClientId(): string | null {
    return this.appleClientIds()[0] || null;
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
    text('paymentLink', 300);
    // Le lien est ouvert par les clients : seule une adresse https est acceptée (jamais « javascript: » ni un chemin local).
    if (next.paymentLink) {
      let url: URL | null = null;
      try { url = new URL(next.paymentLink); } catch { url = null; }
      if (!url || url.protocol !== 'https:') throw new BadRequestException('Lien de paiement invalide : une adresse complète commençant par https:// est attendue.');
      next.paymentLink = url.toString();
    }
    if (next.supportEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next.supportEmail)) throw new BadRequestException('Email de support invalide.');
    // Sans serveur d'envoi la règle reste simplement sans effet (voir verificationRequired) : aucun compte n'est bloqué.
    if (patch.requireEmailVerification !== undefined) next.requireEmailVerification = patch.requireEmailVerification === true;
    if (patch.manualPayments !== undefined) next.manualPayments = patch.manualPayments === true;
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
        // Publiées d'office : le client choisit sa formule et la paie en ligne sans attendre l'administrateur.
        await em.save(Plan, em.create(Plan, { ...p, isPublic: true, isActive: true } as any));
      }
      for (let i = 0; i < DEFAULT_SECTORS.length; i++) {
        const s = DEFAULT_SECTORS[i];
        if (await em.findOne(Sector, { where: { code: s.code } })) continue;
        await this.insertSector(em, s, i + 1);
      }
      for (let i = 0; i < DEFAULT_SERVICE_OFFERS.length; i++) {
        const o = DEFAULT_SERVICE_OFFERS[i];
        await em.save(ServiceOffer, em.create(ServiceOffer, {
          ...o, isPublic: false, isActive: true, sortOrder: i + 1,
          basis: o.price === null ? 'Sur devis, selon le volume de données.' : 'Proposition de tarif à valider par l’administrateur.',
        } as any));
      }
      // Une base neuve reçoit directement le contenu courant : rien à mettre à niveau ensuite.
      await em.update(PlatformSettings, { id: 1 }, { defaultsSeeded: true, catalogVersion: CATALOG_VERSION, paymentMethods: DEFAULT_PAYMENT_METHODS });
      this.cache = null;
      this.logger.log('Contenu de départ créé : formules (publiées, en dollars), secteurs, suggestions, prestations (brouillon).');
      return { seeded: true };
    });
  }

  private async insertSector(em: EntityManager, s: DefaultSector, sortOrder: number): Promise<Sector> {
    const sector = await em.save(Sector, em.create(Sector, {
      code: s.code, name: s.name, nameEn: s.nameEn, nameAr: s.nameAr, description: s.description,
      modules: s.modules, recommendations: s.recommendations, isActive: true, sortOrder,
    }));
    await this.seedCategories(em, sector.id, s.categories, null);
    return sector;
  }

  /**
   * Reporte dans une base DÉJÀ installée les nouveautés du contenu de départ (saas-defaults.ts), une seule fois par
   * version. Règle : ne jamais écraser ce que l'administrateur a modifié.
   *
   * Version 2 :
   *  - modules par secteur : la liste d'un secteur est remplacée seulement si elle est restée celle de la version 1 ;
   *    les comptes de ce secteur reçoivent alors les modules AJOUTÉS (jamais retirés), dans la limite de leur formule ;
   *  - nouveaux secteurs (agroalimentaire, automobile, vente en ligne, textile, beauté) : créés avec leurs suggestions
   *    et leur prestation de mise en service (en brouillon), placés avant « Autre activité » ;
   *  - formules restées en BROUILLON et inchangées : prix proposés, description et arguments mis à jour ;
   *  - moyens de paiement : complétés si la liste est restée celle de la version 1.
   *
   * Version 3 (tout en ligne, sans intervention de l'administrateur) :
   *  - nouveaux modules « Rendez-vous » et « Projets » : ajoutés aux secteurs restés à la liste de la version 2, et aux
   *    comptes de ces secteurs ; la formule Starter reçoit l'agenda si sa liste de modules n'a pas été modifiée ;
   *  - tarifs en dollars : si aucune formule n'était encore publiée (personne n'a vu de prix en dinars), la devise
   *    passe en USD, les formules inchangées reçoivent leur prix en dollars et sont PUBLIÉES, les prestations restées
   *    en brouillon au prix de départ sont converties. Si des formules étaient déjà publiées, rien de cela ne change ;
   *  - code de vérification par email à l'inscription : activé (sans effet tant que l'envoi d'emails n'est pas configuré).
   */
  async upgradeDefaults(): Promise<{ upgraded: boolean; from?: number }> {
    await this.get(true);
    return this.ds.transaction(async (em) => {
      const [row] = await em.query(`SELECT "defaultsSeeded", "catalogVersion", "paymentMethods", "currency" FROM "platform_settings" WHERE "id" = 1 FOR UPDATE`);
      const from = Number(row?.catalogVersion) || 1;
      if (!row || !row.defaultsSeeded || from >= CATALOG_VERSION) return { upgraded: false };
      const notes: string[] = [];
      if (from < 2) notes.push(...(await this.upgradeToV2(em, row)));
      if (from < 3) notes.push(...(await this.upgradeToV3(em, row)));
      await em.update(PlatformSettings, { id: 1 }, { catalogVersion: CATALOG_VERSION });
      this.cache = null;
      this.logger.log(`Contenu de départ mis à niveau (version ${from} → ${CATALOG_VERSION})${notes.length ? ` : ${notes.join(' ; ')}` : ''}.`);
      return { upgraded: true, from };
    });
  }

  /**
   * Remplace la liste de modules d'un secteur quand elle est restée celle de la version précédente, et donne aux
   * comptes de ce secteur les modules ajoutés (jamais retirés), dans la limite de leur formule.
   */
  private async upgradeSectorModules(em: EntityManager, previous: Record<string, string[]>, target: (code: string) => { modules: string[]; recommendations?: string[] } | null): Promise<string[]> {
    const sameSet = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x) => b.includes(String(x)));
    const plans = await em.find(Plan);
    const planModules = new Map(plans.map((p) => [p.code, p.modules?.length ? new Set(p.modules) : null]));
    const touched: string[] = [];
    for (const [code, before] of Object.entries(previous)) {
      const next = target(code);
      if (!next) continue;
      const sector = await em.findOne(Sector, { where: { code } });
      if (!sector || !sameSet(sector.modules, before)) continue; // absent, ou personnalisé par l'administrateur
      const added = next.modules.filter((m) => !before.includes(m));
      if (!added.length) continue;
      await em.update(Sector, { id: sector.id }, { modules: next.modules, ...(next.recommendations ? { recommendations: next.recommendations } : {}) });
      touched.push(code);
      const owners = await em.find(User, { where: { sector: code, role: 'client' }, select: ['id', 'modules', 'planCode', 'ownerId'] });
      for (const owner of owners) {
        // Compte jamais configuré (aucune clé) : tout est déjà ouvert pour lui, rien à ajouter.
        if (owner.ownerId || !owner.modules || !Object.keys(owner.modules).length) continue;
        const allowed = owner.planCode ? planModules.get(owner.planCode) ?? null : null;
        const modules = { ...owner.modules };
        let changed = false;
        for (const key of added) {
          if (modules[key] === true || CORE_MODULES.includes(key) || (allowed && !allowed.has(key))) continue;
          modules[key] = true;
          changed = true;
        }
        if (changed) await em.update(User, { id: owner.id }, { modules });
      }
    }
    return touched;
  }

  private async upgradeToV2(em: EntityManager, row: any): Promise<string[]> {
    const sameSet = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x) => b.includes(String(x)));
    const sameList = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    const notes: string[] = [];

    // ── Modules par secteur (cible : la liste de la version 2 ; la version 3 s'applique ensuite) ──
    const recommendations = new Map(DEFAULT_SECTORS.map((d) => [d.code, d.recommendations]));
    await this.upgradeSectorModules(em, CATALOG_V1.sectorModules, (code) =>
      CATALOG_V2.sectorModules[code] ? { modules: CATALOG_V2.sectorModules[code], recommendations: recommendations.get(code) } : null);

    // ── Nouveaux secteurs ──
    const other = await em.findOne(Sector, { where: { code: 'other' } });
    const [{ max }] = await em.query(`SELECT COALESCE(MAX("sortOrder"), 0)::int AS max FROM "sectors" WHERE "code" <> 'other'`);
    let order = Number(max) || 0;
    const created: string[] = [];
    for (const def of DEFAULT_SECTORS) {
      if (CATALOG_V1.sectorModules[def.code] || (await em.findOne(Sector, { where: { code: def.code } }))) continue;
      await this.insertSector(em, def, ++order);
      created.push(def.code);
    }
    if (created.length && other) await em.update(Sector, { id: other.id }, { sortOrder: order + 1 });
    if (created.length) notes.push(`nouveaux secteurs ${created.join(', ')}`);
    const [{ maxOffer }] = await em.query(`SELECT COALESCE(MAX("sortOrder"), 0)::int AS "maxOffer" FROM "service_offers"`);
    let offerOrder = Number(maxOffer) || 0;
    for (const o of newSectorOffersV2()) {
      if (!o.sectorCode || !created.includes(o.sectorCode)) continue;
      // Créées au prix de la version 2 (dinars) : la version 3 les convertit avec les autres.
      const price = CATALOG_V2.offerPrices[o.name] ?? o.price;
      await em.save(ServiceOffer, em.create(ServiceOffer, { ...o, price, isPublic: false, isActive: true, sortOrder: ++offerOrder, basis: 'Proposition de tarif à valider par l’administrateur.' } as any));
    }

    // ── Formules restées en brouillon et inchangées ──
    const plans = await em.find(Plan);
    for (const [code, v2] of Object.entries(CATALOG_V2.plans)) {
      const v1 = CATALOG_V1.plans[code];
      const plan = plans.find((p) => p.code === code);
      if (!v1 || !plan || plan.isPublic) continue;
      const untouched = num(plan.priceMonthly) === v1.priceMonthly && num(plan.priceAnnual) === v1.priceAnnual && (plan.maxUsers ?? null) === v1.maxUsers && sameList(plan.features, v1.features);
      if (!untouched) continue;
      await em.update(Plan, { id: plan.id }, {
        description: v2.description, priceMonthly: v2.priceMonthly, priceAnnual: v2.priceAnnual, maxUsers: v2.maxUsers,
        modules: v2.modules as any, features: v2.features,
      });
    }

    // ── Moyens de paiement ──
    if (sameSet(row.paymentMethods, CATALOG_V1.paymentMethods)) await em.update(PlatformSettings, { id: 1 }, { paymentMethods: DEFAULT_PAYMENT_METHODS });
    return notes;
  }

  private async upgradeToV3(em: EntityManager, row: any): Promise<string[]> {
    const sameSet = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x) => b.includes(String(x)));
    const sameList = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    const notes: string[] = [];

    // ── Formules : dollars (et publication si rien n'était publié) ──
    // (avant les secteurs : un compte ne reçoit un nouveau module que si sa formule l'inclut, formule déjà mise à jour)
    // Les prix de départ en dinars passent en dollars quand la devise est encore celle de la version 2 et que :
    //  - aucune formule n'était publiée (personne n'a vu de prix en dinars) ; ou
    //  - des formules étaient publiées mais toutes restées celles de départ, sans aucun paiement enregistré : un prix choisi
    //    par l'administrateur, ou déjà payé en dinars, changerait de sens, donc dans ce cas rien ne bouge.
    const plans = await em.find(Plan);
    const offers = await em.find(ServiceOffer);
    const payments = await em.count(SubscriptionPayment);
    const planIsDefault = (p: Plan) => {
      const v2 = CATALOG_V2.plans[p.code];
      return !!v2 && num(p.priceMonthly) === v2.priceMonthly && num(p.priceAnnual) === v2.priceAnnual && (p.maxUsers ?? null) === v2.maxUsers && sameList(p.features, v2.features);
    };
    const offerIsDefault = (o: ServiceOffer) => CATALOG_V2.offerPrices[o.name] !== undefined && num(o.price) === CATALOG_V2.offerPrices[o.name];
    const nobodyPublished = !plans.some((p) => p.isPublic);
    const publishedAreDefault = plans.every((p) => !p.isPublic || planIsDefault(p)) && offers.every((o) => !o.isPublic || offerIsDefault(o));
    const convert = String(row.currency || 'TND') === CATALOG_V2.currency && (nobodyPublished || (payments === 0 && publishedAreDefault));
    let published = 0;
    for (const def of DEFAULT_PLANS) {
      const v2 = CATALOG_V2.plans[def.code];
      const plan = plans.find((p) => p.code === def.code);
      if (!v2 || !plan) continue;
      const untouched = planIsDefault(plan);
      const patch: Partial<Plan> = {};
      // L'agenda entre dans la formule si sa liste de modules est restée celle de départ.
      if (def.modules && v2.modules && sameSet(plan.modules, v2.modules)) patch.modules = def.modules;
      if (untouched) {
        patch.description = def.description;
        patch.features = def.features;
        if (convert) {
          patch.priceMonthly = def.priceMonthly;
          patch.priceAnnual = def.priceAnnual;
          if (nobodyPublished) {
            patch.isPublic = true;
            published++;
          }
        }
      }
      if (Object.keys(patch).length) await em.update(Plan, { id: plan.id }, patch as any);
    }
    if (convert) {
      await em.update(PlatformSettings, { id: 1 }, { currency: 'USD' });
      const usd = new Map(DEFAULT_SERVICE_OFFERS.map((o) => [o.name, o.price]));
      for (const offer of offers) {
        const after = usd.get(offer.name);
        if (!offerIsDefault(offer) || after === undefined || after === null) continue;
        await em.update(ServiceOffer, { id: offer.id }, { price: after });
      }
      const kept = plans.filter((p) => DEFAULT_PLANS.some((d) => d.code === p.code) && !(CATALOG_V2.plans[p.code] && num(p.priceMonthly) === CATALOG_V2.plans[p.code].priceMonthly && num(p.priceAnnual) === CATALOG_V2.plans[p.code].priceAnnual)).map((p) => `${p.code} (${p.priceMonthly ?? '—'}/${p.priceAnnual ?? '—'})`);
      notes.push(`tarifs en dollars, ${published} formule(s) publiée(s)${kept.length ? `, prix modifiés par l’administrateur conservés tels quels (à vérifier, désormais en dollars) : ${kept.join(', ')}` : ''}`);
    } else {
      const why = String(row.currency || 'TND') !== CATALOG_V2.currency
        ? 'devise déjà choisie'
        : payments ? `${payments} paiement(s) enregistré(s)` : 'formules ou prestations publiées avec des prix modifiés';
      notes.push(`devise ${row.currency} et prix conservés (${why}) : modifiables dans Administration › Réglages et Formules`);
    }

    // ── Rendez-vous et Projets, par secteur (secteurs restés au contenu de la version 2 ; comptes concernés compris) ──
    const defaults = new Map(DEFAULT_SECTORS.map((d) => [d.code, d]));
    const touched = await this.upgradeSectorModules(em, CATALOG_V2.sectorModules, (code) => {
      const def = defaults.get(code);
      return def ? { modules: def.modules, recommendations: def.recommendations } : null;
    });
    if (touched.length) notes.push(`Rendez-vous / Projets ajoutés aux secteurs ${touched.join(', ')}`);

    // ── Code de vérification par email : activé (sans effet tant que le SMTP n'est pas configuré) ──
    await em.update(PlatformSettings, { id: 1 }, { requireEmailVerification: true });
    return notes;
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
