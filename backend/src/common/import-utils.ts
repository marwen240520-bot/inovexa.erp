/**
 * Utilitaires partagés par les imports de données (clients, fournisseurs, achats, ventes,
 * employés, factures, produits).
 *
 * Objectifs : accepter des fichiers "du monde réel" (en-têtes français ou anglais, accents,
 * majuscules, nombres au format 1 234,50 €, dates jj/mm/aaaa...) et renvoyer, ligne par ligne,
 * la raison exacte de chaque échec.
 */

export interface ImportErrorDetail {
  /** Numéro de ligne dans le fichier (l'en-tête est la ligne 1) */
  row: number;
  error: string;
}

export interface ImportResult {
  success: number;
  errors: number;
  total: number;
  errorDetails: ImportErrorDetail[];
  message: string;
}

/** "Prénom", "prenom", "PRENOM", "Prix unitaire" -> "prenom", "prixunitaire" */
export const normKey = (key: unknown): string =>
  String(key ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Renvoie la première valeur non vide dont l'en-tête correspond (sans accents ni casse) à un alias. */
export function pick(row: Record<string, any> | null | undefined, aliases: string[]): any {
  if (!row || typeof row !== 'object') return undefined;
  const wanted = aliases.map(normKey);
  const entries = Object.entries(row);
  for (const alias of wanted) {
    for (const [key, value] of entries) {
      if (normKey(key) === alias && !isBlank(value)) return value;
    }
  }
  return undefined;
}

/** Texte nettoyé ou null. */
export function toText(value: unknown): string | null {
  if (isBlank(value)) return null;
  return String(value).trim();
}

/**
 * Nombre tolérant : 1200, "1 200,50", "1.200,50", "1,200.50", "12,5 €", "20 %".
 * Renvoie `fallback` si la valeur est absente ou illisible.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (isBlank(value)) return fallback;
  let s = String(value).replace(/[\s\u00a0\u202f]/g, '').replace(/[^\d,.\-+]/g, '');
  if (!s || s === '-' || s === '+') return fallback;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // Le dernier séparateur est le séparateur décimal
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma > -1) {
    // "1,234,567" (milliers) vs "12,5" (décimale)
    s = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

/** Date tolérante : ISO, jj/mm/aaaa, jj-mm-aaaa, Date. Renvoie null si illisible. */
export function toDate(value: unknown): Date | null {
  if (isBlank(value)) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  const fr = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (fr) {
    const year = fr[3].length === 2 ? 2000 + Number(fr[3]) : Number(fr[3]);
    const d = new Date(year, Number(fr[2]) - 1, Number(fr[1]), Number(fr[4] || 0), Number(fr[5] || 0));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Associe un libellé libre ("Actif", "payée", "En cours"...) à une valeur canonique. */
export function normalizeStatus(
  value: unknown,
  map: Record<string, string[]>,
  fallback: string,
): string {
  const key = normKey(value);
  if (!key) return fallback;
  for (const [canonical, labels] of Object.entries(map)) {
    if (canonical === key || labels.map(normKey).includes(key)) return canonical;
  }
  return fallback;
}

export const ACTIVE_STATUS = { active: ['actif', 'active', 'oui', 'yes', 'true', '1'], inactive: ['inactif', 'inactive', 'non', 'no', 'false', '0'] };

/** Ligne totalement vide (fréquent en fin de fichier Excel) */
export const isEmptyRow = (row: unknown): boolean =>
  !row || typeof row !== 'object' || Object.values(row as object).every(isBlank);

/** Construit la réponse standard d'un import. Seules les 20 premières erreurs sont renvoyées. */
export function buildImportResult(
  noun: string,
  total: number,
  success: number,
  errorDetails: ImportErrorDetail[],
): ImportResult {
  const errors = errorDetails.length;
  return {
    success,
    errors,
    total,
    errorDetails: errorDetails.slice(0, 20),
    message: `${success} ${noun} importé(s), ${errors} erreur(s)`,
  };
}

export const errorMessage = (e: unknown): string => {
  const err = e as any;
  return (
    err?.response?.message?.[0] ||
    err?.response?.message ||
    err?.driverError?.detail ||
    err?.detail ||
    err?.message ||
    'Erreur inconnue'
  );
};

/** Moyens de paiement reconnus (code -> libellés acceptés à l'import / à la saisie) */
export const PAYMENT_METHODS: Record<string, string[]> = {
  cash: ['especes', 'espece', 'cash', 'liquide', 'comptant', 'efectivo'],
  card: ['carte', 'carte bancaire', 'cb', 'credit card', 'debit card', 'card', 'tarjeta', 'visa', 'mastercard'],
  transfer: ['virement', 'virement bancaire', 'bank transfer', 'wire', 'transfer', 'transferencia', 'rib'],
  check: ['cheque', 'chèque', 'check', 'chq'],
  draft: ['traite', 'effet', 'lettre de change', 'draft', 'bill of exchange', 'letra'],
  mobile: ['mobile', 'paiement mobile', 'mobile payment', 'd17', 'flouci', 'e-dinar', 'edinar', 'pago movil'],
  other: ['autre', 'other', 'otro'],
};

/** Valeur canonique d'un moyen de paiement. Vide -> null ; inconnu -> "other". */
export function normalizePaymentMethod(value: unknown): string | null {
  if (isBlank(value)) return null;
  const key = normKey(value);
  for (const [code, labels] of Object.entries(PAYMENT_METHODS)) {
    if (code === key || labels.map(normKey).includes(key)) return code;
  }
  return 'other';
}
