// ============================================================
//  lib/assistant/period.ts — Compréhension des périodes (FR / EN / ES)
//
//  Transforme une question libre en une ou plusieurs périodes exactes :
//    « CA de mai »            → 01/05 → 31/05 (dernier mai écoulé)
//    « revenue for May 2025 » → 01/05/2025 → 31/05/2025
//    « ventas de este mes »   → mois en cours
//    « mois dernier », « last quarter », « T1 2026 », « 30 derniers jours »,
//    « de janvier à mars », « mai vs avril », « en 2025 », « hier »…
//
//  Utilisé par l'assistant hors-ligne ET par les outils du modèle IA.
// ============================================================

export type Lang = "fr" | "en" | "es";

export type PeriodKind =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "range"
  | "lastDays"
  | "all";

export interface Period {
  kind: PeriodKind;
  /** Début inclus (00:00 heure locale) */
  start: Date;
  /** Fin EXCLUE (00:00 du jour suivant la période) */
  end: Date;
  /** Vrai si la période contient « aujourd'hui » (mois en cours, année en cours…) */
  current?: boolean;
  year?: number;
  month?: number; // 0-11
  quarter?: number; // 1-4
  days?: number;
  /** Position dans la question (pour l'ordre) */
  pos?: number;
}

export interface ParsedPeriods {
  periods: Period[];
  /** La question demande une comparaison (« mai vs avril », « compared to ») */
  comparison: boolean;
}

// ── Normalisation ───────────────────────────────────────────
export function normalizeText(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`´]/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff\-/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Noms de mois (normalisés, sans accents) ─────────────────
const MONTH_WORDS: Record<string, number> = {
  janvier: 0, janv: 0, january: 0, jan: 0, enero: 0,
  fevrier: 1, fevr: 1, fev: 1, february: 1, feb: 1, febrero: 1,
  mars: 2, march: 2, marzo: 2,
  avril: 3, avr: 3, april: 3, apr: 3, abril: 3,
  mai: 4, may: 4, mayo: 4,
  juin: 5, june: 5, jun: 5, junio: 5,
  juillet: 6, juil: 6, july: 6, jul: 6, julio: 6,
  aout: 7, august: 7, aug: 7, agosto: 7,
  septembre: 8, sept: 8, sep: 8, september: 8, septiembre: 8, setiembre: 8,
  octobre: 9, oct: 9, october: 9, octubre: 9,
  novembre: 10, nov: 10, november: 10, noviembre: 10,
  decembre: 11, dec: 11, december: 11, diciembre: 11,
};

export const MONTH_LABELS: Record<Lang, string[]> = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
};

// « may » anglais peut être un verbe modal (« may I see… ») : on l'ignore dans ce cas.
const MAY_MODAL_NEXT = new Set(["i", "we", "you", "he", "she", "it", "they", "be", "have", "not", "need", "help"]);
const MAY_MODAL_PREV = new Set(["i", "we", "you", "he", "she", "it", "they", "this", "that", "which", "who"]);

// ── Fabriques de dates ──────────────────────────────────────
const d0 = (y: number, m: number, d = 1) => new Date(y, m, d, 0, 0, 0, 0);
const startOfDay = (d: Date) => d0(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => d0(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function monthPeriod(year: number, month: number, now = new Date()): Period {
  const start = d0(year, month, 1);
  const end = d0(year, month + 1, 1);
  return { kind: "month", start, end, year, month, current: now >= start && now < end };
}

export function quarterPeriod(year: number, quarter: number, now = new Date()): Period {
  const start = d0(year, (quarter - 1) * 3, 1);
  const end = d0(year, quarter * 3, 1);
  return { kind: "quarter", start, end, year, quarter, current: now >= start && now < end };
}

export function yearPeriod(year: number, now = new Date()): Period {
  const start = d0(year, 0, 1);
  const end = d0(year + 1, 0, 1);
  return { kind: "year", start, end, year, current: now >= start && now < end };
}

export function dayPeriod(day: Date, now = new Date()): Period {
  const start = startOfDay(day);
  const end = addDays(start, 1);
  return { kind: "day", start, end, current: now >= start && now < end };
}

export function rangePeriod(start: Date, endExclusive: Date): Period {
  return { kind: "range", start, end: endExclusive };
}

/** Période précédente de même nature (mai → avril, T2 → T1, 2026 → 2025, 30 j → 30 j avant). */
export function previousPeriod(p: Period, now = new Date()): Period {
  if (p.kind === "month" && p.year != null && p.month != null) return monthPeriod(p.month === 0 ? p.year - 1 : p.year, p.month === 0 ? 11 : p.month - 1, now);
  if (p.kind === "quarter" && p.year != null && p.quarter != null) return quarterPeriod(p.quarter === 1 ? p.year - 1 : p.year, p.quarter === 1 ? 4 : p.quarter - 1, now);
  if (p.kind === "year" && p.year != null) return yearPeriod(p.year - 1, now);
  // Plage de mois entiers (« de janvier à mars ») → mêmes mois juste avant
  if (p.start.getDate() === 1 && p.end.getDate() === 1) {
    const months = p.end.getFullYear() * 12 + p.end.getMonth() - (p.start.getFullYear() * 12 + p.start.getMonth());
    if (months >= 1) return { kind: "range", start: d0(p.start.getFullYear(), p.start.getMonth() - months, 1), end: new Date(p.start) };
  }
  const len = p.end.getTime() - p.start.getTime();
  return { kind: p.kind === "day" ? "day" : "range", start: new Date(p.start.getTime() - len), end: new Date(p.start) };
}

/** Pour une période EN COURS : même nombre de jours écoulés dans la période précédente (comparaison équitable). */
export function previousToDate(p: Period, now = new Date()): Period | null {
  if (!p.current) return null;
  const prev = previousPeriod(p, now);
  const elapsed = startOfDay(now).getTime() - p.start.getTime() + 86400000; // jours écoulés, aujourd'hui inclus
  const end = new Date(Math.min(prev.end.getTime(), prev.start.getTime() + elapsed));
  return { ...prev, kind: "range", end };
}

// ── Résolution d'un mois sans année : dernier mois écoulé (ou en cours) ──
function resolveMonthYear(month: number, now: Date): number {
  return month <= now.getMonth() ? now.getFullYear() : now.getFullYear() - 1;
}

const ORD_QUARTER: Record<string, number> = {
  premier: 1, "1er": 1, first: 1, primer: 1, primero: 1, "1st": 1,
  deuxieme: 2, second: 2, seconde: 2, "2e": 2, "2eme": 2, "2nd": 2, segundo: 2,
  troisieme: 3, third: 3, "3e": 3, "3eme": 3, "3rd": 3, tercer: 3, tercero: 3,
  quatrieme: 4, fourth: 4, "4e": 4, "4eme": 4, "4th": 4, cuarto: 4,
};

function quarterOf(d: Date) {
  return Math.floor(d.getMonth() / 3) + 1;
}

/**
 * Analyse toutes les périodes mentionnées dans une question.
 * Ne renvoie AUCUNE période si la question n'en contient pas (à l'appelant de choisir un défaut).
 */
export function parsePeriods(question: string, now = new Date()): ParsedPeriods {
  const q = " " + normalizeText(question) + " ";
  const found: Period[] = [];
  const taken: Array<[number, number]> = [];
  const isTaken = (i: number, j: number) => taken.some(([a, b]) => i < b && j > a);
  const push = (p: Period, idx: number, len: number) => {
    if (isTaken(idx, idx + len)) return;
    taken.push([idx, idx + len]);
    found.push({ ...p, pos: idx });
  };
  const scan = (re: RegExp, fn: (m: RegExpExecArray) => Period | null) => {
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = r.exec(q))) {
      const p = fn(m);
      if (p) push(p, m.index, m[0].length);
    }
  };

  const today = startOfDay(now);
  const thisMonth = monthPeriod(now.getFullYear(), now.getMonth(), now);
  const lastMonthDate = d0(now.getFullYear(), now.getMonth() - 1, 1);

  // 1) Expressions relatives (prioritaires)
  scan(/ (aujourd hui|aujourdhui|today|hoy|ce jour) /, () => dayPeriod(today, now));
  scan(/ (hier|yesterday|ayer) /, () => dayPeriod(addDays(today, -1), now));
  scan(/ (cette semaine|semaine en cours|this week|current week|esta semana|semana actual) /, () => {
    const dow = (today.getDay() + 6) % 7; // lundi = 0
    const start = addDays(today, -dow);
    return { kind: "week", start, end: addDays(start, 7), current: true };
  });
  scan(/ (la semaine (derniere|passee|precedente)|semaine (derniere|passee|precedente)|derniere semaine|last week|previous week|la semana pasada|semana pasada|semana anterior) /, () => {
    const dow = (today.getDay() + 6) % 7;
    const start = addDays(today, -dow - 7);
    return { kind: "week", start, end: addDays(start, 7) };
  });

  // N derniers jours / mois
  scan(/ (?:les |the |los |las )?(?:(\d{1,3}) (?:derniers|dernieres) (jours|mois|semaines)|(?:last|past) (\d{1,3}) (days|months|weeks)|(?:ultimos|ultimas) (\d{1,3}) (dias|meses|semanas)|(\d{1,3}) (?:last|past) (days|months)) /, (m) => {
    const n = Number(m[1] || m[3] || m[5] || m[7]);
    const unit = (m[2] || m[4] || m[6] || m[8] || "").slice(0, 3);
    if (!n || n > 3650) return null;
    const end = addDays(today, 1);
    let start: Date;
    if (unit === "moi" || unit === "mon" || unit === "mes") start = d0(today.getFullYear(), today.getMonth() - n, today.getDate() + 1);
    else if (unit === "sem" || unit === "wee") start = addDays(end, -7 * n);
    else start = addDays(end, -n);
    return { kind: "lastDays", start, end, days: Math.round((end.getTime() - start.getTime()) / 86400000), current: true };
  });

  scan(/ (ce mois(?:-ci| ci)?|cette mois|mois en cours|mois courant|mois actuel|this month|current month|month to date|este mes|mes actual|mes en curso|el presente mes) /, () => thisMonth);
  scan(/ (le mois dernier|mois dernier|le mois passe|mois passe|mois precedent|dernier mois|last month|previous month|prior month|el mes pasado|mes pasado|mes anterior|el ultimo mes) /, () =>
    monthPeriod(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), now),
  );

  // Trimestres relatifs
  scan(/ (ce trimestre|trimestre en cours|trimestre actuel|this quarter|current quarter|este trimestre|trimestre actual) /, () => quarterPeriod(now.getFullYear(), quarterOf(now), now));
  scan(/ (le trimestre dernier|trimestre dernier|trimestre precedent|dernier trimestre|last quarter|previous quarter|el trimestre pasado|trimestre pasado|trimestre anterior) /, () => {
    const q0 = quarterOf(now);
    return quarterPeriod(q0 === 1 ? now.getFullYear() - 1 : now.getFullYear(), q0 === 1 ? 4 : q0 - 1, now);
  });

  // Années relatives
  scan(/ (depuis le debut de l annee|depuis janvier|year to date|ytd|en lo que va del ano|en lo que va de ano|desde principios de ano|desde enero) /, () => ({
    kind: "range", start: d0(now.getFullYear(), 0, 1), end: addDays(today, 1), current: true, year: now.getFullYear(),
  }));
  scan(/ (cette annee|l annee en cours|annee en cours|annee courante|this year|current year|este ano|el ano actual|ano actual|ano en curso) /, () => yearPeriod(now.getFullYear(), now));
  scan(/ (l annee derniere|annee derniere|l annee passee|annee passee|annee precedente|last year|previous year|el ano pasado|ano pasado|ano anterior) /, () => yearPeriod(now.getFullYear() - 1, now));

  // 2) Trimestres explicites : T1, Q2 2025, 3e trimestre, second quarter, primer trimestre
  scan(/ (?:t|q)([1-4])(?:[ -]?(20\d\d))? /, (m) => {
    const qn = Number(m[1]);
    const y = m[2] ? Number(m[2]) : qn <= quarterOf(now) ? now.getFullYear() : now.getFullYear() - 1;
    return quarterPeriod(y, qn, now);
  });
  scan(/ (premier|1er|first|1st|primer|primero|deuxieme|second|seconde|2e|2eme|2nd|segundo|troisieme|third|3e|3eme|3rd|tercer|tercero|quatrieme|fourth|4e|4eme|4th|cuarto) (?:trimestre|quarter)(?: (?:de |del |of )?(20\d\d))? /, (m) => {
    const qn = ORD_QUARTER[m[1]];
    if (!qn) return null;
    const y = m[2] ? Number(m[2]) : qn <= quarterOf(now) ? now.getFullYear() : now.getFullYear() - 1;
    return quarterPeriod(y, qn, now);
  });
  scan(/ (?:trimestre|quarter) ([1-4])(?: (?:de |del |of )?(20\d\d))? /, (m) => {
    const qn = Number(m[1]);
    const y = m[2] ? Number(m[2]) : qn <= quarterOf(now) ? now.getFullYear() : now.getFullYear() - 1;
    return quarterPeriod(y, qn, now);
  });

  // 3) Dates numériques : 2026-05, 05/2026, 5/2026
  scan(/ (20\d\d)-(0?[1-9]|1[0-2]) /, (m) => monthPeriod(Number(m[1]), Number(m[2]) - 1, now));
  scan(/ (0?[1-9]|1[0-2])[/-](20\d\d) /, (m) => monthPeriod(Number(m[2]), Number(m[1]) - 1, now));

  // 4) Mois nommés (avec année facultative) : « mai 2025 », « mayo de 2025 », « may, 2025 »
  {
    const words = Object.keys(MONTH_WORDS).sort((x, y) => y.length - x.length).join("|");
    scan(new RegExp(` (${words})(?:,? (?:de |del |of )?(20\\d\\d))?(?= )`), (m) => {
      const tok = m[1];
      if (tok === "may") {
        const before = q.slice(0, m.index).trim().split(" ").pop() || "";
        const after = q.slice(m.index + m[0].length).trim().split(" ")[0] || "";
        if (!m[2] && (MAY_MODAL_NEXT.has(after) || MAY_MODAL_PREV.has(before))) return null;
      }
      const month = MONTH_WORDS[tok];
      const y = m[2] ? Number(m[2]) : resolveMonthYear(month, now);
      return monthPeriod(y, month, now);
    });
  }

  // 5) Année seule : « en 2025 », « in 2024 », « año 2025 »
  scan(/ (20\d\d) /, (m) => yearPeriod(Number(m[1]), now));

  found.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));

  // Une année seule juste après un mois/trimestre déjà daté est déjà consommée ;
  // si un mois SANS année explicite est suivi d'une année isolée (« mai et juin 2025 »), on l'applique.
  const years = found.filter((p) => p.kind === "year");
  const others = found.filter((p) => p.kind !== "year");
  let periods = found;
  if (years.length === 1 && others.length > 0 && others.every((p) => p.kind === "month")) {
    const y = years[0].year!;
    periods = others.map((p) => monthPeriod(y, p.month!, now)).map((p, i) => ({ ...p, pos: others[i].pos }));
  }

  // Plage « de janvier à mars », « from Jan to Mar », « de enero a marzo », « entre X et Y »
  const isRange = /( a | au | to | until | till | hasta | al | jusqu a | jusqu au | through | - )/.test(q) || /( entre | between )/.test(q);
  const comparison = /(compar|versus| vs |par rapport|contre|frente a| than | que el | que en |difference|diferencia|evolution|evolucion|growth|croissance|crecimiento)/.test(q);
  if (periods.length === 2 && isRange && !comparison) {
    const [a, b] = periods;
    const start = a.start < b.start ? a.start : b.start;
    const end = a.end > b.end ? a.end : b.end;
    periods = [{ kind: "range", start, end, current: now >= start && now < end }];
  }

  return { periods, comparison: comparison && periods.length >= 2 };
}

// ── Libellés ────────────────────────────────────────────────
const fmtDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function periodLabel(p: Period, lang: Lang): string {
  const M = MONTH_LABELS[lang];
  const lastDay = new Date(p.end.getTime() - 86400000);
  switch (p.kind) {
    case "month": {
      const base = `${M[p.month!]} ${p.year}`;
      if (!p.current) return base;
      return lang === "en" ? `${base} (month to date)` : lang === "es" ? `${base} (mes en curso)` : `${base} (mois en cours)`;
    }
    case "quarter":
      return lang === "en" ? `Q${p.quarter} ${p.year}` : `T${p.quarter} ${p.year}`;
    case "year": {
      if (!p.current) return String(p.year);
      return lang === "en" ? `${p.year} (year to date)` : lang === "es" ? `${p.year} (en lo que va del año)` : `${p.year} (depuis le 1er janvier)`;
    }
    case "day":
      return fmtDate(p.start, lang);
    case "lastDays":
      return lang === "en" ? `last ${p.days} days` : lang === "es" ? `últimos ${p.days} días` : `${p.days} derniers jours`;
    case "all":
      return lang === "en" ? "all time" : lang === "es" ? "todo el historial" : "tout l'historique";
    default:
      return lang === "en"
        ? `${fmtDate(p.start, lang)} → ${fmtDate(lastDay, lang)}`
        : lang === "es"
          ? `del ${fmtDate(p.start, lang)} al ${fmtDate(lastDay, lang)}`
          : `du ${fmtDate(p.start, lang)} au ${fmtDate(lastDay, lang)}`;
  }
}

/** Convertit des dates ISO (AAAA-MM-JJ, fin INCLUSE) en Period — utilisé par les outils du modèle. */
export function periodFromIso(startIso?: string | null, endIso?: string | null, now = new Date()): Period | null {
  const parse = (s?: string | null) => {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? d0(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  let s = parse(startIso);
  let e = parse(endIso);
  if (!s && !e) return null;
  // Dates inversées (« du 31/05 au 01/05 ») : on les remet dans l'ordre
  if (s && e && e < s) [s, e] = [e, s];
  const start = s ?? d0(2000, 0, 1);
  const end = e ? addDays(e, 1) : addDays(startOfDay(now), 1);
  // Reconnaît un mois / une année entière pour un meilleur libellé
  if (start.getDate() === 1 && end.getDate() === 1) {
    if (end.getFullYear() * 12 + end.getMonth() - (start.getFullYear() * 12 + start.getMonth()) === 1) return monthPeriod(start.getFullYear(), start.getMonth(), now);
    if (start.getMonth() === 0 && end.getMonth() === 0 && end.getFullYear() - start.getFullYear() === 1) return yearPeriod(start.getFullYear(), now);
  }
  return { kind: "range", start, end, current: now >= start && now < end };
}

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
