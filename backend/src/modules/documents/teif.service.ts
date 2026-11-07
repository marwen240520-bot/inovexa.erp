import { BadRequestException, Injectable } from '@nestjs/common';
import { Company } from '../company/company.entity';
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { amountToFrenchWords } from '../../common/number-words';
import { round } from '../../common/money';

/**
 * Facture électronique tunisienne — génération du fichier TEIF (Tunisian Electronic Invoice Format) version 1.8.8,
 * le format XML attendu par la plateforme El Fatoora de Tunisie TradeNet (TTN).
 *
 * Ce que fait ce service : produire, pour une facture ou un avoir validé, un XML conforme au schéma TTN
 * (`resources/teif/teif-1.8.8-withoutSig.xsd`) et au guide d'implémentation (codes « I-xx » de l'annexe A).
 *
 * Ce qu'il ne fait PAS (et qui relève de l'abonnement El Fatoora de la société, voir docs/EL-FATOORA.md) :
 *  - la signature électronique XAdES avec le certificat TunTrust de la société ;
 *  - la transmission à TTN et la récupération de la référence TTN (RefTtnVal).
 * Le fichier produit est celui que l'on dépose (ou envoie via le connecteur TTN) pour signature et validation.
 */

/** Codes de l'annexe A du guide TEIF utilisés ici. */
export const TEIF = {
  VERSION: '1.8.8',
  AGENCY: 'TTN',
  ID_TAX: 'I-01', // matricule fiscal tunisien
  ID_CIN: 'I-02', // carte d'identité nationale
  ID_FOREIGN: 'I-04', // identifiant étranger
  DOC_INVOICE: 'I-11',
  DOC_CREDIT_NOTE: 'I-12',
  DATE_ISSUE: 'I-31',
  DATE_DUE: 'I-32',
  PARTNER_SUPPLIER: 'I-62',
  PARTNER_CUSTOMER: 'I-64',
  REF_TRADE_REGISTER: 'I-815',
  REF_PURCHASE_ORDER: 'I-83',
  REF_REFERENCED_INVOICE: 'I-89',
  CONTACT_COMMERCIAL: 'I-93',
  COM_PHONE: 'I-101',
  COM_EMAIL: 'I-103',
  PAY_TERMS_BASIC: 'I-111',
  PAY_TERMS_FIXED_DATE: 'I-112',
  FII_BANK: 'I-142',
  ALLOWANCE_DISCOUNT: 'I-151',
  TAX_STAMP: 'I-1601',
  TAX_VAT: 'I-1602',
  AMT_LINE_TOTAL_HT: 'I-171',
  AMT_TOTAL_HT: 'I-176',
  AMT_TAX_BASE: 'I-177',
  AMT_TAX: 'I-178',
  AMT_CAPITAL: 'I-179',
  AMT_TOTAL_TTC: 'I-180',
  AMT_TOTAL_TAX: 'I-181',
  AMT_TOTAL_TAX_BASE: 'I-182',
  AMT_UNIT_HT: 'I-183',
  AMT_LINE_NET: 'I-188',
  FTX_OBSERVATION: 'I-48',
} as const;

/** Matricule fiscal au format TTN : 7 chiffres, clé, code TVA (A/B/D/N/P), catégorie (C/M/N/P), établissement 000. */
const TN_TAX_ID = /^[0-9]{7}[ABCDEFGHJKLMNPQRSTVWXYZ][ABDNP][CMNP]000$/;

export interface PartyIdentifier { type: string; value: string; physical: boolean }

/** « 1234567X/A/M/000 » (saisie ERP) ou « 1234567XAM000 » → identifiant TTN ; CIN à 8 chiffres acceptée (I-02). */
export function partyIdentifier(raw: string | null | undefined): PartyIdentifier | null {
  const compact = String(raw || '').toUpperCase().replace(/[\s/\-.]/g, '');
  if (!compact) return null;
  if (TN_TAX_ID.test(compact)) return { type: TEIF.ID_TAX, value: compact, physical: false };
  if (/^[0-9]{8}$/.test(compact)) return { type: TEIF.ID_CIN, value: compact, physical: true };
  return null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const cut = (s: unknown, max: number) => String(s ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
const amt = (n: unknown) => (Number(n) || 0).toFixed(3);
const rate = (n: unknown) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : String(round(v, 2));
};
/** AAAA-MM-JJ → ddMMyy (format TTN). */
const ddMMyy = (iso: string | Date | null | undefined) => {
  const s = iso instanceof Date ? iso.toISOString().slice(0, 10) : String(iso || '').slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}${m[2]}${m[1].slice(2)}` : null;
};
const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '');

export interface TeifInput {
  company: Company;
  doc: Document & { lines: DocumentLine[] };
  /** Numéro et date de la facture d'origine, pour un avoir. */
  credited?: { number: string | null; issueDate: string | null } | null;
}

@Injectable()
export class TeifService {
  /** Vérifie que tout ce que TTN exige est présent ; renvoie la liste des manques (vide = exportable). */
  problems(input: TeifInput): string[] {
    const { company, doc } = input;
    const out: string[] = [];
    if (!['invoice', 'credit_note'].includes(doc.type)) out.push('Seules les factures et avoirs de vente sont transmis à El Fatoora.');
    if (!doc.lockedAt || !doc.number) out.push('Le document doit être validé (numéro légal attribué).');
    if (doc.status === 'cancelled') out.push('Le document est annulé.');
    const supplier = partyIdentifier(company.taxId);
    if (!supplier || supplier.type !== TEIF.ID_TAX) out.push('Matricule fiscal de la société absent ou invalide (format attendu : 1234567X/A/M/000).');
    if (!cut(company.legalName, 200)) out.push('Raison sociale de la société manquante.');
    if (!cut(company.address, 500)) out.push('Adresse de la société manquante.');
    if (!partyIdentifier(doc.partyTaxId)) out.push('Matricule fiscal du client manquant ou invalide (ou CIN à 8 chiffres pour un particulier) — à renseigner sur la fiche client avant la validation.');
    if (!cut(doc.partyName, 200)) out.push('Nom du client manquant.');
    if (!ddMMyy(doc.issueDate)) out.push('Date d’émission invalide.');
    if (!input.doc.lines?.length) out.push('Le document n’a aucune ligne.');
    if ((doc.currency || 'TND') !== 'TND') out.push('Seules les factures en dinars (TND) sont prises en charge.');
    return out;
  }

  /** Nom de fichier conseillé pour le dépôt. */
  filename(doc: Document) {
    return `TEIF-${String(doc.number || doc.id).replace(/[^A-Za-z0-9_-]+/g, '_')}.xml`;
  }

  /** Génère le XML TEIF (non signé). Lève une erreur 400 listant les manques. */
  render(input: TeifInput): string {
    const problems = this.problems(input);
    if (problems.length) throw new BadRequestException(`Export El Fatoora impossible : ${problems.join(' ')}`);
    const { company, doc } = input;
    const supplier = partyIdentifier(company.taxId)!;
    const customer = partyIdentifier(doc.partyTaxId)!;
    const isCredit = doc.type === 'credit_note';
    const issue = ddMMyy(doc.issueDate)!;
    const due = ddMMyy(doc.dueDate);
    const globalDiscount = Math.max(0, Number(doc.globalDiscountPct) || 0) / 100;

    // Lignes : la remise globale est ventilée sur les lignes pour que la somme des lignes = total HT (contrôle TTN)
    const lineNets = doc.lines.map((l) => round((Number(l.netHT) || 0) * (1 - globalDiscount), 3));
    const drift = round((Number(doc.totalHT) || 0) - lineNets.reduce((t, x) => t + x, 0), 3);
    if (lineNets.length && Math.abs(drift) > 0 && Math.abs(drift) < 1) lineNets[lineNets.length - 1] = round(lineNets[lineNets.length - 1] + drift, 3);

    const lines = doc.lines.map((l, i) => {
      const discount = Math.max(0, Number(l.discountPct) || 0);
      return `      <Lin>
        <ItemIdentifier>${i + 1}</ItemIdentifier>
        <LinImd lang="fr">
          <ItemCode>${esc(cut(l.sku || (l.productId ? `ART-${l.productId}` : `L${i + 1}`), 35) || `L${i + 1}`)}</ItemCode>
          <ItemDescription>${esc(cut(l.description, 500) || 'Article')}</ItemDescription>
        </LinImd>
        <LinQty>
          <Quantity measurementUnit="${esc(cut(l.unit || 'UNIT', 8).toUpperCase() || 'UNIT')}">${amt(l.quantity)}</Quantity>
        </LinQty>
        <LinTax>
          <TaxTypeName code="${TEIF.TAX_VAT}">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${rate(l.vatRate)}</TaxRate>
          </TaxDetails>
        </LinTax>${discount > 0 ? `
        <LinAlc>
          <Alc allowanceCode="${TEIF.ALLOWANCE_DISCOUNT}">
            <AllowanceIdentifier>REM${rate(discount)}</AllowanceIdentifier>
            <SpecialServices lang="fr">Remise</SpecialServices>
          </Alc>
          <Pcd>
            <Percentage>${rate(discount)}</Percentage>
            <PercentageBasis>100</PercentageBasis>
          </Pcd>
        </LinAlc>` : ''}
        <LinMoa>
          <MoaDetails>
            <Moa amountTypeCode="${TEIF.AMT_UNIT_HT}" currencyCodeList="ISO_4217">
              <Amount currencyIdentifier="TND">${amt(l.unitPriceHT)}</Amount>
            </Moa>
          </MoaDetails>
          <MoaDetails>
            <Moa amountTypeCode="${TEIF.AMT_LINE_TOTAL_HT}" currencyCodeList="ISO_4217">
              <Amount currencyIdentifier="TND">${amt(lineNets[i])}</Amount>
            </Moa>
          </MoaDetails>
          <MoaDetails>
            <Moa amountTypeCode="${TEIF.AMT_LINE_NET}" currencyCodeList="ISO_4217">
              <Amount currencyIdentifier="TND">${amt(lineNets[i])}</Amount>
            </Moa>
          </MoaDetails>
        </LinMoa>
      </Lin>`;
    });

    // Taxes : TVA par taux, puis droit de timbre. La retenue à la source n'a pas de code dans le schéma 1.8.8 : en observation.
    const breakdown = (doc.vatBreakdown || []).filter((b) => Number(b.baseHT) !== 0 || Number(b.vatAmount) !== 0);
    const taxDetails = (breakdown.length ? breakdown : [{ rate: 0, baseHT: Number(doc.totalHT) || 0, vatAmount: 0 }]).map(
      (b) => `      <InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="${TEIF.TAX_VAT}">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${rate(b.rate)}</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <Moa amountTypeCode="${TEIF.AMT_TAX_BASE}" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${amt(b.baseHT)}</Amount>
          </Moa>
        </AmountDetails>
        <AmountDetails>
          <Moa amountTypeCode="${TEIF.AMT_TAX}" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${amt(b.vatAmount)}</Amount>
          </Moa>
        </AmountDetails>
      </InvoiceTaxDetails>`,
    );
    const stamp = Number(doc.stampDuty) || 0;
    if (stamp > 0) {
      taxDetails.push(`      <InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="${TEIF.TAX_STAMP}">Droit de timbre</TaxTypeName>
          <TaxDetails>
            <TaxRate>0</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <Moa amountTypeCode="${TEIF.AMT_TAX}" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${amt(stamp)}</Amount>
          </Moa>
        </AmountDetails>
      </InvoiceTaxDetails>`);
    }
    const totalHT = Number(doc.totalHT) || 0;
    const totalVat = Number(doc.totalVat) || 0;
    const totalTTC = round(totalHT + totalVat + stamp, 3);
    const withholding = Number(doc.withholdingAmount) || 0;

    const observations: string[] = [];
    if (withholding > 0) observations.push(`Retenue à la source ${rate(doc.withholdingRate)} % : ${amt(withholding)} TND ; net à payer ${amt(doc.netToPay)} TND.`);
    if (doc.notes) observations.push(cut(doc.notes, 500));

    const supplierRefs: string[] = [];
    if (company.tradeRegister) supplierRefs.push(this.ref(TEIF.REF_TRADE_REGISTER, cut(company.tradeRegister, 35)));
    // Le numéro CNSS (I-818, annexe A) n'est pas admis par le schéma XSD 1.8.8 : il n'est pas émis.
    const customerRefs: string[] = [];
    if (doc.externalRef) customerRefs.push(this.ref(TEIF.REF_PURCHASE_ORDER, cut(doc.externalRef, 35)));

    const contacts: string[] = [];
    const contactName = cut(company.tradeName || company.legalName, 200);
    if (company.phone) contacts.push(this.contact(contactName, TEIF.COM_PHONE, cut(company.phone, 500)));
    if (company.email) contacts.push(this.contact(contactName, TEIF.COM_EMAIL, cut(company.email, 500)));

    const rib = digits(company.bankAccount);
    const payment = `    <PytSection>
      <PytSectionDetails>
        <Pyt>
          <PaymentTearmsTypeCode>${due ? TEIF.PAY_TERMS_FIXED_DATE : TEIF.PAY_TERMS_BASIC}</PaymentTearmsTypeCode>
          <PaymentTearmsDescription>${esc(cut(doc.paymentTerms || (due ? `Paiement à l'échéance du ${String(doc.dueDate).slice(0, 10).split('-').reverse().join('/')}` : 'Paiement à réception'), 500))}</PaymentTearmsDescription>
        </Pyt>${rib && rib.length <= 20 ? `
        <PytFii functionCode="${TEIF.FII_BANK}">
          <AccountHolder>
            <AccountNumber>${rib}</AccountNumber>
            <OwnerIdentifier>${esc(cut(company.legalName, 70))}</OwnerIdentifier>
          </AccountHolder>${company.bankName ? `
          <InstitutionIdentification nameCode="${esc(cut(company.bankName, 11))}">
            <InstitutionName>${esc(cut(company.bankName, 70))}</InstitutionName>
          </InstitutionIdentification>` : ''}
        </PytFii>` : ''}
      </PytSectionDetails>
    </PytSection>
`;

    const credited = input.credited;
    const documentReferences = isCredit && credited?.number ? `
      <DocumentReferences>
        <DocumentReference>
          <Reference refID="${TEIF.REF_REFERENCED_INVOICE}">${esc(cut(credited.number, 70))}</Reference>${ddMMyy(credited.issueDate) ? `
          <ReferenceDate>
            <DateText functionCode="${TEIF.DATE_ISSUE}" format="ddMMyy">${ddMMyy(credited.issueDate)}</DateText>
          </ReferenceDate>` : ''}
        </DocumentReference>
      </DocumentReferences>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<TEIF version="${TEIF.VERSION}" controlingAgency="${TEIF.AGENCY}">
  <InvoiceHeader>
    <MessageSenderIdentifier type="${supplier.type}">${supplier.value}</MessageSenderIdentifier>
    <MessageRecieverIdentifier type="${customer.type}">${customer.value}</MessageRecieverIdentifier>
  </InvoiceHeader>
  <InvoiceBody>
    <Bgm>
      <DocumentIdentifier>${esc(cut(doc.number, 70))}</DocumentIdentifier>
      <DocumentType code="${isCredit ? TEIF.DOC_CREDIT_NOTE : TEIF.DOC_INVOICE}">${isCredit ? "Facture d'avoir" : 'Facture'}</DocumentType>${documentReferences}
    </Bgm>
    <Dtm>
      <DateText functionCode="${TEIF.DATE_ISSUE}" format="ddMMyy">${issue}</DateText>${due ? `
      <DateText functionCode="${TEIF.DATE_DUE}" format="ddMMyy">${due}</DateText>` : ''}
    </Dtm>
    <PartnerSection>
      <PartnerDetails functionCode="${TEIF.PARTNER_SUPPLIER}">
        <Nad>
          <PartnerIdentifier type="${supplier.type}">${supplier.value}</PartnerIdentifier>
          <PartnerName nameType="Qualification">${esc(cut(company.legalName, 200))}</PartnerName>
          ${this.address(company.address, company.city, company.postalCode)}
        </Nad>${supplierRefs.join('')}${contacts.join('')}
      </PartnerDetails>
      <PartnerDetails functionCode="${TEIF.PARTNER_CUSTOMER}">
        <Nad>
          <PartnerIdentifier type="${customer.type}">${customer.value}</PartnerIdentifier>
          <PartnerName nameType="${customer.physical ? 'Physical' : 'Qualification'}">${esc(cut(doc.partyName, 200))}</PartnerName>${doc.partyAddress ? `
          ${this.address(doc.partyAddress, null, null)}` : ''}
        </Nad>${customerRefs.join('')}
      </PartnerDetails>
    </PartnerSection>
${payment}${observations.length ? `    <Ftx>
      <FreeTextDetail subjectCode="${TEIF.FTX_OBSERVATION}">
${observations.map((o) => `        <FreeTexts>${esc(o)}</FreeTexts>`).join('\n')}
      </FreeTextDetail>
    </Ftx>
` : ''}    <LinSection>
${lines.join('\n')}
    </LinSection>
    <InvoiceMoa>${Number(company.shareCapital) > 0 ? `
      <AmountDetails>
        <Moa amountTypeCode="${TEIF.AMT_CAPITAL}" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${amt(company.shareCapital)}</Amount>
        </Moa>
      </AmountDetails>` : ''}
      <AmountDetails>
        <Moa amountTypeCode="${TEIF.AMT_TOTAL_HT}" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${amt(totalHT)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="${TEIF.AMT_TOTAL_TAX_BASE}" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${amt(totalHT)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="${TEIF.AMT_TOTAL_TAX}" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${amt(totalVat + stamp)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="${TEIF.AMT_TOTAL_TTC}" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${amt(totalTTC)}</Amount>
          <AmountDescription lang="fr">${esc(cut(amountToFrenchWords(totalTTC), 500))}</AmountDescription>
        </Moa>
      </AmountDetails>
    </InvoiceMoa>
    <InvoiceTax>
${taxDetails.join('\n')}
    </InvoiceTax>
  </InvoiceBody>
</TEIF>
`;
  }

  private address(full: string | null | undefined, city: string | null | undefined, postalCode: string | null | undefined) {
    const description = cut(full, 500) || cut(city, 500) || '-';
    return `<PartnerAdresses lang="fr">
            <AdressDescription>${esc(description)}</AdressDescription>${city ? `
            <CityName>${esc(cut(city, 35))}</CityName>` : ''}${postalCode ? `
            <PostalCode>${esc(cut(postalCode, 17))}</PostalCode>` : ''}
            <Country codeList="ISO_3166-1">TN</Country>
          </PartnerAdresses>`;
  }

  private ref(code: string, value: string) {
    return `
        <RffSection>
          <Reference refID="${code}">${esc(value)}</Reference>
        </RffSection>`;
  }

  private contact(name: string, means: string, value: string) {
    return `
        <CtaSection>
          <Contact functionCode="${TEIF.CONTACT_COMMERCIAL}">
            <ContactIdentifier>${esc(cut(name, 17) || 'CONTACT')}</ContactIdentifier>
            <ContactName>${esc(name || 'Contact')}</ContactName>
          </Contact>
          <Communication>
            <ComMeansType>${means}</ComMeansType>
            <ComAdress>${esc(value)}</ComAdress>
          </Communication>
        </CtaSection>`;
  }
}
