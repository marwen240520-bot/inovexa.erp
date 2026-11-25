// components/site/SiteHeader.tsx
// En-tête des pages publiques : logo, menu, choix de la langue, bouton de démo.
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  href: string;
  label: string;
}

const LANG_CODES = ["en", "fr", "es"] as const;

export default function SiteHeader({
  lang,
  nav,
  cta,
  labels,
}: {
  lang: string;
  nav: NavItem[];
  cta: NavItem;
  labels: { language: string; menu: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  // La langue est celle de toute l'application (cookie « lang ») : après le changement,
  // la page est redemandée au serveur pour être rendue dans la nouvelle langue.
  const switchTo = async (code: string) => {
    if (code === lang) return;
    await changeLanguage(code);
    router.refresh();
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <header className="st-header">
      <div className="st-wrap st-header-row">
        <Link href="/" className="st-brand" aria-label="Inovexa ERP">
          <img src="/images/logo.png" alt="" width={40} height={40} />
          <span className="st-brand-name" lang="en">
            <b>INOV</b>EXA <span>ERP</span>
          </span>
        </Link>

        <nav id="st-nav" className={"st-nav" + (open ? " is-open" : "")} aria-label="Site">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="st-header-tools">
          <div className="st-langs" role="group" aria-label={labels.language}>
            {LANG_CODES.map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                className={code === lang ? "is-active" : undefined}
                aria-pressed={code === lang}
                onClick={() => switchTo(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href={cta.href} className="st-btn st-btn-small">
            {cta.label}
          </Link>
          <button
            type="button"
            className="st-menu-btn"
            aria-controls="st-nav"
            aria-expanded={open}
            aria-label={labels.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
