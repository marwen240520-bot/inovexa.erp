import {
  COUNTRY_CODES, CURRENCY_BY_COUNTRY, countryName, currencyDecimals, defaultCurrencyFor, isCountryCode, isCurrencyCode, isTunisia,
  PAYROLL_PACKS, hasPayrollPack, localFeatures, taxIdLabel, taxIdShortLabel,
} from '../../src/common/countries';
import { amountInWordsFor, amountToFrenchWords } from '../../src/common/number-words';
import { normalizePhone } from '../../src/common/phone';
import { parseVatRates, validateTaxId, vatRatesFor } from '../../src/common/fiscal';
import { computeTotals, fromMinor, round, toMillimes, toMinor } from '../../src/common/money';

describe('pays et devises', () => {
  it('reconnaît les codes pays ISO (dont le Kosovo) et refuse le reste', () => {
    for (const c of ['TN', 'FR', 'MA', 'US', 'JP', 'XK', 'BR']) expect(isCountryCode(c)).toBe(true);
    for (const c of ['ZZ', 'tn', 'TUN', '', 'AN', 'SU', null, undefined, 12]) expect(isCountryCode(c as any)).toBe(false);
    expect(COUNTRY_CODES.length).toBeGreaterThan(240);
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
  });

  it('donne le nom du pays dans la langue demandée, le code à défaut', () => {
    expect(countryName('TN', 'fr')).toBe('Tunisie');
    expect(countryName('FR', 'fr')).toBe('France');
    expect(countryName('DE', 'en')).toBe('Germany');
    expect(countryName('ES', 'es')).toBe('España');
    expect(countryName('ZZ')).toBe('ZZ');
  });

  it('propose la devise usuelle du pays et ne se trompe pas sur les cas courants', () => {
    expect(defaultCurrencyFor('TN')).toBe('TND');
    expect(defaultCurrencyFor('FR')).toBe('EUR');
    expect(defaultCurrencyFor('DE')).toBe('EUR');
    expect(defaultCurrencyFor('MA')).toBe('MAD');
    expect(defaultCurrencyFor('US')).toBe('USD');
    expect(defaultCurrencyFor('GB')).toBe('GBP');
    expect(defaultCurrencyFor('JP')).toBe('JPY');
    expect(defaultCurrencyFor('fr')).toBe('EUR');
    expect(defaultCurrencyFor('ZZ')).toBeNull();
    expect(defaultCurrencyFor(null)).toBeNull();
  });

  it('chaque devise proposée est un code à trois lettres, et chaque pays de la table existe', () => {
    for (const [country, currency] of Object.entries(CURRENCY_BY_COUNTRY)) {
      expect(isCountryCode(country)).toBe(true);
      expect(isCurrencyCode(currency)).toBe(true);
    }
  });

  it('valide le format d’un code devise', () => {
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('eur')).toBe(false);
    expect(isCurrencyCode('EURO')).toBe(false);
    expect(isCurrencyCode('E1R')).toBe(false);
    expect(isCurrencyCode(undefined)).toBe(false);
  });

  it('connaît les décimales de chaque devise (ISO 4217)', () => {
    expect(currencyDecimals('TND')).toBe(3);
    expect(currencyDecimals('KWD')).toBe(3);
    expect(currencyDecimals('BHD')).toBe(3);
    expect(currencyDecimals('EUR')).toBe(2);
    expect(currencyDecimals('usd')).toBe(2);
    expect(currencyDecimals('MAD')).toBe(2);
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('XOF')).toBe(0);
    expect(currencyDecimals('KRW')).toBe(0);
    expect(currencyDecimals('XXX')).toBe(2);
    expect(currencyDecimals(null)).toBe(2);
  });

  it('réserve le timbre, la retenue, le TEIF et la paie aux sociétés tunisiennes', () => {
    expect(localFeatures('TN')).toEqual({ stampDuty: true, withholding: true, teif: true, payroll: true });
    expect(localFeatures(undefined)).toEqual({ stampDuty: true, withholding: true, teif: true, payroll: true });
    for (const c of ['FR', 'MA', 'US', 'DZ', 'SA']) expect(localFeatures(c)).toEqual({ stampDuty: false, withholding: false, teif: false, payroll: false });
    // La paie suit un pack par pays (lois locales) ; sans pack, RH (employés, congés) reste disponible mais pas la paie.
    expect(Object.keys(PAYROLL_PACKS)).toEqual(['TN']);
    expect(hasPayrollPack('tn')).toBe(true);
    expect(hasPayrollPack('FR')).toBe(false);
    expect(localFeatures('FR').payroll).toBe(hasPayrollPack('FR'));
    expect(isTunisia('tn')).toBe(true);
    expect(isTunisia('FR')).toBe(false);
  });

  it('nomme l’identifiant fiscal selon le pays', () => {
    expect(taxIdLabel('TN')).toBe('Matricule fiscal');
    expect(taxIdLabel('FR')).toBe('Identifiant fiscal');
    expect(taxIdShortLabel('TN')).toBe('MF');
    expect(taxIdShortLabel(undefined)).toBe('MF');
    expect(taxIdShortLabel('FR')).toBe('ID fiscal');
  });
});

describe('identifiant fiscal par pays', () => {
  it('garde la règle stricte du matricule fiscal pour la Tunisie', () => {
    expect(validateTaxId('1234567X')).toMatchObject({ valid: true, kind: 'mf', normalized: '1234567X' });
    expect(validateTaxId('1234567x/a/m/000')).toMatchObject({ valid: true, kind: 'mf', normalized: '1234567X/A/M/000' });
    expect(validateTaxId('12345678')).toMatchObject({ valid: true, kind: 'cin' });
    expect(validateTaxId('', { country: 'TN' })).toMatchObject({ valid: true, kind: 'empty' });
    expect(validateTaxId('FR12345678901').valid).toBe(false);
    expect(validateTaxId('abc').valid).toBe(false);
  });

  it('accepte un format libre hors Tunisie, en le mettant en forme', () => {
    expect(validateTaxId('fr 12 345678901', { country: 'FR' })).toMatchObject({ valid: true, kind: 'other', normalized: 'FR 12 345678901' });
    expect(validateTaxId('001509176000008', { country: 'MA' })).toMatchObject({ valid: true, kind: 'other' });
    expect(validateTaxId('12-3456789', { country: 'US' })).toMatchObject({ valid: true, kind: 'other', normalized: '12-3456789' });
    expect(validateTaxId('', { country: 'FR' })).toMatchObject({ valid: true, kind: 'empty' });
  });

  it('refuse les identifiants étrangers trop courts, trop longs ou aux caractères étranges', () => {
    expect(validateTaxId('ab', { country: 'FR' }).valid).toBe(false);
    expect(validateTaxId('X'.repeat(41), { country: 'FR' }).valid).toBe(false);
    expect(validateTaxId('12$34', { country: 'FR' }).valid).toBe(false);
    expect(validateTaxId('<script>', { country: 'FR' }).valid).toBe(false);
    expect(validateTaxId('-123', { country: 'FR' }).valid).toBe(false);
  });

  it('une société tunisienne peut avoir un client ou un fournisseur étranger, avec son code pays devant', () => {
    expect(validateTaxId('FR12345678901', { country: 'TN', party: true })).toMatchObject({ valid: true, kind: 'other' });
    expect(validateTaxId('MA 001234567890123', { party: true })).toMatchObject({ valid: true, kind: 'other' });
    // un matricule tunisien reste contrôlé strictement, même pour un tiers
    expect(validateTaxId('1234567X/A/M/000', { party: true })).toMatchObject({ valid: true, kind: 'mf' });
    const bad = validateTaxId('12345', { party: true });
    expect(bad.valid).toBe(false);
    expect(bad.message).toContain('code pays');
    expect(validateTaxId('12345').message).not.toContain('code pays');
  });
});

describe('taux de TVA de la société', () => {
  it('lit une liste saisie : décimales, virgule, doublons, tri', () => {
    expect(parseVatRates([20, 5.5, 10, 20])).toEqual({ rates: [5.5, 10, 20] });
    expect(parseVatRates(['20', '5,5', 0])).toEqual({ rates: [0, 5.5, 20] });
    expect(parseVatRates([8.25])).toEqual({ rates: [8.25] });
  });

  it('refuse une liste vide, hors bornes, trop précise ou mal formée', () => {
    expect(parseVatRates([]).error).toBeTruthy();
    expect(parseVatRates('20').error).toBeTruthy();
    expect(parseVatRates([101]).error).toBeTruthy();
    expect(parseVatRates([-1]).error).toBeTruthy();
    expect(parseVatRates([12.345]).error).toBeTruthy();
    expect(parseVatRates(['abc']).error).toBeTruthy();
    expect(parseVatRates([null]).error).toBeTruthy();
    expect(parseVatRates([NaN]).error).toBeTruthy();
    expect(parseVatRates(Array.from({ length: 21 }, (_, i) => i)).error).toBeTruthy();
    expect(parseVatRates(Array.from({ length: 20 }, (_, i) => i)).rates).toHaveLength(20);
  });

  it('une société tunisienne sans liste garde 0, 7, 13 et 19 %', () => {
    expect(vatRatesFor({ countryCode: 'TN', vatRates: null, defaultVatRate: 19 })).toEqual([0, 7, 13, 19]);
    expect(vatRatesFor({ vatRates: null, defaultVatRate: 19 })).toEqual([0, 7, 13, 19]);
  });

  it('une société étrangère sans liste ne facture pas de TVA tant qu’elle n’a pas réglé ses taux', () => {
    expect(vatRatesFor({ countryCode: 'FR', vatRates: null, defaultVatRate: 0 })).toEqual([0]);
  });

  it('utilise la liste de la société et y ajoute toujours son taux par défaut', () => {
    expect(vatRatesFor({ countryCode: 'FR', vatRates: [20, 10, 5.5, 2.1], defaultVatRate: 20 })).toEqual([2.1, 5.5, 10, 20]);
    expect(vatRatesFor({ countryCode: 'FR', vatRates: [5.5, 10], defaultVatRate: 20 })).toEqual([5.5, 10, 20]);
    expect(vatRatesFor({ countryCode: 'TN', vatRates: [7], defaultVatRate: 19 })).toEqual([7, 19]);
    expect(vatRatesFor({ countryCode: 'FR', vatRates: [], defaultVatRate: 0 })).toEqual([0]);
  });
});

describe('montants selon les décimales de la devise', () => {
  it('convertit en unités mineures et inversement, à la précision demandée', () => {
    expect(toMinor(19.99, 2)).toBe(1999);
    expect(toMinor(0.1 + 0.2, 2)).toBe(30);
    expect(toMinor(1.005, 2)).toBe(101);
    expect(toMinor(1999.4, 0)).toBe(1999);
    expect(toMinor(19.999)).toBe(19999);
    expect(toMillimes(19.999)).toBe(19999);
    expect(fromMinor(1999, 2)).toBe(19.99);
    expect(fromMinor(5997, 0)).toBe(5997);
    expect(round(1.005, 2)).toBe(1.01);
  });

  it('dinar (3 décimales) : le comportement d’origine ne change pas', () => {
    const lines = [{ quantity: 3, unitPriceHT: 19.995, vatRate: 19 }, { quantity: 1.5, unitPriceHT: 12.345, discountPct: 10, vatRate: 7 }];
    const base = computeTotals(lines, { globalDiscountPct: 5, stampDuty: 1, withholdingRate: 1.5, withholdingThreshold: 0 });
    expect(computeTotals(lines, { globalDiscountPct: 5, stampDuty: 1, withholdingRate: 1.5, withholdingThreshold: 0, decimals: 3 })).toEqual(base);
    for (const bad of [7, -1, 1.5, NaN]) {
      expect(computeTotals(lines, { globalDiscountPct: 5, stampDuty: 1, withholdingRate: 1.5, withholdingThreshold: 0, decimals: bad })).toEqual(base);
    }
  });

  it('euro (2 décimales) : arrondi au centime, TVA par taux sur la base cumulée', () => {
    const one = computeTotals([{ quantity: 3, unitPriceHT: 19.99, vatRate: 20 }], { decimals: 2 });
    expect(one.totalHT).toBe(59.97);
    expect(one.totalVat).toBe(11.99);
    expect(one.totalTTC).toBe(71.96);
    expect(one.netToPay).toBe(71.96);

    const two = computeTotals([{ quantity: 1, unitPriceHT: 10, vatRate: 5.5 }, { quantity: 2, unitPriceHT: 4.99, vatRate: 20 }], { decimals: 2 });
    expect(two.vatBreakdown).toEqual([
      { rate: 5.5, baseHT: 10, vatAmount: 0.55 },
      { rate: 20, baseHT: 9.98, vatAmount: 2 },
    ]);
    expect(two.totalHT).toBe(19.98);
    expect(two.totalVat).toBe(2.55);
    expect(two.totalTTC).toBe(22.53);
  });

  it('euro : aucun montant n’a plus de deux décimales', () => {
    const t = computeTotals(
      [{ quantity: 7, unitPriceHT: 3.337, discountPct: 12.5, vatRate: 19.6 }, { quantity: 0.333, unitPriceHT: 99.99, vatRate: 8.25 }],
      { decimals: 2, globalDiscountPct: 3.3 },
    );
    const twoDecimals = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;
    const all = [t.subtotalHT, t.discountTotal, t.totalHT, t.totalVat, t.totalTTC, t.netToPay,
      ...t.lines.flatMap((l) => [l.grossHT, l.discountAmount, l.netHT, l.vatAmount, l.totalTTC]),
      ...t.vatBreakdown.flatMap((g) => [g.baseHT, g.vatAmount])];
    for (const n of all) expect(twoDecimals(n)).toBe(true);
    expect(round(t.totalHT + t.totalVat, 2)).toBe(t.totalTTC);
  });

  it('yen (0 décimale) : montants entiers', () => {
    const t = computeTotals([{ quantity: 3, unitPriceHT: 1999, vatRate: 10 }], { decimals: 0 });
    expect(t.totalHT).toBe(5997);
    expect(t.totalVat).toBe(600);
    expect(t.totalTTC).toBe(6597);
    expect(Number.isInteger(t.netToPay)).toBe(true);
  });

  it('sans TVA (taux 0) : le TTC est le HT, quelle que soit la devise', () => {
    for (const decimals of [0, 2, 3]) {
      const t = computeTotals([{ quantity: 2, unitPriceHT: 50, vatRate: 0 }], { decimals });
      expect(t.totalHT).toBe(100);
      expect(t.totalVat).toBe(0);
      expect(t.totalTTC).toBe(100);
    }
  });
});

describe('montant en lettres selon la devise', () => {
  it('garde la formulation d’origine pour le dinar tunisien', () => {
    expect(amountInWordsFor(120.3, 'TND')).toBe(amountToFrenchWords(120.3));
    expect(amountInWordsFor(120.3, 'TND')).toBe('cent vingt dinars et trois cents millimes');
    expect(amountInWordsFor(120.3, null)).toBe('cent vingt dinars et trois cents millimes');
  });

  it('écrit les euros et les centimes', () => {
    expect(amountInWordsFor(119.5, 'EUR')).toBe('cent dix-neuf euros et cinquante centimes');
    expect(amountInWordsFor(1, 'EUR')).toBe('un euro');
    expect(amountInWordsFor(0.5, 'EUR')).toBe('zéro euro et cinquante centimes');
    expect(amountInWordsFor(80, 'eur')).toBe('quatre-vingts euros');
    expect(amountInWordsFor(71.96, 'EUR')).toBe('soixante et onze euros et quatre-vingt-seize centimes');
  });

  it('accorde les noms féminins et les millions', () => {
    expect(amountInWordsFor(1, 'GBP')).toBe('une livre sterling');
    expect(amountInWordsFor(21, 'GBP')).toBe('vingt et une livres sterling');
    expect(amountInWordsFor(21000, 'GBP')).toBe('vingt et un mille livres sterling');
    expect(amountInWordsFor(1_000_000, 'EUR')).toBe("un million d'euros");
    expect(amountInWordsFor(2_000_000, 'USD')).toBe('deux millions de dollars');
  });

  it('gère les devises sans subdivision et à trois décimales', () => {
    expect(amountInWordsFor(5997, 'JPY')).toBe('cinq mille neuf cent quatre-vingt-dix-sept yens');
    expect(amountInWordsFor(1.5, 'KWD')).toBe('un dinar koweïtien et cinq cents fils');
    expect(amountInWordsFor(1250, 'XOF')).toBe('mille deux cent cinquante francs CFA');
  });

  it('n’invente pas le nom d’une devise inconnue : pas de montant en lettres', () => {
    expect(amountInWordsFor(10, 'XXX')).toBeNull();
    expect(amountInWordsFor(10, 'BRL')).toBeNull();
  });
});

describe('téléphone selon le pays', () => {
  it('Tunisie : les numéros locaux à 8 chiffres sont acceptés', () => {
    expect(normalizePhone('22 535 181')).toMatchObject({ valid: true, normalized: '+21622535181' });
    expect(normalizePhone('+33 6 12 34 56 78')).toMatchObject({ valid: true, normalized: '+33612345678' });
  });

  it('hors Tunisie : l’indicatif du pays est obligatoire', () => {
    const local = normalizePhone('22 535 181', { international: true });
    expect(local.valid).toBe(false);
    expect(local.message).toContain('indicatif');
    expect(normalizePhone('06 12 34 56 78', { international: true }).valid).toBe(false);
    expect(normalizePhone('+33 6 12 34 56 78', { international: true })).toMatchObject({ valid: true, normalized: '+33612345678' });
    expect(normalizePhone('0033 6 12 34 56 78', { international: true })).toMatchObject({ valid: true, normalized: '+33612345678' });
    expect(normalizePhone('', { international: true })).toMatchObject({ valid: true, normalized: '' });
  });
});

describe('devises', () => {
  it('seuls les codes ISO 4217 réels sont acceptés', () => {
    for (const ok of ['TND', 'EUR', 'USD', 'JPY', 'MAD', 'XOF', 'KWD']) expect(isCurrencyCode(ok)).toBe(true);
    for (const ko of ['ZZZ', 'ABC', 'EU', 'euro', 'eur', '123', '', null, undefined, 42]) expect(isCurrencyCode(ko)).toBe(false);
  });

  it('toute devise proposée par pays est reconnue', () => {
    for (const code of Object.values(CURRENCY_BY_COUNTRY)) expect(isCurrencyCode(code)).toBe(true);
  });
});
