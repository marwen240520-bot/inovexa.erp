import { round } from '../../common/money';

/**
 * Calcul de la paie mensuelle (Tunisie).
 *
 * ⚠ Les taux, plafonds et barèmes changent avec les lois de finances et les conventions collectives : ils ne sont
 * donc PAS écrits en dur. Les valeurs ci-dessous sont des valeurs de départ alignées sur les textes en vigueur en 2026
 * (barème IRPP de la loi de finances 2025, CNSS régime général, CSS 2026 — voir docs/VALIDATION-PAIE-COMPTA.md pour
 * les sources), stockées dans la fiche société (`payrollSettings`) et conservées sur chaque bulletin. Elles restent
 * à faire valider par l'expert-comptable (case « validés » dans Paramètres de paie) avant d'établir de vrais bulletins.
 */
export interface PayrollBracket {
  /** Plafond de la tranche en DT par an (null = sans limite). */
  upTo: number | null;
  /** Taux marginal en %. */
  rate: number;
}

export interface PayrollSettings {
  cnssEmployeeRate: number;
  cnssEmployerRate: number;
  /** Taux « accident du travail et maladies professionnelles » à la charge de l'employeur (varie selon l'activité). */
  workAccidentRate: number;
  professionalExpensesRate: number;
  professionalExpensesCap: number;
  headOfFamilyDeduction: number;
  childDeduction: number;
  maxChildrenDeducted: number;
  /** Contribution sociale de solidarité, en % du revenu imposable. */
  solidarityRate: number;
  /** Revenu net imposable annuel (après déductions) en deçà duquel la CSS n'est pas due (5 000 DT en 2026). */
  solidarityExemptionThreshold: number;
  /** Année des textes de référence des valeurs par défaut (information). */
  referenceYear: number;
  brackets: PayrollBracket[];
  /** Jours de congé payé acquis par mois de travail. */
  leaveDaysPerMonth: number;
  /** Jours travaillés de la semaine (1 = lundi … 7 = dimanche) pour décompter les congés. */
  workingWeek: number[];
  validated: boolean;
}

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  cnssEmployeeRate: 9.18,
  cnssEmployerRate: 16.57,
  workAccidentRate: 0.5,
  professionalExpensesRate: 10,
  professionalExpensesCap: 2000,
  headOfFamilyDeduction: 300,
  childDeduction: 100,
  maxChildrenDeducted: 4,
  // CSS personnes physiques : 1 % − 0,5 point (réduction temporaire LF 2026, art. 87) ; exonération ≤ 5 000 DT.
  solidarityRate: 0.5,
  solidarityExemptionThreshold: 5000,
  referenceYear: 2026,
  // Barème IRPP (loi de finances 2025, JORT du 10/12/2024 ; inchangé par la LF 2026), tranches annuelles en DT.
  brackets: [
    { upTo: 5000, rate: 0 },
    { upTo: 10000, rate: 15 },
    { upTo: 20000, rate: 25 },
    { upTo: 30000, rate: 30 },
    { upTo: 40000, rate: 33 },
    { upTo: 50000, rate: 36 },
    { upTo: 70000, rate: 38 },
    { upTo: null, rate: 40 },
  ],
  leaveDaysPerMonth: 1,
  workingWeek: [1, 2, 3, 4, 5],
  validated: false,
};

export function mergePayrollSettings(custom?: Partial<PayrollSettings> | null): PayrollSettings {
  const s = { ...DEFAULT_PAYROLL_SETTINGS, ...(custom || {}) } as PayrollSettings;
  if (!Array.isArray(s.brackets) || !s.brackets.length) s.brackets = DEFAULT_PAYROLL_SETTINGS.brackets;
  return s;
}

/** Impôt annuel par tranches progressives. */
export function annualIncomeTax(taxable: number, brackets: PayrollBracket[]): number {
  let tax = 0;
  let previous = 0;
  for (const b of brackets) {
    const upper = b.upTo === null ? Infinity : b.upTo;
    if (taxable > previous) tax += (Math.min(taxable, upper) - previous) * (b.rate / 100);
    previous = upper;
    if (taxable <= upper) break;
  }
  return round(tax, 3);
}

export interface PayrollInput {
  grossSalary: number;
  bonuses?: number;
  otherDeductions?: number;
  headOfFamily?: boolean;
  childrenCount?: number;
}

export interface PayrollResult {
  grossSalary: number;
  bonuses: number;
  totalGross: number;
  employeeCnss: number;
  taxableIncome: number;
  incomeTax: number;
  solidarityContribution: number;
  otherDeductions: number;
  netSalary: number;
  employerCnss: number;
  employerCost: number;
  details: {
    annualNetAfterCnss: number;
    professionalExpenses: number;
    familyDeduction: number;
    annualTaxable: number;
    annualIncomeTax: number;
  };
}

/**
 * Bulletin mensuel : la base annuelle est le mois ×12 (les primes exceptionnelles sont donc annualisées — approximation
 * standard pour une retenue mensuelle ; la régularisation annuelle reste à faire par le comptable).
 */
export function computePayslip(input: PayrollInput, settings: PayrollSettings): PayrollResult {
  const gross = Math.max(0, Number(input.grossSalary) || 0);
  const bonuses = Math.max(0, Number(input.bonuses) || 0);
  const totalGross = round(gross + bonuses, 3);
  const employeeCnss = round((totalGross * settings.cnssEmployeeRate) / 100, 3);

  const annualNet = round((totalGross - employeeCnss) * 12, 3);
  const professionalExpenses = round(Math.min((annualNet * settings.professionalExpensesRate) / 100, settings.professionalExpensesCap), 3);
  const children = Math.min(Math.max(Number(input.childrenCount) || 0, 0), settings.maxChildrenDeducted);
  const familyDeduction = round((input.headOfFamily ? settings.headOfFamilyDeduction : 0) + children * settings.childDeduction, 3);
  const annualTaxable = Math.max(0, round(annualNet - professionalExpenses - familyDeduction, 3));
  const annualTax = annualIncomeTax(annualTaxable, settings.brackets);

  const incomeTax = round(annualTax / 12, 3);
  const taxableIncome = round(annualTaxable / 12, 3);
  const solidarityExempt = annualTaxable <= (Number(settings.solidarityExemptionThreshold) || 0);
  const solidarityContribution = solidarityExempt ? 0 : round((taxableIncome * settings.solidarityRate) / 100, 3);
  const otherDeductions = Math.max(0, round(Number(input.otherDeductions) || 0, 3));
  const netSalary = round(totalGross - employeeCnss - incomeTax - solidarityContribution - otherDeductions, 3);
  const employerCnss = round((totalGross * (settings.cnssEmployerRate + settings.workAccidentRate)) / 100, 3);

  return {
    grossSalary: round(gross, 3), bonuses, totalGross, employeeCnss, taxableIncome, incomeTax, solidarityContribution,
    otherDeductions, netSalary, employerCnss, employerCost: round(totalGross + employerCnss, 3),
    details: { annualNetAfterCnss: annualNet, professionalExpenses, familyDeduction, annualTaxable, annualIncomeTax: annualTax },
  };
}

/** Jours de la période (inclus) tombant sur les jours travaillés de la semaine. */
export function workingDaysBetween(start: string, end: string, workingWeek: number[]): number {
  const s = Date.parse(`${start}T00:00:00Z`);
  const e = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return 0;
  let days = 0;
  for (let t = s; t <= e; t += 86_400_000) {
    const dow = new Date(t).getUTCDay() || 7; // dimanche = 7
    if (workingWeek.includes(dow)) days++;
  }
  return days;
}
