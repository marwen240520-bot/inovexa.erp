// components/site/CatalogBlocks.tsx
// Blocs des pages publiques tirés du catalogue réel de l'ERP (lib/catalog.ts) : modules, secteurs, contenu des
// formules. Ils ne sont pas écrits à la main dans les pages : quand un module ou un secteur change dans le catalogue
// (lui-même contrôlé contre le serveur par un test), les pages Produits et Tarifs suivent.
// Composants serveur (aucun état).
import React from "react";
import Link from "next/link";
import { ModuleIcon, type ModuleIconKey } from "@/components/site/ModuleIcon";
import { SectorIcon } from "@/components/site/SectorIcon";
import { ALL_MODULES, DEFAULT_TRIAL_HOURS, MODULE_GROUPS, MODULE_INFO, PLANS, SECTORS, pick, planIncludes, trialLabel } from "@/lib/catalog";

/** Chiffres clés calculés sur le catalogue : jamais saisis à la main. */
export function CatalogStats({ lang, labels }: { lang: string; labels: { modules: string; sectors: string; languages: string; trial: string } }) {
  const items = [
    { value: String(ALL_MODULES.length), label: labels.modules },
    { value: String(SECTORS.length), label: labels.sectors },
    { value: "4", label: labels.languages },
    { value: trialLabel(DEFAULT_TRIAL_HOURS, lang), label: labels.trial },
  ];
  return (
    <dl className="st-stats">
      {items.map((item) => (
        <div key={item.label} className="st-stat">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Deux colonnes de hauteur voisine : (vente + pilotage) et (achats, stock, logistique + finance). */
const MODULE_COLUMNS: string[][] = [["commercial", "insights"], ["supply", "finance"]];

/** Tous les modules, par famille, avec ce que chacun fait réellement. */
export function ModulesBlock({ lang }: { lang: string }) {
  const placed = new Set(MODULE_COLUMNS.flat());
  // Une famille ajoutée plus tard au catalogue reste affichée, à la suite de la première colonne.
  const columns = MODULE_COLUMNS.map((ids, i) => [...ids, ...(i === 0 ? MODULE_GROUPS.map((g) => g.id).filter((id) => !placed.has(id)) : [])]);
  return (
    <div className="st-modgroups">
      {columns.map((ids, i) => (
        <div key={i} className="st-modcol">
          {ids.map((id) => MODULE_GROUPS.find((g) => g.id === id)).filter((group) => !!group).map((group) => (
            <section key={group!.id} className="st-modgroup" aria-label={pick(group!.label, lang)}>
              <h3 className="st-modgroup-title">{pick(group!.label, lang)}</h3>
              <ul className="st-mods">
                {group!.modules.map((code) => (
                  <li key={code} className="st-mod" id={`module-${code}`}>
                    <span className="st-mod-ico" aria-hidden="true"><ModuleIcon name={code as ModuleIconKey} size={20} /></span>
                    <div>
                      <h4>{pick(MODULE_INFO[code].label, lang)}</h4>
                      <p>{pick(MODULE_INFO[code].desc, lang)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Les secteurs proposés à l'inscription, chacun avec les modules activés d'office. */
export function SectorsBlock({ lang, labels }: { lang: string; labels: { modules: string; cta: string } }) {
  return (
    <div className="st-sectors">
      {SECTORS.map((sector) => (
        <article key={sector.code} className="st-sector" id={`sector-${sector.code}`}>
          <header>
            <span className="st-sector-ico" aria-hidden="true"><SectorIcon code={sector.code} size={22} /></span>
            <h3>{pick(sector.name, lang)}</h3>
          </header>
          <p>{pick(sector.desc, lang)}</p>
          <p className="st-sector-label">{labels.modules}</p>
          <ul className="st-sector-mods">
            {sector.modules.filter((code) => code !== "dashboard").map((code) => <li key={code}>{pick(MODULE_INFO[code].label, lang)}</li>)}
          </ul>
          <Link href={`/auth/register?sector=${sector.code}`} className="st-sector-cta">{labels.cta} →</Link>
        </article>
      ))}
    </div>
  );
}

/** Ce que comprend chaque formule, module par module. */
export function PlanMatrixBlock({ lang, labels }: { lang: string; labels: { module: string; users: string; unlimited: string; included: string; notIncluded: string; note: string } }) {
  return (
    <>
      <div className="st-table-wrap">
        <table className="st-table st-matrix">
          <thead>
            <tr>
              <th scope="col">{labels.module}</th>
              {PLANS.map((plan) => <th key={plan.code} scope="col" className="st-matrix-plan">{plan.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{labels.users}</th>
              {PLANS.map((plan) => <td key={plan.code} className="st-matrix-cell"><strong>{plan.maxUsers === null ? labels.unlimited : plan.maxUsers}</strong></td>)}
            </tr>
            {MODULE_GROUPS.map((group) => (
              <React.Fragment key={group.id}>
                <tr className="st-matrix-group">
                  <th scope="colgroup" colSpan={PLANS.length + 1}>{pick(group.label, lang)}</th>
                </tr>
                {group.modules.map((code) => (
                  <tr key={code}>
                    <th scope="row">{pick(MODULE_INFO[code].label, lang)}</th>
                    {PLANS.map((plan) => {
                      const on = code === "dashboard" || planIncludes(plan, code);
                      return (
                        <td key={plan.code} className={"st-matrix-cell" + (on ? " is-on" : " is-off")}>
                          <span aria-hidden="true">{on ? "✓" : "—"}</span>
                          <span className="st-sr">{on ? labels.included : labels.notIncluded}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="st-muted">{labels.note}</p>
    </>
  );
}

/** Étapes numérotées (comment se passe l'essai, comment payer…). */
export function StepsBlock({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="st-steps">
      {items.map((item, i) => (
        <li key={i} className="st-step">
          <span className="st-step-n" aria-hidden="true">{i + 1}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
