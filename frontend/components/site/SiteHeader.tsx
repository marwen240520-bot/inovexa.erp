// components/site/SiteHeader.tsx
// En-tête des pages publiques : logo, menu, bouton de langue (le même que sur la page d'accueil), bouton de démo.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  href: string;
  label: string;
}

// Même liste et mêmes drapeaux que le bouton de langue de la page d'accueil (app/page.tsx).
const LANGS = [
  { code: "fr", label: "Français", flag: "fr" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
] as const;

const IconChevronDown = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);

  const currentLang = LANGS.find((item) => item.code === lang) ?? LANGS[1];

  // Fermeture du menu des langues : clic en dehors ou touche Échap (comme sur la page d'accueil).
  useEffect(() => {
    if (!showLanguageMenu) return;
    const onPointer = (event: PointerEvent) => {
      if (langWrapRef.current && !langWrapRef.current.contains(event.target as Node)) setShowLanguageMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLanguageMenu(false);
        langButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [showLanguageMenu]);

  // La langue est celle de toute l'application (cookie « lang ») : après le changement,
  // la page est redemandée au serveur pour être rendue dans la nouvelle langue.
  const handleLanguageChange = useCallback(
    async (code: string) => {
      setShowLanguageMenu(false);
      langButtonRef.current?.focus();
      if (code === lang) return;
      await changeLanguage(code);
      router.refresh();
    },
    [changeLanguage, lang, router]
  );

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
          <div ref={langWrapRef} className="st-lang">
            <button
              ref={langButtonRef}
              type="button"
              className="st-chip-btn"
              aria-haspopup="listbox"
              aria-expanded={showLanguageMenu}
              aria-label={`${labels.language} — ${currentLang.label}`}
              onClick={() => setShowLanguageMenu((value) => !value)}
            >
              <img src={`https://flagcdn.com/w20/${currentLang.flag}.png`} width={16} height={12} alt="" />
              <span className="st-chip-code">{currentLang.code.toUpperCase()}</span>
              <span className={"st-chevron" + (showLanguageMenu ? " open" : "")}>
                <IconChevronDown />
              </span>
            </button>

            {showLanguageMenu && (
              <ul role="listbox" aria-label={labels.language} className="st-lang-menu">
                {LANGS.map((item) => {
                  const active = item.code === currentLang.code;
                  return (
                    <li key={item.code} role="option" aria-selected={active}>
                      <button
                        type="button"
                        lang={item.code}
                        className={"st-lang-item" + (active ? " active" : "")}
                        onClick={() => handleLanguageChange(item.code)}
                      >
                        <img src={`https://flagcdn.com/w20/${item.flag}.png`} width={16} height={12} alt="" />
                        <span>{item.label}</span>
                        {active && <IconCheck />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
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
