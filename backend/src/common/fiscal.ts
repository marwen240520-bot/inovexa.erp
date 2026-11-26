/**
 * Règles fiscales par défaut (Tunisie) des documents commerciaux. Pour une société d'un autre pays, les taux de TVA se
 * règlent dans sa fiche (voir vatRatesFor) ; le droit de timbre, la retenue à la source tunisienne et le TEIF ne
 * s'appliquent qu'aux sociétés tunisiennes (voir localFeatures dans countries.ts).
 *
 * Sources vérifiées (PwC Tax Summaries – Tunisia, loi de finances 2026) :
 *  - TVA : 19 % (taux normal), 13 % et 7 % (taux réduits), 0 % (exonéré / export) ;
 *  - droit de timbre : 1 DT par facture (depuis 2023) ; grandes surfaces (> 1 500 m²) : barème
 *    progressif depuis le 1er janvier 2026 ;
 *  - retenue à la source : 1,5 % sur les paiements > 1 000 DT TTC pour biens et services (1 % si le
 *    bénéficiaire est soumis à l'IS à 15 %, 0,5 % s'il l'est à 10 %) ; 10 % sur honoraires, commissions,
 *    loyers (3 % si le bénéficiaire est une société soumise à l'IS ou tient une comptabilité).
 *
 * Ces taux évoluent avec chaque loi de finances : ils sont tous modifiables par document, et les
 * valeurs par défaut sont dans les paramètres de la société. À valider avec votre expert-comptable.
 */

export const VAT_RATES = [0, 7, 13, 19] as const;
export const DEFAULT_VAT_RATE = 19;

export interface WithholdingPreset {
  rate: number;
  label: string;
  /** Le seuil de 1 000 DT TTC s'applique-t-il à ce taux ? */
  usesThreshold: boolean;
}

export const WITHHOLDING_PRESETS: WithholdingPreset[] = [
  { rate: 0, label: 'Aucune retenue', usesThreshold: false },
  { rate: 0.5, label: 'Biens et services — bénéficiaire soumis à l’IS à 10 %', usesThreshold: true },
  { rate: 1, label: 'Biens et services — bénéficiaire soumis à l’IS à 15 %', usesThreshold: true },
  { rate: 1.5, label: 'Biens et services — taux général (paiement > 1 000 DT TTC)', usesThreshold: true },
  { rate: 3, label: 'Honoraires, commissions, loyers — bénéficiaire société ou comptabilité', usesThreshold: false },
  { rate: 10, label: 'Honoraires, commissions, loyers — autres bénéficiaires', usesThreshold: false },
  { rate: 15, label: 'Primes de rendement aux distributeurs', usesThreshold: false },
  { rate: 20, label: 'Intérêts, jetons de présence', usesThreshold: false },
];

export type StampScale = 'flat' | 'large_store';

/**
 * Droit de timbre d'une facture.
 *  - `flat` : montant fixe (1 DT par défaut) ;
 *  - `large_store` : grandes surfaces — 1 DT sous 50 DT, 1,5 DT de 50 à 100 DT, 2 DT au-delà (TTC).
 */
export function stampDutyFor(totalTTC: number, scale: StampScale = 'flat', flatAmount = 1): number {
  if (scale === 'large_store') {
    if (totalTTC < 50) return 1;
    if (totalTTC <= 100) return 1.5;
    return 2;
  }
  return Math.max(0, Number(flatAmount) || 0);
}

export interface TaxIdCheck {
  valid: boolean;
  normalized: string;
  kind: 'mf' | 'cin' | 'other' | 'empty' | 'invalid';
  message?: string;
}

export interface TaxIdOptions {
  /** Pays de la société (ISO) : la règle stricte du matricule fiscal ne vaut que pour la Tunisie (défaut). */
  country?: string | null;
  /** Vrai pour un client ou un fournisseur : un identifiant étranger précédé du code pays (FR12345678901) est accepté. */
  party?: boolean;
}

/** Identifiant fiscal étranger (n° de TVA, SIREN, ICE, NIF, EIN…) : format libre, seuls les caractères usuels sont contrôlés. */
function foreignTaxId(raw: string): TaxIdCheck {
  const v = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (v.length < 3 || v.length > 40 || !/^[A-Z0-9][A-Z0-9 ./-]*$/.test(v)) {
    return {
      valid: false,
      normalized: v,
      kind: 'invalid',
      message: 'Identifiant fiscal invalide : 3 à 40 caractères (lettres, chiffres, espace, point, tiret ou barre oblique).',
    };
  }
  return { valid: true, normalized: v, kind: 'other' };
}

/**
 * Matricule fiscal tunisien : 7 chiffres + clé (lettre), puis catégorie TVA (A, B, D, N, P),
 * code établissement (M, N, P, C, E) et numéro d'établissement à 3 chiffres.
 * Exemple : 1234567X/A/M/000 ou, sans le détail, 1234567X. Un numéro de CIN (8 chiffres) est accepté pour un particulier.
 */
export function validateTaxId(value: string | null | undefined, opts: TaxIdOptions = {}): TaxIdCheck {
  const raw = String(value ?? '').trim();
  if (!raw) return { valid: true, normalized: '', kind: 'empty' };
  // Hors Tunisie : format libre (n° de TVA, SIREN, ICE, NIF, EIN…).
  if (String(opts.country || 'TN').toUpperCase() !== 'TN') return foreignTaxId(raw);
  const compact = raw.toUpperCase().replace(/[\s/\\.-]/g, '');
  // Tiers étranger d'une société tunisienne : « FR12345678901 », « MA001234567890123 » (un matricule tunisien commence par un chiffre).
  if (opts.party && /^[A-Z]{2}[A-Z0-9]{3,}$/.test(compact)) return foreignTaxId(raw);
  if (/^\d{8}$/.test(compact)) return { valid: true, normalized: compact, kind: 'cin' };
  const m = /^(\d{7})([A-Z])(?:([ABDNP])(?:([MNPCE])(\d{3})?)?)?$/.exec(compact);
  if (!m) {
    return {
      valid: false,
      normalized: compact,
      kind: 'invalid',
      message:
        'Matricule fiscal invalide : 7 chiffres + 1 lettre (ex. 1234567X ou 1234567X/A/M/000).' +
        (opts.party ? ' Pour un tiers étranger, faites précéder son identifiant du code pays (ex. FR12345678901).' : ''),
    };
  }
  const [, digits, key, category, establishment, number] = m;
  const parts = [`${digits}${key}`];
  if (category) parts.push(category);
  if (establishment) parts.push(establishment);
  if (number) parts.push(number);
  return { valid: true, normalized: parts.join('/'), kind: 'mf' };
}

// ───────────── Taux de TVA par société ─────────────

/** Liste de taux saisie : nombres de 0 à 100 (deux décimales au plus), sans doublon, triés. */
export function parseVatRates(input: unknown): { rates: number[]; error?: string } {
  if (!Array.isArray(input)) return { rates: [], error: 'Les taux de TVA doivent former une liste de nombres.' };
  const out = new Set<number>();
  for (const item of input) {
    const n = Number(typeof item === 'string' ? item.replace(',', '.') : item);
    if (item === null || item === '' || !Number.isFinite(n) || n < 0 || n > 100 || Math.round(n * 100) / 100 !== n) {
      return { rates: [], error: `Taux de TVA invalide : « ${item} » (nombre de 0 à 100, deux décimales au plus).` };
    }
    out.add(n);
  }
  if (out.size === 0) return { rates: [], error: 'Indiquez au moins un taux de TVA (0 si vous n’en facturez pas).' };
  if (out.size > 20) return { rates: [], error: 'Vingt taux de TVA au maximum.' };
  return { rates: [...out].sort((a, b) => a - b) };
}

export interface VatSource {
  countryCode?: string | null;
  vatRates?: unknown;
  defaultVatRate?: unknown;
}

/**
 * Taux de TVA que la société peut utiliser : sa liste, sinon celle de son pays (Tunisie : 0, 7, 13, 19 ; ailleurs : 0).
 * Son taux par défaut en fait toujours partie, pour qu'une pièce créée sans taux précis reste valide.
 */
export function vatRatesFor(company: VatSource): number[] {
  const configured = Array.isArray(company.vatRates) && company.vatRates.length ? parseVatRates(company.vatRates).rates : [];
  const base = configured.length ? configured : String(company.countryCode || 'TN').toUpperCase() === 'TN' ? [...VAT_RATES] : [0];
  const set = new Set<number>(base);
  const def = Number(company.defaultVatRate);
  if (Number.isFinite(def) && def >= 0 && def <= 100) set.add(Math.round(def * 100) / 100);
  return [...set].sort((a, b) => a - b);
}
