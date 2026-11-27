"use client";
/** Onglets du Stock : niveaux par dépôt, dépôts, journal des mouvements, lots et péremption. */
import React, { useEffect, useState } from "react";
import {
  api, Badge, Btn, Card, Empty, ErrorBox, fmtDate, inputStyle, Loading, Modal, moneyDT, num as numStyle, Notice, qty as fmtQty, Stat, TableWrap, td, th, useLoad,
} from "@/components/erp/kit";
import { FILTER_REASONS, reasonLabel, type Tr } from "./i18n";
import { daysUntil, FormError, isBlank, LabeledField, ProductPicker, stockTone, type StockProduct, type Warehouse } from "./shared";
import { ProductSettingsModal, StockCardModal, type SettingsRow } from "./Modals";

export interface TabProps {
  tr: Tr;
  warehouses: Warehouse[];
  products: StockProduct[];
  notify: (message: string, tone?: "ok" | "err") => void;
  /** Compteur incrémenté après toute opération : les onglets rechargent leurs données. */
  refresh: number;
  bump: () => void;
}

const linkBtn: React.CSSProperties = { background: "none", border: "none", padding: 0, color: "var(--theme-primary, #4f46e5)", cursor: "pointer", font: "inherit", fontWeight: 600, textAlign: "left" };
const statusText = (tr: Tr, s: string) => (s === "out" ? tr("Rupture", "Out of stock", "Agotado") : s === "low" ? tr("Stock bas", "Low stock", "Stock bajo") : tr("Correct", "OK", "Correcto"));

// ───────────────────────── Niveaux par dépôt ─────────────────────────

interface LevelRow {
  productId: number; name: string; sku?: string | null; unit?: string | null; quantity: number; minStock: number; avgCost: number; value: number;
  trackLots?: boolean; status: "out" | "low" | "ok"; warehouses: Array<{ warehouseId: number | null; warehouse: string; quantity: number }>;
}

export function LevelsTab({ tr, warehouses, notify, refresh, bump, onAdjust }: TabProps & { onAdjust: (productId: number) => void }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [cardId, setCardId] = useState<number | null>(null);
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  useEffect(() => {
    const h = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(h);
  }, [search]);
  const { data, error, loading, reload } = useLoad(
    () => api<LevelRow[]>("/stock/levels", { query: { warehouseId, search: q, lowOnly: lowOnly ? true : undefined, limit: 500 } }),
    [warehouseId, q, lowOnly, refresh],
  );
  const rows = data || [];
  const totalValue = rows.reduce((s, r) => s + (r.value || 0), 0);

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label={tr("Produits suivis", "Tracked products", "Productos controlados")} value={rows.length} />
        <Stat label={tr("Valeur du stock", "Stock value", "Valor del stock")} value={moneyDT(totalValue)} />
        <Stat label={tr("Stock bas", "Low stock", "Stock bajo")} value={rows.filter((r) => r.status === "low").length} tone={rows.some((r) => r.status === "low") ? "bad" : undefined} />
        <Stat label={tr("En rupture", "Out of stock", "Agotados")} value={rows.filter((r) => r.status === "out").length} tone={rows.some((r) => r.status === "out") ? "bad" : undefined} />
      </div>
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <LabeledField id="levels-search" label={tr("Rechercher", "Search", "Buscar")}>
              <input id="levels-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} placeholder={tr("Nom, SKU ou code-barres", "Name, SKU or barcode", "Nombre, SKU o código de barras")} autoComplete="off" />
            </LabeledField>
          </div>
          <LabeledField id="levels-warehouse" label={tr("Dépôt", "Warehouse", "Almacén")}>
            <select id="levels-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous les dépôts", "All warehouses", "Todos los almacenes")}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.isActive ? "" : ` (${tr("désactivé", "disabled", "desactivado")})`}</option>)}
            </select>
          </LabeledField>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, paddingBottom: 8, whiteSpace: "nowrap" }}>
            <input type="checkbox" style={{ width: 18, height: 18, flex: "none", margin: 0 }} checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            {tr("Stock bas ou rupture seulement", "Low or out of stock only", "Solo stock bajo o agotado")}
          </label>
        </div>
      </Card>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card pad={false}>
        {loading && !data ? <Loading /> : rows.length === 0 ? (
          <Empty>
            {tr("Aucun produit à afficher.", "No product to show.", "Ningún producto que mostrar.")}
            <div style={{ fontSize: 13, marginTop: 6 }}>{tr("Les services n'ont pas de stock : ils n'apparaissent pas ici.", "Services have no stock: they do not appear here.", "Los servicios no tienen stock: no aparecen aquí.")}</div>
          </Empty>
        ) : (
          <TableWrap min={980}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Stock", "Stock", "Stock")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Seuil", "Threshold", "Umbral")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Coût moyen", "Avg. cost", "Costo medio")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Valeur", "Value", "Valor")}</th>
                <th style={th}>{tr("Statut", "Status", "Estado")}</th>
                <th style={th}>{tr("Par dépôt", "By warehouse", "Por almacén")}</th>
                <th style={th}>{tr("Actions", "Actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td style={td}>
                    <button type="button" style={linkBtn} onClick={() => setCardId(r.productId)}>{r.name}</button>
                    {r.sku ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>SKU {r.sku}{r.trackLots ? ` · ${tr("par lot", "lot-tracked", "por lote")}` : ""}</div> : null}
                  </td>
                  <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{fmtQty(r.quantity)} {r.unit || ""}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(r.minStock)}</td>
                  <td style={{ ...td, ...numStyle }}>{moneyDT(r.avgCost)}</td>
                  <td style={{ ...td, ...numStyle }}>{moneyDT(r.value)}</td>
                  <td style={td}><Badge tone={stockTone(r.status)}>{statusText(tr, r.status)}</Badge></td>
                  <td style={td}>
                    {r.warehouses.length === 0 ? "—" : (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {r.warehouses.map((w) => <Badge key={`${w.warehouseId}-${w.warehouse}`} tone="gray">{w.warehouse}: {fmtQty(w.quantity)}</Badge>)}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn onClick={() => onAdjust(r.productId)} aria-label={`${tr("Ajuster", "Adjust", "Ajustar")} : ${r.name}`}>{tr("Ajuster", "Adjust", "Ajustar")}</Btn>
                      <Btn onClick={() => setSettings({ productId: r.productId, name: r.name, unit: r.unit, minStock: r.minStock, trackLots: r.trackLots, avgCost: r.avgCost })} aria-label={`${tr("Réglages", "Settings", "Ajustes")} : ${r.name}`}>{tr("Réglages", "Settings", "Ajustes")}</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
      {cardId !== null && <StockCardModal tr={tr} productId={cardId} onClose={() => setCardId(null)} />}
      {settings && <ProductSettingsModal tr={tr} row={settings} onClose={() => setSettings(null)} onDone={(m) => { setSettings(null); notify(m); bump(); }} />}
    </>
  );
}

// ───────────────────────── Dépôts ─────────────────────────

type WhForm = { id?: number; name: string; code: string; address: string; isDefault: boolean };
const WH_CODE = /^[A-Za-z0-9_-]{1,20}$/;

export function WarehousesTab({ tr, warehouses, notify, bump }: TabProps) {
  const [form, setForm] = useState<WhForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = form?.id !== undefined;

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form || busy) return;
    const name = form.name.trim();
    if (!name) return setError(tr("Le nom du dépôt est obligatoire.", "The warehouse name is required.", "El nombre del almacén es obligatorio."));
    if (name.length > 120) return setError(tr("Le nom ne peut pas dépasser 120 caractères.", "The name cannot exceed 120 characters.", "El nombre no puede superar los 120 caracteres."));
    if (!editing && !isBlank(form.code) && !WH_CODE.test(form.code.trim())) return setError(tr("Code : 1 à 20 lettres, chiffres, - ou _.", "Code: 1 to 20 letters, digits, - or _.", "Código: de 1 a 20 letras, dígitos, - o _."));
    if (form.address.length > 300) return setError(tr("L'adresse ne peut pas dépasser 300 caractères.", "The address cannot exceed 300 characters.", "La dirección no puede superar los 300 caracteres."));
    setBusy(true);
    setError(null);
    try {
      if (editing) await api(`/stock/warehouses/${form.id}`, { method: "PUT", body: { name, address: form.address.trim(), isDefault: form.isDefault || undefined } });
      else await api("/stock/warehouses", { method: "POST", body: { name, ...(isBlank(form.code) ? {} : { code: form.code.trim() }), ...(isBlank(form.address) ? {} : { address: form.address.trim() }), ...(form.isDefault ? { isDefault: true } : {}) } });
      setForm(null);
      notify(editing ? tr("Dépôt modifié.", "Warehouse updated.", "Almacén modificado.") : tr("Dépôt créé.", "Warehouse created.", "Almacén creado."));
      bump();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const change = async (w: Warehouse, patch: { isDefault?: boolean; isActive?: boolean }, okMessage: string) => {
    try {
      await api(`/stock/warehouses/${w.id}`, { method: "PUT", body: { name: w.name, ...patch } });
      notify(okMessage);
      bump();
    } catch (err) {
      notify((err as Error).message, "err");
    }
  };

  return (
    <>
      <Card
        title={tr("Dépôts", "Warehouses", "Almacenes")}
        right={<Btn variant="primary" onClick={() => { setError(null); setForm({ name: "", code: "", address: "", isDefault: false }); }}>+ {tr("Nouveau dépôt", "New warehouse", "Nuevo almacén")}</Btn>}
        pad={false}
      >
        {warehouses.length === 0 ? <Empty>{tr("Aucun dépôt.", "No warehouse.", "Ningún almacén.")}</Empty> : (
          <TableWrap min={720}>
            <thead>
              <tr>
                <th style={th}>{tr("Nom", "Name", "Nombre")}</th><th style={th}>{tr("Code", "Code", "Código")}</th><th style={th}>{tr("Adresse", "Address", "Dirección")}</th>
                <th style={th}>{tr("Statut", "Status", "Estado")}</th><th style={th}>{tr("Actions", "Actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{w.name}</td>
                  <td style={td}>{w.code}</td>
                  <td style={td}>{w.address || "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {w.isDefault && <Badge tone="blue">{tr("Par défaut", "Default", "Predeterminado")}</Badge>}
                      <Badge tone={w.isActive ? "green" : "gray"}>{w.isActive ? tr("Actif", "Active", "Activo") : tr("Désactivé", "Disabled", "Desactivado")}</Badge>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn onClick={() => { setError(null); setForm({ id: w.id, name: w.name, code: w.code, address: w.address || "", isDefault: w.isDefault }); }} aria-label={`${tr("Modifier", "Edit", "Editar")} : ${w.name}`}>{tr("Modifier", "Edit", "Editar")}</Btn>
                      {!w.isDefault && w.isActive && <Btn onClick={() => change(w, { isDefault: true }, tr("Dépôt par défaut mis à jour.", "Default warehouse updated.", "Almacén predeterminado actualizado."))} aria-label={`${tr("Définir par défaut", "Make default", "Establecer como predeterminado")} : ${w.name}`}>{tr("Par défaut", "Make default", "Predeterminado")}</Btn>}
                      {!w.isDefault && (
                        w.isActive
                          ? <Btn variant="danger" onClick={() => change(w, { isActive: false }, tr("Dépôt désactivé.", "Warehouse disabled.", "Almacén desactivado."))} aria-label={`${tr("Désactiver", "Disable", "Desactivar")} : ${w.name}`}>{tr("Désactiver", "Disable", "Desactivar")}</Btn>
                          : <Btn onClick={() => change(w, { isActive: true }, tr("Dépôt réactivé.", "Warehouse enabled.", "Almacén reactivado."))} aria-label={`${tr("Réactiver", "Enable", "Reactivar")} : ${w.name}`}>{tr("Réactiver", "Enable", "Reactivar")}</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
      <Notice tone="blue">{tr(
        "Un dépôt qui contient du stock ne peut pas être désactivé : transférez d'abord son contenu vers un autre dépôt (bouton « Transfert »).",
        "A warehouse that still holds stock cannot be disabled: transfer its content to another warehouse first (“Transfer” button).",
        "Un almacén con stock no se puede desactivar: transfiera primero su contenido a otro almacén (botón «Transferencia»).",
      )}</Notice>
      {form && (
        <Modal
          title={editing ? tr("Modifier le dépôt", "Edit warehouse", "Editar almacén") : tr("Nouveau dépôt", "New warehouse", "Nuevo almacén")} onClose={() => setForm(null)} width={480}
          footer={<>
            <Btn onClick={() => setForm(null)}>{tr("Annuler", "Cancel", "Cancelar")}</Btn>
            <Btn type="submit" form="warehouse-form" variant="primary" busy={busy}>{tr("Enregistrer", "Save", "Guardar")}</Btn>
          </>}
        >
          <form id="warehouse-form" noValidate onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <LabeledField id="wh-name" label={tr("Nom", "Name", "Nombre")} required>
              <input id="wh-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} maxLength={120} aria-required="true" autoComplete="off" />
            </LabeledField>
            {!editing && (
              <LabeledField id="wh-code" label={tr("Code (facultatif)", "Code (optional)", "Código (opcional)")} hint={tr("Lettres, chiffres, - ou _ (20 max). Généré si vide.", "Letters, digits, - or _ (20 max). Generated if empty.", "Letras, dígitos, - o _ (20 máx.). Se genera si está vacío.")}>
                <input id="wh-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} maxLength={20} autoComplete="off" />
              </LabeledField>
            )}
            <LabeledField id="wh-address" label={tr("Adresse", "Address", "Dirección")}>
              <input id="wh-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} maxLength={300} autoComplete="off" />
            </LabeledField>
            {!(editing && form.isDefault) && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" style={{ width: 18, height: 18, flex: "none", margin: 0 }} checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                {tr("Dépôt par défaut (ventes, achats, caisse)", "Default warehouse (sales, purchases, checkout)", "Almacén predeterminado (ventas, compras, caja)")}
              </label>
            )}
            <FormError message={error} />
          </form>
        </Modal>
      )}
    </>
  );
}

// ───────────────────────── Mouvements ─────────────────────────

interface Mov {
  id: number; createdAt: string; type: string; reason: string; quantity: number; unitCost: number; balanceAfter: number;
  refType?: string | null; refId?: string | null; lotNumber?: string | null; note?: string | null; productId: number; productName: string; sku?: string | null; warehouseName: string;
}
const PAGE = 50;
const TYPES = ["in", "out", "adjustment", "opening", "transfer_in", "transfer_out"] as const;
const typeText = (tr: Tr, t: string) => ({
  in: tr("Entrée", "In", "Entrada"), out: tr("Sortie", "Out", "Salida"), adjustment: tr("Ajustement", "Adjustment", "Ajuste"), opening: tr("Ouverture", "Opening", "Apertura"),
  transfer_in: tr("Transfert (entrée)", "Transfer in", "Transferencia (entrada)"), transfer_out: tr("Transfert (sortie)", "Transfer out", "Transferencia (salida)"),
}[t] || t);

export function MovementsTab({ tr, warehouses, products, refresh }: TabProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("");
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [cardId, setCardId] = useState<number | null>(null);
  const filter = (set: (v: string) => void) => (v: string) => { set(v); setPage(0); };
  const { data, error, loading, reload } = useLoad(
    () => api<{ total: number; items: Mov[] }>("/stock/movements", { query: { warehouseId, reason, type, productId, from, to, limit: PAGE, offset: page * PAGE } }),
    [warehouseId, reason, type, productId, from, to, page, refresh],
  );
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, alignItems: "end" }}>
          <ProductPicker id="mov-product" label={tr("Produit", "Product", "Producto")} emptyLabel={tr("Tous les produits", "All products", "Todos los productos")} products={products} value={productId} onChange={filter(setProductId)} tr={tr} />
          <LabeledField id="mov-warehouse" label={tr("Dépôt", "Warehouse", "Almacén")}>
            <select id="mov-warehouse" value={warehouseId} onChange={(e) => filter(setWarehouseId)(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous", "All", "Todos")}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField id="mov-reason" label={tr("Motif", "Reason", "Motivo")}>
            <select id="mov-reason" value={reason} onChange={(e) => filter(setReason)(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous", "All", "Todos")}</option>
              {FILTER_REASONS.map((r) => <option key={r} value={r}>{reasonLabel(tr, r)}</option>)}
            </select>
          </LabeledField>
          <LabeledField id="mov-type" label={tr("Type", "Type", "Tipo")}>
            <select id="mov-type" value={type} onChange={(e) => filter(setType)(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous", "All", "Todos")}</option>
              {TYPES.map((t) => <option key={t} value={t}>{typeText(tr, t)}</option>)}
            </select>
          </LabeledField>
          <LabeledField id="mov-from" label={tr("Du", "From", "Desde")}>
            <input id="mov-from" type="date" value={from} onChange={(e) => filter(setFrom)(e.target.value)} style={inputStyle} />
          </LabeledField>
          <LabeledField id="mov-to" label={tr("Au", "To", "Hasta")}>
            <input id="mov-to" type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} style={inputStyle} />
          </LabeledField>
        </div>
      </Card>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card pad={false}>
        {loading && !data ? <Loading /> : items.length === 0 ? <Empty>{tr("Aucun mouvement pour ces critères.", "No movement for these filters.", "Ningún movimiento con estos filtros.")}</Empty> : (
          <TableWrap min={980}>
            <thead>
              <tr>
                <th style={th}>{tr("Date", "Date", "Fecha")}</th><th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th>
                <th style={th}>{tr("Motif", "Reason", "Motivo")}</th><th style={{ ...th, ...numStyle }}>{tr("Quantité", "Quantity", "Cantidad")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Coût unitaire", "Unit cost", "Costo unitario")}</th><th style={{ ...th, ...numStyle }}>{tr("Solde du dépôt", "Warehouse balance", "Saldo del almacén")}</th>
                <th style={th}>{tr("Référence", "Reference", "Referencia")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={td}>{fmtDate(m.createdAt)}</td>
                  <td style={td}>
                    <button type="button" style={linkBtn} onClick={() => setCardId(m.productId)}>{m.productName}</button>
                    {m.sku ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>SKU {m.sku}</div> : null}
                  </td>
                  <td style={td}>{m.warehouseName}</td>
                  <td style={td}>{reasonLabel(tr, m.reason)}<div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{typeText(tr, m.type)}</div></td>
                  <td style={{ ...td, ...numStyle, fontWeight: 700, color: m.quantity < 0 ? "var(--theme-danger, #ef4444)" : "var(--theme-success, #10b981)" }}>{m.quantity > 0 ? "+" : ""}{fmtQty(m.quantity)}</td>
                  <td style={{ ...td, ...numStyle }}>{moneyDT(m.unitCost)}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(m.balanceAfter)}</td>
                  <td style={td}>
                    {m.refType ? `${m.refType}${m.refId ? ` #${m.refId}` : ""}` : "—"}
                    {m.lotNumber ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{tr("Lot", "Lot", "Lote")} {m.lotNumber}</div> : null}
                    {m.note ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{m.note}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {total > PAGE && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--theme-border)", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} {tr("sur", "of", "de")} {total}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>{tr("Précédent", "Previous", "Anterior")}</Btn>
              <Btn disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>{tr("Suivant", "Next", "Siguiente")}</Btn>
            </div>
          </div>
        )}
      </Card>
      {cardId !== null && <StockCardModal tr={tr} productId={cardId} onClose={() => setCardId(null)} />}
    </>
  );
}

// ───────────────────────── Lots et péremption ─────────────────────────

interface LotRow { id: number; productId: number; productName: string; warehouse: string; lotNumber: string; expiryDate?: string | null; quantity: number }

export function expiryBadge(tr: Tr, expiry?: string | null) {
  const d = daysUntil(expiry);
  if (d === null) return <Badge tone="gray">{tr("Sans date", "No date", "Sin fecha")}</Badge>;
  if (d < 0) return <Badge tone="red">{tr(`Périmé depuis ${-d} j`, `Expired ${-d} d ago`, `Caducado hace ${-d} d`)}</Badge>;
  if (d <= 30) return <Badge tone="amber">{tr(`Dans ${d} j`, `In ${d} d`, `En ${d} d`)}</Badge>;
  return <Badge tone="green">{tr(`Dans ${d} j`, `In ${d} d`, `En ${d} d`)}</Badge>;
}

export function LotsTab({ tr, warehouses, refresh }: TabProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [within, setWithin] = useState("");
  const { data, error, loading, reload } = useLoad(
    () => api<LotRow[]>("/stock/lots", { query: { warehouseId, expiringInDays: within } }),
    [warehouseId, within, refresh],
  );
  const rows = data || [];
  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <LabeledField id="lots-warehouse" label={tr("Dépôt", "Warehouse", "Almacén")}>
            <select id="lots-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous les dépôts", "All warehouses", "Todos los almacenes")}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField id="lots-within" label={tr("Péremption", "Expiry", "Caducidad")}>
            <select id="lots-within" value={within} onChange={(e) => setWithin(e.target.value)} style={inputStyle}>
              <option value="">{tr("Tous les lots", "All lots", "Todos los lotes")}</option>
              <option value="0">{tr("Périmés (aujourd'hui inclus)", "Expired (including today)", "Caducados (hoy incluido)")}</option>
              <option value="30">{tr("Périmés ou dans 30 jours", "Expired or within 30 days", "Caducados o en 30 días")}</option>
              <option value="60">{tr("Périmés ou dans 60 jours", "Expired or within 60 days", "Caducados o en 60 días")}</option>
              <option value="90">{tr("Périmés ou dans 90 jours", "Expired or within 90 days", "Caducados o en 90 días")}</option>
            </select>
          </LabeledField>
        </div>
      </Card>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card pad={false}>
        {loading && !data ? <Loading /> : rows.length === 0 ? (
          <Empty>
            {tr("Aucun lot en stock.", "No lot in stock.", "Ningún lote en stock.")}
            <div style={{ fontSize: 13, marginTop: 6 }}>{tr("Activez le suivi par lot d'un produit dans « Niveaux par dépôt » → Réglages.", "Enable lot tracking on a product in “Levels by warehouse” → Settings.", "Active el control por lote de un producto en «Niveles por almacén» → Ajustes.")}</div>
          </Empty>
        ) : (
          <TableWrap min={720}>
            <thead>
              <tr>
                <th style={th}>{tr("Produit", "Product", "Producto")}</th><th style={th}>{tr("Lot", "Lot", "Lote")}</th><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th>
                <th style={{ ...th, ...numStyle }}>{tr("Quantité", "Quantity", "Cantidad")}</th><th style={th}>{tr("Péremption", "Expiry", "Caducidad")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{l.productName}</td>
                  <td style={td}>{l.lotNumber}</td>
                  <td style={td}>{l.warehouse}</td>
                  <td style={{ ...td, ...numStyle }}>{fmtQty(l.quantity)}</td>
                  <td style={td}>{l.expiryDate ? <>{fmtDate(l.expiryDate)} {expiryBadge(tr, l.expiryDate)}</> : expiryBadge(tr, null)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
