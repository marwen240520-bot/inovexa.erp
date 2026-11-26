import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Company } from './company.entity';
import { User } from '../users/entities/user.entity';
import { parseVatRates, validateTaxId, vatRatesFor } from '../../common/fiscal';
import { countryName, currencyDecimals, isCountryCode, isCurrencyCode, localFeatures, taxIdLabel } from '../../common/countries';

export const DEFAULT_NUMBERING: Record<string, string> = {
  quote: 'DV',
  delivery_note: 'BL',
  invoice: 'FA',
  credit_note: 'AV',
  purchase_order: 'BC',
  goods_receipt: 'BR',
  supplier_invoice: 'FF',
  supplier_credit_note: 'AF',
  payment: 'RG',
  stock_transfer: 'TR',
  stock_count: 'INV',
  cash_session: 'Z',
};

const EDITABLE: Array<keyof Company> = [
  'legalName', 'tradeName', 'legalForm', 'taxId', 'tradeRegister', 'cnssNumber', 'shareCapital', 'address', 'city',
  'postalCode', 'country', 'countryCode', 'phone', 'email', 'website', 'logoDataUrl', 'bankName', 'bankAccount', 'currency',
  'defaultVatRate', 'vatRates', 'stampDutyEnabled', 'stampDutyAmount', 'stampScale', 'withholdingThreshold',
  'defaultPaymentTermsDays', 'quoteValidityDays', 'numbering', 'accountMap', 'payrollSettings', 'invoiceFooter', 'defaultNotes',
];

const MAX_LOGO = 600_000;

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company) private readonly repo: Repository<Company>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Fiche de la société ; créée au premier accès à partir du nom saisi à l'inscription. */
  async getOrCreate(userId: number, manager?: EntityManager): Promise<Company> {
    const repo = manager ? manager.getRepository(Company) : this.repo;
    let company = await repo.findOne({ where: { userId } });
    if (company) return company;
    const user = await (manager ? manager.getRepository(User) : this.users).findOne({ where: { id: userId } });
    company = repo.create({
      userId,
      legalName: user?.companyName || user?.name || '',
      email: user?.email || null,
      phone: user?.phone || null,
      numbering: { ...DEFAULT_NUMBERING },
    });
    try {
      return await repo.save(company);
    } catch (e: any) {
      if (e?.code === '23505') return (await repo.findOne({ where: { userId } }))!; // créée en parallèle
      throw e;
    }
  }

  /** Préfixe de numérotation d'un type de pièce (personnalisable). */
  prefixFor(company: Company, key: string): string {
    const custom = company.numbering?.[key];
    return (custom && String(custom).trim().toUpperCase().slice(0, 10)) || DEFAULT_NUMBERING[key] || key.toUpperCase().slice(0, 4);
  }

  async update(userId: number, data: Partial<Company>) {
    const company = await this.getOrCreate(userId);
    const patch: Record<string, any> = {};
    for (const key of EDITABLE) if (data && (data as any)[key] !== undefined) patch[key] = (data as any)[key];

    if (patch.countryCode !== undefined) {
      const code = String(patch.countryCode || '').trim().toUpperCase();
      if (!isCountryCode(code)) throw new BadRequestException('Pays invalide (code ISO à 2 lettres, ex. TN, FR, MA).');
      patch.countryCode = code;
      // Le nom du pays suit le code, sauf s'il a été saisi en même temps.
      if (patch.country === undefined) patch.country = countryName(code, 'fr');
    }
    const countryCode = String(patch.countryCode ?? company.countryCode ?? 'TN');
    if (patch.taxId !== undefined) {
      const check = validateTaxId(patch.taxId, { country: countryCode });
      if (!check.valid) throw new BadRequestException(check.message);
      patch.taxId = check.normalized || null;
    }
    if (patch.vatRates !== undefined && patch.vatRates !== null) {
      const parsed = parseVatRates(patch.vatRates);
      if (parsed.error) throw new BadRequestException(parsed.error);
      patch.vatRates = parsed.rates;
    }
    if (patch.logoDataUrl === '') patch.logoDataUrl = null; // « Retirer le logo » → logo par défaut
    if (patch.logoDataUrl) {
      if (!/^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/=]+$/i.test(patch.logoDataUrl)) {
        throw new BadRequestException('Le logo doit être une image PNG ou JPEG.');
      }
      if (patch.logoDataUrl.length > MAX_LOGO) throw new BadRequestException('Logo trop volumineux (réduisez-le avant l’envoi).');
    }
    if (patch.currency !== undefined) {
      const currency = String(patch.currency || '').trim().toUpperCase();
      if (!isCurrencyCode(currency)) throw new BadRequestException('Devise invalide (code ISO à 3 lettres, ex. TND, EUR, USD).');
      patch.currency = currency;
      if (currency !== company.currency) {
        // Une comptabilité se tient dans une seule devise : on ne la change plus dès qu'une pièce numérotée existe.
        const [used] = await this.repo.manager.query(`SELECT 1 AS n FROM "documents" WHERE "userId" = $1 AND "number" IS NOT NULL LIMIT 1`, [userId]);
        if (used) throw new BadRequestException('La devise ne peut plus être modifiée : des pièces numérotées existent déjà dans la devise actuelle.');
      }
    }
    // Une société tunisienne tient ses comptes en dinars (timbre, TEIF, paie et plan comptable sont en dinars).
    if ((patch.countryCode !== undefined || patch.currency !== undefined) && countryCode === 'TN' && String(patch.currency ?? company.currency ?? 'TND') !== 'TND') {
      throw new BadRequestException('Une société tunisienne tient ses comptes en dinars tunisiens (TND).');
    }
    // Changer de pays sans toucher à l'identifiant fiscal : celui qui est déjà enregistré doit rester valable dans le nouveau pays.
    if (patch.countryCode !== undefined && patch.countryCode !== company.countryCode && patch.taxId === undefined && company.taxId?.trim()) {
      const recheck = validateTaxId(company.taxId, { country: countryCode });
      if (!recheck.valid) throw new BadRequestException(`Corrigez l’identifiant fiscal en même temps que le pays. ${recheck.message}`);
    }
    if (patch.stampScale !== undefined && !['flat', 'large_store'].includes(patch.stampScale)) throw new BadRequestException('Barème de timbre invalide.');
    for (const k of ['defaultVatRate', 'stampDutyAmount', 'withholdingThreshold']) {
      if (patch[k] !== undefined && (!Number.isFinite(Number(patch[k])) || Number(patch[k]) < 0 || (k === 'defaultVatRate' && Number(patch[k]) > 100))) throw new BadRequestException(`Valeur invalide : ${k}`);
    }
    if (patch.numbering) {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(patch.numbering as Record<string, string>)) {
        if (!(k in DEFAULT_NUMBERING)) continue;
        const prefix = String(v || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{1,10}$/.test(prefix)) throw new BadRequestException(`Préfixe invalide pour « ${k} » (1 à 10 lettres ou chiffres).`);
        clean[k] = prefix;
      }
      patch.numbering = { ...DEFAULT_NUMBERING, ...(company.numbering || {}), ...clean };
    }
    Object.assign(company, patch);
    return this.repo.save(company);
  }

  /** Ce que l'interface doit savoir pour s'adapter à la société : pays, devise et précision, taux de TVA, fonctions locales. */
  profile(company: Company) {
    const countryCode = company.countryCode || 'TN';
    const currency = company.currency || 'TND';
    return {
      countryCode,
      countryName: countryName(countryCode, 'fr'),
      currency,
      currencyDecimals: currencyDecimals(currency),
      defaultVatRate: Number(company.defaultVatRate),
      vatRates: vatRatesFor(company),
      taxIdLabel: taxIdLabel(countryCode),
      features: localFeatures(countryCode),
    };
  }

  /** Vérifie que la société a les mentions légales indispensables pour émettre une facture. */
  legalGaps(company: Company): string[] {
    const gaps: string[] = [];
    if (!company.legalName?.trim()) gaps.push('raison sociale');
    if (!company.taxId?.trim()) gaps.push(taxIdLabel(company.countryCode).toLowerCase());
    if (!company.address?.trim()) gaps.push('adresse');
    return gaps;
  }
}
