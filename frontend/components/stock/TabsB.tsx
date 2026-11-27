"use client";
/** Onglets du Stock : inventaires physiques, alertes, rotation, valorisation et contrôle de cohérence. */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDaysISO, api, Badge, Btn, Card, Empty, ErrorBox, fmtDate, inputStyle, Loading, Modal, moneyDT, num as numStyle, Notice, qty as fmtQty, Stat, TableWrap, td, th, todayISO, useLoad,
} from "@/components/erp/kit";
import { type Tr } from "./i18n";
import { FormError, LabeledField, norm, optNum, round3, stockTone } from "./shared";
import { expiryBadge, type TabProps } from "./TabsA";

const linkBtn: React.CSSProperties = { display: "inline-block", padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "1px solid var(--theme-border)", color: "var(--theme-text)", textDecoration: "none", whiteSpace: "nowrap" };

// ───────────────────────── Inventaires ─────────────────────────

interface CountRow { id: number; number?: string | null; warehouseName: string; status: string; note?: string | null; createdAt: string; lineCount: number | string; countedCount: number | string }
const countStatus = (tr: Tr, s: string): [string, "blue" | "green" | "red" | "gray"] =>
  s === "counting" ? [tr("En cours", "In progress", "En curso"), "blue"] : s === "validated" ? [tr("Validé", "Validated", "Validado"), "green"] : s === "cancelled" ? [tr("Annulé", "Cancelled", "Anulado"), "red"] : [s, "gray"];

export function CountsTab({ tr, warehouses, products, notify, refresh, bump }: TabProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, error, loading, reload } = useLoad(() => api<CountRow[]>("/stock/counts"), [refresh]);
  const rows = data || [];
  return (
    <>
      <Card
        title={tr("Inventaires physiques", "Physical stock counts", "Inventarios físicos")}
        right={<Btn variant="primary" onClick={() => setCreating(true)}>+ {tr("Nouvel inventaire", "New count", "Nuevo inventario")}</Btn>}
        pad={false}
      >
        {error && <div style={{ padding: 12 }}><ErrorBox message={error} onRetry={reload} /></div>}
        {loading && !data ? <Loading /> : rows.length === 0 ? (
          <Empty>
            {tr("Aucun inventaire pour le moment.", "No stock count yet.", "Aún no hay inventarios.")}
            <div style={{ fontSize: 13, marginTop: 6 }}>{tr("Un inventaire fige le stock théorique d'un dépôt, vous saisissez les quantités comptées, puis la validation corrige les écarts.", "A count freezes the theoretical stock of a warehouse; you enter the counted quantities, then validation corrects the differences.", "Un inventario congela el stock teórico de un almacén; usted introduce las cantidades contadas y la validación corrige las diferencias.")}</div>
          </Empty>
        ) : (
          <TableWrap min={720}>
            <thead>
              <tr>
                <th style={th}>{tr("N°", "No.", "N.º")}</th><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th><th style={th}>{tr("Statut", "Status", "Estado")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Comptés", "Counted", "Contados")}</th><th style={th}>{tr("Créé le", "Created", "Creado")}</th><th style={th}>{tr("Note", "Note", "Nota")}</th><th style={th}> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const [label, tone] = countStatus(tr, c.status);
                return (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight: 600 }}>{c.number || `#${c.id}`}</td>
                    <td style={td}>{c.warehouseName}</td>
                    <td style={td}><Badge tone={tone}>{label}</Badge></td>
                    <td style={{ ...td, ...numStyle }}>{Number(c.countedCount)} / {Number(c.lineCount)}</td>
                    <td style={td}>{fmtDate(c.createdAt)}</td>
                    <td style={td}>{c.note || "—"}</td>
                    <td style={td}><Btn onClick={() => setOpenId(c.id)} aria-label={`${tr("Ouvrir l'inventaire", "Open count", "Abrir inventario")} ${c.number || c.id}`}>{c.status === "counting" ? tr("Compter", "Count", "Contar") : tr("Consulter", "View", "Consultar")}</Btn></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
      {creating && (
        <NewCount
          tr={tr} warehouses={warehouses} products={products} onClose={() => setCreating(false)}
          onCreated={(id) => { setCreating(false); bump(); setOpenId(id); }}
        />
      )}
      {openId !== null && <CountDetail tr={tr} id={openId} notify={notify} onClose={() => setOpenId(null)} onChanged={bump} />}
    </>
  );
}

function NewCount({ tr, warehouses, products, onClose, onCreated }: { tr: Tr; warehouses: TabProps["warehouses"]; products: TabProps["products"]; onClose: () => void; onCreated: (id: number) => void }) {
  const active = warehouses.filter((w) => w.isActive);
  const [warehouseId, setWarehouseId] = useState(String((active.find((w) => w.isDefault) || active[0])?.id ?? ""));
  const [note, setNote] = useState("");
  const [only, setOnly] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = useMemo(() => {
    const n = norm(q.trim());
    return (n ? products.filter((p) => norm(p.name).includes(n) || norm(p.sku).includes(n)) : products).slice(0, 100);
  }, [products, q]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!warehouseId) return setError(tr("Choisissez un dépôt.", "Choose a warehouse.", "Elija un almacén."));
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ id: number }>("/stock/counts", { method: "POST", body: { warehouseId: Number(warehouseId), ...(only.length ? { productIds: only } : {}), ...(note.trim() ? { note: note.trim() } : {}) } });
      onCreated(created.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tr("Nouvel inventaire", "New stock count", "Nuevo inventario")} onClose={onClose} width={560}
      footer={<>
        <Btn onClick={onClose}>{tr("Annuler", "Cancel", "Cancelar")}</Btn>
        <Btn type="submit" form="new-count-form" variant="primary" busy={busy}>{tr("Ouvrir l'inventaire", "Start the count", "Iniciar el inventario")}</Btn>
      </>}
    >
      <form id="new-count-form" noValidate onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LabeledField id="count-warehouse" label={tr("Dépôt à inventorier", "Warehouse to count", "Almacén a inventariar")} required>
          <select id="count-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={inputStyle} aria-required="true">
            {active.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </LabeledField>
        <LabeledField id="count-note" label={tr("Note", "Note", "Nota")}>
          <input id="count-note" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} maxLength={300} autoComplete="off" />
        </LabeledField>
        <fieldset style={{ border: "1px solid var(--theme-border)", borderRadius: 10, padding: 10 }}>
          <legend style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)", padding: "0 4px" }}>
            {tr("Produits à compter (facultatif)", "Products to count (optional)", "Productos a contar (opcional)")}
          </legend>
          <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginBottom: 6 }}>
            {tr("Sans sélection, tous les produits présents dans le dépôt sont comptés.", "With no selection, every product present in the warehouse is counted.", "Sin selección, se cuentan todos los productos presentes en el almacén.")}
          </div>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} placeholder={tr("Filtrer…", "Filter…", "Filtrar…")} aria-label={tr("Filtrer les produits", "Filter products", "Filtrar productos")} />
          <div style={{ maxHeight: 180, overflowY: "auto", display: "grid", gap: 4 }}>
            {shown.map((p) => (
              <label key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <input type="checkbox" style={{ width: 18, height: 18, flex: "none", margin: 0 }} checked={only.includes(p.id)} onChange={(e) => setOnly((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))} />
                {p.name}{p.sku ? ` (${p.sku})` : ""}
              </label>
            ))}
          </div>
          {only.length > 0 && <div style={{ fontSize: 12, marginTop: 6 }}>{only.length} {tr("produit(s) sélectionné(s)", "product(s) selected", "producto(s) seleccionado(s)")}</div>}
        </fieldset>
        <FormError message={error} />
      </form>
    </Modal>
  );
}

interface CountLine { id: number; productId: number; name: string; sku?: string | null; unit?: string | null; expectedQty: number; countedQty: number | null; unitCost: number; difference: number | null; differenceValue: number | null }
interface CountData {
  id: number; number?: string | null; warehouseId: number; status: string; note?: string | null; lines: CountLine[];
  summary: { lines: number; counted: number; withDifference: number; shortageValue: number; surplusValue: number };
}
const SHOW_MAX = 500;

function CountDetail({ tr, id, notify, onClose, onChanged }: { tr: Tr; id: number; notify: TabProps["notify"]; onClose: () => void; onChanged: () => void }) {
  const { data, error, loading, reload } = useLoad(() => api<CountData>(`/stock/counts/${id}`), [id]);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [todoOnly, setTodoOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Les saisies repartent des valeurs enregistrées à chaque rechargement du serveur.
  useEffect(() => {
    if (!data) return;
    setInputs(Object.fromEntries(data.lines.map((l) => [l.productId, l.countedQty === null ? "" : String(l.countedQty)])));
  }, [data]);
  const editable = data?.status === "counting";
  const lines = useMemo(() => {
    const n = norm(search.trim());
    return (data?.lines || []).filter((l) => (!n || norm(l.name).includes(n) || norm(l.sku).includes(n)) && (!todoOnly || l.countedQty === null));
  }, [data, search, todoOnly]);

  /** Lignes saisies et modifiées ; null si une saisie est invalide. */
  const pending = (): Array<{ productId: number; countedQty: number }> | null => {
    const out: Array<{ productId: number; countedQty: number }> = [];
    for (const l of data?.lines || []) {
      const raw = inputs[l.productId] ?? "";
      if (raw.trim() === "") continue;
      const v = optNum(raw);
      if (v === undefined || !Number.isFinite(v) || v < 0) {
        setFormError(tr(`Quantité invalide pour « ${l.name} » : indiquez un nombre positif ou nul.`, `Invalid quantity for “${l.name}”: enter a number, zero or more.`, `Cantidad no válida para «${l.name}»: indique un número, cero o más.`));
        return null;
      }
      if (v !== l.countedQty) out.push({ productId: l.productId, countedQty: round3(v) });
    }
    return out;
  };

  const save = async (silent = false): Promise<boolean> => {
    const lines2 = pending();
    if (!lines2) return false;
    if (!lines2.length) {
      if (!silent) notify(tr("Aucune modification à enregistrer.", "Nothing to save.", "Nada que guardar."));
      return true;
    }
    try {
      await api(`/stock/counts/${id}/lines`, { method: "PUT", body: { lines: lines2 } });
      if (!silent) notify(tr(`${lines2.length} ligne(s) enregistrée(s).`, `${lines2.length} line(s) saved.`, `${lines2.length} línea(s) guardada(s).`));
      onChanged();
      await reload();
      return true;
    } catch (err) {
      setFormError((err as Error).message);
      return false;
    }
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try { await fn(); } finally { setBusy(false); }
  };

  const validate = () => run(async () => {
    if (!(await save(true))) return;
    if (!confirm(tr("Valider l'inventaire ? Les écarts seront transformés en ajustements de stock et l'inventaire ne sera plus modifiable.", "Validate the count? The differences will become stock adjustments and the count can no longer be edited.", "¿Validar el inventario? Las diferencias se convertirán en ajustes de stock y el inventario ya no se podrá modificar."))) return;
    try {
      const res = await api<{ number?: string; adjustments?: number | unknown[] }>(`/stock/counts/${id}/validate`, { method: "POST" });
      const n = Array.isArray(res.adjustments) ? res.adjustments.length : Number(res.adjustments) || 0;
      notify(tr(`Inventaire ${res.number || ""} validé : ${n} ajustement(s).`, `Count ${res.number || ""} validated: ${n} adjustment(s).`, `Inventario ${res.number || ""} validado: ${n} ajuste(s).`));
      onChanged();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    }
  });

  const cancel = () => run(async () => {
    if (!confirm(tr("Annuler cet inventaire ? Les quantités saisies seront perdues.", "Cancel this count? The entered quantities will be lost.", "¿Anular este inventario? Se perderán las cantidades introducidas."))) return;
    try {
      await api(`/stock/counts/${id}/cancel`, { method: "POST" });
      notify(tr("Inventaire annulé.", "Count cancelled.", "Inventario anulado."));
      onChanged();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    }
  });

  const s = data?.summary;
  const [stLabel, stTone] = data ? countStatus(tr, data.status) : ["", "gray" as const];
  return (
    <Modal
      title={`${tr("Inventaire", "Stock count", "Inventario")} ${data?.number || ""}`} onClose={onClose} width={1000}
      footer={editable ? <>
        <Btn variant="danger" onClick={cancel} disabled={busy}>{tr("Annuler l'inventaire", "Cancel the count", "Anular el inventario")}</Btn>
        <Btn onClick={() => run(async () => { await save(); })} disabled={busy}>{tr("Enregistrer le comptage", "Save counts", "Guardar el conteo")}</Btn>
        <Btn variant="success" onClick={validate} busy={busy}>{tr("Valider l'inventaire", "Validate the count", "Validar el inventario")}</Btn>
      </> : <Btn onClick={onClose}>{tr("Fermer", "Close", "Cerrar")}</Btn>}
    >
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && s && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
            <Stat label={tr("Statut", "Status", "Estado")} value={<Badge tone={stTone}>{stLabel}</Badge>} />
            <Stat label={tr("Comptés", "Counted", "Contados")} value={`${s.counted} / ${s.lines}`} />
            <Stat label={tr("Avec écart", "With difference", "Con diferencia")} value={s.withDifference} />
            <Stat label={tr("Manquants (valeur)", "Shortages (value)", "Faltantes (valor)")} value={moneyDT(s.shortageValue)} tone={s.shortageValue < 0 ? "bad" : undefined} />
            <Stat label={tr("Surplus (valeur)", "Surplus (value)", "Excedentes (valor)")} value={moneyDT(s.surplusValue)} tone={s.surplusValue > 0 ? "good" : undefined} />
          </div>
          {data.note && <div style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>{data.note}</div>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 220px" }}>
              <LabeledField id="count-search" label={tr("Filtrer les lignes", "Filter lines", "Filtrar líneas")}>
                <input id="count-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} autoComplete="off" />
              </LabeledField>
            </div>
            {editable && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, paddingBottom: 8 }}>
                <input type="checkbox" style={{ width: 18, height: 18, flex: "none", margin: 0 }} checked={todoOnly} onChange={(e) => setTodoOnly(e.target.checked)} />
                {tr("Non comptés seulement", "Not counted yet", "Solo sin contar")}
              </label>
            )}
          </div>
          <TableWrap min={720}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={{ ...th, ...numStyle }}>{tr("Attendu", "Expected", "Esperado")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Compté", "Counted", "Contado")}</th><th style={{ ...th, ...numStyle }}>{tr("Écart", "Difference", "Diferencia")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Valeur de l'écart", "Difference value", "Valor de la diferencia")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.slice(0, SHOW_MAX).map((l) => {
                const raw = inputs[l.productId] ?? "";
                const v = optNum(raw);
                const live = v === undefined || !Number.isFinite(v) ? l.difference : round3(v - l.expectedQty);
                return (
                  <tr key={l.id}>
                    <td style={td}>{l.name}{l.sku ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>SKU {l.sku}</div> : null}</td>
                    <td style={{ ...td, ...numStyle }}>{fmtQty(l.expectedQty)} {l.unit || ""}</td>
                    <td style={{ ...td, ...numStyle }}>
                      {editable ? (
                        <input
                          inputMode="decimal" value={raw} onChange={(e) => setInputs((m) => ({ ...m, [l.productId]: e.target.value }))}
                          aria-label={`${tr("Quantité comptée", "Counted quantity", "Cantidad contada")} : ${l.name}`} style={{ ...inputStyle, width: 110, textAlign: "right" }} autoComplete="off"
                        />
                      ) : (l.countedQty === null ? "—" : fmtQty(l.countedQty))}
                    </td>
                    <td style={{ ...td, ...numStyle, fontWeight: 700, color: live === null ? undefined : live < 0 ? "var(--theme-danger, #ef4444)" : live > 0 ? "var(--theme-success, #10b981)" : undefined }}>
                      {live === null ? "—" : `${live > 0 ? "+" : ""}${fmtQty(live)}`}
                    </td>
                    <td style={{ ...td, ...numStyle }}>{live === null ? "—" : moneyDT(round3(live * l.unitCost))}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          {lines.length > SHOW_MAX && <Notice tone="blue">{tr(`Affichage limité à ${SHOW_MAX} lignes sur ${lines.length} : filtrez pour voir les autres.`, `Showing ${SHOW_MAX} of ${lines.length} lines: filter to see the others.`, `Se muestran ${SHOW_MAX} de ${lines.length} líneas: filtre para ver las demás.`)}</Notice>}
          {editable && <Notice tone="blue">{tr("Saisissez 0 pour un produit absent du dépôt. La validation exige que tous les produits soient comptés.", "Enter 0 for a product that is not in the warehouse. Validation requires every product to be counted.", "Introduzca 0 para un producto ausente del almacén. La validación exige que todos los productos estén contados.")}</Notice>}
          <FormError message={formError} />
        </>
      )}
    </Modal>
  );
}

// ───────────────────────── Alertes ─────────────────────────

interface AlertsData {
  lowStock: Array<{ productId: number; name: string; sku?: string | null; unit?: string | null; quantity: number; minStock: number; status: "out" | "low" }>;
  expiringLots: Array<{ id: number; productName: string; warehouse: string; lotNumber: string; expiryDate: string; quantity: number; daysLeft: number; expired: boolean }>;
}

export function AlertsTab({ tr, refresh, onAdjust }: TabProps & { onAdjust: (productId: number) => void }) {
  const [days, setDays] = useState("60");
  const { data, error, loading, reload } = useLoad(() => api<AlertsData>("/stock/alerts", { query: { expiryDays: days } }), [days, refresh]);
  const low = data?.lowStock || [];
  const lots = data?.expiringLots || [];
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label={tr("En rupture", "Out of stock", "Agotados")} value={low.filter((p) => p.status === "out").length} tone={low.some((p) => p.status === "out") ? "bad" : undefined} />
        <Stat label={tr("Stock bas", "Low stock", "Stock bajo")} value={low.filter((p) => p.status === "low").length} />
        <Stat label={tr("Lots périmés", "Expired lots", "Lotes caducados")} value={lots.filter((l) => l.expired).length} tone={lots.some((l) => l.expired) ? "bad" : undefined} />
        <Stat label={tr("Lots à surveiller", "Lots to watch", "Lotes a vigilar")} value={lots.filter((l) => !l.expired).length} />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card title={tr("Ruptures et stocks bas", "Out of stock and low stock", "Agotados y stock bajo")} pad={false}>
        {loading && !data ? <Loading /> : low.length === 0 ? <Empty>{tr("Aucune alerte de stock : tout est au-dessus du seuil.", "No stock alert: everything is above the threshold.", "Sin alertas de stock: todo está por encima del umbral.")}</Empty> : (
          <TableWrap min={680}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={{ ...th, ...numStyle }}>{tr("Stock", "Stock", "Stock")}</th><th style={{ ...th, ...numStyle }}>{tr("Seuil", "Threshold", "Umbral")}</th>
                <th style={th}>{tr("Statut", "Status", "Estado")}</th><th style={th}>{tr("Actions", "Actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {low.map((p) => (
                <tr key={p.productId}>
                  <td style={td}>{p.name}{p.sku ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>SKU {p.sku}</div> : null}</td>
                  <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{fmtQty(p.quantity)} {p.unit || ""}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(p.minStock)}</td>
                  <td style={td}><Badge tone={stockTone(p.status)}>{p.status === "out" ? tr("Rupture", "Out of stock", "Agotado") : tr("Stock bas", "Low stock", "Stock bajo")}</Badge></td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Link href="/dashboard/purchases" style={linkBtn} aria-label={`${tr("Réapprovisionner", "Reorder", "Reponer")} : ${p.name}`}>{tr("Réapprovisionner", "Reorder", "Reponer")}</Link>
                      <Btn onClick={() => onAdjust(p.productId)} aria-label={`${tr("Ajuster", "Adjust", "Ajustar")} : ${p.name}`}>{tr("Ajuster", "Adjust", "Ajustar")}</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
      <Card
        title={tr("Lots périmés ou proches de la péremption", "Expired or soon-to-expire lots", "Lotes caducados o próximos a caducar")}
        right={
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            {tr("Horizon", "Horizon", "Horizonte")}
            <select value={days} onChange={(e) => setDays(e.target.value)} style={{ ...inputStyle, width: "auto" }} aria-label={tr("Horizon de péremption en jours", "Expiry horizon in days", "Horizonte de caducidad en días")}>
              {["30", "60", "90", "180"].map((d) => <option key={d} value={d}>{d} {tr("jours", "days", "días")}</option>)}
            </select>
          </label>
        }
        pad={false}
      >
        {loading && !data ? <Loading /> : lots.length === 0 ? <Empty>{tr("Aucun lot concerné.", "No lot concerned.", "Ningún lote afectado.")}</Empty> : (
          <TableWrap min={680}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={th}>{tr("Lot", "Lot", "Lote")}</th><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Quantité", "Quantity", "Cantidad")}</th><th style={th}>{tr("Péremption", "Expiry", "Caducidad")}</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{l.productName}</td><td style={td}>{l.lotNumber}</td><td style={td}>{l.warehouse}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(l.quantity)}</td><td style={td}>{fmtDate(l.expiryDate)} {expiryBadge(tr, l.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}

// ───────────────────────── Rotation ─────────────────────────

interface RotationData {
  period: { from: string; to: string; days: number };
  items: Array<{ productId: number; name: string; sku?: string | null; soldQty: number; cogs: number; averageStockValue: number; rotation: number | null; daysOfStock: number | null; closingQty: number; status: "dormant" | "slow" | "ok" }>;
  dormantCount: number;
}

export function RotationTab({ tr, refresh }: TabProps) {
  const [from, setFrom] = useState(addDaysISO(-90));
  const [to, setTo] = useState(todayISO());
  const bad = !!from && !!to && from > to;
  const { data, error, loading, reload } = useLoad(() => (bad ? Promise.resolve(null as RotationData | null) : api<RotationData>("/stock/rotation", { query: { from, to } })), [from, to, refresh]);
  const items = data?.items || [];
  const tone = (s: string): "green" | "amber" | "gray" => (s === "ok" ? "green" : s === "slow" ? "amber" : "gray");
  const label = (s: string) => (s === "ok" ? tr("Normale", "Normal", "Normal") : s === "slow" ? tr("Lente", "Slow", "Lenta") : tr("Dormant", "Dormant", "Inactivo"));
  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <LabeledField id="rot-from" label={tr("Du", "From", "Desde")}><input id="rot-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} /></LabeledField>
          <LabeledField id="rot-to" label={tr("Au", "To", "Hasta")}><input id="rot-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} /></LabeledField>
        </div>
        {bad && <div style={{ marginTop: 10 }}><FormError message={tr("La date de début doit précéder la date de fin.", "The start date must come before the end date.", "La fecha de inicio debe ser anterior a la de fin.")} /></div>}
      </Card>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <Stat label={tr("Période", "Period", "Período")} value={`${data.period.days} ${tr("jours", "days", "días")}`} />
          <Stat label={tr("Produits analysés", "Products analysed", "Productos analizados")} value={items.length} />
          <Stat label={tr("Produits dormants", "Dormant products", "Productos inactivos")} value={data.dormantCount} tone={data.dormantCount > 0 ? "bad" : undefined} sub={tr("en stock sans aucune sortie", "in stock with no outflow", "en stock sin ninguna salida")} />
        </div>
      )}
      <Card pad={false}>
        {loading && !data ? <Loading /> : items.length === 0 ? <Empty>{tr("Aucune donnée sur cette période.", "No data for this period.", "Sin datos en este período.")}</Empty> : (
          <TableWrap min={860}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={{ ...th, ...numStyle }}>{tr("Qté sortie", "Qty out", "Cant. salida")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Coût des ventes", "Cost of sales", "Costo de ventas")}</th><th style={{ ...th, ...numStyle }}>{tr("Stock moyen (valeur)", "Average stock (value)", "Stock medio (valor)")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Rotation", "Turnover", "Rotación")}</th><th style={{ ...th, ...numStyle }}>{tr("Jours de stock", "Days of stock", "Días de stock")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Stock final", "Closing stock", "Stock final")}</th><th style={th}>{tr("Statut", "Status", "Estado")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.productId}>
                  <td style={td}>{i.name}{i.sku ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>SKU {i.sku}</div> : null}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(i.soldQty)}</td>
                  <td style={{ ...td, ...numStyle }}>{moneyDT(i.cogs)}</td>
                  <td style={{ ...td, ...numStyle }}>{moneyDT(i.averageStockValue)}</td>
                  <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{i.rotation === null ? "—" : `${fmtQty(i.rotation)} ×`}</td>
                  <td style={{ ...td, ...numStyle }}>{i.daysOfStock === null ? "—" : i.daysOfStock}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(i.closingQty)}</td>
                  <td style={td}><Badge tone={tone(i.status)}>{label(i.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
      <Notice tone="blue">{tr(
        "Rotation = coût des marchandises sorties ÷ valeur moyenne du stock sur la période. Jours de stock = durée que couvre le stock actuel au rythme des sorties. « Dormant » : en stock mais aucune sortie sur la période.",
        "Turnover = cost of goods out ÷ average stock value over the period. Days of stock = how long current stock lasts at the current outflow rate. “Dormant”: in stock but no outflow in the period.",
        "Rotación = costo de la mercancía salida ÷ valor medio del stock en el período. Días de stock = tiempo que cubre el stock actual al ritmo de salidas. «Inactivo»: en stock pero sin ninguna salida en el período.",
      )}</Notice>
    </>
  );
}

// ───────────────────────── Valorisation et cohérence ─────────────────────────

interface ValuationData {
  method: string; totalValue: number; productsWithoutCost: number; note?: string;
  warehouses: Array<{ warehouseId: number; warehouse: string; quantity: number; value: number }>;
  categories: Array<{ category: string; value: number }>;
}
interface ReconcileData { checked: boolean; drift: Array<{ productId: number; name: string; productQuantity: number; warehousesTotal: number }>; fixed: number }

export function ValuationTab({ tr, notify, refresh, bump }: TabProps) {
  const { data, error, loading, reload } = useLoad(() => api<ValuationData>("/stock/valuation"), [refresh]);
  const [rec, setRec] = useState<ReconcileData | null>(null);
  const [busy, setBusy] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const maxCat = Math.max(1, ...(data?.categories || []).map((c) => c.value));

  const check = async () => {
    if (busy) return;
    setBusy(true);
    setRecError(null);
    try { setRec(await api<ReconcileData>("/stock/reconcile")); } catch (err) { setRecError((err as Error).message); } finally { setBusy(false); }
  };
  const fix = async () => {
    if (busy || !rec?.drift.length) return;
    if (!confirm(tr("Aligner le stock total des produits sur la somme de leurs dépôts ? Les dépôts font foi.", "Align each product's total stock on the sum of its warehouses? The warehouses are the reference.", "¿Alinear el stock total de los productos con la suma de sus almacenes? Los almacenes son la referencia."))) return;
    setBusy(true);
    setRecError(null);
    try {
      const res = await api<ReconcileData>("/stock/reconcile", { method: "POST", query: { fix: "true" } });
      notify(tr(`${res.fixed} produit(s) corrigé(s).`, `${res.fixed} product(s) fixed.`, `${res.fixed} producto(s) corregido(s).`));
      setRec(await api<ReconcileData>("/stock/reconcile"));
      bump();
    } catch (err) {
      setRecError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : data && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <Stat label={tr("Valeur totale du stock", "Total stock value", "Valor total del stock")} value={moneyDT(data.totalValue)} sub={tr("Coût moyen unitaire pondéré (CMUP)", "Weighted average unit cost", "Costo medio unitario ponderado")} />
            <Stat label={tr("Produits sans coût", "Products without cost", "Productos sin costo")} value={data.productsWithoutCost} tone={data.productsWithoutCost > 0 ? "bad" : undefined} />
          </div>
          {data.productsWithoutCost > 0 && (
            <Notice>
              {tr(`${data.productsWithoutCost} produit(s) en stock n'ont pas de coût : la valorisation est sous-estimée. Renseignez le coût moyen dans `, `${data.productsWithoutCost} product(s) in stock have no cost: the valuation is understated. Enter the average cost in `, `${data.productsWithoutCost} producto(s) en stock no tienen costo: la valoración está subestimada. Indique el costo medio en `)}
              <Link href="/dashboard/stock/levels">{tr("Niveaux par dépôt → Réglages", "Levels by warehouse → Settings", "Niveles por almacén → Ajustes")}</Link>.
            </Notice>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Card title={tr("Par dépôt", "By warehouse", "Por almacén")} pad={false}>
              {data.warehouses.length === 0 ? <Empty>{tr("Aucun stock réparti par dépôt.", "No stock split by warehouse.", "Ningún stock repartido por almacén.")}</Empty> : (
                <TableWrap min={320}>
                  <thead><tr><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th><th style={{ ...th, ...numStyle }}>{tr("Quantité", "Quantity", "Cantidad")}</th><th style={{ ...th, ...numStyle }}>{tr("Valeur", "Value", "Valor")}</th></tr></thead>
                  <tbody>{data.warehouses.map((w) => <tr key={w.warehouseId}><td style={td}>{w.warehouse}</td><td style={{ ...td, ...numStyle }}>{fmtQty(w.quantity)}</td><td style={{ ...td, ...numStyle, fontWeight: 700 }}>{moneyDT(w.value)}</td></tr>)}</tbody>
                </TableWrap>
              )}
            </Card>
            <Card title={tr("Par catégorie", "By category", "Por categoría")} pad={false}>
              {data.categories.length === 0 ? <Empty>{tr("Aucune valeur.", "No value.", "Sin valor.")}</Empty> : (
                <TableWrap min={320}>
                  <thead><tr><th style={th}>{tr("Catégorie", "Category", "Categoría")}</th><th style={{ ...th, ...numStyle }}>{tr("Valeur", "Value", "Valor")}</th></tr></thead>
                  <tbody>
                    {data.categories.map((c) => (
                      <tr key={c.category}>
                        <td style={td}>
                          {c.category}
                          <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: "var(--theme-surface-hover)", marginTop: 4 }}>
                            <div style={{ height: 6, borderRadius: 3, width: `${Math.max(2, Math.round((c.value / maxCat) * 100))}%`, background: "var(--theme-primary, #4f46e5)" }} />
                          </div>
                        </td>
                        <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{moneyDT(c.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>
          </div>
        </>
      )}
      <Card
        title={tr("Contrôle de cohérence", "Consistency check", "Control de coherencia")}
        right={<Btn onClick={check} busy={busy}>{tr("Vérifier", "Check", "Verificar")}</Btn>}
      >
        <div style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>
          {tr("Vérifie que le stock total de chaque produit est égal à la somme de ses dépôts (lecture seule tant que vous ne corrigez pas).", "Checks that each product's total stock equals the sum of its warehouses (read-only until you fix it).", "Comprueba que el stock total de cada producto sea igual a la suma de sus almacenes (solo lectura hasta que corrija).")}
        </div>
        {recError && <div style={{ marginTop: 10 }}><FormError message={recError} /></div>}
        {rec && rec.drift.length === 0 && <div role="status" style={{ marginTop: 10, color: "var(--theme-success, #10b981)", fontWeight: 600 }}>{tr("Aucun écart : le stock des produits correspond à celui des dépôts.", "No difference: product stock matches warehouse stock.", "Sin diferencias: el stock de los productos coincide con el de los almacenes.")}</div>}
        {rec && rec.drift.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <TableWrap min={480}>
              <thead><tr><th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={{ ...th, ...numStyle }}>{tr("Stock du produit", "Product stock", "Stock del producto")}</th><th style={{ ...th, ...numStyle }}>{tr("Somme des dépôts", "Warehouses total", "Suma de almacenes")}</th></tr></thead>
              <tbody>{rec.drift.map((d) => <tr key={d.productId}><td style={td}>{d.name}</td><td style={{ ...td, ...numStyle }}>{fmtQty(d.productQuantity)}</td><td style={{ ...td, ...numStyle }}>{fmtQty(d.warehousesTotal)}</td></tr>)}</tbody>
            </TableWrap>
            <div style={{ marginTop: 10 }}><Btn variant="danger" onClick={fix} busy={busy}>{tr("Aligner sur les dépôts", "Align on warehouses", "Alinear con los almacenes")}</Btn></div>
          </div>
        )}
      </Card>
    </>
  );
}
