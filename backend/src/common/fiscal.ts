/**
 * Règles fiscales tunisiennes utilisées par les documents commerciaux.
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
  kind: 'mf' | 'cin' | 'empty' | 'invalid';
  message?: string;
}

/**
 * Matricule fiscal tunisien : 7 chiffres + clé (lettre), puis catégorie TVA (A, B, D, N, P),
 * code établissement (M, N, P, C, E) et numéro d'établissement à 3 chiffres.
 * Exemple : 1234567X/A/M/000 ou, sans le détail, 1234567X. Un numéro de CIN (8 chiffres) est accepté pour un particulier.
 */
export function validateTaxId(value: string | null | undefined): TaxIdCheck {
  const raw = String(value ?? '').trim();
  if (!raw) return { valid: true, normalized: '', kind: 'empty' };
  const compact = raw.toUpperCase().replace(/[\s/\\.-]/g, '');
  if (/^\d{8}$/.test(compact)) return { valid: true, normalized: compact, kind: 'cin' };
  const m = /^(\d{7})([A-Z])(?:([ABDNP])(?:([MNPCE])(\d{3})?)?)?$/.exec(compact);
  if (!m) {
    return {
      valid: false,
      normalized: compact,
      kind: 'invalid',
      message: 'Matricule fiscal invalide : 7 chiffres + 1 lettre (ex. 1234567X ou 1234567X/A/M/000).',
    };
  }
  const [, digits, key, category, establishment, number] = m;
  const parts = [`${digits}${key}`];
  if (category) parts.push(category);
  if (establishment) parts.push(establishment);
  if (number) parts.push(number);
  return { valid: true, normalized: parts.join('/'), kind: 'mf' };
}
