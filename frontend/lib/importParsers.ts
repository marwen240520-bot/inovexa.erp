/**
 * Lecture des fichiers d'import (CSV, Excel .xlsx, JSON, tableau HTML exporté par l'application).
 *
 * Le format est détecté d'après le CONTENU du fichier et non d'après son extension :
 *  - zip ("PK")            -> classeur Excel .xlsx
 *  - OLE2 (D0 CF 11 E0)    -> ancien .xls binaire : non supporté (message explicite)
 *  - texte commençant par [ ou {  -> JSON
 *  - texte contenant <table>      -> tableau HTML (c'est ce que produit l'export « Excel » de l'application)
 *  - sinon                        -> CSV (séparateur , ; tabulation ou | détecté automatiquement)
 */

export type ImportRow = Record<string, any>;

/** Colonnes qui doivent rester du TEXTE (un téléphone « 0612… » ne doit pas devenir le nombre 612…). */
const KEEP_AS_TEXT =
  /(phone|tel|mobile|gsm|fax|sku|ref|code|zip|postal|iban|siret|siren|rib|account|compte|numero|number|matricule|cin|passeport|operation|barcode|ean)/i;

/** Convertit une cellule texte en nombre / booléen quand c'est sans risque, sinon la laisse telle quelle. */
function coerce(header: string, raw: string): any {
  const v = raw.trim();
  if (v === "") return "";
  if (v === "true" || v === "false") return v === "true";
  if (KEEP_AS_TEXT.test(header)) return v;
  // Nombre simple (sans zéro initial). "12,5" ou "1 200,50 €" restent du texte : le serveur sait les lire.
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/** Transforme un tableau de lignes (1re ligne = en-têtes) en objets. */
function rowsToObjects(table: string[][]): ImportRow[] {
  const nonEmpty = table.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (nonEmpty.length === 0) return [];
  const headers = nonEmpty[0].map((h) => String(h ?? "").replace(/^\uFEFF/, "").trim());
  const out: ImportRow[] = [];
  for (let r = 1; r < nonEmpty.length; r++) {
    const cells = nonEmpty[r];
    const obj: ImportRow = {};
    headers.forEach((h, idx) => {
      if (!h) return; // colonne sans titre : ignorée
      obj[h] = coerce(h, String(cells[idx] ?? ""));
    });
    if (Object.keys(obj).length > 0) out.push(obj);
  }
  return out;
}

// ───────────────────────────── CSV ─────────────────────────────

export function detectDelimiter(text: string): string {
  const firstLine =
    text
      .split(/\r?\n/)
      .find((l) => l.trim() !== "" && !/^sep=.$/i.test(l.trim())) || "";
  // On ignore ce qui est entre guillemets
  const stripped = firstLine.replace(/"[^"]*"/g, "");
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    const count = stripped.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** Découpe un texte CSV (guillemets, "" échappés, retours à la ligne dans une cellule). */
export function tokenizeCSV(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parseCSVText(text: string): ImportRow[] {
  let clean = text.replace(/^\uFEFF/, "");
  // Ligne d'indication Excel « sep=; »
  clean = clean.replace(/^sep=.\r?\n/i, "");
  const delimiter = detectDelimiter(clean);
  return rowsToObjects(tokenizeCSV(clean, delimiter));
}

// ───────────────────────────── JSON ─────────────────────────────

export function parseJSONText(text: string): ImportRow[] {
  let data: any;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Fichier JSON invalide");
  }
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // { "clients": [ ... ] } -> on prend l'unique tableau
    const arrays = Object.values(data).filter(Array.isArray) as any[][];
    if (arrays.length === 1) return arrays[0];
    return [data];
  }
  throw new Error("Le fichier JSON doit contenir un tableau ou un objet");
}

// ───────────────────────────── HTML (export « Excel » de l'application) ─────────────────────────────

export function parseHTMLTable(html: string): ImportRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) throw new Error("Aucun tableau trouvé dans le fichier");
  const table2d = Array.from(table.querySelectorAll("tr")).map((tr) =>
    Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim()),
  );
  return rowsToObjects(table2d);
}

// ───────────────────────────── XLSX ─────────────────────────────

const colIndex = (ref: string): number => {
  const letters = (ref.match(/^[A-Z]+/i) || ["A"])[0].toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const BUILTIN_DATE_FORMATS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

const isDateFormatCode = (code: string): boolean => {
  const c = code.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
  return /[ymd]/i.test(c) && !/general/i.test(c);
};

/** Numéro de série Excel -> "AAAA-MM-JJ" (ou date-heure ISO si la valeur a une partie horaire) */
const excelSerialToISO = (serial: number): string => {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return String(serial);
  return Number.isInteger(serial) ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 19);
};

const xmlDoc = (xml: string): Document => new DOMParser().parseFromString(xml, "application/xml");
const byTag = (root: Document | Element, tag: string): Element[] =>
  Array.from(root.getElementsByTagNameNS("*", tag));
const textOf = (el: Element | undefined | null): string => (el ? el.textContent || "" : "");

export async function parseXLSX(buffer: ArrayBuffer): Promise<ImportRow[]> {
  const JSZip = (await import("jszip")).default;
  let zip: any;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error("Fichier Excel invalide ou corrompu");
  }

  // 1) Feuille à lire : la première du classeur
  let sheetPath = "";
  const wbFile = zip.file("xl/workbook.xml");
  const relsFile = zip.file("xl/_rels/workbook.xml.rels");
  if (wbFile && relsFile) {
    const wb = xmlDoc(await wbFile.async("string"));
    const rels = xmlDoc(await relsFile.async("string"));
    const firstSheet = byTag(wb, "sheet")[0];
    const rid = firstSheet?.getAttribute("r:id") || firstSheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const rel = byTag(rels, "Relationship").find((r) => r.getAttribute("Id") === rid);
    const target = rel?.getAttribute("Target");
    if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.?\//, "")}`;
  }
  if (!sheetPath || !zip.file(sheetPath)) {
    sheetPath =
      Object.keys(zip.files)
        .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n))
        .sort()[0] || "";
  }
  if (!sheetPath) throw new Error("Aucune feuille de calcul trouvée dans le fichier Excel");

  // 2) Textes partagés
  const shared: string[] = [];
  const ssFile = zip.file("xl/sharedStrings.xml");
  if (ssFile) {
    const ss = xmlDoc(await ssFile.async("string"));
    byTag(ss, "si").forEach((si) => {
      // On ignore les annotations phonétiques <rPh>
      const parts = byTag(si, "t").filter((t) => t.parentElement?.localName !== "rPh");
      shared.push(parts.map((t) => t.textContent || "").join(""));
    });
  }

  // 3) Styles : quelles cellules sont des dates ?
  const dateXf = new Set<number>();
  const stFile = zip.file("xl/styles.xml");
  if (stFile) {
    const st = xmlDoc(await stFile.async("string"));
    const customCodes = new Map<number, string>();
    byTag(st, "numFmt").forEach((n) => customCodes.set(Number(n.getAttribute("numFmtId")), n.getAttribute("formatCode") || ""));
    const cellXfs = byTag(st, "cellXfs")[0];
    if (cellXfs) {
      Array.from(cellXfs.children).forEach((xf, idx) => {
        const id = Number(xf.getAttribute("numFmtId") || 0);
        if (BUILTIN_DATE_FORMATS.has(id) || (customCodes.has(id) && isDateFormatCode(customCodes.get(id)!))) dateXf.add(idx);
      });
    }
  }

  // 4) Cellules
  const sheet = xmlDoc(await zip.file(sheetPath).async("string"));
  const table: string[][] = [];
  byTag(sheet, "row").forEach((rowEl) => {
    const line: string[] = [];
    Array.from(rowEl.children)
      .filter((c) => c.localName === "c")
      .forEach((c) => {
        const idx = colIndex(c.getAttribute("r") || "A");
        const type = c.getAttribute("t");
        const style = Number(c.getAttribute("s") || 0);
        const vEl = byTag(c, "v")[0];
        let value = "";
        if (type === "s") value = shared[Number(textOf(vEl))] ?? "";
        else if (type === "inlineStr") value = byTag(c, "t").map((t) => t.textContent || "").join("");
        else if (type === "b") value = textOf(vEl) === "1" ? "true" : "false";
        else if (type === "str" || type === "e") value = textOf(vEl);
        else if (vEl) {
          const num = Number(textOf(vEl));
          value = dateXf.has(style) && Number.isFinite(num) ? excelSerialToISO(num) : textOf(vEl);
        }
        line[idx] = value;
      });
    // Les lignes sont remplies de "trous" -> chaînes vides
    for (let i = 0; i < line.length; i++) if (line[i] === undefined) line[i] = "";
    table.push(line);
  });
  return rowsToObjects(table);
}

// ───────────────────────────── Point d'entrée ─────────────────────────────

function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    // CSV enregistré par Excel sous Windows (accents en windows-1252)
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export async function parseImportFile(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const b = new Uint8Array(buffer.slice(0, 8));

  if (b[0] === 0x50 && b[1] === 0x4b) return parseXLSX(buffer);

  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) {
    throw new Error(
      "Le format Excel 97-2003 (.xls) n'est pas supporté. Ouvrez le fichier dans Excel puis enregistrez-le au format .xlsx ou CSV, et réessayez.",
    );
  }

  const text = decodeText(buffer);
  const head = text.replace(/^\uFEFF/, "").trimStart();
  if (head === "") return [];
  if (head.startsWith("[") || head.startsWith("{")) return parseJSONText(text);
  if (/<table[\s>]/i.test(head.slice(0, 20000))) return parseHTMLTable(text);
  return parseCSVText(text);
}
