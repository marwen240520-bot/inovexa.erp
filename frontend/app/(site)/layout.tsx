// app/(site)/layout.tsx
// Mise en page commune des pages publiques : /products, /pricing, /about, /contact, /blog, /privacy, /terms.
import type React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getSiteLang, siteT } from "@/lib/site/content";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = await getSiteLang();
  const t = siteT(lang);
  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    // Le contenu public existe en anglais, français et espagnol : toujours de gauche à droite.
    <div className="site-root" lang={lang} dir="ltr">
      <a className="st-skip" href="#st-main">
        {t("a11y.skipToContent")}
      </a>
      <SiteHeader
        lang={lang}
        nav={nav}
        login={{ href: "/auth/login", label: t("cta.signIn") }}
        cta={{ href: "/contact#form-section", label: t("cta.bookDemo") }}
        labels={{ language: t("nav.language"), menu: "Menu" }}
      />
      <main id="st-main">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  );
}
