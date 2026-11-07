/**
 * Plan comptable de base — INDICATIF. Les numéros de compte s'inspirent du plan comptable tunisien mais doivent être
 * validés (et au besoin remplacés) par l'expert-comptable de la société : la correspondance « fonction -> compte »
 * se règle dans Paramètres > Société (champ accountMap) et des comptes peuvent être ajoutés.
 */
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface BaseAccount {
  code: string;
  name: string;
  type: AccountType;
}

/** Fonction -> numéro de compte utilisé par les écritures automatiques. */
export const DEFAULT_ACCOUNT_MAP: Record<string, string> = {
  receivable: '411',
  payable: '401',
  sales: '701',
  salesServices: '706',
  stock: '370',
  cogs: '607',
  purchasesExpense: '616',
  vatCollected: '4367',
  vatDeductible: '4366',
  withholdingReceivable: '4364',
  withholdingPayable: '4363',
  stampPayable: '4368',
  stampExpense: '647',
  bank: '512',
  cash: '531',
};

export const ACCOUNT_FUNCTIONS: Record<string, string> = {
  receivable: 'Clients',
  payable: 'Fournisseurs',
  sales: 'Ventes de marchandises',
  salesServices: 'Prestations de services vendues',
  stock: 'Stocks de marchandises',
  cogs: 'Coût d’achat des marchandises vendues',
  purchasesExpense: 'Achats non stockés / services extérieurs',
  vatCollected: 'TVA collectée',
  vatDeductible: 'TVA déductible',
  withholdingReceivable: 'Retenues à la source subies (à récupérer)',
  withholdingPayable: 'Retenues à la source opérées (à reverser)',
  stampPayable: 'Droit de timbre à reverser',
  stampExpense: 'Droit de timbre (charge)',
  bank: 'Banque',
  cash: 'Caisse',
};

export const BASE_ACCOUNTS: BaseAccount[] = [
  { code: '101', name: 'Capital social', type: 'equity' },
  { code: '110', name: 'Réserves', type: 'equity' },
  { code: '120', name: 'Résultat reporté', type: 'equity' },
  { code: '130', name: 'Résultat de l’exercice', type: 'equity' },
  { code: '164', name: 'Emprunts bancaires', type: 'liability' },
  { code: '215', name: 'Matériel et outillage', type: 'asset' },
  { code: '218', name: 'Autres immobilisations corporelles', type: 'asset' },
  { code: '280', name: 'Amortissements des immobilisations', type: 'asset' },
  { code: '370', name: 'Stocks de marchandises', type: 'asset' },
  { code: '401', name: 'Fournisseurs', type: 'liability' },
  { code: '409', name: 'Fournisseurs débiteurs (avoirs à recevoir)', type: 'asset' },
  { code: '411', name: 'Clients', type: 'asset' },
  { code: '419', name: 'Clients créditeurs (avances et avoirs)', type: 'liability' },
  { code: '421', name: 'Personnel — rémunérations dues', type: 'liability' },
  { code: '431', name: 'CNSS — cotisations à payer', type: 'liability' },
  { code: '4363', name: 'État — retenues à la source à reverser', type: 'liability' },
  { code: '4364', name: 'État — retenues à la source subies', type: 'asset' },
  { code: '4366', name: 'État — TVA déductible', type: 'asset' },
  { code: '4367', name: 'État — TVA collectée', type: 'liability' },
  { code: '4368', name: 'État — droit de timbre à reverser', type: 'liability' },
  { code: '4369', name: 'État — impôts et taxes à payer', type: 'liability' },
  { code: '512', name: 'Banque', type: 'asset' },
  { code: '531', name: 'Caisse', type: 'asset' },
  { code: '600', name: 'Achats consommés', type: 'expense' },
  { code: '607', name: 'Coût d’achat des marchandises vendues', type: 'expense' },
  { code: '616', name: 'Services extérieurs et achats non stockés', type: 'expense' },
  { code: '626', name: 'Frais postaux et télécommunications', type: 'expense' },
  { code: '641', name: 'Rémunérations du personnel', type: 'expense' },
  { code: '645', name: 'Charges sociales', type: 'expense' },
  { code: '647', name: 'Droits de timbre et taxes', type: 'expense' },
  { code: '661', name: 'Charges d’intérêts', type: 'expense' },
  { code: '681', name: 'Dotations aux amortissements', type: 'expense' },
  { code: '701', name: 'Ventes de marchandises', type: 'income' },
  { code: '706', name: 'Prestations de services', type: 'income' },
  { code: '709', name: 'Rabais, remises et ristournes accordés', type: 'income' },
  { code: '758', name: 'Produits divers', type: 'income' },
];

export const JOURNALS: Record<string, string> = {
  VT: 'Journal des ventes',
  AC: 'Journal des achats',
  BQ: 'Journal de banque',
  CA: 'Journal de caisse',
  OD: 'Opérations diverses',
};
