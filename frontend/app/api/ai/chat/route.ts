// ============================================================
//  app/api/ai/chat/route.ts — Assistant IA "pro" d'Inovexa ERP
//  RAG par injection de contexte structuré (tout le système).
//  La clé API reste STRICTEMENT côté serveur (jamais NEXT_PUBLIC_).
//
//  Variables d'environnement (Vercel → Project → Settings → Environment Variables) :
//    ANTHROPIC_API_KEY   (obligatoire)  ex: sk-ant-...
//    ANTHROPIC_MODEL     (optionnel)    défaut: claude-sonnet-4-6
//                                       (claude-haiku-4-5-20251001 = moins cher/rapide)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

type ChatMessage = { role: "user" | "assistant"; content: string };

const LANG_LABEL: Record<string, string> = {
  fr: "français",
  en: "English",
  es: "español",
  ar: "العربية",
};

function safeJson(v: unknown): string {
  try {
    const s = JSON.stringify(v ?? {});
    // Garde-fou taille : évite des prompts démesurés (et coûteux).
    return s.length > 60000 ? s.slice(0, 60000) + ' …"__TRUNCATED__"' : s;
  } catch {
    return "{}";
  }
}

function buildSystem(language: string, context: unknown): string {
  const lang = LANG_LABEL[language] || "français";
  return [
    `Tu es l'analyste IA intégré à « Inovexa ERP », un ERP cloud pour PME.`,
    `Tu aides l'utilisateur à comprendre et piloter son activité sur TOUS les modules :`,
    `ventes, achats, produits/stock, clients, commandes, factures, finance, RH, logistique.`,
    ``,
    `On te fournit ci-dessous un instantané JSON des données ERP ACTUELLES de l'utilisateur`,
    `(ERP_CONTEXT). C'est ta SEULE source de vérité.`,
    ``,
    `Règles :`,
    `- Réponds UNIQUEMENT à partir d'ERP_CONTEXT. N'invente jamais un chiffre, un nom, une date ou un enregistrement.`,
    `- L'objet "counts" contient les totaux RÉELS ; les listes "samples" sont tronquées. Si la réponse exige la liste complète et qu'elle est tronquée, signale-le.`,
    `- Si la donnée demandée n'est pas dans l'instantané (enregistrement absent des échantillons, module non présent), dis-le clairement et indique où chercher dans l'app. Ne devine pas.`,
    `- Sois concis et concret. Utilise les chiffres de l'utilisateur. Monnaie : DT (TND), format « 12 345 DT ».`,
    `- Tu peux raisonner de façon transversale (lier un stock bas à des commandes en attente, une facture impayée à un client, etc.).`,
    `- Markdown léger (**gras**, listes). Reste bref : c'est une bulle de chat, pas un rapport.`,
    `- Réponds en ${lang}.`,
    ``,
    `ERP_CONTEXT (JSON) :`,
    safeJson(context),
  ].join("\n");
}

function sanitize(messages: unknown): ChatMessage[] {
  const arr = Array.isArray(messages) ? messages : [];
  let msgs = arr
    .filter(
      (m: any) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m: any) => ({ role: m.role, content: m.content })) as ChatMessage[];

  // L'API Anthropic exige que le premier message soit "user".
  while (msgs.length && msgs[0].role !== "user") msgs = msgs.slice(1);

  // Borne le nombre de tours pour limiter les tokens.
  return msgs.slice(-12);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Pas de clé → le client basculera sur son repli local.
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const messages = sanitize(body?.messages);
  if (!messages.length) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystem(String(body?.language || "fr"), body?.context),
        messages,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "upstream", status: res.status, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = (Array.isArray(data?.content) ? data.content : [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: "exception", detail: String(e?.message || e).slice(0, 300) },
      { status: 500 },
    );
  }
}
