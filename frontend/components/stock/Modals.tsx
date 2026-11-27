"use client";
/**
 * Fenêtres du module Stock : ajustement, transfert, fiche de stock d'un produit, réglages d'un produit.
 * Même socle que les autres écrans « ERP » (components/erp/kit) : role="dialog", Échap, champs étiquetés,
 * erreurs lisibles dans la fenêtre.
 */
import React, { useState } from "react";
import {
  addDaysISO, api, Btn, Empty, fmtDate, inputStyle, Loading, Modal, moneyDT, num as numStyle, Notice, qty as fmtQty, Stat, TableWrap, td, th, useLoad,
} from "@/components/erp/kit";
import { ADJUST_REASONS, reasonLabel, type Tr } from "./i18n";
import { FormError, isBlank, LabeledField, optNum, ProductPicker, round3, toNum, type StockProduct, type Warehouse } from "./shared";

const errText = (e: unknown, tr: Tr) => (e as { message?: string } | null)?.message || tr("Une erreur est survenue.", "Something went wrong.", "Ha ocurrido un error.");

// ───────────────────────── Ajustement ─────────────────────────

export function AdjustModal({ tr, products, warehouses, product, onClose, onDone }: {
  tr: Tr; products: StockProduct[]; warehouses: Warehouse[]; product?: StockProduct | null; onClose: () => void; onDone: (message: string) => void;
}) {
  const active = warehouses.filter((w) => w.isActive);
  const [productId, setProductId] = useState(product ? String(product.id) : "");
  const [warehouseId, setWarehouseId] = useState(String((active.find((w) => w.isDefault) || active[0])?.id ?? ""));
  const [mode, setMode] = useState<"delta" | "target">("delta");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState<string>("manual");
  const [unitCost, setUnitCost] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = products.find((p) => String(p.id) === productId) || (product && String(product.id) === productId ? product : undefined);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!productId) return setError(tr("Choisissez un produit.", "Choose a product.", "Elija un producto."));
    const v = toNum(value);
    if (!Number.isFinite(v)) return setError(tr("Indiquez une quantité valide.", "Enter a valid quantity.", "Indique una cantidad válida."));
    if (mode === "delta" && v === 0) return setError(tr("La variation ne peut pas être nulle.", "The change cannot be zero.", "La variación no puede ser cero."));
    if (mode === "target" && v < 0) return setError(tr("La quantité cible ne peut pas être négative.", "The target quantity cannot be negative.", "La cantidad objetivo no puede ser negativa."));
    const cost = optNum(unitCost);
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) return setError(tr("Le coût unitaire doit être un nombre positif.", "The unit cost must be a positive number.", "El costo unitario debe ser un número positivo."));
    if (chosen?.trackLots && mode === "delta" && v > 0 && isBlank(lotNumber)) {
      return setError(tr("Ce produit est suivi par lot : indiquez le numéro de lot de l'entrée.", "This product is lot-tracked: enter the lot number of the receipt.", "Este producto se controla por lote: indique el número de lote de la entrada."));
    }
    const body: Record<string, unknown> = { productId: Number(productId), reason };
    if (warehouseId) body.warehouseId = Number(warehouseId);
    if (mode === "delta") body.quantity = round3(v); else body.newQuantity = round3(v);
    if (cost !== undefined) body.unitCost = round3(cost);
    if (!isBlank(lotNumber)) body.lotNumber = lotNumber.trim();
    if (!isBlank(expiryDate)) body.expiryDate = expiryDate;
    if (!isBlank(note)) body.note = note.trim();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ message?: string }>("/stock/adjustments", { method: "POST", body });
      onDone(res?.message || tr("Ajustement enregistré.", "Adjustment saved.", "Ajuste registrado."));
    } catch (err) {
      setError(errText(err, tr));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tr("Ajustement de stock", "Stock adjustment", "Ajuste de stock")} onClose={onClose} width={560}
      footer={<>
        <Btn onClick={onClose}>{tr("Annuler", "Cancel", "Cancelar")}</Btn>
        <Btn type="submit" form="stock-adjust-form" variant="primary" busy={busy}>{tr("Enregistrer", "Save", "Guardar")}</Btn>
      </>}
    >
      <form id="stock-adjust-form" noValidate onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ProductPicker id="adjust-product" label={tr("Produit", "Product", "Producto")} required products={products} value={productId} onChange={setProductId} tr={tr} />
        <LabeledField id="adjust-warehouse" label={tr("Dépôt", "Warehouse", "Almacén")}>
          <select id="adjust-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={inputStyle}>
            {active.map((w) => <option key={w.id} value={w.id}>{w.name}{w.isDefault ? ` — ${tr("par défaut", "default", "predeterminado")}` : ""}</option>)}
          </select>
        </LabeledField>
        <div role="group" aria-label={tr("Type de saisie", "Entry type", "Tipo de entrada")} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant={mode === "delta" ? "primary" : "ghost"} aria-pressed={mode === "delta"} onClick={() => setMode("delta")}>{tr("Variation (+ / −)", "Change (+ / −)", "Variación (+ / −)")}</Btn>
          <Btn variant={mode === "target" ? "primary" : "ghost"} aria-pressed={mode === "target"} onClick={() => setMode("target")}>{tr("Quantité cible", "Target quantity", "Cantidad objetivo")}</Btn>
        </div>
        <LabeledField
          id="adjust-value" required
          label={mode === "delta" ? tr("Variation (négative pour une sortie)", "Change (negative for an outflow)", "Variación (negativa para una salida)") : tr("Quantité à obtenir dans ce dépôt", "Quantity to reach in this warehouse", "Cantidad a alcanzar en este almacén")}
        >
          <input id="adjust-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} aria-required="true" autoComplete="off" />
        </LabeledField>
        <LabeledField id="adjust-reason" label={tr("Motif", "Reason", "Motivo")}>
          <select id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle}>
            {ADJUST_REASONS.map((r) => <option key={r} value={r}>{reasonLabel(tr, r)}</option>)}
          </select>
        </LabeledField>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <LabeledField id="adjust-cost" label={tr("Coût unitaire (entrées)", "Unit cost (receipts)", "Costo unitario (entradas)")}>
            <input id="adjust-cost" inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} style={inputStyle} autoComplete="off" />
          </LabeledField>
          <LabeledField id="adjust-lot" label={tr("N° de lot", "Lot number", "N.º de lote")} required={!!chosen?.trackLots}>
            <input id="adjust-lot" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} style={inputStyle} maxLength={60} autoComplete="off" />
          </LabeledField>
          <LabeledField id="adjust-expiry" label={tr("Péremption", "Expiry date", "Caducidad")}>
            <input id="adjust-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={inputStyle} />
          </LabeledField>
        </div>
        <LabeledField id="adjust-note" label={tr("Note", "Note", "Nota")}>
          <input id="adjust-note" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} maxLength={300} autoComplete="off" />
        </LabeledField>
        <FormError message={error} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Transfert ─────────────────────────

interface TLine { productId: string; quantity: string; lotNumber: string }

export function TransferModal({ tr, products, warehouses, onClose, onDone }: {
  tr: Tr; products: StockProduct[]; warehouses: Warehouse[]; onClose: () => void; onDone: (message: string) => void;
}) {
  const active = warehouses.filter((w) => w.isActive);
  const def = active.find((w) => w.isDefault) || active[0];
  const [from, setFrom] = useState(String(def?.id ?? ""));
  const [to, setTo] = useState(String(active.find((w) => w.id !== def?.id)?.id ?? ""));
  const [lines, setLines] = useState<TLine[]>([{ productId: "", quantity: "", lotNumber: "" }]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setLine = (i: number, patch: Partial<TLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!from || !to) return setError(tr("Choisissez le dépôt de départ et celui d'arrivée.", "Choose the source and destination warehouses.", "Elija el almacén de origen y el de destino."));
    if (from === to) return setError(tr("Les dépôts de départ et d'arrivée doivent être différents.", "The source and destination warehouses must differ.", "Los almacenes de origen y destino deben ser distintos."));
    const filled = lines.filter((l) => l.productId || !isBlank(l.quantity));
    if (!filled.length) return setError(tr("Ajoutez au moins un produit à transférer.", "Add at least one product to transfer.", "Añada al menos un producto a transferir."));
    const payload: Array<{ productId: number; quantity: number; lotNumber?: string }> = [];
    for (const l of filled) {
      const q = toNum(l.quantity);
      if (!l.productId) return setError(tr("Choisissez un produit pour chaque ligne.", "Choose a product on every line.", "Elija un producto en cada línea."));
      if (!Number.isFinite(q) || q <= 0) return setError(tr("Chaque quantité doit être supérieure à zéro.", "Each quantity must be greater than zero.", "Cada cantidad debe ser mayor que cero."));
      payload.push({ productId: Number(l.productId), quantity: round3(q), ...(isBlank(l.lotNumber) ? {} : { lotNumber: l.lotNumber.trim() }) });
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ number?: string }>("/stock/transfers", {
        method: "POST",
        body: { fromWarehouseId: Number(from), toWarehouseId: Number(to), lines: payload, ...(isBlank(note) ? {} : { note: note.trim() }) },
      });
      onDone(res?.number ? tr(`Transfert ${res.number} enregistré.`, `Transfer ${res.number} saved.`, `Transferencia ${res.number} registrada.`) : tr("Transfert enregistré.", "Transfer saved.", "Transferencia registrada."));
    } catch (err) {
      setError(errText(err, tr));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tr("Transfert entre dépôts", "Transfer between warehouses", "Transferencia entre almacenes")} onClose={onClose} width={680}
      footer={<>
        <Btn onClick={onClose}>{tr("Annuler", "Cancel", "Cancelar")}</Btn>
        <Btn type="submit" form="stock-transfer-form" variant="primary" busy={busy} disabled={active.length < 2}>{tr("Transférer", "Transfer", "Transferir")}</Btn>
      </>}
    >
      {active.length < 2 && <Notice>{tr("Il faut au moins deux dépôts actifs : créez-en un dans l'onglet « Dépôts ».", "You need at least two active warehouses: create one in the “Warehouses” tab.", "Se necesitan al menos dos almacenes activos: cree uno en la pestaña «Almacenes».")}</Notice>}
      <form id="stock-transfer-form" noValidate onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <LabeledField id="transfer-from" label={tr("Dépôt de départ", "From warehouse", "Almacén de origen")} required>
            <select id="transfer-from" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} aria-required="true">
              {active.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField id="transfer-to" label={tr("Dépôt d'arrivée", "To warehouse", "Almacén de destino")} required>
            <select id="transfer-to" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} aria-required="true">
              <option value="">—</option>
              {active.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </LabeledField>
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{ border: "1px solid var(--theme-border)", borderRadius: 10, padding: 10, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", alignItems: "end" }}>
            <ProductPicker id={`transfer-product-${i}`} label={`${tr("Produit", "Product", "Producto")} ${i + 1}`} required products={products} value={l.productId} onChange={(v) => setLine(i, { productId: v })} tr={tr} />
            <LabeledField id={`transfer-qty-${i}`} label={tr("Quantité", "Quantity", "Cantidad")} required>
              <input id={`transfer-qty-${i}`} inputMode="decimal" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} style={inputStyle} aria-required="true" autoComplete="off" />
            </LabeledField>
            <LabeledField id={`transfer-lot-${i}`} label={tr("N° de lot (facultatif)", "Lot number (optional)", "N.º de lote (opcional)")}>
              <input id={`transfer-lot-${i}`} value={l.lotNumber} onChange={(e) => setLine(i, { lotNumber: e.target.value })} style={inputStyle} maxLength={60} autoComplete="off" />
            </LabeledField>
            {lines.length > 1 && (
              <Btn variant="danger" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} aria-label={`${tr("Retirer la ligne", "Remove line", "Quitar la línea")} ${i + 1}`}>×</Btn>
            )}
          </div>
        ))}
        <div><Btn onClick={() => setLines((ls) => [...ls, { productId: "", quantity: "", lotNumber: "" }])} disabled={lines.length >= 200}>+ {tr("Ajouter un produit", "Add a product", "Añadir un producto")}</Btn></div>
        <LabeledField id="transfer-note" label={tr("Note", "Note", "Nota")}>
          <input id="transfer-note" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} maxLength={300} autoComplete="off" />
        </LabeledField>
        <FormError message={error} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Fiche de stock ─────────────────────────

interface CardLine { id: number; createdAt: string; type: string; reason: string; quantity: number; unitCost: number; refType?: string | null; refId?: string | null; lotNumber?: string | null; note?: string | null; warehouse: string; balance: number }
interface CardData {
  product: { id: number; name: string; sku?: string | null; unit?: string | null; currentQuantity: number; avgCost: number };
  opening: number; totalIn: number; totalOut: number; closing: number; lines: CardLine[];
}

export function StockCardModal({ tr, productId, onClose }: { tr: Tr; productId: number; onClose: () => void }) {
  const [from, setFrom] = useState(addDaysISO(-90));
  const [to, setTo] = useState("");
  const { data, error, loading } = useLoad(() => api<CardData>(`/stock/card/${productId}`, { query: { from, to } }), [productId, from, to]);
  return (
    <Modal title={`${tr("Fiche de stock", "Stock card", "Ficha de stock")}${data ? ` — ${data.product.name}` : ""}`} onClose={onClose} width={900} footer={<Btn onClick={onClose}>{tr("Fermer", "Close", "Cerrar")}</Btn>}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <LabeledField id="card-from" label={tr("Du", "From", "Desde")}>
          <input id="card-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        </LabeledField>
        <LabeledField id="card-to" label={tr("Au", "To", "Hasta")}>
          <input id="card-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        </LabeledField>
      </div>
      {error && <FormError message={error} />}
      {loading && !data && <Loading />}
      {data && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Stat label={tr("Report", "Opening", "Saldo inicial")} value={fmtQty(data.opening)} />
            <Stat label={tr("Entrées", "In", "Entradas")} value={fmtQty(data.totalIn)} tone="good" />
            <Stat label={tr("Sorties", "Out", "Salidas")} value={fmtQty(data.totalOut)} tone={data.totalOut > 0 ? "bad" : undefined} />
            <Stat label={tr("Solde final", "Closing", "Saldo final")} value={fmtQty(data.closing)} sub={`${tr("Stock actuel", "Current stock", "Stock actual")} : ${fmtQty(data.product.currentQuantity)}`} />
          </div>
          {data.lines.length === 0 ? <Empty>{tr("Aucun mouvement sur cette période.", "No movement in this period.", "Ningún movimiento en este período.")}</Empty> : (
            <TableWrap min={760}>
              <thead>
                <tr>
                  <th style={th}>{tr("Date", "Date", "Fecha")}</th><th style={th}>{tr("Motif", "Reason", "Motivo")}</th><th style={th}>{tr("Dépôt", "Warehouse", "Almacén")}</th>
                  <th style={{ ...th, ...numStyle }}>{tr("Quantité", "Quantity", "Cantidad")}</th><th style={{ ...th, ...numStyle }}>{tr("Coût", "Cost", "Costo")}</th><th style={{ ...th, ...numStyle }}>{tr("Solde", "Balance", "Saldo")}</th>
                  <th style={th}>{tr("Référence", "Reference", "Referencia")}</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((l) => (
                  <tr key={l.id}>
                    <td style={td}>{fmtDate(l.createdAt)}</td>
                    <td style={td}>{reasonLabel(tr, l.reason)}{l.note ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{l.note}</div> : null}</td>
                    <td style={td}>{l.warehouse}</td>
                    <td style={{ ...td, ...numStyle, fontWeight: 700, color: l.quantity < 0 ? "var(--theme-danger, #ef4444)" : "var(--theme-success, #10b981)" }}>{l.quantity > 0 ? "+" : ""}{fmtQty(l.quantity)}</td>
                    <td style={{ ...td, ...numStyle }}>{moneyDT(l.unitCost)}</td>
                    <td style={{ ...td, ...numStyle }}>{fmtQty(l.balance)}</td>
                    <td style={td}>{l.refType ? `${l.refType}${l.refId ? ` #${l.refId}` : ""}` : "—"}{l.lotNumber ? <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{tr("Lot", "Lot", "Lote")} {l.lotNumber}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </>
      )}
    </Modal>
  );
}

// ───────────────────────── Réglages d'un produit ─────────────────────────

export interface SettingsRow { productId: number; name: string; unit?: string | null; minStock?: number; trackLots?: boolean; avgCost?: number }

export function ProductSettingsModal({ tr, row, onClose, onDone }: { tr: Tr; row: SettingsRow; onClose: () => void; onDone: (message: string) => void }) {
  const [minStock, setMinStock] = useState(String(row.minStock ?? 0));
  const [unit, setUnit] = useState(row.unit ?? "");
  const [trackLots, setTrackLots] = useState(!!row.trackLots);
  const [avgCost, setAvgCost] = useState(String(row.avgCost ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const min = toNum(minStock);
    if (!Number.isInteger(min) || min < 0) return setError(tr("Le seuil d'alerte doit être un nombre entier positif ou nul.", "The alert threshold must be a whole number, zero or more.", "El umbral de alerta debe ser un número entero, cero o más."));
    if (unit.trim().length > 20) return setError(tr("L'unité ne peut pas dépasser 20 caractères.", "The unit cannot exceed 20 characters.", "La unidad no puede superar los 20 caracteres."));
    const cost = toNum(avgCost);
    if (!Number.isFinite(cost) || cost < 0) return setError(tr("Le coût moyen doit être un nombre positif ou nul.", "The average cost must be a number, zero or more.", "El costo medio debe ser un número, cero o más."));
    const settings: Record<string, unknown> = {};
    if (min !== (row.minStock ?? 0)) settings.minStock = min;
    if (unit.trim() !== (row.unit ?? "")) settings.unit = unit.trim();
    if (trackLots !== !!row.trackLots) settings.trackLots = trackLots;
    const costChanged = round3(cost) !== round3(row.avgCost ?? 0);
    if (!Object.keys(settings).length && !costChanged) return onClose();
    setBusy(true);
    setError(null);
    try {
      if (Object.keys(settings).length) await api(`/stock/products/${row.productId}/settings`, { method: "PATCH", body: settings });
      if (costChanged) await api(`/stock/products/${row.productId}/cost`, { method: "PATCH", body: { avgCost: round3(cost) } });
      onDone(tr("Réglages enregistrés.", "Settings saved.", "Ajustes guardados."));
    } catch (err) {
      setError(errText(err, tr));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`${tr("Réglages", "Settings", "Ajustes")} — ${row.name}`} onClose={onClose} width={480}
      footer={<>
        <Btn onClick={onClose}>{tr("Annuler", "Cancel", "Cancelar")}</Btn>
        <Btn type="submit" form="stock-settings-form" variant="primary" busy={busy}>{tr("Enregistrer", "Save", "Guardar")}</Btn>
      </>}
    >
      <form id="stock-settings-form" noValidate onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LabeledField id="settings-min" label={tr("Seuil d'alerte (stock bas)", "Alert threshold (low stock)", "Umbral de alerta (stock bajo)")} required hint={tr("Une alerte apparaît quand le stock atteint ce seuil.", "An alert appears when stock reaches this threshold.", "Aparece una alerta cuando el stock alcanza este umbral.")}>
          <input id="settings-min" inputMode="numeric" value={minStock} onChange={(e) => setMinStock(e.target.value)} style={inputStyle} aria-required="true" autoComplete="off" />
        </LabeledField>
        <LabeledField id="settings-unit" label={tr("Unité (pièce, kg, litre…)", "Unit (piece, kg, litre…)", "Unidad (pieza, kg, litro…)")}>
          <input id="settings-unit" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} maxLength={20} autoComplete="off" />
        </LabeledField>
        <LabeledField id="settings-cost" label={tr("Coût moyen unitaire", "Average unit cost", "Costo medio unitario")} hint={tr("Sert à valoriser le stock (CMUP).", "Used to value stock (weighted average cost).", "Se usa para valorar el stock (costo medio ponderado).")}>
          <input id="settings-cost" inputMode="decimal" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} style={inputStyle} autoComplete="off" />
        </LabeledField>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" style={{ width: 18, height: 18, flex: "none", margin: 0 }} checked={trackLots} onChange={(e) => setTrackLots(e.target.checked)} />
          {tr("Suivre ce produit par lot (numéro et péremption)", "Track this product by lot (number and expiry)", "Controlar este producto por lote (número y caducidad)")}
        </label>
        <FormError message={error} />
      </form>
    </Modal>
  );
}

