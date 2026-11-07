import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TeifService, partyIdentifier } from '../../src/modules/documents/teif.service';

const XSD = path.resolve(__dirname, '../../resources/teif/teif-1.8.8-withoutSig.xsd');

const company: any = {
  legalName: 'Société Test SARL', tradeName: 'Inovexa', legalForm: 'SARL', taxId: '1234567X/A/M/000', tradeRegister: 'B1234562020', cnssNumber: '123456-78',
  shareCapital: 10000, address: '12 rue de Carthage', city: 'Tunis', postalCode: '1000', phone: '71000000', email: 'contact@test.tn', bankName: 'BIAT', bankAccount: '08 006 0123456789012 34',
};
const line = (over: Partial<any> = {}) => ({
  position: 0, productId: 7, sku: 'ERP-A', description: 'Imprimante', unit: null, quantity: 2, unitPriceHT: 100, discountPct: 0, vatRate: 19, netHT: 200, vatAmount: 38, totalTTC: 238, ...over,
});
const invoice = (over: Partial<any> = {}): any => ({
  id: 5, type: 'invoice', number: 'FA-2026-00012', status: 'validated', lockedAt: new Date(), issueDate: '2026-03-15', dueDate: '2026-04-14', currency: 'TND',
  partyType: 'client', partyId: 3, partyName: 'Client Histo', partyTaxId: '7654321B/A/M/000', partyAddress: '5 avenue Habib Bourguiba, Tunis', paymentTerms: '30 jours', externalRef: 'BC-77',
  globalDiscountPct: 0, subtotalHT: 200, discountTotal: 0, totalHT: 200, vatBreakdown: [{ rate: 19, baseHT: 200, vatAmount: 38 }], totalVat: 38, totalTTC: 238, stampDuty: 1,
  withholdingRate: 0, withholdingAmount: 0, netToPay: 239, notes: null, creditedDocumentId: null, lines: [line()], ...over,
});

/** Validation XSD avec xmllint quand il est installé (sinon le test ne vérifie que la structure). */
function xsdErrors(xml: string): string | null {
  const probe = spawnSync('xmllint', ['--version'], { encoding: 'utf8' });
  if (probe.error) return null;
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'teif-')), 'invoice.xml');
  fs.writeFileSync(file, xml);
  const r = spawnSync('xmllint', ['--noout', '--schema', XSD, file], { encoding: 'utf8' });
  return r.status === 0 ? '' : `${r.stderr}\n${r.stdout}`;
}

describe('partyIdentifier (identifiants TTN)', () => {
  it('normalise le matricule fiscal saisi dans l’ERP', () => {
    expect(partyIdentifier('1234567X/A/M/000')).toEqual({ type: 'I-01', value: '1234567XAM000', physical: false });
    expect(partyIdentifier('1234567xam000')).toEqual({ type: 'I-01', value: '1234567XAM000', physical: false });
  });
  it('accepte une CIN (particulier) et refuse les formes incomplètes', () => {
    expect(partyIdentifier('01234567')).toEqual({ type: 'I-02', value: '01234567', physical: true });
    expect(partyIdentifier('7654321B')).toBeNull(); // forme courte : code TVA / catégorie / établissement manquants
    expect(partyIdentifier('1234567O/A/M/000')).toBeNull(); // la lettre O n'est pas une clé valide
    expect(partyIdentifier('')).toBeNull();
  });
});

describe('TeifService', () => {
  const svc = new TeifService();

  it('liste les manques avant export', () => {
    expect(svc.problems({ company, doc: invoice() })).toEqual([]);
    const p = svc.problems({ company: { ...company, taxId: '' }, doc: invoice({ lockedAt: null, number: null, partyTaxId: '7654321B', lines: [] }) });
    expect(p.join(' ')).toMatch(/validé/);
    expect(p.join(' ')).toMatch(/société absent/);
    expect(p.join(' ')).toMatch(/client manquant/);
    expect(p.join(' ')).toMatch(/aucune ligne/);
  });

  it('génère une facture TEIF 1.8.8 conforme au schéma TTN', () => {
    const xml = svc.render({ company, doc: invoice() });
    expect(xml).toContain('<TEIF version="1.8.8" controlingAgency="TTN">');
    expect(xml).toContain('<MessageSenderIdentifier type="I-01">1234567XAM000</MessageSenderIdentifier>');
    expect(xml).toContain('<MessageRecieverIdentifier type="I-01">7654321BAM000</MessageRecieverIdentifier>');
    expect(xml).toContain('<DocumentType code="I-11">Facture</DocumentType>');
    expect(xml).toContain('<DateText functionCode="I-31" format="ddMMyy">150326</DateText>');
    expect(xml).toContain('<DateText functionCode="I-32" format="ddMMyy">140426</DateText>');
    expect(xml).toContain('<PartnerDetails functionCode="I-62">');
    expect(xml).toContain('<PartnerDetails functionCode="I-64">');
    expect(xml).toContain('<Reference refID="I-815">B1234562020</Reference>');
    expect(xml).toContain('<Reference refID="I-83">BC-77</Reference>');
    expect(xml).toContain('<AccountNumber>08006012345678901234</AccountNumber>');
    expect(xml).toContain('<Moa amountTypeCode="I-176" currencyCodeList="ISO_4217">\n          <Amount currencyIdentifier="TND">200.000</Amount>');
    expect(xml).toContain('<Amount currencyIdentifier="TND">239.000</Amount>'); // TTC = HT + TVA + timbre
    expect(xml).toContain('<AmountDescription lang="fr">deux cent trente-neuf dinars</AmountDescription>');
    expect(xml).toContain('<TaxTypeName code="I-1601">Droit de timbre</TaxTypeName>');
    expect(xml).toContain('<Moa amountTypeCode="I-178" currencyCodeList="ISO_4217">\n            <Amount currencyIdentifier="TND">38.000</Amount>');
    const errors = xsdErrors(xml);
    if (errors === null) console.warn('xmllint absent : validation XSD non exécutée');
    else expect(errors).toBe('');
  });

  it('avoir : type I-12, référence à la facture d’origine, retenue en observation, remise ventilée', () => {
    const doc = invoice({
      type: 'credit_note', number: 'AV-2026-00003', creditedDocumentId: 5, dueDate: null, externalRef: null,
      lines: [line({ discountPct: 10, netHT: 180, vatAmount: 34.2, totalTTC: 214.2 }), line({ position: 1, sku: null, productId: null, description: 'Port', quantity: 1, unitPriceHT: 20, netHT: 20, vatAmount: 3.8, totalTTC: 23.8 })],
      globalDiscountPct: 5, subtotalHT: 200, discountTotal: 10, totalHT: 190, vatBreakdown: [{ rate: 19, baseHT: 190, vatAmount: 36.1 }], totalVat: 36.1, totalTTC: 226.1, stampDuty: 0,
      withholdingRate: 1.5, withholdingAmount: 3.392, netToPay: 222.708,
    });
    const xml = svc.render({ company, doc, credited: { number: 'FA-2026-00012', issueDate: '2026-03-15' } });
    expect(xml).toContain('<DocumentType code="I-12">Facture d\'avoir</DocumentType>');
    expect(xml).toContain('<Reference refID="I-89">FA-2026-00012</Reference>');
    expect(xml).toContain('<Percentage>10</Percentage>');
    expect(xml).toContain('<FreeTexts>Retenue à la source 1.5 % : 3.392 TND ; net à payer 222.708 TND.</FreeTexts>');
    expect(xml).toContain('<ItemCode>L2</ItemCode>');
    // 180 et 20 remisés de 5 % = 171 + 19 = 190 = total HT
    expect(xml).toContain('<Amount currencyIdentifier="TND">171.000</Amount>');
    expect(xml).toContain('<Amount currencyIdentifier="TND">19.000</Amount>');
    expect(xml).not.toContain('functionCode="I-32"');
    const errors = xsdErrors(xml);
    if (errors !== null) expect(errors).toBe('');
  });

  it('refuse un document non éligible avec un message explicite', () => {
    expect(() => svc.render({ company, doc: invoice({ type: 'quote' }) })).toThrow(/factures et avoirs/);
    expect(() => svc.render({ company, doc: invoice({ partyTaxId: '7654321B' }) })).toThrow(/Matricule fiscal du client/);
  });
});
