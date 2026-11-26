// lib/publicOffer.ts
// Offre affichée sur le site public (page d'accueil, Tarifs) : formules, prix, durée de l'essai.
//
// Source : GET /public/plans — les formules PUBLIÉES par l'administrateur. Tant qu'aucune n'est publiée, ou si le
// serveur met du temps à répondre (il peut être en veille), le site affiche les formules PROPOSÉES de lib/catalog.ts ;
// dès que la réponse arrive, les prix de l'administrateur les remplacent.
"use client";
import { useEffect, useState } from "react";
import { DEFAULT_TRIAL_HOURS, DEFAULT_VAT_RATE, PLANS, pick } from "@/lib/catalog";
import { publicGet, type PlansResponse } from "@/lib/saas";

export interface DisplayPlan {
  code: string;
  name: string;
  tagline: string;
  /** Hors taxes ; null = sur devis. */
  priceMonthly: number | null;
  priceAnnual: number | null;
  /** null = illimité. */
  maxUsers: number | null;
  /** null = tous les modules du secteur. */
  modules: string[] | null;
  features: string[];
  highlight: boolean;
}

export interface PublicOffer {
  plans: DisplayPlan[];
  currency: string;
  vatRate: number;
  trialHours: number;
  /** true : prix publiés par l'administrateur ; false : prix proposés du catalogue. */
  live: boolean;
}

/** Offre du catalogue (prix proposés), dans la langue demandée. */
export function catalogOffer(lang: string): PublicOffer {
  return {
    plans: PLANS.map((p) => ({
      code: p.code, name: p.name, tagline: pick(p.tagline, lang), priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual, maxUsers: p.maxUsers,
      modules: p.modules, features: p.features.map((f) => pick(f, lang)), highlight: p.highlight,
    })),
    currency: "TND", vatRate: DEFAULT_VAT_RATE, trialHours: DEFAULT_TRIAL_HOURS, live: false,
  };
}

/**
 * Réponse de l'API → offre affichée. Les textes saisis par l'administrateur sont en français : dans les autres langues,
 * une formule connue du catalogue garde ses textes traduits (les prix, eux, viennent toujours de l'API).
 */
export function offerFromApi(res: PlansResponse, lang: string): PublicOffer {
  const fallback = catalogOffer(lang);
  const base = {
    currency: res.currency || fallback.currency,
    vatRate: Number.isFinite(Number(res.vatRate)) ? Number(res.vatRate) : fallback.vatRate,
    trialHours: Number(res.trialHours) > 0 ? Number(res.trialHours) : fallback.trialHours,
  };
  if (!Array.isArray(res.plans) || res.plans.length === 0) return { ...fallback, ...base };
  const plans: DisplayPlan[] = res.plans.map((p) => {
    const known = fallback.plans.find((c) => c.code === p.code);
    const translated = lang !== "fr" && known;
    return {
      code: p.code, name: p.name,
      tagline: translated ? known.tagline : p.description || known?.tagline || "",
      priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual, maxUsers: p.maxUsers,
      modules: p.modules?.length ? p.modules : null,
      features: translated ? known.features : p.features?.length ? p.features : known?.features || [],
      highlight: p.highlight,
    };
  });
  return { ...base, plans, live: true };
}

// Une seule lecture par onglet, partagée par tous les composants qui affichent l'offre.
let pending: Promise<PlansResponse | null> | null = null;
function loadPlans(): Promise<PlansResponse | null> {
  if (!pending) {
    pending = publicGet<PlansResponse>("/public/plans").catch(() => null);
    // Un échec n'est pas gardé : la prochaine page réessaie.
    void pending.then((res) => { if (!res) pending = null; });
  }
  return pending;
}

/** Offre à afficher : celle du catalogue tout de suite, remplacée par celle de l'API dès qu'elle répond. */
export function usePublicOffer(lang: string): PublicOffer {
  const [response, setResponse] = useState<PlansResponse | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPlans().then((res) => { if (alive && res) setResponse(res); });
    return () => { alive = false; };
  }, []);
  return response ? offerFromApi(response, lang) : catalogOffer(lang);
}

/** Économie d'un abonnement annuel par rapport à douze mensualités, en % (null si un prix manque). */
export function annualSavingPct(plan: Pick<DisplayPlan, "priceMonthly" | "priceAnnual">): number | null {
  if (plan.priceMonthly === null || plan.priceAnnual === null || plan.priceMonthly <= 0) return null;
  const pct = (1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100;
  return pct > 0.5 ? Math.round(pct) : null;
}

/**
 * « 2 mois offerts » n'est vrai que si chaque formule annuelle coûte exactement dix mensualités. L'administrateur fixe
 * les prix : la mention n'est affichée que lorsqu'elle est exacte (sinon c'est l'économie en % qui est montrée).
 */
export function twoMonthsFree(plans: Array<Pick<DisplayPlan, "priceMonthly" | "priceAnnual">>): boolean {
  const priced = plans.filter((plan) => plan.priceMonthly !== null && plan.priceAnnual !== null && plan.priceMonthly > 0);
  return priced.length > 0 && priced.every((plan) => Math.abs((plan.priceAnnual as number) - (plan.priceMonthly as number) * 10) < 0.0005);
}
