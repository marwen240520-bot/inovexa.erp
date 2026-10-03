import { NextRequest, NextResponse } from "next/server";

/**
 * Relevé des violations de Content Security Policy (diagnostic).
 *
 * Le middleware ajoute `report-uri /api/csp-report` à la CSP : à chaque violation (ex. `eval` bloqué), le
 * navigateur envoie ici un rapport. On l'écrit dans les logs du serveur (ligne « [CSP] … ») avec le FICHIER
 * et la LIGNE responsables : c'est ce qui permet de savoir si c'est le code de l'application, une
 * bibliothèque, ou une extension du navigateur (source-file = chrome-extension://…).
 *
 * Aucun effet sur la CSP elle-même : on ne l'assouplit pas. Réponse toujours 204.
 */
export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_LOGS_PER_WINDOW = 30; // anti-inondation des logs (point d'entrée public)
let windowStart = 0;
let logged = 0;

const clean = (v: unknown, max = 200): string =>
  String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max);

export async function POST(req: NextRequest) {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) { windowStart = now; logged = 0; }
  if (logged >= MAX_LOGS_PER_WINDOW) return new NextResponse(null, { status: 204 });

  try {
    const raw = await req.text();
    if (raw.length > 8192) return new NextResponse(null, { status: 204 });
    const json = JSON.parse(raw);
    const r = (json && json["csp-report"]) || json || {};
    logged++;
    console.warn("[CSP]", JSON.stringify({
      directive: clean(r["violated-directive"] || r["effective-directive"]),
      blocked: clean(r["blocked-uri"]),
      source: clean(r["source-file"]),
      line: Number(r["line-number"]) || 0,
      column: Number(r["column-number"]) || 0,
      sample: clean(r["script-sample"], 120),
      page: clean(r["document-uri"]),
    }));
  } catch {
    /* rapport illisible : ignoré */
  }
  return new NextResponse(null, { status: 204 });
}

// Les navigateurs n'envoient que des POST ; tout autre verbe est refusé.
export async function GET() {
  return new NextResponse(null, { status: 405 });
}
