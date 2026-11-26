// components/site/SiteHeader.tsx
// En-tête commun à la page d'accueil et aux pages publiques.
//   à gauche  : le logo ;
//   à droite  : le menu, « Connexion », le bouton de langue et « Essai gratuit » (création du compte en ligne).
// La barre reste en haut de l'écran pendant le défilement (position: sticky) : elle occupe sa propre hauteur
// dans la page, elle ne se pose donc jamais sur le contenu.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flag, type LangCode } from "@/components/ui/LanguageMenu";
import "./site-header.css";

interface NavItem {
  href: string;
  label: string;
}

const LANG_LABELS: Record<string, string> = { fr: "Français", en: "English", es: "Español" };
/** Les pages publiques existent en français, anglais et espagnol. */
const DEFAULT_LANGUAGES = ["fr", "en", "es"] as const;

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
  login,
  labels,
  languages = DEFAULT_LANGUAGES,
}: {
  lang: string;
  nav: NavItem[];
  /** Bouton principal, à droite (« Essai gratuit » : tout se fait en ligne, sans rendez-vous). */
  cta: NavItem;
  /** Lien « Connexion », affiché avant le bouton de langue (facultatif). */
  login?: NavItem;
  labels: { language: string; menu: string };
  /** Langues proposées dans le menu (codes). */
  languages?: readonly string[];
}) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Une langue hors liste garde son code, sans drapeau.
  const known = (code: string): code is LangCode => code === "fr" || code === "en" || code === "es";
  const currentLabel = LANG_LABELS[lang] ?? lang.toUpperCase();

  // Ombre légère dès que la page a défilé : la barre se détache du contenu qui passe dessous.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermeture du menu des langues : clic en dehors ou touche Échap.
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

  // Menu mobile ouvert : Échap le referme.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
    <header className={"st-header" + (scrolled ? " is-scrolled" : "") + (open ? " is-open" : "")}>
      <div className="st-header-row">
        {/* Gauche : logo */}
        <Link href="/" className="st-brand" aria-label="Inovexa ERP">
          <img src="/images/logo.png" alt="" width={40} height={40} />
          <span className="st-brand-name" lang="en" dir="ltr">
            <b>INOV</b>EXA <span>ERP</span>
          </span>
        </Link>

        {/* Droite : menu, connexion, langue, essai gratuit */}
        <div className="st-header-right">
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
            {/* Repris dans le menu des petits écrans, où ils n'ont pas la place dans la barre */}
            {login ? (
              <Link href={login.href} className="st-nav-extra" onClick={() => setOpen(false)}>
                {login.label}
              </Link>
            ) : null}
            <Link href={cta.href} className="st-nav-extra st-nav-cta" onClick={() => setOpen(false)}>
              {cta.label}
            </Link>
          </nav>

          <div className="st-header-tools">
            {login ? (
              <Link href={login.href} className="st-header-login">
                {login.label}
              </Link>
            ) : null}

            <div ref={langWrapRef} className="st-lang">
              <button
                ref={langButtonRef}
                type="button"
                className="st-chip-btn"
                aria-haspopup="listbox"
                aria-expanded={showLanguageMenu}
                aria-label={`${labels.language} — ${currentLabel}`}
                onClick={() => setShowLanguageMenu((value) => !value)}
              >
                {known(lang) ? <Flag code={lang} width={18} /> : null}
                <span className="st-chip-code">{lang.toUpperCase()}</span>
                <span className={"st-chevron" + (showLanguageMenu ? " open" : "")}>
                  <IconChevronDown />
                </span>
              </button>

              {showLanguageMenu && (
                <ul role="listbox" aria-label={labels.language} className="st-lang-menu">
                  {languages.map((code) => {
                    const active = code === lang;
                    return (
                      <li key={code} role="option" aria-selected={active}>
                        <button
                          type="button"
                          lang={code}
                          className={"st-lang-item" + (active ? " active" : "")}
                          onClick={() => handleLanguageChange(code)}
                        >
                          {known(code) ? <Flag code={code} width={18} /> : null}
                          <span>{LANG_LABELS[code] ?? code.toUpperCase()}</span>
                          {active && <IconCheck />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Link href={cta.href} className="st-header-cta">
              {cta.label}
            </Link>

            <button
              ref={menuButtonRef}
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
      </div>
    </header>
  );
}
