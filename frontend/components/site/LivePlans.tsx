"use client";
// components/site/LivePlans.tsx
// Formules et prix de la page Tarifs. Les prix affichés sont ceux que l'administrateur a publiés (GET /public/plans) ;
// tant qu'aucune formule n'est publiée, ce sont les prix proposés du catalogue. Tous les prix sont hors taxes.
import Link from "next/link";
import React, { useState } from "react";
import { trialLabel } from "@/lib/catalog";
import { annualSavingPct, twoMonthsFree, usePublicOffer } from "@/lib/publicOffer";
import { formatMoney, formatPrice, withVat } from "@/lib/saas";

export interface LivePlansLabels {
  monthly: string; annual: string; twoMonthsFree: string; perMonth: string; perYear: string; exclTax: string; inclTax: string;
  /** « soit {price} HT / mois » */
  perMonthEquivalent: string;
  recommended: string; onQuote: string; askQuote: string;
  /** « Essayer gratuitement {trial} » */
  cta: string;
  /** « Jusqu’à {n} utilisateurs » */
  upTo: string;
  unlimitedUsers: string;
  /** « Prix hors taxes, TVA {rate} % en sus. » */
  vatNote: string;
  cycle: string;
}

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
const isUsersLine = (text: string) => text.length <= 44 && /utilisateur|\busers?\b|usuario/i.test(text) && (/\d/.test(text) || /illimit|unlimited|ilimitad|sin límite/i.test(text));

export default function LivePlans({ lang, labels }: { lang: string; labels: LivePlansLabels }) {
  const offer = usePublicOffer(lang);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const trial = trialLabel(offer.trialHours, lang);
  const annualPerk = twoMonthsFree(offer.plans);
  const price = (n: number) => formatPrice(n, lang, offer.currency);

  return (
    <div className="st-live">
      <div className="st-cycle" role="radiogroup" aria-label={labels.cycle}>
        {(["monthly", "annual"] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cycle === c} className={cycle === c ? "is-on" : ""} onClick={() => setCycle(c)}>
            {c === "monthly" ? labels.monthly : labels.annual}
            {c === "annual" && annualPerk ? <span className="st-save">{labels.twoMonthsFree}</span> : null}
          </button>
        ))}
      </div>

      <div className="st-plans">
        {offer.plans.map((plan) => {
          const amount = cycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
          const saving = cycle === "annual" ? annualSavingPct(plan) : null;
          const usersLine = plan.maxUsers === null ? labels.unlimitedUsers : fill(labels.upTo, { n: plan.maxUsers });
          return (
            <article key={plan.code} className={"st-plan" + (plan.highlight ? " st-plan-featured" : "")}>
              {plan.highlight ? <span className="st-plan-badge">{labels.recommended}</span> : null}
              <h3 className="st-plan-name">{plan.name}</h3>
              <p className="st-plan-desc">{plan.tagline}</p>
              {amount === null ? (
                <p className="st-live-price"><strong>{labels.onQuote}</strong></p>
              ) : (
                <>
                  <p className="st-live-price">
                    <strong>{price(amount)}</strong>
                    <span>{labels.exclTax} {cycle === "annual" ? labels.perYear : labels.perMonth}</span>
                  </p>
                  <p className="st-live-sub">
                    {cycle === "annual"
                      ? <>{fill(labels.perMonthEquivalent, { price: price(Math.round((amount / 12) * 1000) / 1000) })}{saving ? <span className="st-save">−{saving} %</span> : null}</>
                      : <>{formatMoney(withVat(amount, offer.vatRate, offer.currency), lang, offer.currency)} {labels.inclTax}</>}
                  </p>
                </>
              )}
              {amount === null
                ? <Link href="/contact#form-section" className="st-btn st-btn-ghost">{labels.askQuote}</Link>
                : <Link href={`/auth/register?plan=${plan.code}`} className={plan.highlight ? "st-btn" : "st-btn st-btn-ghost"}>{fill(labels.cta, { trial })}</Link>}
              <ul className="st-checks">
                <li><span aria-hidden="true">✓</span>{usersLine}</li>
                {plan.features.filter((feature) => !isUsersLine(feature)).map((feature) => (
                  <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="st-muted">{fill(labels.vatNote, { rate: offer.vatRate.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 }) })}</p>
    </div>
  );
}
