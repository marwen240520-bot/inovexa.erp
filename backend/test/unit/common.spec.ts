import { computeTotals, round, weightedAverageCost, toMillimes } from '../../src/common/money';
import { amountToFrenchWords, integerToFrench } from '../../src/common/number-words';
import { stampDutyFor, validateTaxId } from '../../src/common/fiscal';

describe('round / millimes', () => {
  it('arrondit commercialement et symétriquement', () => {
    expect(round(1.0005)).toBe(1.001);
    expect(round(-1.0005)).toBe(-1.001);
    expect(round(2.675, 2)).toBe(2.68);
    expect(round(0.1 + 0.2)).toBe(0.3);
    expect(toMillimes(19.999)).toBe(19999);
  });
});

describe('computeTotals', () => {
  it('calcule HT, TVA par taux, TTC et net à payer (timbre + retenue)', () => {
    const t = computeTotals(
      [
        { quantity: 3, unitPriceHT: 100, vatRate: 19 },
        { quantity: 2, unitPriceHT: 50.5, vatRate: 7 },
      ],
      { stampDuty: 1, withholdingRate: 1.5 },
    );
    expect(t.totalHT).toBe(401);
    expect(t.vatBreakdown).toEqual([
      { rate: 7, baseHT: 101, vatAmount: 7.07 },
      { rate: 19, baseHT: 300, vatAmount: 57 },
    ]);
    expect(t.totalVat).toBe(64.07);
    expect(t.totalTTC).toBe(465.07);
    expect(t.withholdingAmount).toBe(0); // sous le seuil de 1 000 DT
    expect(t.netToPay).toBe(466.07);
  });

  it('applique la retenue à la source au-dessus du seuil, sur le TTC', () => {
    const t = computeTotals([{ quantity: 1, unitPriceHT: 2000, vatRate: 19 }], { stampDuty: 1, withholdingRate: 1.5 });
    expect(t.totalTTC).toBe(2380);
    expect(t.withholdingAmount).toBe(35.7);
    expect(t.netToPay).toBe(2380 + 1 - 35.7);
  });

  it('gère remises de ligne, remise globale et millimes', () => {
    const t = computeTotals([{ quantity: 1.5, unitPriceHT: 12.345, discountPct: 10, vatRate: 19 }], { globalDiscountPct: 5 });
    // brut 18.5175 -> 18.518 ; -10 % = 16.666 ; -5 % = 15.833
    expect(t.lines[0].grossHT).toBe(18.518);
    expect(t.totalHT).toBe(15.833);
    expect(t.totalVat).toBe(3.008);
    expect(t.totalTTC).toBe(18.841);
  });

  it('ne dérive jamais : 1000 lignes à 0,1 DT = 100 DT exactement', () => {
    const lines = Array.from({ length: 1000 }, () => ({ quantity: 1, unitPriceHT: 0.1, vatRate: 0 }));
    expect(computeTotals(lines).totalHT).toBe(100);
  });

  it('avoir : montants négatifs conservent la symétrie', () => {
    const t = computeTotals([{ quantity: -1, unitPriceHT: 100, vatRate: 19 }]);
    expect(t.totalHT).toBe(-100);
    expect(t.totalVat).toBe(-19);
    expect(t.totalTTC).toBe(-119);
  });
});

describe('CMUP', () => {
  it('pondère les entrées', () => {
    expect(weightedAverageCost(10, 5, 10, 7)).toBe(6);
    expect(weightedAverageCost(0, 0, 4, 9.5)).toBe(9.5);
    expect(weightedAverageCost(10, 5, 0, 99)).toBe(5);
  });
});

describe('montant en lettres', () => {
  const cases: Array<[number, string]> = [
    [0, 'zéro'], [1, 'un'], [16, 'seize'], [17, 'dix-sept'], [21, 'vingt et un'], [31, 'trente et un'],
    [71, 'soixante et onze'], [77, 'soixante-dix-sept'], [80, 'quatre-vingts'], [81, 'quatre-vingt-un'],
    [91, 'quatre-vingt-onze'], [99, 'quatre-vingt-dix-neuf'], [100, 'cent'], [101, 'cent un'], [180, 'cent quatre-vingts'],
    [200, 'deux cents'], [201, 'deux cent un'], [1000, 'mille'], [1001, 'mille un'], [2000, 'deux mille'],
    [80000, 'quatre-vingt mille'], [100000, 'cent mille'], [200000, 'deux cent mille'], [1_000_000, 'un million'],
    [2_000_000, 'deux millions'], [1_999_999, 'un million neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf'],
  ];
  it.each(cases)('%d -> %s', (n, words) => expect(integerToFrench(n)).toBe(words));

  it('dinars et millimes', () => {
    expect(amountToFrenchWords(1234.567)).toBe('mille deux cent trente-quatre dinars et cinq cent soixante-sept millimes');
    expect(amountToFrenchWords(1)).toBe('un dinar');
    expect(amountToFrenchWords(0.5)).toBe('zéro dinar et cinq cents millimes');
    expect(amountToFrenchWords(2380.001)).toBe('deux mille trois cent quatre-vingts dinars et un millime');
  });
});

describe('fiscalité tunisienne', () => {
  it('timbre : forfait et barème grandes surfaces', () => {
    expect(stampDutyFor(500)).toBe(1);
    expect(stampDutyFor(30, 'large_store')).toBe(1);
    expect(stampDutyFor(75, 'large_store')).toBe(1.5);
    expect(stampDutyFor(100.001, 'large_store')).toBe(2);
  });
  it('matricule fiscal', () => {
    expect(validateTaxId('1234567A')).toMatchObject({ valid: true, kind: 'mf', normalized: '1234567A' });
    expect(validateTaxId('1234567/x/a/m/000')).toMatchObject({ valid: true, normalized: '1234567X/A/M/000' });
    expect(validateTaxId('1234567/a/m/000').valid).toBe(false); // catégorie TVA manquante
    expect(validateTaxId('12345678')).toMatchObject({ valid: true, kind: 'cin' });
    expect(validateTaxId('')).toMatchObject({ valid: true, kind: 'empty' });
    expect(validateTaxId('ABC123').valid).toBe(false);
    expect(validateTaxId('123456A').valid).toBe(false);
  });
});
