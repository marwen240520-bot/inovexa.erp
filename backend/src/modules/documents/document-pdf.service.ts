import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');
import { Company } from '../company/company.entity';
import { DOC_META } from './documents.types';
import { DocumentType } from './entities/document.entity';

const PAGE = { w: 595.28, h: 841.89, margin: 40 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#d1d5db';
const ACCENT = '#1d4ed8';
/** Cadre maximal du logo dans l'en-tête (le logo garde ses proportions) : agrandir ces valeurs pour un logo plus grand. */
const LOGO_MAX = { w: 200, h: 100 };

/** Les polices PDF standard ne couvrent que le latin : tout autre caractère est remplacé pour éviter un texte illisible. */
const clean = (s: unknown) =>
  String(s ?? '').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ‘’“”–—…€]/g, '?');

/** 1234.5 -> « 1 234,500 » (espace insécable remplacé par une espace simple, absente de la police). */
export function formatAmount(n: number | null | undefined, decimals = 3): string {
  const v = Number(n) || 0;
  const [int, dec] = Math.abs(v).toFixed(decimals).split('.');
  const spaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0 ? '-' : ''}${spaced}${dec ? ',' + dec : ''}`;
}

const formatQty = (n: number) => {
  const s = Number(n).toFixed(3).replace(/\.?0+$/, '');
  return s.replace('.', ',');
};

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '';
  const s = typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10);
  const [y, m, day] = s.split('-');
  return `${day}/${m}/${y}`;
};

/** Logo par défaut des documents (backend/resources/brand/logo.png) quand la société n'a pas chargé le sien. */
let defaultLogo: Buffer | null | undefined;
function brandLogo(): Buffer | null {
  if (defaultLogo !== undefined) return defaultLogo;
  const candidates = [
    path.resolve(process.cwd(), 'resources/brand/logo.png'),
    path.resolve(__dirname, '../../../resources/brand/logo.png'), // src/modules/documents (ts-node)
    path.resolve(__dirname, '../../../../resources/brand/logo.png'), // dist/src/modules/documents
  ];
  defaultLogo = null;
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { defaultLogo = fs.readFileSync(c); break; } } catch { /* suivant */ }
  }
  return defaultLogo;
}

/** Hauteur réellement dessinée d'un logo ajusté au cadre LOGO_MAX (même calcul que l'option `fit` de PDFKit). */
function fittedLogoHeight(pdf: PDFKit.PDFDocument, logo: Buffer): number {
  try {
    const img = (pdf as unknown as { openImage(src: Buffer): { width: number; height: number; orientation?: number } }).openImage(logo);
    const [w, h] = (img.orientation ?? 1) > 4 ? [img.height, img.width] : [img.width, img.height];
    return w / h > LOGO_MAX.w / LOGO_MAX.h ? LOGO_MAX.w * (h / w) : LOGO_MAX.h;
  } catch {
    return LOGO_MAX.h;
  }
}

@Injectable()
export class DocumentPdfService {
  /** Génère le PDF d'un document commercial (le « document » est le résultat de DocumentsService.get). */
  render(company: Company, doc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Auteur fixe : le nom de l'utilisateur / de la société n'apparaît plus, même dans les propriétés du fichier.
      const pdf = new PDFDocument({ size: 'A4', margins: { top: PAGE.margin, left: PAGE.margin, right: PAGE.margin, bottom: 92 }, bufferPages: true, info: { Title: `${doc.typeLabel} ${doc.number || ''}`.trim(), Author: 'Inovexa ERP' } });
      const chunks: Buffer[] = [];
      pdf.on('data', (c: Buffer) => chunks.push(c));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);
      try {
        this.draw(pdf, company, doc);
        pdf.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  private draw(pdf: PDFKit.PDFDocument, company: Company, doc: any) {
    const type = doc.type as DocumentType;
    const meta = DOC_META[type];
    const isDraft = !doc.lockedAt;

    // ── En-tête : logo (agrandi) à gauche, document à droite ──
    // Les coordonnées de l'utilisateur / de la société (nom, adresse, ville, MF, RC, téléphone) ne sont plus imprimées.
    let y = PAGE.margin;
    // Logo : celui chargé par la société (Paramètres › Société), sinon le logo par défaut de l'application.
    let logo: Buffer | null = null;
    if (company.logoDataUrl) {
      try { logo = Buffer.from(company.logoDataUrl.split(',')[1], 'base64'); } catch { logo = null; }
    }
    if (!logo) logo = brandLogo();
    let logoBottom = y;
    if (logo) {
      try {
        pdf.image(logo, PAGE.margin, y, { fit: [LOGO_MAX.w, LOGO_MAX.h] });
        logoBottom = y + fittedLogoHeight(pdf, logo); // le cadre client se place juste sous le logo
      } catch {
        /* logo illisible : on continue sans */
      }
    }

    const rightX = PAGE.w - PAGE.margin - 220;
    pdf.fillColor(ACCENT).font('Helvetica-Bold').fontSize(20).text(clean(doc.typeLabel).toUpperCase(), rightX, y, { width: 220, align: 'right' });
    pdf.fillColor(INK).fontSize(11).text(clean(doc.number || 'BROUILLON'), rightX, pdf.y, { width: 220, align: 'right' });
    pdf.font('Helvetica').fontSize(8.5).fillColor(MUTED);
    pdf.text(`Date : ${formatDate(doc.issueDate)}`, rightX, pdf.y + 2, { width: 220, align: 'right' });
    if (doc.type === 'quote' && doc.validUntil) pdf.text(`Valable jusqu'au : ${formatDate(doc.validUntil)}`, rightX, pdf.y, { width: 220, align: 'right' });
    if (meta.settles && !meta.isCredit && doc.dueDate) pdf.text(`Échéance : ${formatDate(doc.dueDate)}`, rightX, pdf.y, { width: 220, align: 'right' });
    if (doc.externalRef) pdf.text(`Réf. : ${clean(doc.externalRef)}`, rightX, pdf.y, { width: 220, align: 'right' });
    if (doc.sources?.length) pdf.text(`${meta.isCredit ? 'Facture' : 'Réf. documents'} : ${doc.sources.map((s: any) => s.number).filter(Boolean).join(', ')}`, rightX, pdf.y, { width: 220, align: 'right' });
    y = Math.max(pdf.y, logoBottom) + 14;

    // ── Tiers : cadre client / fournisseur à gauche, sous le logo ──
    const partyLabel = meta.party === 'client' ? 'CLIENT' : 'FOURNISSEUR';
    const boxX = PAGE.margin;
    const partyLines = [
      doc.partyName,
      doc.partyTaxId ? `MF : ${doc.partyTaxId}` : '',
      doc.partyAddress || '',
      doc.partyPhone ? `Tél : ${doc.partyPhone}` : '',
    ].filter(Boolean);
    const boxH = 22 + partyLines.length * 12 + 6;
    pdf.roundedRect(boxX, y, 260, boxH, 4).strokeColor(LINE).lineWidth(0.8).stroke();
    pdf.fillColor(MUTED).font('Helvetica-Bold').fontSize(7.5).text(partyLabel, boxX + 10, y + 7);
    pdf.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(clean(partyLines[0]), boxX + 10, y + 18, { width: 240 });
    pdf.font('Helvetica').fontSize(8.5).fillColor(INK);
    let py = pdf.y;
    for (const l of partyLines.slice(1)) {
      pdf.text(clean(l), boxX + 10, py, { width: 240 });
      py = pdf.y;
    }
    y += boxH + 16;

    // ── Tableau des lignes ──
    const cols = [
      { key: 'description', label: 'Désignation', w: 245, align: 'left' as const },
      { key: 'quantity', label: 'Qté', w: 48, align: 'right' as const },
      { key: 'unitPriceHT', label: 'P.U. HT', w: 64, align: 'right' as const },
      { key: 'discountPct', label: 'Rem. %', w: 42, align: 'right' as const },
      { key: 'vatRate', label: 'TVA %', w: 40, align: 'right' as const },
      { key: 'netHT', label: 'Total HT', w: 76, align: 'right' as const },
    ];
    const drawHeader = (top: number) => {
      pdf.rect(PAGE.margin, top, CONTENT_W, 18).fill('#f3f4f6');
      let x = PAGE.margin;
      pdf.fillColor(INK).font('Helvetica-Bold').fontSize(8);
      for (const c of cols) {
        pdf.text(c.label, x + 4, top + 5, { width: c.w - 8, align: c.align });
        x += c.w;
      }
      return top + 18;
    };
    y = drawHeader(y);
    pdf.font('Helvetica').fontSize(8.5);
    const bottomLimit = PAGE.h - 120;
    for (const l of doc.lines as any[]) {
      const descr = clean(l.sku ? `${l.description}\nRéf. ${l.sku}` : l.description);
      const rowH = Math.max(16, pdf.heightOfString(descr, { width: cols[0].w - 8 }) + 8);
      if (y + rowH > bottomLimit) {
        pdf.addPage();
        y = drawHeader(PAGE.margin);
        pdf.font('Helvetica').fontSize(8.5);
      }
      let x = PAGE.margin;
      pdf.fillColor(INK);
      const cells = [descr, `${formatQty(l.quantity)}${l.unit ? ' ' + clean(l.unit) : ''}`, formatAmount(l.unitPriceHT), l.discountPct ? formatQty(l.discountPct) : '', formatQty(l.vatRate), formatAmount(l.netHT)];
      cols.forEach((c, i) => {
        pdf.text(cells[i], x + 4, y + 4, { width: c.w - 8, align: c.align });
        x += c.w;
      });
      y += rowH;
      pdf.moveTo(PAGE.margin, y).lineTo(PAGE.margin + CONTENT_W, y).strokeColor(LINE).lineWidth(0.5).stroke();
    }

    // ── Totaux (bloc à droite) + TVA par taux (à gauche) ──
    const totalsRows: Array<[string, string, boolean?]> = [];
    if (doc.discountTotal > 0) {
      totalsRows.push(['Total brut HT', formatAmount(doc.subtotalHT)]);
      totalsRows.push(['Remises', `-${formatAmount(doc.discountTotal)}`]);
    }
    totalsRows.push(['Total HT', formatAmount(doc.totalHT)]);
    totalsRows.push(['Total TVA', formatAmount(doc.totalVat)]);
    totalsRows.push(['Total TTC', formatAmount(doc.totalTTC), true]);
    if (doc.stampDuty > 0) totalsRows.push(['Droit de timbre', formatAmount(doc.stampDuty)]);
    if (doc.withholdingAmount > 0) totalsRows.push([`Retenue à la source (${formatQty(doc.withholdingRate)} %)`, `-${formatAmount(doc.withholdingAmount)}`]);
    const netLabel = meta.settles ? (meta.isCredit ? 'Net à rembourser / imputer' : 'Net à payer') : 'Total TTC';
    const showNet = meta.settles;
    const blockH = totalsRows.length * 15 + (showNet ? 30 : 4) + 10;
    if (y + blockH + 120 > PAGE.h - 60) {
      pdf.addPage();
      y = PAGE.margin;
    }
    y += 12;
    const totalsX = PAGE.w - PAGE.margin - 230;
    let ty = y;
    for (const [label, value, bold] of totalsRows) {
      pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(INK);
      pdf.text(clean(label), totalsX, ty, { width: 140 });
      pdf.text(value, totalsX + 140, ty, { width: 90, align: 'right' });
      ty += 15;
    }
    if (showNet) {
      pdf.rect(totalsX - 6, ty + 2, 236, 24).fill(ACCENT);
      pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
      pdf.text(netLabel, totalsX, ty + 9, { width: 140 });
      pdf.text(`${formatAmount(doc.netToPay)} ${doc.currency}`, totalsX + 100, ty + 9, { width: 130, align: 'right' });
      ty += 30;
    }

    // TVA par taux
    let vy = y;
    if (doc.vatBreakdown?.length) {
      pdf.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('DÉTAIL TVA', PAGE.margin, vy);
      vy += 12;
      pdf.font('Helvetica-Bold').fontSize(8).fillColor(INK);
      pdf.text('Taux', PAGE.margin, vy, { width: 50 });
      pdf.text('Base HT', PAGE.margin + 50, vy, { width: 70, align: 'right' });
      pdf.text('TVA', PAGE.margin + 120, vy, { width: 70, align: 'right' });
      vy += 12;
      pdf.font('Helvetica').fontSize(8.5);
      for (const g of doc.vatBreakdown) {
        pdf.text(`${formatQty(g.rate)} %`, PAGE.margin, vy, { width: 50 });
        pdf.text(formatAmount(g.baseHT), PAGE.margin + 50, vy, { width: 70, align: 'right' });
        pdf.text(formatAmount(g.vatAmount), PAGE.margin + 120, vy, { width: 70, align: 'right' });
        vy += 12;
      }
    }

    y = Math.max(ty, vy) + 8;
    // Montant en lettres
    pdf.font('Helvetica').fontSize(8.5).fillColor(INK);
    const noun = meta.label.toLowerCase();
    const inWords = `${noun.startsWith('facture') ? 'Arrêtée la présente' : 'Arrêté le présent'} ${noun} à la somme de : ${doc.amountInWords}`;
    pdf.text(clean(inWords), PAGE.margin, y, { width: CONTENT_W });
    y = pdf.y + 8;

    // Conditions
    // (Les conditions de règlement ne sont plus imprimées : l'échéance figure dans l'en-tête.)
    const conditions: string[] = [];
    if (meta.settles && !meta.isCredit && doc.installments?.length) {
      conditions.push('Échéancier : ' + doc.installments.map((i: any) => `${formatDate(i.dueDate)} : ${formatAmount(i.amount)}`).join('  |  '));
    }
    if (meta.settles && !meta.isCredit && company.bankAccount) conditions.push(`Coordonnées bancaires${company.bankName ? ' (' + company.bankName + ')' : ''} : ${company.bankAccount}`);
    if (doc.notes) conditions.push(String(doc.notes));
    if (conditions.length) {
      pdf.fillColor(MUTED).fontSize(8.5);
      for (const c of conditions) pdf.text(clean(c), PAGE.margin, pdf.y + 2, { width: CONTENT_W });
    }

    // ── Pied de page sur toutes les pages + filigrane brouillon ──
    // Pas de ligne de mentions de la société (forme juridique, capital, MF, RC, CNSS) : seuls la référence TTN,
    // le texte de pied de page personnalisé et la pagination sont imprimés.
    const range = pdf.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      pdf.switchToPage(range.start + i);
      pdf.save();
      pdf.page.margins.bottom = 0; // évite un saut de page automatique en écrivant dans la marge basse
      if (isDraft) {
        pdf.rotate(-35, { origin: [PAGE.w / 2, PAGE.h / 2] });
        pdf.fillColor('#e5e7eb').opacity(0.55).font('Helvetica-Bold').fontSize(90).text('BROUILLON', 0, PAGE.h / 2 - 45, { width: PAGE.w, align: 'center', lineBreak: false });
        pdf.opacity(1);
      }
      pdf.restore();
      pdf.page.margins.bottom = 0;
      pdf.fillColor(MUTED).font('Helvetica').fontSize(7);
      if (doc.ttnReference) {
        pdf.fillColor(INK).text(`Facture électronique validée par Tunisie TradeNet (El Fatoora) - Réf. TTN : ${clean(doc.ttnReference)}`, PAGE.margin, PAGE.h - 62, { width: CONTENT_W, align: 'center', lineBreak: false, height: 12, ellipsis: true });
        pdf.fillColor(MUTED);
      }
      if (doc.footer) pdf.text(clean(doc.footer), PAGE.margin, PAGE.h - 48, { width: CONTENT_W, align: 'center', lineBreak: false, height: 12, ellipsis: true });
      pdf.text(`Page ${i + 1} / ${range.count}`, PAGE.margin, PAGE.h - 34, { width: CONTENT_W, align: 'center', lineBreak: false });
    }
  }
}
