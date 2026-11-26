"use client";
// app/dashboard/products/suggestions/page.tsx — Suggestions du secteur.
// Des exemples de produits et de prestations propres au secteur de la société, à copier dans son catalogue puis à
// adapter. Les montants sont INDICATIFS (ce ne sont pas des prix de marché) : chacun fixe son prix avant d'ajouter.
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { api, Badge, Btn, Card, Empty, ErrorBox, Loading, Notice, Page, TableWrap, inputStyle, num, td, th, useNotice, useRequireAuth } from "@/components/erp/kit";
import { useLanguage } from "@/contexts/LanguageContext";
import { MODULE_INFO, SECTORS, pick, type CatalogModule } from "@/lib/catalog";
import { formatMoney, sectorName, type SectorDetail } from "@/lib/saas";
import { fill, useSaasTexts } from "@/lib/saasTexts";

interface SuggestionsResponse extends Partial<SectorDetail> {
  sectors: Array<{ code: string; name: string; nameEn: string | null; nameAr: string | null; itemCount: number }>;
  current: string;
}

type Kind = "all" | "product" | "service";

export default function SectorSuggestionsPage() {
  useRequireAuth();
  const tx = useSaasTexts();
  const s = tx.suggestions;
  const { language } = useLanguage();
  const [notice, notify] = useNotice();

  const [sector, setSector] = useState<string>("");
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | "selection" | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<SuggestionsResponse>("/billing/suggestions", { query: { sector: sector || undefined } })
      .then((res) => { if (alive) { setData(res); setError(null); setSelected(new Set()); setCategory("all"); } })
      .catch((e: Error) => { if (alive) setError(e.message || tx.auth.serverError); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  const categories = useMemo(() => data?.categories ?? [], [data]);
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.items ?? []).filter((item) =>
      (kind === "all" || item.kind === kind) &&
      (category === "all" || String(item.categoryId) === category) &&
      (!q || item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q)));
  }, [data, search, category, kind]);

  /** Nom du secteur dans la langue de l'écran (le serveur ne garde pas l'espagnol : il vient du catalogue). */
  const nameOf = (entry: { code: string; name: string; nameEn: string | null; nameAr: string | null }) => {
    const known = SECTORS.find((c) => c.code === entry.code);
    return language === "es" && known ? known.name.es : sectorName(entry, language);
  };

  const priceOf = (id: number, fallback: number | null) => {
    const typed = prices[id];
    if (typed === undefined || typed.trim() === "") return fallback;
    const value = Number(typed.replace(",", "."));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };

  const toggle = (id: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allShown = items.length > 0 && items.every((item) => selected.has(item.id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    for (const item of items) { if (allShown) next.delete(item.id); else next.add(item.id); }
    return next;
  });

  const importItems = async (ids: number[], marker: number | "selection") => {
    if (!ids.length || busy !== null) return;
    setBusy(marker);
    try {
      const overrides: Record<string, { price: number }> = {};
      for (const id of ids) {
        const typed = prices[id];
        if (typed !== undefined && typed.trim() !== "") {
          const value = Number(typed.replace(",", "."));
          if (Number.isFinite(value) && value >= 0) overrides[String(id)] = { price: value };
        }
      }
      const res = await api<{ created: number; skipped: number }>("/products/suggestions/import", { method: "POST", body: { itemIds: ids, overrides } });
      setAdded((prev) => new Set([...prev, ...ids]));
      setSelected((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next; });
      notify([fill(s.added, { n: res.created }), res.skipped ? fill(s.skipped, { n: res.skipped }) : ""].filter(Boolean).join(" "));
    } catch (e: any) {
      notify(e?.message || tx.auth.serverError, "err");
    } finally {
      setBusy(null);
    }
  };

  const sectorInfo = data?.sector;
  const modules = (sectorInfo?.modules ?? []).filter((m): m is CatalogModule => m !== "dashboard" && m in MODULE_INFO);

  return (
    <Page
      title={s.title}
      subtitle={s.subtitle}
      actions={<Link href="/dashboard/products" style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--theme-border)", color: "var(--theme-text)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{s.goProducts}</Link>}
    >
      {notice}
      <Notice>{s.disclaimer}</Notice>
      {error ? <ErrorBox message={error} onRetry={() => setSector((v) => v)} /> : null}

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{s.sector}</span>
            <select value={data?.current || sector} onChange={(e) => setSector(e.target.value)} style={inputStyle}>
              {(data?.sectors ?? []).map((entry) => <option key={entry.code} value={entry.code}>{nameOf(entry)} ({entry.itemCount})</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 260px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{s.search}</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{s.category}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              <option value="all">{s.allCategories}</option>
              {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 180px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{s.kindAll}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} style={inputStyle}>
              <option value="all">{s.kindAll}</option>
              <option value="product">{s.kindProduct}</option>
              <option value="service">{s.kindService}</option>
            </select>
          </label>
        </div>
      </Card>

      {sectorInfo && (sectorInfo.recommendations?.length || modules.length) ? (
        <Card title={s.tips}>
          {sectorInfo.recommendations?.length ? (
            <ul style={{ margin: "0 0 12px", paddingInlineStart: 20, display: "grid", gap: 6, fontSize: 14, lineHeight: 1.5 }}>
              {sectorInfo.recommendations.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          ) : null}
          {modules.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--theme-text-secondary)" }}>{s.modules} :</span>
              {modules.map((m) => <Badge key={m} tone="violet">{pick(MODULE_INFO[m].label, language)}</Badge>)}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card
        pad={false}
        title={sectorInfo ? nameOf(sectorInfo) : s.title}
        right={<Btn variant="primary" disabled={selected.size === 0} busy={busy === "selection"} onClick={() => importItems([...selected], "selection")}>{fill(s.addSelected, { n: selected.size })}</Btn>}
      >
        {loading ? <Loading /> : items.length === 0 ? <Empty>{s.none}</Empty> : (
          <TableWrap min={860}>
            <thead>
              <tr>
                <th style={{ ...th, width: 36 }}><input type="checkbox" checked={allShown} onChange={toggleAll} aria-label={s.addSelected.replace(/\s*\(\{n\}\)/, "")} /></th>
                <th style={th}>{s.name}</th>
                <th style={th}>{s.category}</th>
                <th style={th}>{s.unit}</th>
                <th style={{ ...th, ...num }}>{s.cost}</th>
                <th style={{ ...th, ...num }}>{s.price}</th>
                <th style={{ ...th, ...num }}>{s.yourPrice}</th>
                <th style={{ ...th, ...num }}>{s.margin}</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const price = priceOf(item.id, item.sellingPrice);
                const margin = price !== null && price > 0 && item.purchasePrice !== null ? Math.round(((price - item.purchasePrice) / price) * 1000) / 10 : item.marginPct;
                const done = added.has(item.id);
                return (
                  <tr key={item.id}>
                    <td style={td}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} disabled={done} aria-label={item.name} /></td>
                    <td style={{ ...td, minWidth: 260 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.description ? <div style={{ fontSize: 12.5, color: "var(--theme-text-secondary)", marginTop: 2 }}>{item.description}</div> : null}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        <Badge tone={item.kind === "service" ? "blue" : "gray"}>{item.kind === "service" ? s.service : s.product}</Badge>
                        {item.trackLots ? <Badge tone="amber">{s.lots}</Badge> : null}
                      </div>
                      {item.basis ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 4 }}>{s.basis} : {item.basis}</div> : null}
                    </td>
                    <td style={td}>{item.categoryId ? categoryName.get(item.categoryId) || "—" : "—"}</td>
                    <td style={td}>{item.unit}</td>
                    <td style={{ ...td, ...num }}>{item.purchasePrice === null ? "—" : formatMoney(item.purchasePrice, language)}</td>
                    <td style={{ ...td, ...num }}>{item.sellingPrice === null ? "—" : formatMoney(item.sellingPrice, language)}</td>
                    <td style={{ ...td, ...num }}>
                      <input
                        inputMode="decimal"
                        value={prices[item.id] ?? ""}
                        placeholder={item.sellingPrice === null ? "0" : String(item.sellingPrice)}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        style={{ ...inputStyle, width: 104, textAlign: "end" }}
                        dir="ltr"
                        aria-label={`${s.yourPrice} — ${item.name}`}
                        disabled={done}
                      />
                    </td>
                    <td style={{ ...td, ...num }}>{margin === null || margin === undefined ? "—" : `${margin.toLocaleString(language === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 })} %`}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {done ? <Badge tone="green">✓</Badge> : <Btn onClick={() => importItems([item.id], item.id)} busy={busy === item.id} disabled={busy !== null}>{s.add}</Btn>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </Page>
  );
}
