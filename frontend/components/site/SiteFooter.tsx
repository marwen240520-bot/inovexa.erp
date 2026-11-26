// components/site/SiteFooter.tsx
// Pied de page des pages publiques. Composant serveur.
import Link from "next/link";
import { siteT, type SiteLang } from "@/lib/site/content";

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@inovexa.erp" },
  { label: "X (Twitter)", href: "https://x.com/Inovexa_erp/" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61570972464277" },
];

export default function SiteFooter({ lang }: { lang: SiteLang }) {
  const t = siteT(lang);
  const year = new Date().getFullYear();
  const company = [
    { href: "/", label: t("footer.home") },
    { href: "/products", label: t("footer.products") },
    { href: "/pricing", label: t("footer.pricing") },
    { href: "/blog", label: t("footer.blog") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("footer.contact") },
    { href: "/auth/login", label: t("cta.signIn") },
    { href: "/auth/register", label: t("cta.createAccount") },
  ];
  // Chaque secteur renvoie à sa fiche sur la page Produits (ancres « sector-<code> » du catalogue).
  const industries = [
    { key: "manufacturing", sector: "manufacturing" },
    { key: "retail", sector: "commerce" },
    { key: "distribution", sector: "wholesale" },
    { key: "healthcare", sector: "healthcare" },
    { key: "professionalServices", sector: "services" },
    { key: "agribusiness", sector: "agrifood" },
  ];

  return (
    <footer className="st-footer">
      <div className="st-wrap st-footer-grid">
        <div>
          <Link href="/" className="st-brand" aria-label="Inovexa ERP">
            <img src="/images/logo.png" alt="" width={40} height={40} />
            <span className="st-brand-name" lang="en">
              <b>INOV</b>EXA <span>ERP</span>
            </span>
          </Link>
          <p className="st-footer-tagline">{t("footer.tagline")}</p>
          <p className="st-footer-socials">
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}
              </a>
            ))}
          </p>
        </div>

        <nav aria-label={t("footer.company")}>
          <h2 className="st-footer-title">{t("footer.company")}</h2>
          <ul>
            {company.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.industries")}>
          <h2 className="st-footer-title">{t("footer.industries")}</h2>
          <ul>
            {industries.map(({ key, sector }) => (
              <li key={key}>
                <Link href={`/products#sector-${sector}`}>{t("footer." + key)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="st-footer-title">{t("footer.getInTouch")}</h2>
          <ul>
            <li>
              <a href="mailto:contact@inovexa-erp.com">contact@inovexa-erp.com</a>
            </li>
            <li>
              <a href="tel:+21622535181">+216 22 535 181</a>
            </li>
            <li>
              <a href="tel:+21626583168">+216 26 583 168</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="st-wrap st-footer-legal">
        <p suppressHydrationWarning>
          © {year} {t("footer.rights")}{" "}
          <a href="https://msai-systems.com" target="_blank" rel="noopener noreferrer">
            MSAI Systems
          </a>
        </p>
        <p>
          <Link href="/privacy">{t("footer.privacyPolicy")}</Link>
          <Link href="/terms">{t("footer.termsOfService")}</Link>
          <Link href="/privacy#cookies">{t("footer.cookiePolicy")}</Link>
        </p>
      </div>
    </footer>
  );
}
