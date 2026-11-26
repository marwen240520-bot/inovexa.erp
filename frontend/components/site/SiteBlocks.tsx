// components/site/SiteBlocks.tsx
// Affiche les blocs de contenu des pages publiques (content/site/**.json). Composant serveur.
import React from "react";
import Link from "next/link";
import type { Block, Inline } from "@/lib/site/content";
import { CatalogStats, ModulesBlock, PlanMatrixBlock, SectorsBlock, StepsBlock } from "@/components/site/CatalogBlocks";
import LivePlans from "@/components/site/LivePlans";
import PaymentMethods from "@/components/site/PaymentMethods";

export interface BlockExtras {
  /** Rendu du bloc « contact » (formulaire + coordonnées). */
  contact?: React.ReactNode;
  /** Langue de la page : utilisée par les blocs tirés du catalogue de l'ERP (modules, secteurs, formules). */
  lang?: string;
}

export function SiteLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

export function Inlines({ nodes }: { nodes?: Inline[] }) {
  if (!nodes) return null;
  return (
    <>
      {nodes.map((node, i) => (
        <InlineNode key={i} node={node} />
      ))}
    </>
  );
}

function InlineNode({ node }: { node: Inline }) {
  if (typeof node === "string") return <>{node}</>;
  const kids = <Inlines nodes={node.c} />;
  switch (node.t) {
    case "b":
      return <strong>{kids}</strong>;
    case "i":
      return <em>{kids}</em>;
    case "s":
      return <s>{kids}</s>;
    case "code":
      return <code>{kids}</code>;
    case "br":
      return <br />;
    case "img":
      return node.src ? <img src={node.src} alt={node.alt || ""} loading="lazy" className="st-inline-img" /> : null;
    case "a":
      return <SiteLink href={node.href || "#"}>{kids}</SiteLink>;
    default:
      return kids;
  }
}

export function Blocks({ blocks, extras }: { blocks?: Block[]; extras?: BlockExtras }) {
  if (!blocks) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} extras={extras} />
      ))}
    </>
  );
}

/** Élément de liste : un seul paragraphe → texte direct, sinon blocs. */
function ListItem({ blocks }: { blocks: Block[] }) {
  if (blocks.length === 1 && blocks[0].t === "p") return <Inlines nodes={blocks[0].c} />;
  return (
    <>
      {blocks.map((block, i) =>
        i === 0 && block.t === "p" ? <Inlines key={i} nodes={block.c} /> : <BlockNode key={i} block={block} />
      )}
    </>
  );
}

function BlockNode({ block: b, extras }: { block: Block; extras?: BlockExtras }) {
  switch (b.t) {
    case "hero":
      return (
        <section className="st-hero">
          <div className="st-wrap">
            {b.eyebrow ? <p className="st-eyebrow">{b.eyebrow}</p> : null}
            <h1 className="st-h1">
              <Inlines nodes={b.title} />
            </h1>
            <div className="st-hero-body">
              <Blocks blocks={b.blocks} extras={extras} />
            </div>
          </div>
        </section>
      );
    case "section":
      return (
        <section className="st-section" id={b.id}>
          <div className="st-wrap">
            <header className="st-section-head">
              {b.eyebrow ? <p className="st-eyebrow">{b.eyebrow}</p> : null}
              <h2 className="st-h2">
                <Inlines nodes={b.title} />
              </h2>
              {b.lead ? (
                <p className="st-lead">
                  <Inlines nodes={b.lead} />
                </p>
              ) : null}
            </header>
            <Blocks blocks={b.blocks} extras={extras} />
          </div>
        </section>
      );
    case "cards":
      return (
        <div className={"st-cards" + (b.items.length === 2 || b.items.length === 4 ? " st-cards-even" : "")}>
          {b.items.map((item: any, i: number) => (
            <article key={i} className="st-card">
              {item.badge ? <span className="st-badge">{item.badge}</span> : null}
              <h3 className="st-card-title">
                {item.href ? (
                  <SiteLink href={item.href}>
                    <Inlines nodes={item.title} />
                  </SiteLink>
                ) : (
                  <Inlines nodes={item.title} />
                )}
              </h3>
              <Blocks blocks={item.body} />
            </article>
          ))}
        </div>
      );
    case "stats":
      return (
        <dl className="st-stats">
          {b.items.map((item: any, i: number) => (
            <div key={i} className="st-stat">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "actions": {
      const links = (b.links as { href: string; label: string }[]).filter((l) => l.label && l.label !== "→");
      if (!links.length) return null;
      return (
        <p className="st-actions">
          {links.map((link, i) => (
            <SiteLink key={i} href={link.href} className={i === 0 ? "st-btn" : "st-btn st-btn-ghost"}>
              {link.label}
            </SiteLink>
          ))}
        </p>
      );
    }
    case "chips":
      return (
        <ul className="st-chips">
          {b.items.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "plans":
      return (
        <div className="st-plans">
          {b.items.map((plan: any, i: number) => (
            <article key={i} className={"st-plan" + (plan.badge ? " st-plan-featured" : "")}>
              {plan.badge ? <span className="st-plan-badge">{plan.badge}</span> : null}
              <h3 className="st-plan-name">{plan.name}</h3>
              <p className="st-plan-price">{plan.price}</p>
              <p className="st-plan-desc">{plan.desc}</p>
              <SiteLink href={plan.cta.href} className={plan.badge ? "st-btn" : "st-btn st-btn-ghost"}>
                {plan.cta.label}
              </SiteLink>
              <p className="st-plan-list-title">{plan.listTitle}</p>
              <ul className="st-checks">
                {plan.features.map((feature: any, j: number) => (
                  <li key={j} className={feature.off ? "is-off" : undefined}>
                    <span aria-hidden="true">{feature.off ? "✗" : "✓"}</span>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      );
    case "faq":
      return (
        <div className="st-faq">
          {b.items.map((item: any, i: number) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      );
    case "contact":
      return <>{extras?.contact ?? null}</>;
    // ── Blocs tirés du catalogue réel de l'ERP (lib/catalog.ts) ──
    case "catalogStats":
      return <CatalogStats lang={extras?.lang || "fr"} labels={b.labels} />;
    case "modules":
      return <ModulesBlock lang={extras?.lang || "fr"} />;
    case "sectors":
      return <SectorsBlock lang={extras?.lang || "fr"} labels={b.labels} />;
    case "planMatrix":
      return <PlanMatrixBlock lang={extras?.lang || "fr"} labels={b.labels} />;
    case "livePlans":
      return <LivePlans lang={extras?.lang || "fr"} labels={b.labels} />;
    case "payments":
      return <PaymentMethods lang={extras?.lang || "fr"} />;
    case "steps":
      return <StepsBlock items={b.items} />;
    case "table":
      return (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                {b.head.map((cell: Inline[], i: number) => (
                  <th key={i} scope="col">
                    <Inlines nodes={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row: Inline[][], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <Inlines nodes={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "h":
      return React.createElement(
        "h" + Math.min(6, Math.max(2, Number(b.l) || 2)),
        { className: "st-h" },
        <Inlines nodes={b.c} />
      );
    case "p":
      return (
        <p>
          <Inlines nodes={b.c} />
        </p>
      );
    case "ul":
      return (
        <ul className="st-list">
          {b.items.map((item: Block[], i: number) => (
            <li key={i}>
              <ListItem blocks={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="st-list" start={b.start}>
          {b.items.map((item: Block[], i: number) => (
            <li key={i}>
              <ListItem blocks={item} />
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="st-quote">
          <Blocks blocks={b.c} />
        </blockquote>
      );
    case "hr":
      return <hr className="st-hr" />;
    default:
      return null;
  }
}
