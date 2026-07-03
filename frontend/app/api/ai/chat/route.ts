// ============================================================
//  app/api/ai/chat/route.ts — Assistant IA "pro" d'Inovexa ERP
//  v2 : STREAMING temps réel + PROMPT CACHING + RAG structuré.
//
//  Améliorations vs v1 :
//   1. stream: true → la réponse s'affiche mot à mot en TEMPS RÉEL
//      (latence perçue divisée par ~5, plus de longue attente).
//   2. Prompt caching Anthropic (cache_control ephemeral) sur les
//      instructions ET sur le contexte ERP → jusqu'à -90% de coût
//      et réponses plus rapides sur les tours suivants.
//   3. Système de prompt renforcé : date du jour, règles de calcul,
//      format monétaire, anti-hallucination.
//
//  La clé API reste STRICTEMENT côté serveur (jamais NEXT_PUBLIC_).
//
//  Variables d'environnement (Vercel → Settings → Environment Variables) :
//    ANTHROPIC_API_KEY   (obligatoire)  ex: sk-ant-...
//    ANTHROPIC_MODEL     (optionnel)    défaut: claude-sonnet-4-6
//                                       (claude-haiku-4-5-20251001 = moins cher/rapide)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    return s.length > 80000 ? s.slice(0, 80000) + ' …"__TRUNCATED__"' : s;
  } catch {
    return "{}";
  }
}

/**
 * Bloc d'instructions STABLE (mis en cache par Anthropic).
 * Ne pas y injecter de valeur qui change à chaque requête,
 * sinon le cache est invalidé.
 */
function buildInstructions(language: string): string {
  const lang = LANG_LABEL[language] || "français";
  return [
    `Tu es l'analyste IA intégré à « Inovexa ERP », un ERP cloud pour PME.`,
    `Tu aides l'utilisateur à comprendre et piloter son activité sur TOUS les modules :`,
    `ventes, achats, produits/stock, clients, commandes, factures, finance, RH, logistique.`,
    ``,
    `On te fournit un instantané JSON des données ERP ACTUELLES de l'utilisateur`,
    `(ERP_CONTEXT). C'est ta SEULE source de vérité.`,
    ``,
    `Règles :`,
    `- Réponds UNIQUEMENT à partir d'ERP_CONTEXT. N'invente jamais un chiffre, un nom, une date ou un enregistrement.`,
    `- L'objet "counts" contient les totaux RÉELS ; l'objet "aggregates" contient des agrégats DÉJÀ CALCULÉS (CA mensuel, top produits par CA, créances, valeur de stock). Utilise-les en priorité : ils sont plus fiables qu'un calcul manuel sur des listes tronquées.`,
    `- Les listes "samples" sont tronquées. Si la réponse exige la liste complète et qu'elle est tronquée, signale-le.`,
    `- Si la donnée demandée n'est pas dans l'instantané (enregistrement absent, module non fourni pour cette question), dis-le clairement et indique où chercher dans l'app. Ne devine pas.`,
    `- Quand tu fais un calcul (marge, croissance, moyenne), montre brièvement la formule utilisée.`,
    `- Sois concis et concret. Utilise les chiffres de l'utilisateur. Monnaie : DT (TND), format « 12 345 DT ».`,
    `- Tu peux raisonner de façon transversale (lier un stock bas à des commandes en attente, une facture impayée à un client, etc.).`,
    `- Termine, quand c'est pertinent, par UNE action recommandée concrète (ex. « → Relancez la facture #F-102 »).`,
    `- Markdown léger (**gras**, listes courtes). Reste bref : c'est une bulle de chat, pas un rapport.`,
    `- Réponds en ${lang}.`,
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

  const language = String(body?.language || "fr");
  const today = new Date().toISOString().slice(0, 10);

  // System = 2 blocs :
  //  1) Instructions stables  → cache_control (réutilisé tel quel à chaque tour)
  //  2) Contexte ERP          → cache_control (réutilisé tant que les données ne changent pas)
  const system = [
    {
      type: "text",
      text: buildInstructions(language),
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `Date du jour : ${today}\n\nERP_CONTEXT (JSON) :\n${safeJson(body?.context)}`,
      cache_control: { type: "ephemeral" },
    },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1400,
        stream: true,
        system,
        messages,
      }),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "exception", detail: String(e?.message || e).slice(0, 300) },
      { status: 500 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: "upstream", status: upstream.status, detail: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  // ── Relais SSE → flux texte brut ────────────────────────────
  // On parse le flux SSE d'Anthropic côté serveur et on ne renvoie
  // au navigateur QUE les deltas de texte, en clair. Le client n'a
  // qu'à lire response.body et concaténer.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Les événements SSE sont séparés par une ligne vide.
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const evt = JSON.parse(payload);
                if (
                  evt?.type === "content_block_delta" &&
                  evt?.delta?.type === "text_delta" &&
                  typeof evt.delta.text === "string"
                ) {
                  controller.enqueue(encoder.encode(evt.delta.text));
                } else if (evt?.type === "error") {
                  controller.enqueue(
                    encoder.encode("\n\n[Erreur du service IA, réessayez.]"),
                  );
                }
              } catch {
                /* ligne non-JSON : ignorer */
              }
            }
          }
        }
      } catch {
        /* Connexion interrompue : on termine proprement. */
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
    cancel() {
      try {
        upstream.body?.cancel();
      } catch {
        /* noop */
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      "x-ai-stream": "1",
    },
  });
}
