
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import "./site-header.css";

interface NavItem {
  href: string;
  label: string;
}

const LANGS = [
  { code: "fr", label: "Français", flag: "fr" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
] as const;

const DEFAULT_NAV: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

const DEFAULT_CTA: NavItem = {
  href: "/contact#form-section",
  label: "Réserver une démo",
};

const IconChevronDown = () => (
  <svg
    width={9}
    height={9}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg
    width={10}
    height={10}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
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

  // Utilise les liens transmis par la page, sans doublons.
  const navigation = (nav?.length ? nav : DEFAULT_NAV).filter(
    (item, index, array) =>
      array.findIndex((candidate) => candidate.href === item.href) === index
  );

  const demoButton = cta?.href ? cta : DEFAULT_CTA;

  const currentLang = LANGS.find((item) => item.code === lang);
  const currentLabel = currentLang?.label ?? lang.toUpperCase();

  useEffect(() => {
    if (!showLanguageMenu) return;

    const onPointer = (event: PointerEvent) => {
      if (
        langWrapRef.current &&
        !langWrapRef.current.contains(event.target as Node)
      ) {
        setShowLanguageMenu(false);
      }
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

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="st-header">
      <div className="st-header-row">
        {/* GAUCHE : LOGO */}
        <Link href="/" className="st-brand" aria-label="Inovexa ERP">
          <img
            src="/images/logo.png"
            alt="Inovexa ERP"
            width={32}
            height={32}
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
            }}
          />

          <span className="st-brand-name" lang="en" dir="ltr">
            <b>INOV</b>EXA <span>ERP</span>
          </span>
        </Link>

        {/* CENTRE : NAVIGATION */}
        <nav
          id="st-nav"
          className={"st-nav" + (open ? " is-open" : "")}
          aria-label="Navigation principale"
        >
          {navigation.map((item) => {
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

        {/* DROITE : LANGUE + DEMO + MENU MOBILE */}
        <div className="st-header-tools">
          <div ref={langWrapRef} className="st-lang">
            <button
              ref={langButtonRef}
              type="button"
              className="st-chip-btn"
              aria-haspopup="listbox"
              aria-expanded={showLanguageMenu}
              aria-label={`${labels.language} — ${currentLabel}`}
              onClick={() =>
                setShowLanguageMenu((value) => !value)
              }
            >
              {currentLang && (
                <img
                  src={`https://flagcdn.com/w20/${currentLang.flag}.png`}
                  width={13}
                  height={10}
                  alt=""
                />
              )}

              <span className="st-chip-code">
                {lang.toUpperCase()}
              </span>

              <span
                className={
                  "st-chevron" +
                  (showLanguageMenu ? " open" : "")
                }
              >
                <IconChevronDown />
              </span>
            </button>

            {showLanguageMenu && (
              <ul
                role="listbox"
                aria-label={labels.language}
                className="st-lang-menu"
              >
                {LANGS.map((item) => {
                  const active = item.code === lang;

                  return (
                    <li
                      key={item.code}
                      role="option"
                      aria-selected={active}
                    >
                      <button
                        type="button"
                        lang={item.code}
                        className={
                          "st-lang-item" +
                          (active ? " active" : "")
                        }
                        onClick={() =>
                          handleLanguageChange(item.code)
                        }
                      >
                        <img
                          src={`https://flagcdn.com/w20/${item.flag}.png`}
                          width={13}
                          height={10}
                          alt=""
                        />

                        <span>{item.label}</span>

                        {active && <IconCheck />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href={demoButton.href}
            className="st-header-cta"
          >
            {demoButton.label}
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
