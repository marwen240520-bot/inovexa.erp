"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Mode = "sale" | "purchase";
interface Product { id: number; name: string; sku?: string; price?: number | string; quantity?: number; imageUrl?: string | null; }
interface Line { product: Product; quantity: number; unitPrice: number; }
interface Ticket { notice?: string; mode: Mode; ticketNumber: string; counterpart: string | null; paymentMethod: string | null; itemsCount: number; total: number; createdAt: string; lines: Array<{ productName: string; quantity: number; unitPrice: number; total: number }>; }

const PAYMENT_CODES = ["cash", "card", "transfer", "check", "mobile", "other"] as const;

const TX: Record<string, Record<string, string>> = {
  fr: {
    title: "Caisse rapide", subtitle: "Vendez ou achetez des produits en quelques secondes",
    sale: "Vente", purchase: "Achat", todaySales: "Ventes du jour", todayPurchases: "Achats du jour",
    search: "Rechercher un produit ou scanner un code (SKU)…", empty: "Aucun produit trouvé", noProducts: "Aucun produit : ajoutez-en dans le module Produits.",
    outOfStock: "Rupture", stock: "Stock", cart: "Panier", cartEmpty: "Touchez un produit pour l'ajouter",
    customer: "Client (facultatif)", supplier: "Fournisseur (facultatif)", customerPh: "Client comptoir", payment: "Moyen de paiement",
    total: "Total", items: "article(s)", clear: "Vider", chargeSale: "Encaisser", chargePurchase: "Enregistrer l'achat",
    unitPrice: "Prix unitaire", maxStock: "Stock maximum atteint", viewCart: "Voir le panier",
    ticket: "Ticket", newSale: "Nouvelle vente", newPurchase: "Nouvel achat", print: "Imprimer", close: "Fermer", saved: "Opération enregistrée",
    cash: "Espèces", card: "Carte", transfer: "Virement", check: "Chèque", mobile: "Mobile", other: "Autre",
    errServer: "Erreur du serveur. Réessayez.", errNetwork: "Impossible de joindre le serveur.", errAuth: "Session expirée : reconnectez-vous.",
    purchaseHint: "Achat : le stock augmente et le prix d'achat est modifiable.", remove: "Retirer",
    priceHint: "Le prix de chaque ligne est modifiable (remise, prix négocié).",
    fallbackNote: "Mode de secours : le serveur n'est pas encore à jour. L'opération est bien enregistrée dans Ventes / Achats ; seul le moyen de paiement n'est pas conservé.",
    partial: "ligne(s) déjà enregistrée(s) avant l'erreur",
  },
  en: {
    title: "Quick checkout", subtitle: "Sell or buy products in seconds",
    sale: "Sale", purchase: "Purchase", todaySales: "Today's sales", todayPurchases: "Today's purchases",
    search: "Search a product or scan a code (SKU)…", empty: "No product found", noProducts: "No products yet: add some in the Products module.",
    outOfStock: "Out of stock", stock: "Stock", cart: "Cart", cartEmpty: "Tap a product to add it",
    customer: "Customer (optional)", supplier: "Supplier (optional)", customerPh: "Walk-in customer", payment: "Payment method",
    total: "Total", items: "item(s)", clear: "Clear", chargeSale: "Charge", chargePurchase: "Record purchase",
    unitPrice: "Unit price", maxStock: "Maximum stock reached", viewCart: "View cart",
    ticket: "Receipt", newSale: "New sale", newPurchase: "New purchase", print: "Print", close: "Close", saved: "Transaction saved",
    cash: "Cash", card: "Card", transfer: "Transfer", check: "Check", mobile: "Mobile", other: "Other",
    errServer: "Server error. Please try again.", errNetwork: "Cannot reach the server.", errAuth: "Session expired: please sign in again.",
    purchaseHint: "Purchase: stock increases and the purchase price is editable.", remove: "Remove",
    priceHint: "Each line price can be edited (discount, negotiated price).",
    fallbackNote: "Fallback mode: the server is not up to date yet. The transaction is saved in Sales / Purchases; only the payment method is not kept.",
    partial: "line(s) already saved before the error",
  },
  es: {
    title: "Caja rápida", subtitle: "Venda o compre productos en segundos",
    sale: "Venta", purchase: "Compra", todaySales: "Ventas de hoy", todayPurchases: "Compras de hoy",
    search: "Buscar un producto o escanear un código (SKU)…", empty: "Ningún producto encontrado", noProducts: "Aún no hay productos: añádalos en el módulo Productos.",
    outOfStock: "Agotado", stock: "Stock", cart: "Carrito", cartEmpty: "Toque un producto para añadirlo",
    customer: "Cliente (opcional)", supplier: "Proveedor (opcional)", customerPh: "Cliente de mostrador", payment: "Método de pago",
    total: "Total", items: "artículo(s)", clear: "Vaciar", chargeSale: "Cobrar", chargePurchase: "Registrar la compra",
    unitPrice: "Precio unitario", maxStock: "Stock máximo alcanzado", viewCart: "Ver carrito",
    ticket: "Ticket", newSale: "Nueva venta", newPurchase: "Nueva compra", print: "Imprimir", close: "Cerrar", saved: "Operación guardada",
    cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", check: "Cheque", mobile: "Móvil", other: "Otro",
    errServer: "Error del servidor. Inténtelo de nuevo.", errNetwork: "No se puede conectar con el servidor.", errAuth: "Sesión caducada: vuelva a iniciar sesión.",
    purchaseHint: "Compra: el stock aumenta y el precio de compra es editable.", remove: "Quitar",
    priceHint: "El precio de cada línea es editable (descuento, precio negociado).",
    fallbackNote: "Modo de respaldo: el servidor aún no está actualizado. La operación se guarda en Ventas / Compras; solo no se conserva el método de pago.",
    partial: "línea(s) ya guardada(s) antes del error",
  },
};

const norm = (v: any) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export default function PosPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  const t = TX[language] || TX.fr;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("sale");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [counterpart, setCounterpart] = useState("");
  const [payment, setPayment] = useState<string>("cash");
  const [names, setNames] = useState<{ clients: string[]; suppliers: string[] }>({ clients: [], suppliers: [] });
  const [today, setToday] = useState<{ sales: { count: number; total: number }; purchases: { count: number; total: number } } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`, { headers: authHeaders() });
      if (res.status === 401) { router.push("/auth/login"); return; }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* l'écran affiche « aucun produit » */ }
    setLoading(false);
  }, [router]);

  const loadToday = useCallback(async () => {
    try { const res = await fetch(`${API_URL}/pos/today`, { headers: authHeaders() }); if (res.ok) setToday(await res.json()); } catch { /* facultatif */ }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/auth/login"); return; }
    loadProducts(); loadToday();
    (async () => {
      const get = async (path: string) => { try { const r = await fetch(`${API_URL}/${path}`, { headers: authHeaders() }); const d = r.ok ? await r.json() : []; return (Array.isArray(d) ? d : []).map((x: any) => String(x.name || "")).filter(Boolean); } catch { return []; } };
      const [clients, suppliers] = await Promise.all([get("clients"), get("suppliers")]);
      setNames({ clients, suppliers });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changer de mode vide le panier (les prix et les règles de stock diffèrent)
  const switchMode = (m: Mode) => { if (m === mode) return; setMode(m); setLines([]); setCounterpart(""); setError(""); };

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return products;
    return products.filter((p) => norm(p.name).includes(q) || norm(p.sku).includes(q));
  }, [products, query]);

  const stockOf = (p: Product) => num(p.quantity);

  const addProduct = (p: Product) => {
    setError("");
    if (mode === "sale" && stockOf(p) <= 0) return;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const cap = mode === "sale" ? stockOf(p) : 100000;
        if (prev[i].quantity >= cap) return prev;
        return prev.map((l, k) => (k === i ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product: p, quantity: 1, unitPrice: num(p.price) }];
    });
    setFlash(p.id); setTimeout(() => setFlash(null), 350);
  };

  const setQty = (id: number, q: number) => setLines((prev) => prev.map((l) => {
    if (l.product.id !== id) return l;
    const cap = mode === "sale" ? stockOf(l.product) : 100000;
    return { ...l, quantity: Math.max(1, Math.min(cap, Math.round(q) || 1)) };
  }));
  const setPrice = (id: number, v: number) => setLines((prev) => prev.map((l) => (l.product.id === id ? { ...l, unitPrice: Math.max(0, v) } : l)));
  const removeLine = (id: number) => setLines((prev) => prev.filter((l) => l.product.id !== id));

  // Entrée dans la recherche : SKU exact (douchette) ou unique résultat -> ajout direct
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setQuery(""); return; }
    if (e.key !== "Enter") return;
    const q = norm(query.trim()); if (!q) return;
    const exact = products.find((p) => norm(p.sku) === q);
    const target = exact || (filtered.length === 1 ? filtered[0] : null);
    if (target) { addProduct(target); setQuery(""); }
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const itemsCount = lines.reduce((s, l) => s + l.quantity, 0);

  // Ancien serveur (sans /pos/checkout) : on enregistre ligne par ligne avec les routes Ventes / Achats existantes.
  const checkoutFallback = async () => {
    const done: Line[] = [];
    const results: Ticket["lines"] = [];
    const name = counterpart.trim();
    for (const l of lines) {
      const body = mode === "sale"
        ? { productId: l.product.id, quantity: l.quantity, unitPrice: l.unitPrice, clientName: name || "Client comptoir", status: "completed" }
        : { productId: l.product.id, quantity: l.quantity, unitPrice: l.unitPrice, supplierName: name || undefined, status: "received" };
      let ok = false; let message = "";
      try {
        const r = await fetch(`${API_URL}/${mode === "sale" ? "sales" : "purchases"}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
        ok = r.ok;
        if (!ok) { const d = await r.json().catch(() => ({} as any)); message = (Array.isArray(d?.message) ? d.message[0] : d?.message) || t.errServer; }
      } catch { message = t.errNetwork; }
      if (!ok) {
        setError(`${done.length ? `${done.length} ${t.partial} (${done.map((x) => x.product.name).join(", ")}) — ` : ""}${message}`);
        if (done.length) { setLines((prev) => prev.filter((x) => !done.some((d) => d.product.id === x.product.id))); loadProducts(); }
        return;
      }
      done.push(l);
      results.push({ productName: l.product.name, quantity: l.quantity, unitPrice: l.unitPrice, total: Math.round(l.quantity * l.unitPrice * 100) / 100 });
    }
    const now = new Date();
    setTicket({
      notice: t.fallbackNote, mode, counterpart: name || (mode === "sale" ? "Client comptoir" : null), paymentMethod: payment,
      ticketNumber: `${mode === "sale" ? "V" : "A"}-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      itemsCount: results.reduce((s, r) => s + r.quantity, 0), total: Math.round(results.reduce((s, r) => s + r.total, 0) * 100) / 100,
      createdAt: now.toISOString(), lines: results,
    });
    setLines([]); setCounterpart(""); setCartOpen(false); loadProducts();
  };

  const checkout = async () => {
    if (!lines.length || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API_URL}/pos/checkout`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ mode, counterpart: counterpart.trim() || undefined, paymentMethod: payment, lines: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, unitPrice: l.unitPrice })) }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok && data?.success) {
        setTicket(data); setLines([]); setCounterpart(""); setCartOpen(false);
        loadProducts(); loadToday();
      } else if (res.status === 401 || res.status === 403) setError(t.errAuth);
      else if (res.status === 404) await checkoutFallback();
      else if (res.status >= 500) setError(t.errServer);
      else { const m = Array.isArray(data?.message) ? data.message[0] : data?.message; setError(m || t.errServer); }
    } catch { setError(t.errNetwork); }
    setBusy(false);
  };

  const printTicket = () => {
    if (!ticket) return;
    const w = window.open("", "_blank", "width=380,height=640");
    if (!w) return;
    const rows = ticket.lines.map((l) => `<tr><td>${l.quantity} × ${String(l.productName).replace(/</g, "&lt;")}</td><td style="text-align:right">${formatCurrency(l.total)}</td></tr>`).join("");
    w.document.write(`<html><head><title>${ticket.ticketNumber}</title><style>body{font:13px monospace;padding:14px;color:#000}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse}td{padding:3px 0;border-bottom:1px dashed #999}.t{font-size:16px;font-weight:bold;margin-top:10px;display:flex;justify-content:space-between}</style></head><body><h2>INOVEXA</h2><div>${ticket.ticketNumber}<br>${new Date(ticket.createdAt).toLocaleString()}${ticket.counterpart ? "<br>" + String(ticket.counterpart).replace(/</g, "&lt;") : ""}</div><hr><table>${rows}</table><div class="t"><span>${t.total}</span><span>${formatCurrency(ticket.total)}</span></div></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  const accent = mode === "sale" ? "#10b981" : "#f59e0b";
  const card: React.CSSProperties = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16 };
  const names2 = mode === "sale" ? names.clients : names.suppliers;

  // ───────── Panier (colonne de droite ou feuille sur mobile) ─────────
  const cartPanel = (
    <div style={{ ...card, padding: isMobile ? 16 : 18, display: "flex", flexDirection: "column", gap: 14, ...(isMobile ? { border: "none", borderRadius: 0, background: "transparent", padding: 0 } : {}) }}>
      {!isMobile && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 17, color: theme.text }}>{t.cart}{itemsCount > 0 && <span style={{ color: theme.textSecondary, fontWeight: 400, fontSize: 13 }}> · {itemsCount} {t.items}</span>}</h2>
          {lines.length > 0 && <button onClick={() => setLines([])} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>{t.clear}</button>}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: isMobile ? "38vh" : 340, overflowY: "auto", minHeight: 56 }}>
        {lines.length === 0 && <div style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", padding: "18px 8px" }}>{t.cartEmpty}</div>}
        {lines.map((l) => (
          <div key={l.product.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 10, background: theme.surfaceHover, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: theme.text, fontWeight: 600, fontSize: 14, wordBreak: "break-word" }}>{l.product.name}</span>
              <button onClick={() => removeLine(l.product.id)} aria-label={t.remove} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden", background: theme.surface }}>
                <button onClick={() => setQty(l.product.id, l.quantity - 1)} aria-label="-" style={{ width: 40, height: 40, border: "none", background: "transparent", color: theme.text, fontSize: 20, cursor: "pointer" }}>−</button>
                <input type="number" inputMode="numeric" min={1} value={l.quantity} onChange={(e) => setQty(l.product.id, num(e.target.value))} aria-label="Quantité" style={{ width: 52, height: 40, textAlign: "center", border: "none", borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, background: "transparent", color: theme.text, fontSize: 16, outline: "none" }} />
                <button onClick={() => addProduct(l.product)} aria-label="+" style={{ width: 40, height: 40, border: "none", background: "transparent", color: theme.text, fontSize: 20, cursor: "pointer" }}>+</button>
              </div>
              <input type="number" inputMode="decimal" step="0.01" min={0} value={l.unitPrice} onChange={(e) => setPrice(l.product.id, num(e.target.value))} aria-label={t.unitPrice} title={t.unitPrice} style={{ width: 96, height: 40, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, textAlign: "right", padding: "0 8px", fontSize: 16 }} />
              <span style={{ marginLeft: "auto", color: theme.text, fontWeight: 700 }}>{formatCurrency(l.quantity * l.unitPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label style={{ color: theme.textSecondary, fontSize: 12, display: "block", marginBottom: 5 }}>{mode === "sale" ? t.customer : t.supplier}</label>
        <input list="pos-names" value={counterpart} onChange={(e) => setCounterpart(e.target.value)} placeholder={mode === "sale" ? t.customerPh : ""} style={{ width: "100%", boxSizing: "border-box", height: 44, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, padding: "0 12px", fontSize: 16 }} />
        <datalist id="pos-names">{names2.slice(0, 200).map((n) => <option key={n} value={n} />)}</datalist>
      </div>

      <div>
        <label style={{ color: theme.textSecondary, fontSize: 12, display: "block", marginBottom: 6 }}>{t.payment}</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {PAYMENT_CODES.map((code) => (
            <button key={code} onClick={() => setPayment(code)} aria-pressed={payment === code} style={{ minHeight: 42, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: payment === code ? 700 : 500, border: `1.5px solid ${payment === code ? theme.primary : theme.border}`, background: payment === code ? theme.primary : theme.surfaceHover, color: payment === code ? "#ffffff" : theme.text }}>{t[code]}</button>
          ))}
        </div>
      </div>

      {error && <div role="alert" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.5)", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
        <span style={{ color: theme.textSecondary }}>{t.total}</span>
        <span style={{ color: theme.text, fontSize: 26, fontWeight: 800 }}>{formatCurrency(total)}</span>
      </div>
      <button onClick={checkout} disabled={!lines.length || busy} style={{ height: 54, borderRadius: 14, border: "none", cursor: !lines.length || busy ? "not-allowed" : "pointer", opacity: !lines.length || busy ? 0.55 : 1, background: accent, color: "#ffffff", fontSize: 17, fontWeight: 800 }}>
        {busy ? "…" : `${mode === "sale" ? t.chargeSale : t.chargePurchase} · ${formatCurrency(total)}`}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.background, padding: isMobile ? "12px" : "16px", paddingBottom: isMobile ? 150 : 24 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <h1 style={{ margin: 0, color: theme.text, fontSize: isMobile ? 20 : 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={isMobile ? 20 : 26} height={isMobile ? 20 : 26} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><rect x="8" y="6" width="8" height="4" rx="1" /><line x1="8" y1="14" x2="8.01" y2="14" /><line x1="12" y1="14" x2="12.01" y2="14" /><line x1="16" y1="14" x2="16.01" y2="14" /><line x1="8" y1="18" x2="8.01" y2="18" /><line x1="12" y1="18" x2="16" y2="18" /></svg>
              {t.title}
            </h1>
            <p style={{ margin: "4px 0 0", color: theme.textSecondary, fontSize: isMobile ? 12 : 14 }}>{t.subtitle}</p>
          </div>
          {today && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ ...card, padding: "8px 14px" }}><div style={{ color: theme.textSecondary, fontSize: 11 }}>{t.todaySales}</div><div style={{ color: theme.text, fontWeight: 700 }}>{formatCurrency(today.sales.total)} <span style={{ color: theme.textSecondary, fontWeight: 400, fontSize: 12 }}>({today.sales.count})</span></div></div>
              <div style={{ ...card, padding: "8px 14px" }}><div style={{ color: theme.textSecondary, fontSize: 11 }}>{t.todayPurchases}</div><div style={{ color: theme.text, fontWeight: 700 }}>{formatCurrency(today.purchases.total)} <span style={{ color: theme.textSecondary, fontWeight: 400, fontSize: 12 }}>({today.purchases.count})</span></div></div>
            </div>
          )}
        </div>

        {/* Mode : vente / achat */}
        <div role="tablist" style={{ display: "flex", gap: 6, padding: 5, borderRadius: 14, background: theme.surfaceHover, border: `1px solid ${theme.border}`, marginBottom: 14, maxWidth: 420 }}>
          {(["sale", "purchase"] as Mode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} style={{ flex: 1, height: 46, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, background: mode === m ? (m === "sale" ? "#10b981" : "#f59e0b") : "transparent", color: mode === m ? "#ffffff" : theme.text }}>
              {m === "sale" ? t.sale : t.purchase}
            </button>
          ))}
        </div>
        <div style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>{mode === "purchase" ? t.purchaseHint : t.priceHint}</div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 380px", gap: 16, alignItems: "start" }}>
          {/* Produits */}
          <div>
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey} placeholder={t.search} autoComplete="off" aria-label={t.search} style={{ width: "100%", boxSizing: "border-box", height: 50, borderRadius: 14, border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: "0 16px", fontSize: 16, marginBottom: 14, outline: "none" }} />
            {loading ? (
              <div style={{ color: theme.textSecondary, padding: 30, textAlign: "center" }}>…</div>
            ) : filtered.length === 0 ? (
              <div style={{ ...card, color: theme.textSecondary, padding: 30, textAlign: "center" }}>{products.length === 0 ? t.noProducts : t.empty}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 170}px, 1fr))`, gap: isMobile ? 10 : 12 }}>
                {filtered.map((p) => {
                  const out = mode === "sale" && stockOf(p) <= 0;
                  const inCart = lines.find((l) => l.product.id === p.id);
                  return (
                    <button key={p.id} onClick={() => addProduct(p)} disabled={out} style={{ ...card, padding: 0, overflow: "hidden", textAlign: "left", cursor: out ? "not-allowed" : "pointer", opacity: out ? 0.5 : 1, position: "relative", transform: flash === p.id ? "scale(0.96)" : "scale(1)", transition: "transform 0.15s", border: `1.5px solid ${inCart ? accent : theme.border}`, display: "flex", flexDirection: "column" }}>
                      <div style={{ aspectRatio: "4 / 3", background: theme.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textSecondary }}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                        )}
                      </div>
                      <div style={{ padding: "10px 12px 12px" }}>
                        <div style={{ color: theme.text, fontWeight: 600, fontSize: 14, lineHeight: 1.25, minHeight: 35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{p.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                          <span style={{ color: theme.text, fontWeight: 800 }}>{formatCurrency(num(p.price))}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: out ? "#b91c1c" : stockOf(p) < 10 ? "#b45309" : theme.textSecondary }}>{out ? t.outOfStock : `${t.stock} ${stockOf(p)}`}</span>
                        </div>
                      </div>
                      {inCart && <span style={{ position: "absolute", top: 8, right: 8, background: accent, color: "#fff", borderRadius: 999, minWidth: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, padding: "0 6px" }}>{inCart.quantity}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panier : colonne fixe sur ordinateur */}
          {!isMobile && <div style={{ position: "sticky", top: 16 }}>{cartPanel}</div>}
        </div>
      </div>

      {/* Mobile : barre du panier + feuille */}
      {isMobile && lines.length > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} style={{ position: "fixed", left: 12, right: 12, bottom: 78, zIndex: 900, height: 58, borderRadius: 16, border: "none", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", fontSize: 16, fontWeight: 800, boxShadow: "0 12px 30px rgba(17,24,39,0.3)" }}>
          <span>{t.viewCart} · {itemsCount} {t.items}</span><span>{formatCurrency(total)}</span>
        </button>
      )}
      {isMobile && cartOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", maxHeight: "calc(100dvh - 12px)", overflowY: "auto", background: theme.surface, borderRadius: "20px 20px 0 0", padding: "16px 16px calc(16px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: theme.text }}>{t.cart} · {itemsCount} {t.items}</h2>
              <button onClick={() => setCartOpen(false)} aria-label={t.close} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            {cartPanel}
          </div>
        </div>
      )}

      {/* Ticket */}
      {ticket && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setTicket(null); }} style={{ position: "fixed", inset: 0, zIndex: 3500, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }}>
          <div style={{ width: "100%", maxWidth: 420, background: theme.surface, color: theme.text, borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: 22, maxHeight: "92dvh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
              <h2 style={{ margin: "10px 0 2px", fontSize: 20 }}>{t.saved}</h2>
              <div style={{ color: theme.textSecondary, fontSize: 13 }}>{t.ticket} {ticket.ticketNumber}</div>
            </div>
            <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 12, fontSize: 14 }}>
              {ticket.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0" }}><span>{l.quantity} × {l.productName}</span><span style={{ fontWeight: 600 }}>{formatCurrency(l.total)}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 10, fontSize: 20, fontWeight: 800 }}><span>{t.total}</span><span>{formatCurrency(ticket.total)}</span></div>
              {ticket.notice && <div style={{ background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.5)", color: theme.text, borderRadius: 10, padding: "8px 10px", fontSize: 12, marginTop: 8 }}>{ticket.notice}</div>}
              <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6 }}>{ticket.counterpart ? `${ticket.counterpart} · ` : ""}{ticket.paymentMethod ? t[ticket.paymentMethod] || ticket.paymentMethod : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={printTicket} style={{ flex: 1, height: 48, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, fontSize: 15, cursor: "pointer" }}>{t.print}</button>
              <button onClick={() => { setTicket(null); searchRef.current?.focus(); }} style={{ flex: 1.4, height: 48, borderRadius: 12, border: "none", background: accent, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{ticket.mode === "sale" ? t.newSale : t.newPurchase}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
