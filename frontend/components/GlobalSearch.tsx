"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCachedModules } from "@/components/Sidebar";

type SearchType =
  | "clients" | "suppliers" | "products" | "categories" | "invoices"
  | "sales" | "purchases" | "orders" | "employees" | "shipments";

interface Hit {
  type: SearchType;
  id: number;
  title: string;
  subtitle: string;
  path: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

/** Module (menu) correspondant à chaque type de résultat : on masque les modules non activés pour le client */
const MODULE_OF: Record<SearchType, string> = {
  clients: "clients", suppliers: "suppliers", products: "products", categories: "categories",
  invoices: "invoices", sales: "sales", purchases: "purchases", orders: "orders", employees: "hr", shipments: "logistics",
};

const TEXTS: Record<string, any> = {
  fr: {
    placeholder: "Rechercher dans votre espace…",
    hint: "Clients, produits, factures, ventes, employés…",
    searching: "Recherche en cours…",
    none: "Aucun résultat pour",
    tooShort: "Saisissez au moins 2 caractères",
    error: "La recherche a échoué. Réessayez.",
    clear: "Effacer la recherche",
    groups: { clients: "Clients", suppliers: "Fournisseurs", products: "Produits", categories: "Catégories", invoices: "Factures", sales: "Ventes", purchases: "Achats", orders: "Commandes", employees: "Employés", shipments: "Expéditions" },
  },
  en: {
    placeholder: "Search your workspace…",
    hint: "Clients, products, invoices, sales, employees…",
    searching: "Searching…",
    none: "No results for",
    tooShort: "Type at least 2 characters",
    error: "Search failed. Please try again.",
    clear: "Clear search",
    groups: { clients: "Clients", suppliers: "Suppliers", products: "Products", categories: "Categories", invoices: "Invoices", sales: "Sales", purchases: "Purchases", orders: "Orders", employees: "Employees", shipments: "Shipments" },
  },
  es: {
    placeholder: "Buscar en su espacio…",
    hint: "Clientes, productos, facturas, ventas, empleados…",
    searching: "Buscando…",
    none: "Sin resultados para",
    tooShort: "Escriba al menos 2 caracteres",
    error: "La búsqueda falló. Inténtelo de nuevo.",
    clear: "Borrar búsqueda",
    groups: { clients: "Clientes", suppliers: "Proveedores", products: "Productos", categories: "Categorías", invoices: "Facturas", sales: "Ventas", purchases: "Compras", orders: "Pedidos", employees: "Empleados", shipments: "Envíos" },
  },
};

const GROUP_ORDER: SearchType[] = ["clients", "suppliers", "products", "invoices", "sales", "purchases", "orders", "employees", "shipments", "categories"];

const GROUP_COLOR: Record<SearchType, string> = {
  clients: "#6366f1", suppliers: "#0ea5e9", products: "#f59e0b", categories: "#a855f7", invoices: "#10b981",
  sales: "#22c55e", purchases: "#ef4444", orders: "#f97316", employees: "#ec4899", shipments: "#14b8a6",
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);

/** Met en évidence la partie recherchée */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "rgba(250, 204, 21, 0.45)", color: "inherit", borderRadius: 3, padding: "0 1px" }}>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

export default function GlobalSearch({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXTS[language] || TEXTS.fr;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [searched, setSearched] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();

  // Recherche différée (250 ms) et annulation de la requête précédente
  useEffect(() => {
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setHits([]); setLoading(false); setError(false); setSearched("");
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/workspace-search?q=${encodeURIComponent(trimmed)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const modules = getCachedModules();
        const allowed = (type: SearchType) =>
          !modules || Object.keys(modules).length === 0 || modules[MODULE_OF[type]] === true;
        const list: Hit[] = (Array.isArray(data?.results) ? data.results : []).filter((h: Hit) => allowed(h.type));
        list.sort((a, b) => GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type));
        setHits(list); setError(false); setSearched(trimmed); setActive(0);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(true); setHits([]); setSearched(trimmed);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, []);

  // Raccourcis : « / » ou Ctrl/Cmd + K pour placer le curseur dans la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((hit: Hit) => {
    setOpen(false);
    // La page de destination s'ouvre déjà filtrée sur le terme recherché
    router.push(`${hit.path}?q=${encodeURIComponent(searched || trimmed)}`);
  }, [router, searched, trimmed]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter") { e.preventDefault(); go(hits[active]); }
  };

  // Regroupement par type en conservant l'index global (navigation au clavier)
  const groups = useMemo(() => {
    const map = new Map<SearchType, Array<{ hit: Hit; index: number }>>();
    hits.forEach((hit, index) => {
      if (!map.has(hit.type)) map.set(hit.type, []);
      map.get(hit.type)!.push({ hit, index });
    });
    return Array.from(map.entries());
  }, [hits]);

  const showPanel = open && trimmed.length > 0;

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 560 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--theme-text-secondary)", display: "flex", pointerEvents: "none" }}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          aria-label={t.placeholder}
          autoComplete="off"
          value={query}
          placeholder={t.placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "14px 40px 14px 42px" : "12px 70px 12px 42px",
            fontSize: isMobile ? 16 : 14,
            color: "var(--theme-text)",
            background: "var(--theme-surface)",
            border: "1.5px solid var(--theme-border)",
            borderRadius: 14,
            outline: "none",
            boxShadow: "0 1px 4px rgba(17,24,39,0.05)",
            appearance: "none",
            WebkitAppearance: "none",
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--theme-border)"; }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary, #6366f1)"; }}
        />
        {query ? (
          <button
            type="button"
            aria-label={t.clear}
            onClick={() => { setQuery(""); setHits([]); inputRef.current?.focus(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", color: "var(--theme-text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        ) : (
          !isMobile && (
            <kbd style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--theme-text-secondary)", border: "1px solid var(--theme-border)", borderRadius: 6, padding: "1px 7px", background: "var(--theme-surface-hover)" }}>
              Ctrl K
            </kbd>
          )
        )}
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 2500,
            maxHeight: isMobile ? "60vh" : 440,
            overflowY: "auto",
            background: "var(--theme-surface)",
            color: "var(--theme-text)",
            border: "1px solid var(--theme-border)",
            borderRadius: 14,
            boxShadow: "0 18px 40px rgba(17,24,39,0.22)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {trimmed.length < 2 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--theme-text-secondary)" }}>{t.tooShort}</div>
          ) : loading && hits.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--theme-text-secondary)" }}>{t.searching}</div>
          ) : error ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#ef4444" }}>{t.error}</div>
          ) : hits.length === 0 && searched === trimmed ? (
            <div style={{ padding: "16px", fontSize: 14 }}>
              {t.none} « <strong>{trimmed}</strong> »
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--theme-text-secondary)" }}>{t.hint}</div>
            </div>
          ) : (
            groups.map(([type, items]) => (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--theme-text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GROUP_COLOR[type] }} />
                  {t.groups[type]}
                  <span style={{ marginLeft: "auto", fontWeight: 500 }}>{items.length}</span>
                </div>
                {items.map(({ hit, index }) => (
                  <div
                    key={`${hit.type}-${hit.id}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(hit)}
                    style={{
                      padding: isMobile ? "12px 16px" : "9px 16px",
                      cursor: "pointer",
                      background: index === active ? "var(--theme-surface-hover)" : "transparent",
                      borderLeft: `3px solid ${index === active ? GROUP_COLOR[type] : "transparent"}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--theme-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Highlight text={hit.title} query={searched} />
                    </div>
                    {hit.subtitle && (
                      <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Highlight text={hit.subtitle} query={searched} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          <div style={{ height: 6 }} />
        </div>
      )}
    </div>
  );
}
