import { DEFAULT_PAYROLL_SETTINGS, annualIncomeTax, computePayslip, mergePayrollSettings, workingDaysBetween } from '../../src/modules/hr/payroll';

const S = DEFAULT_PAYROLL_SETTINGS;

describe('annualIncomeTax (barème progressif)', () => {
  it('ne taxe pas la première tranche', () => {
    expect(annualIncomeTax(0, S.brackets)).toBe(0);
    expect(annualIncomeTax(5000, S.brackets)).toBe(0);
  });
  it('applique chaque tranche à la part qui lui revient', () => {
    expect(annualIncomeTax(30000, S.brackets)).toBe(6700); // 15 000 × 26 % + 10 000 × 28 %
    expect(annualIncomeTax(60000, S.brackets)).toBe(16600); // + 20 000 × 32 % + 10 000 × 35 %
  });
  it('est continu à la frontière des tranches', () => {
    expect(annualIncomeTax(20000, S.brackets)).toBe(3900);
    expect(annualIncomeTax(20001, S.brackets)).toBe(3900.28); // le dinar suivant est taxé à 28 %
  });
});

describe('computePayslip', () => {
  it('chef de famille avec 2 enfants, 2 000 DT brut', () => {
    const r = computePayslip({ grossSalary: 2000, headOfFamily: true, childrenCount: 2 }, S);
    expect(r.employeeCnss).toBe(183.6);
    expect(r.details.professionalExpenses).toBe(2000); // plafonné
    expect(r.details.familyDeduction).toBe(500);
    expect(r.incomeTax).toBe(309.764);
    expect(r.solidarityContribution).toBe(16.081);
    expect(r.netSalary).toBe(1490.555);
    expect(r.employerCnss).toBe(341.4);
    expect(r.employerCost).toBe(2341.4);
  });

  it('la répartition est équilibrée : brut + charges patronales = net + retenues + charges patronales', () => {
    const r = computePayslip({ grossSalary: 3456.789, bonuses: 120.5, otherDeductions: 33, headOfFamily: true, childrenCount: 1 }, S);
    const withheld = r.employeeCnss + r.incomeTax + r.solidarityContribution + r.otherDeductions;
    expect(Math.abs(r.totalGross - withheld - r.netSalary)).toBeLessThan(0.0011);
    expect(r.employerCost).toBeCloseTo(r.totalGross + r.employerCnss, 3);
  });

  it('petit salaire : pas d’impôt', () => {
    const r = computePayslip({ grossSalary: 500 }, S);
    expect(r.incomeTax).toBe(0);
    expect(r.solidarityContribution).toBeGreaterThanOrEqual(0);
    expect(r.netSalary).toBeCloseTo(500 - r.employeeCnss - r.solidarityContribution, 3);
  });

  it('plafonne les enfants déduits', () => {
    const four = computePayslip({ grossSalary: 3000, childrenCount: 4 }, S);
    const six = computePayslip({ grossSalary: 3000, childrenCount: 6 }, S);
    expect(six.details.familyDeduction).toBe(four.details.familyDeduction);
    expect(six.netSalary).toBe(four.netSalary);
  });

  it('ignore les valeurs négatives ou invalides', () => {
    const r = computePayslip({ grossSalary: -50, bonuses: NaN as any, childrenCount: -3 }, S);
    expect(r.totalGross).toBe(0);
    expect(r.netSalary).toBe(0);
  });

  it('les primes augmentent l’impôt de façon progressive', () => {
    const base = computePayslip({ grossSalary: 2500 }, S);
    const prime = computePayslip({ grossSalary: 2500, bonuses: 500 }, S);
    expect(prime.netSalary).toBeGreaterThan(base.netSalary);
    expect(prime.incomeTax).toBeGreaterThan(base.incomeTax);
  });

  it('respecte des paramètres personnalisés', () => {
    const custom = mergePayrollSettings({ cnssEmployeeRate: 10, solidarityRate: 0, brackets: [{ upTo: null, rate: 0 }] });
    const r = computePayslip({ grossSalary: 1000 }, custom);
    expect(r.employeeCnss).toBe(100);
    expect(r.incomeTax).toBe(0);
    expect(r.netSalary).toBe(900);
  });
});

describe('mergePayrollSettings', () => {
  it('retombe sur le barème par défaut si le barème fourni est vide', () => {
    expect(mergePayrollSettings({ brackets: [] }).brackets).toEqual(S.brackets);
    expect(mergePayrollSettings(null).cnssEmployeeRate).toBe(S.cnssEmployeeRate);
  });
  it('marque les paramètres par défaut comme non validés', () => {
    expect(S.validated).toBe(false);
  });
});

describe('workingDaysBetween', () => {
  const week = [1, 2, 3, 4, 5];
  it('compte les jours ouvrés d’une semaine, week-end exclu', () => {
    expect(workingDaysBetween('2026-03-02', '2026-03-08', week)).toBe(5);
  });
  it('compte mars 2026 = 22 jours', () => {
    expect(workingDaysBetween('2026-03-01', '2026-03-31', week)).toBe(22);
  });
  it('week-end seul = 0', () => {
    expect(workingDaysBetween('2027-02-06', '2027-02-07', week)).toBe(0);
  });
  it('gère un jour unique et une période inversée', () => {
    expect(workingDaysBetween('2026-03-02', '2026-03-02', week)).toBe(1);
    expect(workingDaysBetween('2026-03-05', '2026-03-02', week)).toBe(0);
  });
  it('respecte une semaine de travail personnalisée (samedi travaillé)', () => {
    expect(workingDaysBetween('2026-03-02', '2026-03-08', [1, 2, 3, 4, 5, 6])).toBe(6);
  });
});
