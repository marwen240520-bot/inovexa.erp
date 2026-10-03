/**
 * Export de fichiers côté navigateur : vrai classeur Excel (.xlsx) + téléchargement.
 *
 * Le .xlsx est assemblé à la main (un .xlsx est une archive ZIP de fichiers XML) avec JSZip, déjà présent
 * dans le projet : aucune dépendance ajoutée.
 *
 * Choix de conception :
 *  - textes écrits en « inlineStr » : une cellule qui commence par « = », « + », « - » ou « @ » reste du TEXTE
 *    (aucune formule n'est jamais exécutée à l'ouverture, contrairement à un CSV) ;
 *  - nombres écrits comme de vrais nombres, dates ISO converties en vraies dates Excel ;
 *  - ligne d'en-tête colorée, figée, avec filtres ; largeur des colonnes ajustée au contenu.
 */

export type Cell = string | number | boolean | null | undefined | Date | object;

export interface SheetData {
  name: string;
  /** La première ligne est l'en-tête. */
  rows: Cell[][];
}

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_CELL_CHARS = 32000;          // limite Excel : 32 767 caractères par cellule
const MAX_ROWS = 1_000_000;            // limite Excel : 1 048 576 lignes

const xmlEscape = (s: string): string =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "") // caractères interdits en XML
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 0 -> A, 25 -> Z, 26 -> AA … */
export function columnName(index: number): string {
  let n = index + 1, name = "";
  while (n > 0) { const r = (n - 1) % 26; name = String.fromCharCode(65 + r) + name; n = Math.floor((n - 1) / 26); }
  return name;
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Numéro de série Excel (jours depuis 1899-12-30), exprimé en heure locale pour que Excel affiche la même heure. */
export function excelSerial(d: Date): number {
  return (d.getTime() - d.getTimezoneOffset() * 60000) / 86400000 + 25569;
}

// Styles : 0 normal | 1 en-tête | 2 date-heure | 3 date | 4 nombre à 2 décimales
const STYLE = { normal: 0, header: 1, datetime: 2, date: 3, decimal: 4 } as const;

function cellXml(ref: string, value: Cell, isHeader: boolean): string {
  if (value === null || value === undefined || value === "") return isHeader ? `<c r="${ref}" s="${STYLE.header}"/>` : "";
  if (isHeader) return `<c r="${ref}" s="${STYLE.header}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return `<c r="${ref}"${Number.isInteger(value) ? "" : ` s="${STYLE.decimal}"`}><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : `<c r="${ref}" s="${STYLE.datetime}"><v>${excelSerial(value)}</v></c>`;
  }
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (ISO_DATE.test(text)) {
    const d = new Date(text + "T00:00:00");
    if (!isNaN(d.getTime())) return `<c r="${ref}" s="${STYLE.date}"><v>${excelSerial(d)}</v></c>`;
  }
  if (ISO_DATETIME.test(text)) {
    const d = new Date(text);
    if (!isNaN(d.getTime())) return `<c r="${ref}" s="${STYLE.datetime}"><v>${excelSerial(d)}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text.slice(0, MAX_CELL_CHARS))}</t></is></c>`;
}

const displayLength = (value: Cell): number => {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return 16;
  if (typeof value === "string" && (ISO_DATETIME.test(value) || ISO_DATE.test(value))) return value.length > 10 ? 16 : 10;
  return (typeof value === "object" ? JSON.stringify(value) : String(value)).length;
};

function sheetXml(rows: Cell[][]): string {
  const data = rows.slice(0, MAX_ROWS);
  const columns = data.reduce((m, r) => Math.max(m, r.length), 0) || 1;
  const widths = Array.from({ length: columns }, (_, c) => {
    const longest = data.slice(0, 500).reduce((m, r) => Math.max(m, displayLength(r[c])), 0);
    return Math.min(60, Math.max(10, Math.round(longest * 1.15) + 2));
  });
  const lastRef = `${columnName(columns - 1)}${Math.max(1, data.length)}`;
  const rowsXml = data.map((row, r) => {
    const cells: string[] = [];
    for (let c = 0; c < columns; c++) cells.push(cellXml(`${columnName(c)}${r + 1}`, row[c], r === 0));
    return `<row r="${r + 1}"${r === 0 ? ' ht="22" customHeight="1"' : ""}>${cells.join("")}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastRef}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${rowsXml}</sheetData>${data.length > 1 ? `<autoFilter ref="A1:${lastRef}"/>` : ""}</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd\\ hh:mm"/><numFmt numFmtId="165" formatCode="yyyy\\-mm\\-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** Nom d'onglet valide : 31 caractères max, sans [ ] : * ? / \ ; unique dans le classeur. */
export function safeSheetName(raw: string, used: Set<string>, index: number): string {
  let name = raw.replace(/[\[\]:*?\/\\]/g, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "").slice(0, 31) || `Feuille ${index + 1}`;
  let candidate = name, n = 2;
  while (used.has(candidate.toLowerCase())) { const suffix = ` (${n++})`; candidate = name.slice(0, 31 - suffix.length) + suffix; }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Assemble un classeur .xlsx (plusieurs onglets). */
export async function buildXlsx(sheets: SheetData[]): Promise<Blob> {
  const list = sheets.length ? sheets : [{ name: "Feuille 1", rows: [[""]] }];
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const used = new Set<string>();
  const names = list.map((s, i) => safeSheetName(s.name, used, i));

  zip.file("[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${list.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`);
  zip.file("_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xmlEscape(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${list.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file("xl/styles.xml", STYLES_XML);
  list.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)));

  return zip.generateAsync({ type: "blob", mimeType: MIME_XLSX, compression: "DEFLATE" });
}

/**
 * Transforme un rapport { type, generatedAt, total, items: [...] } en onglets :
 *  - « Résumé » : tous les chiffres clés (valeurs simples) ;
 *  - un onglet par tableau (« items » -> « Données »), colonnes = union des champs de toutes les lignes.
 */
export function reportToSheets(data: any, labels: { summary: string; data: string; indicator: string; value: string }): SheetData[] {
  const sheets: SheetData[] = [];
  const scalars: Cell[][] = [[labels.indicator, labels.value]];
  const tables: Array<[string, any[]]> = [];
  Object.entries(data || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) { if (value.length && typeof value[0] === "object") tables.push([key, value]); }
    else if (value !== null && value !== undefined && typeof value !== "object") scalars.push([key, value as Cell]);
  });
  if (scalars.length > 1) sheets.push({ name: labels.summary, rows: scalars });
  tables.forEach(([key, rows]) => {
    const headers: string[] = [];
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => { if (!headers.includes(k)) headers.push(k); }));
    sheets.push({ name: key === "items" ? labels.data : key, rows: [headers, ...rows.map((r) => headers.map((h) => (r ? (r[h] as Cell) : null)))] });
  });
  return sheets;
}

/** Déclenche le téléchargement d'un fichier généré dans le navigateur. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
