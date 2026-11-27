"use client";
// components/home/HomePage.tsx — contenu de la page d'accueil.
// app/page.tsx l'enveloppe côté serveur (titre, description, URL canonique, données structurées) ; ce composant client
// affiche la page.
//
// Une page qui défile : premier écran (image, titre, essai gratuit), puis pourquoi Inovexa ERP, les modules, les
// secteurs, le démarrage en trois étapes, les formules et un dernier appel à l'essai.
// L'en-tête est celui des pages publiques (components/site/SiteHeader) : il garde sa place en haut de l'écran et
// ne recouvre pas le contenu. Textes en français, anglais et espagnol (components/home/homeTexts.ts) ;
// modules, secteurs et formules viennent du catalogue commun (lib/catalog.ts).
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteHeader from "@/components/site/SiteHeader";
import { ModuleIcon, MODULE_ICON_PATHS, type ModuleIconKey } from "@/components/site/ModuleIcon";
import { SectorIcon } from "@/components/site/SectorIcon";
import { HOME_TEXTS, fillText, type HomeLang } from "@/components/home/homeTexts";
import { ALL_MODULES, MODULE_GROUPS, MODULE_INFO, SECTORS, pick, trialLabel, type CatalogModule } from "@/lib/catalog";
import { usePublicOffer, twoMonthsFree } from "@/lib/publicOffer";
import { formatPrice } from "@/lib/saas";
import { getStoredUser, getToken, homeFor } from "@/lib/session";

const HOME_LANGS: HomeLang[] = ["fr", "en", "es"];
/** Répartition des groupes de modules (lib/catalog.ts › MODULE_GROUPS) sur deux colonnes. */
const GROUP_COLUMNS: string[][] = [["commercial", "insights"], ["supply", "finance"]];
const BG_IMAGE = "/images/3.png";

// ─── Icônes ────────────────────────────────────────────────────────────────────
const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: "false" as const };
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5" {...stroke}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2.8" {...stroke}><polyline points="20 6 9 17 4 12" /></svg>
);
const IconSparkles = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
    <path d="M11 4 Q12.5 10.5 19 12 Q12.5 13.5 11 20 Q9.5 13.5 3 12 Q9.5 10.5 11 4 Z" fill="currentColor" />
    <path d="M19 2.5v4M17 4.5h4" />
    <path d="M19.5 17v3M18 18.5h3" />
  </svg>
);
const IconTarget = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>
);
const IconBars = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
);
const IconFlag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
);
const FEATURE_ICONS = [IconTarget, IconBars, IconShield, IconFlag];

// ─── Orbite des modules (icônes posées sur l'image, nom au survol) ─────────────
// Une icône par module du catalogue (20) + les expéditions : 10 sur l'arc intérieur (rayon 360), 11 sur l'arc extérieur
// (rayon 455), centrés sur (1300 ; 625), régulièrement espacés (≈ 70 px entre deux icônes de 48 px).
// Les positions sont exprimées en pixels de l'image de fond (1672 × 941). La couche .hp-orbit-box reproduit le
// cadrage « object-fit: cover » de .hp-bg-img (object-position: 100% 55%) : les icônes restent collées au portable
// quelle que soit la taille de l'écran.
const ORBIT_IMG_W = 1672;
const ORBIT_IMG_H = 941;
const ORBIT_ITEMS = [
  { key: "appointments", x: 998.1, y: 428.9 },
  { key: "pos", x: 1042.0, y: 373.9 },
  { key: "products", x: 1095.8, y: 328.5 },
  { key: "categories", x: 1157.4, y: 294.4 },
  { key: "stock", x: 1224.5, y: 273.0 },
  { key: "dashboard", x: 1294.4, y: 265.0 },
  { key: "sales", x: 1364.6, y: 270.8 },
  { key: "purchases", x: 1432.3, y: 290.2 },
  { key: "orders", x: 1494.9, y: 322.3 },
  { key: "invoices", x: 1550.1, y: 366.0 },

  { key: "clients", x: 927.3, y: 364.0 },
  { key: "suppliers", x: 972.2, y: 309.4 },
  { key: "objectives", x: 1025.0, y: 262.5 },
  { key: "hr", x: 1084.5, y: 224.3 },
  { key: "projects", x: 1149.2, y: 195.7 },
  { key: "finance", x: 1217.5, y: 177.5 },
  { key: "ai", x: 1287.8, y: 170.2 },
  { key: "logistics", x: 1358.4, y: 173.8 },
  { key: "shipments", x: 1427.6, y: 188.2 },
  { key: "reports", x: 1493.7, y: 213.3 },
  { key: "analytics", x: 1555.1, y: 248.2 },
] as const satisfies readonly { key: ModuleIconKey; x: number; y: number }[];

// Chaque module du catalogue (lib/catalog.ts) a son icône dans l'orbite : si un module est ajouté au catalogue sans l'être ici,
// la compilation échoue, au lieu de laisser une icône manquer sur l'accueil. « shipments » (expéditions) s'y ajoute en plus.
type OrbitKey = (typeof ORBIT_ITEMS)[number]["key"];
const ORBIT_COVERS_CATALOG: [Exclude<CatalogModule, OrbitKey>] extends [never] ? true : false = true;
void ORBIT_COVERS_CATALOG;

function ModuleOrbit({ lang, label, shipments }: { lang: HomeLang; label: string; shipments: string }) {
  const nameOf = (key: ModuleIconKey) => (key === "shipments" ? shipments : pick(MODULE_INFO[key].label, lang));
  return (
    <div className="hp-orbit">
      <div className="hp-orbit-box">
        <svg className="hp-orbit-lines" viewBox={`0 0 ${ORBIT_IMG_W} ${ORBIT_IMG_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="hp-orbit-icon-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7B5CFF" />
              <stop offset="1" stopColor="#4B37E2" />
            </linearGradient>
            <linearGradient id="hp-orbit-line-in" gradientUnits="userSpaceOnUse" x1="982" y1="0" x2="1576" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="0.88" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hp-orbit-line-out" gradientUnits="userSpaceOnUse" x1="902" y1="0" x2="1659" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
            </linearGradient>
            <filter id="hp-orbit-glow" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path d="M 982.1 456.0 A 360 360 0 0 1 1575.8 393.6" fill="none" stroke="url(#hp-orbit-line-in)" strokeWidth="1.4" filter="url(#hp-orbit-glow)" />
          <path d="M 902.0 404.4 A 455 455 0 0 1 1658.5 344.9" fill="none" stroke="url(#hp-orbit-line-out)" strokeWidth="1.2" filter="url(#hp-orbit-glow)" />
        </svg>

        <ul className="hp-orbit-list" aria-label={label}>
          {ORBIT_ITEMS.map((m, i) => (
            <li
              key={m.key}
              className={"hp-orbit-item" + (m.x >= 1600 ? " is-end" : "")}
              style={{ left: `${(m.x / ORBIT_IMG_W) * 100}%`, top: `${(m.y / ORBIT_IMG_H) * 100}%`, "--i": i } as React.CSSProperties}
            >
              <span className="hp-orbit-tile">
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#hp-orbit-icon-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  {MODULE_ICON_PATHS[m.key]}
                </svg>
              </span>
              <span className="hp-orbit-tip">{nameOf(m.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage(): React.ReactElement {
  const { language } = useLanguage();
  const lang: HomeLang = HOME_LANGS.includes(language as HomeLang) ? (language as HomeLang) : "en";
  const text = HOME_TEXTS[lang];
  const offer = usePublicOffer(lang);
  const trial = trialLabel(offer.trialHours, lang);

  // La session n'est connue que dans le navigateur : le premier rendu est celui d'un visiteur.
  const [workspace, setWorkspace] = useState<string | null>(null);
  useEffect(() => {
    setWorkspace(getToken() ? homeFor(getStoredUser()) : null);
  }, []);

  const year = new Date().getFullYear();
  const withTrial = (template: string) => fillText(template, { trial });
  const nav = [
    { href: "/", label: text.header.home },
    { href: "/products", label: text.header.products },
    { href: "/pricing", label: text.header.pricing },
    { href: "/blog", label: text.header.blog },
    { href: "/about", label: text.header.about },
    { href: "/contact", label: text.header.contact },
  ];

  return (
    <div className="home-page">
      <SiteHeader
        lang={lang}
        nav={nav}
        login={workspace ? undefined : { href: "/auth/login", label: text.header.login }}
        cta={workspace ? { href: workspace, label: text.dashboardCta } : { href: "/auth/register", label: text.header.trial }}
        labels={{ language: text.header.language, menu: "Menu" }}
        languages={HOME_LANGS}
      />

      <main>
        {/* ── Premier écran ── */}
        <section className="hp-hero" aria-labelledby="hp-title">
          <img className="hp-bg-img" src={BG_IMAGE} alt="" aria-hidden="true" draggable={false} decoding="async" />
          <ModuleOrbit lang={lang} label={text.orbitLabel} shipments={text.shipments} />

          <div className="hp-hero-content">
            <p className="hp-rise hp-d1 hp-badge">
              <span className="hp-live-dot" aria-hidden="true" />
              {text.badge}
            </p>
            {/* Titre (élément le plus grand de l'écran) : glissement seul, sans opacité 0, pour être peint tout de suite */}
            <h1 id="hp-title" className="hp-slide hp-title">{text.title}</h1>
            <p className="hp-rise hp-d2 hp-subtitle">{text.subtitle}</p>

            <div className="hp-rise hp-d3 hp-actions">
              {workspace ? (
                <>
                  <Link href={workspace} className="hp-cta">
                    {text.dashboardCta}
                    <span className="hp-cta-arrow"><IconArrow /></span>
                  </Link>
                  <Link href="/pricing" className="hp-ghost">{text.pricingCta}</Link>
                </>
              ) : (
                <>
                  <Link href="/auth/register" className="hp-cta">
                    {withTrial(text.trialCta)}
                    <span className="hp-cta-arrow"><IconArrow /></span>
                  </Link>
                  <Link href="/auth/login" className="hp-ghost">{text.loginCta}</Link>
                </>
              )}
            </div>

            <ul className="hp-rise hp-d4 hp-trust">
              {text.trust.map((item) => (
                <li key={item}>
                  <span className="hp-trust-check"><IconCheck /></span>
                  {withTrial(item)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Pourquoi Inovexa ERP ── */}
        <section className="hp-section" aria-labelledby="hp-why-title">
          <div className="hp-wrap">
            <header className="hp-head">
              <p className="hp-eyebrow">{text.why.eyebrow}</p>
              <h2 id="hp-why-title" className="hp-h2">{text.why.title}</h2>
              <p className="hp-lead">{text.why.lead}</p>
            </header>
            <ul className="hp-cards">
              <li className="hp-card hp-card-ai">
                <span className="hp-card-icon hp-ai-icon"><IconSparkles /></span>
                <div>
                  <h3 className="hp-card-title">
                    {text.why.ai.title} <span className="hp-ai-badge">{text.why.ai.badge}</span>
                  </h3>
                  <p className="hp-card-desc">{text.why.ai.desc}</p>
                </div>
              </li>
              {text.why.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i] ?? IconTarget;
                return (
                  <li key={f.title} className="hp-card">
                    <span className="hp-card-icon"><Icon /></span>
                    <div>
                      <h3 className="hp-card-title">{f.title}</h3>
                      <p className="hp-card-desc">{f.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Modules ── */}
        <section className="hp-section hp-tint" aria-labelledby="hp-modules-title">
          <div className="hp-wrap">
            <header className="hp-head">
              <p className="hp-eyebrow">{fillText(text.modules.eyebrow, { n: ALL_MODULES.length })}</p>
              <h2 id="hp-modules-title" className="hp-h2">{text.modules.title}</h2>
              <p className="hp-lead">{text.modules.lead}</p>
            </header>
            {/* Deux colonnes de hauteur voisine : les groupes courts sont empilés avec les longs */}
            <div className="hp-groups">
              {GROUP_COLUMNS.map((column) => (
                <div key={column.join("-")} className="hp-groups-col">
                  {column.map((id) => {
                    const group = MODULE_GROUPS.find((g) => g.id === id);
                    if (!group) return null;
                    return (
                      <article key={group.id} className="hp-group">
                        <h3 className="hp-group-title">{pick(group.label, lang)}</h3>
                        <ul className="hp-modules">
                          {group.modules.map((key) => (
                            <li key={key}>
                              <span className="hp-module-icon"><ModuleIcon name={key} size={18} /></span>
                              <span>
                                <strong>{pick(MODULE_INFO[key].label, lang)}</strong>
                                <span className="hp-module-desc">{pick(MODULE_INFO[key].desc, lang)}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="hp-more"><Link href="/products" className="hp-link">{text.modules.cta} <IconArrow /></Link></p>
          </div>
        </section>

        {/* ── Secteurs ── */}
        <section className="hp-section" aria-labelledby="hp-sectors-title">
          <div className="hp-wrap">
            <header className="hp-head">
              <p className="hp-eyebrow">{fillText(text.sectors.eyebrow, { n: SECTORS.length })}</p>
              <h2 id="hp-sectors-title" className="hp-h2">{text.sectors.title}</h2>
              <p className="hp-lead">{text.sectors.lead}</p>
            </header>
            <ul className="hp-sectors">
              {SECTORS.map((sector) => (
                <li key={sector.code}>
                  <Link href={`/products#sector-${sector.code}`} className="hp-sector">
                    <span className="hp-sector-icon"><SectorIcon code={sector.code} /></span>
                    <span className="hp-sector-name">{pick(sector.name, lang)}</span>
                    <span className="hp-sector-count">{fillText(text.sectors.count, { n: sector.modules.length })}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="hp-more"><Link href="/products#sectors" className="hp-link">{text.sectors.cta} <IconArrow /></Link></p>
          </div>
        </section>

        {/* ── Démarrage ── */}
        <section className="hp-section hp-tint" aria-labelledby="hp-steps-title">
          <div className="hp-wrap">
            <header className="hp-head">
              <p className="hp-eyebrow">{text.steps.eyebrow}</p>
              <h2 id="hp-steps-title" className="hp-h2">{text.steps.title}</h2>
            </header>
            <ol className="hp-steps">
              {text.steps.items.map((step, i) => (
                <li key={step.title} className="hp-step">
                  <span className="hp-step-num" aria-hidden="true">{i + 1}</span>
                  <h3 className="hp-card-title">{withTrial(step.title)}</h3>
                  <p className="hp-card-desc">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Formules ── */}
        <section className="hp-section" aria-labelledby="hp-pricing-title">
          <div className="hp-wrap">
            <header className="hp-head">
              <p className="hp-eyebrow">{text.pricing.eyebrow}</p>
              <h2 id="hp-pricing-title" className="hp-h2">{text.pricing.title}</h2>
              <p className="hp-lead">{text.pricing.lead}{twoMonthsFree(offer.plans) ? ` ${text.pricing.twoMonths}` : ""}</p>
            </header>
            <div className="hp-plans">
              {offer.plans.map((plan) => (
                <article key={plan.code} className={"hp-plan" + (plan.highlight ? " is-featured" : "")}>
                  {plan.highlight ? <span className="hp-plan-badge">{text.pricing.popular}</span> : null}
                  <h3 className="hp-plan-name">{plan.name}</h3>
                  <p className="hp-plan-price">
                    {plan.priceMonthly === null ? (
                      <strong>{text.pricing.onQuote}</strong>
                    ) : (
                      <>
                        <strong>{formatPrice(plan.priceMonthly, lang, offer.currency)}</strong>
                        <span> {text.pricing.exclTax} {text.pricing.perMonth}</span>
                      </>
                    )}
                  </p>
                  <p className="hp-plan-annual">
                    {plan.priceAnnual === null ? " " : fillText(text.pricing.annual, { price: formatPrice(plan.priceAnnual, lang, offer.currency) })}
                  </p>
                  <p className="hp-plan-tagline">{plan.tagline}</p>
                  <ul className="hp-plan-features">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature}>
                        <span className="hp-trust-check"><IconCheck /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.priceMonthly === null ? "/contact" : `/auth/register?plan=${encodeURIComponent(plan.code)}`} className={plan.highlight ? "hp-cta" : "hp-ghost"}>
                    {plan.priceMonthly === null ? text.header.contact : text.pricing.choose}
                  </Link>
                </article>
              ))}
            </div>
            <p className="hp-more"><Link href="/pricing" className="hp-link">{text.pricing.cta} <IconArrow /></Link></p>
          </div>
        </section>

        {/* ── Dernier appel ── */}
        <section className="hp-band" aria-labelledby="hp-final-title">
          <div className="hp-wrap">
            <h2 id="hp-final-title" className="hp-h2">{text.final.title}</h2>
            <p className="hp-lead">{withTrial(text.final.lead)}</p>
            <div className="hp-actions">
              <Link href={workspace ?? "/auth/register"} className="hp-cta hp-cta-light">
                {workspace ? text.dashboardCta : text.final.primary}
                <span className="hp-cta-arrow"><IconArrow /></span>
              </Link>
              <Link href="/pricing" className="hp-ghost hp-ghost-light">{text.final.secondary}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="hp-footer">
        <div className="hp-wrap hp-footer-grid">
          <div>
            <Link href="/" className="st-brand" aria-label="Inovexa ERP">
              <img src="/images/logo.png" alt="" width={40} height={40} />
              <span className="st-brand-name" lang="en" dir="ltr"><b>INOV</b>EXA <span>ERP</span></span>
            </Link>
            <p className="hp-footer-tagline">{text.footer.tagline}</p>
          </div>
          <nav aria-label={text.footer.product}>
            <h2 className="hp-footer-title">{text.footer.product}</h2>
            <ul>
              <li><Link href="/products">{text.header.products}</Link></li>
              <li><Link href="/pricing">{text.header.pricing}</Link></li>
              <li><Link href="/blog">{text.header.blog}</Link></li>
            </ul>
          </nav>
          <nav aria-label={text.footer.company}>
            <h2 className="hp-footer-title">{text.footer.company}</h2>
            <ul>
              <li><Link href="/about">{text.header.about}</Link></li>
              <li><Link href="/contact">{text.header.contact}</Link></li>
            </ul>
          </nav>
          <nav aria-label={text.footer.account}>
            <h2 className="hp-footer-title">{text.footer.account}</h2>
            <ul>
              <li><Link href="/auth/login">{text.header.login}</Link></li>
              <li><Link href="/auth/register">{text.footer.signup}</Link></li>
              <li><a href="mailto:contact@inovexa-erp.com" dir="ltr">contact@inovexa-erp.com</a></li>
              <li><a href="tel:+21622535181" dir="ltr">+216 22 535 181</a></li>
            </ul>
          </nav>
        </div>
        <div className="hp-wrap hp-footer-legal">
          <p suppressHydrationWarning>
            © {year} Inovexa ERP. {text.footer.rights} · {text.footer.partOf}{" "}
            <a href="https://msai-systems.com" target="_blank" rel="noopener noreferrer">MSAI Systems</a>
          </p>
          <p>
            <Link href="/privacy">{text.footer.privacy}</Link>
            <Link href="/terms">{text.footer.terms}</Link>
          </p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .home-page {
    --hp-bg: #f8f7ff;
    --hp-text: #1E1035;
    --hp-muted: #3d3560;
    --hp-accent: #5b3fe0;
    --hp-accent-deep: #2E1065;
    --hp-line: rgba(91, 63, 224, 0.16);
    --hp-glass: rgba(255, 255, 255, 0.78);
    --hp-wave: linear-gradient(90deg, #6a54e7 0%, #8450e7 28%, #e659b0 62%, #fb7b6f 82%, #fdba69 100%);
    --hp-pad: clamp(16px, 4vw, 56px);
    /* Hauteur de l'en-tête (barre + liseré) : voir components/site/site-header.css */
    --hp-header: 67px;
    color-scheme: light;
    min-height: 100dvh;
    background: var(--hp-bg);
    color: var(--hp-text);
    font-family: var(--font-poppins), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    /* « clip » : rien ne déborde sur les côtés, sans créer de zone de défilement (l'en-tête reste collé en haut) */
    overflow-x: clip;
  }
  .home-page *, .home-page *::before, .home-page *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .home-page :focus-visible { outline: 2px solid #7c5cff; outline-offset: 3px; border-radius: 10px; }
  .home-page ul, .home-page ol { list-style: none; margin: 0; padding: 0; }
  .home-page h1, .home-page h2, .home-page h3, .home-page p { margin: 0; }
  .hp-wrap { width: 100%; max-width: 1180px; margin: 0 auto; }

  /* ══ Premier écran ══ */
  .hp-hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100vh - var(--hp-header));
    min-height: calc(100dvh - var(--hp-header));
    padding: clamp(32px, 6vh, 72px) var(--hp-pad) clamp(40px, 9vh, 104px);
  }
  /* Image plein cadre, ancrée à DROITE : le portable reste toujours visible */
  .hp-bg-img { position: absolute; inset: 0; z-index: -3; width: 100%; height: 100%; object-fit: cover; object-position: 100% 55%; user-select: none; -webkit-user-drag: none; }
  /* Aucun voile sur l'image : elle s'affiche telle quelle, avec toutes ses couleurs. Le titre reste lisible parce que la partie
     gauche de l'image est claire ; les petits écrans sont réglés plus bas (voir « Tablette et téléphone »). */

  .hp-hero-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-start; width: 100%; max-width: min(720px, 52vw); }
  .hp-badge { display: inline-flex; align-items: center; gap: 9px; padding: 7px 16px; border-radius: 999px; background: rgba(255, 255, 255, 0.86); border: 1px solid rgba(109, 40, 217, 0.18); box-shadow: 0 6px 18px rgba(76, 29, 149, 0.08); color: var(--hp-text); font-size: clamp(12.5px, 0.95vw, 14.5px); font-weight: 600; line-height: 1.35; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .hp-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; animation: hpPing 2.4s ease-out infinite; }
  @keyframes hpPing { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); } 80%, 100% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); } }
  .hp-title { margin-top: clamp(16px, 2.8vh, 28px) !important; font-size: clamp(32px, min(4.6vw, 7.4vh), 68px); font-weight: 700; line-height: 1.07; letter-spacing: -0.03em; text-wrap: balance; color: var(--hp-text); }
  .hp-subtitle { margin-top: clamp(14px, 2.2vh, 22px) !important; max-width: 600px; color: var(--hp-muted); font-size: clamp(16px, min(1.35vw, 2.6vh), 20px); line-height: 1.55; }

  /* Boutons */
  .hp-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 14px; margin-top: clamp(22px, 3.6vh, 36px); }
  .hp-cta, .hp-ghost { display: inline-flex; align-items: center; justify-content: center; min-height: 54px; padding: 10px 28px; border-radius: 999px; font-family: inherit; font-size: 16.5px; line-height: 1.25; text-align: center; text-decoration: none; cursor: pointer; }
  .hp-cta { gap: 10px; border: 0; background: var(--hp-accent-deep); color: #fff !important; font-weight: 700; box-shadow: 0 12px 34px rgba(76, 29, 149, 0.34); transition: transform 0.2s, box-shadow 0.2s; }
  .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(76, 29, 149, 0.42); }
  .hp-cta:active { transform: translateY(0); }
  .hp-cta-arrow { display: inline-flex; transition: transform 0.2s; }
  .hp-cta:hover .hp-cta-arrow { transform: translateX(3px); }
  .hp-ghost { border: 1px solid rgba(46, 16, 101, 0.28); background: rgba(255, 255, 255, 0.6); color: var(--hp-text) !important; font-weight: 600; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: background 0.2s, border-color 0.2s; }
  .hp-ghost:hover { background: #fff; border-color: rgba(46, 16, 101, 0.5); }

  /* Garanties sous les boutons */
  .hp-trust { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: clamp(18px, 3vh, 28px) !important; color: var(--hp-text); font-size: 14.5px; font-weight: 500; }
  .hp-trust li { display: inline-flex; align-items: center; gap: 8px; }
  .hp-trust-check { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: rgba(34, 197, 94, 0.16); color: #15803d; }

  /* ── Orbite des modules : même cadrage que .hp-bg-img (object-fit: cover ; object-position: 100% 55%) ── */
  .hp-orbit { position: absolute; inset: 0; z-index: 1; pointer-events: none; container-type: size; }
  .hp-orbit-box {
    --u: max(calc(100vw / 1672), calc(100vh / 941));
    position: absolute;
    width: calc(1672 * var(--u));
    height: calc(941 * var(--u));
    left: calc(100vw - 1672 * var(--u));
    top: calc((100vh - 941 * var(--u)) * 0.55);
  }
  @supports (width: 1cqw) {
    .hp-orbit-box {
      --u: max(calc(100cqw / 1672), calc(100cqh / 941));
      left: calc(100cqw - 1672 * var(--u));
      top: calc((100cqh - 941 * var(--u)) * 0.55);
    }
  }
  .hp-orbit-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .home-page .hp-orbit-list { position: absolute; inset: 0; }
  .hp-orbit-item { position: absolute; width: calc(48 * var(--u)); height: calc(48 * var(--u)); transform: translate(-50%, -50%); pointer-events: auto; animation: hpOrbitIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(380ms + var(--i, 0) * 28ms); }
  .hp-orbit-item:hover { z-index: 3; }
  .hp-orbit-tile { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: calc(13 * var(--u)); background: linear-gradient(150deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.6) 100%); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 24px rgba(40, 30, 150, 0.14), 0 0 20px rgba(255, 255, 255, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #4B37E2; transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s, border-color 0.22s; }
  .hp-orbit-tile svg { width: 50%; height: 50%; overflow: visible; }
  .hp-orbit-item:hover .hp-orbit-tile { transform: translateY(-3px) scale(1.12); border-color: rgba(109, 40, 217, 0.45); box-shadow: 0 16px 32px rgba(40, 30, 150, 0.24), 0 0 26px rgba(255, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.9); }
  .hp-orbit-tip { position: absolute; left: 50%; bottom: calc(100% + 12px); transform: translate(-50%, 6px); padding: 6px 12px; border-radius: 999px; background: #2E1065; color: #fff; font-size: 13px; font-weight: 600; line-height: 1.2; white-space: nowrap; box-shadow: 0 10px 24px rgba(17, 12, 46, 0.25); opacity: 0; pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; }
  .hp-orbit-tip::after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: #2E1065; }
  .hp-orbit-item:hover .hp-orbit-tip { opacity: 1; transform: translate(-50%, 0); }
  /* Dernière icône, près du bord droit : bulle alignée à droite pour ne pas être coupée */
  .hp-orbit-item.is-end .hp-orbit-tip { left: auto; right: -6px; transform: translate(0, 6px); }
  .hp-orbit-item.is-end:hover .hp-orbit-tip { transform: translate(0, 0); }
  .hp-orbit-item.is-end .hp-orbit-tip::after { left: auto; right: calc(24 * var(--u)); transform: none; }
  @keyframes hpOrbitIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); } to { opacity: 1; transform: translate(-50%, -50%); } }

  /* Le texte s'arrête avant la première icône de l'orbite (bord gauche = 100vw − 768,7 px d'image × échelle du fond) */
  @media (min-width: 1200px) {
    .hp-hero-content { max-width: min(720px, 52vw, calc(100vw - 768.7 * max(100vw / 1672, (100vh - var(--hp-header)) / 941) - var(--hp-pad) - 32px)); }
  }

  /* Tablette et téléphone : le texte occupe la largeur, l'orbite est masquée */
  @media (max-width: 1199px) {
    .hp-orbit { display: none; }
    .hp-hero-content { max-width: 680px; }
  }
  @media (max-width: 1199px) and (orientation: portrait) { .hp-bg-img { object-position: 0% center; } }
  @media (max-width: 640px) {
    .hp-hero { justify-content: flex-start; padding-top: 36px; padding-bottom: 56px; }
    .hp-actions { flex-direction: column; align-items: stretch; width: 100%; }
    .hp-cta, .hp-ghost { width: 100%; min-height: 52px; }
    .hp-trust { flex-direction: column; gap: 8px; }
  }
  /* Ordinateur peu haut : espacements resserrés pour que le premier écran reste entier */
  @media (min-width: 1200px) and (max-height: 700px) {
    .hp-hero { padding-top: 22px; padding-bottom: 30px; }
    .hp-cta, .hp-ghost { min-height: 48px; }
  }

  /* ══ Sections ══ */
  .hp-section { padding: clamp(52px, 7.5vw, 104px) var(--hp-pad); background: #fff; }
  .hp-section.hp-tint { background: linear-gradient(180deg, #f6f4ff 0%, #eef0ff 100%); }
  .hp-head { max-width: 760px; margin-bottom: clamp(26px, 3.6vw, 44px); }
  .hp-eyebrow { display: inline-block; margin-bottom: 14px !important; padding: 6px 14px; border-radius: 999px; background: rgba(91, 63, 224, 0.09); color: var(--hp-accent); font-size: 13px; font-weight: 700; letter-spacing: 0.3px; }
  .hp-h2 { font-size: clamp(26px, 3.2vw, 40px); font-weight: 700; line-height: 1.14; letter-spacing: -0.02em; text-wrap: balance; }
  .hp-lead { margin-top: 12px !important; color: var(--hp-muted); font-size: clamp(16px, 1.3vw, 18px); line-height: 1.6; }
  .hp-more { margin-top: clamp(22px, 3vw, 34px) !important; }
  .hp-link { display: inline-flex; align-items: center; gap: 8px; color: var(--hp-accent); font-weight: 700; text-decoration: none; }
  .hp-link:hover { text-decoration: underline; text-underline-offset: 4px; }

  /* Cartes « pourquoi » */
  .hp-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .hp-card { display: flex; flex-direction: column; gap: 14px; padding: 22px; border-radius: 18px; background: #fff; border: 1px solid var(--hp-line); box-shadow: 0 10px 30px rgba(62, 84, 190, 0.08); transition: transform 0.2s, box-shadow 0.2s; }
  .hp-card:hover { transform: translateY(-3px); box-shadow: 0 16px 38px rgba(62, 84, 190, 0.14); }
  .hp-card-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 46px; height: 46px; border-radius: 13px; background: rgba(91, 63, 224, 0.09); color: var(--hp-accent); }
  .hp-card-title { font-size: 17px; font-weight: 700; line-height: 1.3; color: var(--hp-text); }
  .hp-card-desc { margin-top: 6px !important; color: var(--hp-muted); font-size: 14.5px; line-height: 1.55; }
  /* Carte mise en avant : pleine largeur, contour aux couleurs de la vague */
  .hp-card.hp-card-ai { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 18px; border: 1.5px solid transparent; background: linear-gradient(120deg, #ffffff 0%, #f5f0ff 55%, #ecfeff 100%) padding-box, var(--hp-wave) border-box; }
  .hp-ai-icon { background: linear-gradient(100deg, #4f3fd8 0%, #7a48e6 100%); color: #fff; }
  .hp-ai-badge { display: inline-flex; vertical-align: middle; margin-inline-start: 6px; padding: 3px 10px; border-radius: 999px; background: rgba(91, 63, 224, 0.1); color: var(--hp-accent); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.4; white-space: nowrap; }

  /* Modules, par groupe */
  .hp-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
  .hp-groups-col { display: grid; gap: 18px; }
  .hp-group { padding: 24px; border-radius: 20px; background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.95); box-shadow: 0 12px 32px rgba(62, 84, 190, 0.1); }
  .hp-group-title { margin-bottom: 14px !important; padding-bottom: 12px; border-bottom: 1px solid var(--hp-line); font-size: 17px; font-weight: 700; }
  .hp-modules { display: grid; gap: 14px; }
  .hp-modules li { display: flex; align-items: flex-start; gap: 12px; }
  .hp-module-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(91, 63, 224, 0.09); color: var(--hp-accent); }
  .hp-modules strong { display: block; font-size: 15px; font-weight: 700; line-height: 1.35; }
  .hp-module-desc { display: block; margin-top: 2px; color: var(--hp-muted); font-size: 13.5px; line-height: 1.5; }

  /* Secteurs */
  .hp-sectors { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .hp-sector { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; height: 100%; padding: 18px; border-radius: 16px; background: #fff; border: 1px solid var(--hp-line); color: var(--hp-text); text-decoration: none; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
  .hp-sector:hover { transform: translateY(-3px); border-color: rgba(91, 63, 224, 0.5); box-shadow: 0 14px 30px rgba(62, 84, 190, 0.14); }
  .hp-sector-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(140deg, rgba(106, 84, 231, 0.14), rgba(230, 89, 176, 0.14)); color: var(--hp-accent); }
  .hp-sector-name { font-size: 15px; font-weight: 700; line-height: 1.3; }
  .hp-sector-count { margin-top: auto; color: var(--hp-muted); font-size: 13px; font-weight: 500; }

  /* Étapes */
  .hp-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; counter-reset: none; }
  .hp-step { padding: 26px 24px; border-radius: 20px; background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(255, 255, 255, 0.95); box-shadow: 0 12px 32px rgba(62, 84, 190, 0.1); }
  .hp-step-num { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: 16px; border-radius: 50%; background: var(--hp-wave); color: #fff; font-size: 17px; font-weight: 800; }

  /* Formules */
  .hp-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: stretch; }
  .hp-plan { position: relative; display: flex; flex-direction: column; padding: 30px 26px 26px; border-radius: 22px; background: #fff; border: 1px solid var(--hp-line); box-shadow: 0 12px 32px rgba(62, 84, 190, 0.08); }
  .hp-plan.is-featured { border: 2px solid transparent; background: linear-gradient(#fff, #fff) padding-box, var(--hp-wave) border-box; box-shadow: 0 20px 48px rgba(91, 63, 224, 0.18); }
  .hp-plan-badge { position: absolute; top: -13px; inset-inline-start: 26px; padding: 4px 13px; border-radius: 999px; background: linear-gradient(100deg, #4f3fd8 0%, #7a48e6 100%); color: #fff; font-size: 12px; font-weight: 700; }
  .hp-plan-name { font-size: 21px; font-weight: 700; }
  .hp-plan-price { margin-top: 10px !important; color: var(--hp-muted); font-size: 15px; }
  .hp-plan-price strong { color: var(--hp-text); font-family: var(--font-poppins), sans-serif; font-size: clamp(30px, 3vw, 38px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
  .hp-plan-annual { margin-top: 4px !important; color: var(--hp-accent); font-size: 14px; font-weight: 600; }
  .hp-plan-tagline { margin-top: 12px !important; color: var(--hp-muted); font-size: 15px; line-height: 1.5; min-height: 3em; }
  .hp-plan-features { display: grid; gap: 10px; margin: 18px 0 24px !important; font-size: 14.5px; }
  .hp-plan-features li { display: flex; align-items: flex-start; gap: 10px; line-height: 1.45; }
  .hp-plan-features .hp-trust-check { margin-top: 1px; }
  .hp-plan .hp-cta, .hp-plan .hp-ghost { margin-top: auto; width: 100%; min-height: 50px; font-size: 15.5px; }
  .hp-plan .hp-ghost { background: #fff; }

  /* Dernier appel */
  .hp-band { padding: clamp(52px, 7vw, 92px) var(--hp-pad); background: linear-gradient(105deg, #2c21a8 0%, #5a35d6 44%, #a53fd0 72%, #ea4f96 90%, #fda85a 100%); color: #fff; }
  .hp-band .hp-wrap { max-width: 860px; text-align: center; }
  .hp-band .hp-h2 { color: #fff; }
  .hp-band .hp-lead { color: rgba(255, 255, 255, 0.92); }
  .hp-band .hp-actions { justify-content: center; }
  .hp-cta-light { background: #fff; color: #2c21a8 !important; box-shadow: 0 12px 34px rgba(20, 12, 80, 0.3); }
  .hp-ghost-light { background: transparent; border-color: rgba(255, 255, 255, 0.7); color: #fff !important; }
  .hp-ghost-light:hover { background: rgba(255, 255, 255, 0.14); border-color: #fff; }

  /* Pied de page */
  .hp-footer { padding: clamp(36px, 5vw, 60px) var(--hp-pad) 24px; background: linear-gradient(160deg, #1c1a4f 0%, #262272 100%); color: #c9cdf5; font-size: 14.5px; }
  .hp-footer a { color: #dfe2ff; text-decoration: none; }
  .hp-footer a:hover { color: #fff; text-decoration: underline; }
  .hp-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.3fr; gap: 32px; }
  .hp-footer .st-brand-name { color: #fff; }
  .hp-footer .st-brand-name span { color: #b2aefc; }
  .hp-footer-tagline { margin-top: 14px !important; max-width: 320px; }
  .hp-footer-title { margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #fff; }
  .hp-footer ul { display: grid; gap: 8px; }
  .hp-footer-legal { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 24px; margin-top: 34px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.16); font-size: 13.5px; }
  .hp-footer-legal p { display: flex; flex-wrap: wrap; gap: 6px 18px; }

  /* ══ Écrans plus étroits ══ */
  @media (max-width: 1100px) {
    .hp-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hp-sectors { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .hp-plans { grid-template-columns: 1fr; max-width: 520px; margin-inline: auto; }
    .hp-plan-tagline { min-height: 0; }
  }
  @media (max-width: 860px) {
    .hp-groups, .hp-steps { grid-template-columns: 1fr; }
    .hp-footer-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .hp-cards { grid-template-columns: 1fr; }
    .hp-card.hp-card-ai { flex-direction: column; align-items: flex-start; }
    .hp-sectors { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .hp-sector { padding: 14px; }
    .hp-group { padding: 20px 18px; }
    .hp-footer-grid { grid-template-columns: 1fr; }
  }

  /* ══ Apparition du premier écran (sans JavaScript) ══ */
  .hp-rise { animation: hpRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hp-slide { animation: hpSlide 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hp-d1 { animation-delay: 60ms; } .hp-d2 { animation-delay: 140ms; } .hp-d3 { animation-delay: 220ms; } .hp-d4 { animation-delay: 300ms; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes hpSlide { from { transform: translateY(14px); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-slide, .hp-live-dot, .hp-orbit-item { animation: none !important; }
    .hp-cta, .hp-cta-arrow, .hp-ghost, .hp-card, .hp-sector, .hp-orbit-tile, .hp-orbit-tip { transition: none !important; }
    .hp-cta:hover, .hp-card:hover, .hp-sector:hover, .hp-orbit-item:hover .hp-orbit-tile { transform: none; }
  }
`;
