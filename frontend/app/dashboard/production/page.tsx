"use client";
/**
 * Production › Ordres de fabrication.
 * Un ordre = un produit fini à fabriquer, une quantité, et sa nomenclature (les composants consommés par unité).
 * À chaque avancement enregistré, la quantité produite entre en stock et les composants en sortent : le stock et
 * le coût des matières restent justes sans double saisie.
 */
import React, { FormEvent, useMemo, useState } from "react";
import { api, Badge, Btn, Card, Empty, ErrorBox, fmtDate, inputStyle, Loading, Modal, Notice, Page, Row, Stat, TableWrap, num, qty, td, th, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";

interface Component { productId: number; quantity: number }
interface ProductionOrder {
  id: number; orderNumber: string; productName: string; productId: number | null; quantity: number; completedQuantity: number; stockedQuantity: number;
  status: "pending" | "in_progress" | "completed" | "cancelled" | string; progress: number; startDate: string | null; endDate: string | null;
  priority: string | null; assignedTo: string | null; notes: string | null; components: Component[] | null; createdAt: string;
}
interface ProductRef { id: number; name: string; quantity?: number; unit?: string | null; isStockable?: boolean }

const STATUS: Record<string, [string, "gray" | "blue" | "green" | "red"]> = { pending: ["En attente", "gray"], in_progress: ["En cours", "blue"], completed: ["Terminé", "green"], cancelled: ["Annulé", "red"] };
const PRIORITY: Record<string, string> = { low: "Basse", normal: "Normale", high: "Haute", urgent: "Urgente" };
const dayOf = (value: string | null) => (value ? String(value).slice(0, 10) : "");

interface Form { productId: string; productName: string; quantity: string; startDate: string; endDate: string; priority: string; assignedTo: string; notes: string; components: Array<{ productId: string; quantity: string }> }
const formOf = (order: ProductionOrder | null): Form => ({
  productId: order?.productId ? String(order.productId) : "", productName: order?.productName || "", quantity: order ? String(order.quantity) : "", startDate: dayOf(order?.startDate ?? null),
  endDate: dayOf(order?.endDate ?? null), priority: order?.priority || "normal", assignedTo: order?.assignedTo || "", notes: order?.notes || "",
  components: (order?.components || []).map((c) => ({ productId: String(c.productId), quantity: String(c.quantity).replace(".", ",") })),
});

function OrderModal({ order, products, onClose, onDone }: { order: ProductionOrder | null; products: ProductRef[]; onClose: () => void; onDone: (message: string) => void }) {
  const [form, setForm] = useState<Form>(formOf(order));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const stockable = products.filter((p) => p.isStockable !== false);
  const started = !!order && (Number(order.completedQuantity) > 0 || order.status === "completed");

  const setComponent = (index: number, patch: Partial<{ productId: string; quantity: string }>) =>
    set("components", form.components.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const quantity = Number(form.quantity);
    const name = form.productId ? stockable.find((p) => String(p.id) === form.productId)?.name || form.productName : form.productName.trim();
    if (!name) { setError("Choisissez le produit fini (ou saisissez son nom)."); return; }
    if (!Number.isInteger(quantity) || quantity <= 0) { setError("Quantité à fabriquer : un nombre entier supérieur à zéro."); return; }
    const components: Component[] = [];
    for (const c of form.components) {
      if (!c.productId && !c.quantity.trim()) continue;
      const q = Number(c.quantity.replace(",", "."));
      if (!c.productId || !(q > 0)) { setError("Nomenclature : choisissez le composant et sa quantité par unité produite."); return; }
      if (c.productId === form.productId) { setError("Un produit ne peut pas être son propre composant."); return; }
      components.push({ productId: Number(c.productId), quantity: q });
    }
    setBusy(true);
    setError(null);
    const body = {
      productId: form.productId ? Number(form.productId) : null, productName: name, quantity, startDate: form.startDate || null, endDate: form.endDate || null,
      priority: form.priority, assignedTo: form.assignedTo.trim() || null, notes: form.notes.trim() || null, components,
    };
    try {
      if (order) await api(`/production/orders/${order.id}`, { method: "PUT", body });
      else await api("/production/orders", { method: "POST", body: { ...body, status: "pending" } });
      onDone(order ? "Ordre de fabrication enregistré." : "Ordre de fabrication créé.");
    } catch (err: any) {
      setError(err?.message || "L’enregistrement a échoué.");
      setBusy(false);
    }
  };

  return (
    <Modal title={order ? `Ordre ${order.orderNumber}` : "Nouvel ordre de fabrication"} onClose={() => { if (!busy) onClose(); }} width={680}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={(e) => save(e as unknown as FormEvent)}>Enregistrer</Btn></>}>
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <Row>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 260px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Produit fini</span>
            <select value={form.productId} onChange={(e) => set("productId", e.target.value)} style={inputStyle} disabled={started}>
              <option value="">— Sans fiche produit (pas d’entrée en stock) —</option>
              {stockable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 140px", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Quantité à fabriquer</span>
            <input type="number" min={1} step={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} style={inputStyle} />
          </label>
        </Row>
        {form.productId ? null : (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Nom de la fabrication</span>
            <input value={form.productName} onChange={(e) => set("productName", e.target.value)} maxLength={160} style={inputStyle} />
          </label>
        )}
        <Row>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Début prévu</span><input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} style={inputStyle} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Fin prévue</span><input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} style={inputStyle} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Priorité</span>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={inputStyle}>{Object.entries(PRIORITY).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 170px" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Responsable</span><input value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} maxLength={120} style={inputStyle} /></label>
        </Row>

        <fieldset style={{ border: "1px solid var(--theme-border)", borderRadius: 10, padding: 12, margin: 0, minWidth: 0 }}>
          <legend style={{ padding: "0 6px", fontSize: 13, fontWeight: 700 }}>Nomenclature — composants consommés pour UNE unité produite</legend>
          {started ? <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--theme-text-secondary)" }}>La fabrication a commencé : la nomenclature s’applique aux prochaines unités produites.</p> : null}
          {form.components.length === 0 ? <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--theme-text-secondary)" }}>Aucun composant : seul le produit fini entrera en stock.</p> : form.components.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select value={c.productId} onChange={(e) => setComponent(i, { productId: e.target.value })} style={{ ...inputStyle, flex: "2 1 220px" }} aria-label={`Composant ${i + 1}`}>
                <option value="">Choisir un composant…</option>
                {stockable.filter((p) => String(p.id) !== form.productId).map((p) => <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ""}</option>)}
              </select>
              <input inputMode="decimal" value={c.quantity} onChange={(e) => setComponent(i, { quantity: e.target.value })} placeholder="Qté / unité" style={{ ...inputStyle, flex: "0 1 120px" }} aria-label={`Quantité du composant ${i + 1}`} />
              <Btn onClick={() => set("components", form.components.filter((_, j) => j !== i))} aria-label="Retirer ce composant">×</Btn>
            </div>
          ))}
          <Btn onClick={() => set("components", [...form.components, { productId: "", quantity: "" }])}>Ajouter un composant</Btn>
        </fieldset>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Notes</span>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        {error ? <div role="alert" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 13.5 }}>{error}</div> : null}
      </form>
    </Modal>
  );
}

function ProgressModal({ order, onClose, onDone }: { order: ProductionOrder; onClose: () => void; onDone: (message: string) => void }) {
  const [produced, setProduced] = useState(String(order.completedQuantity || 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = Number(produced);
  const valid = Number.isInteger(value) && value >= Number(order.completedQuantity || 0) && value <= order.quantity;
  const save = async () => {
    if (!valid) { setError(`Indiquez une quantité entre ${order.completedQuantity || 0} et ${order.quantity}.`); return; }
    setBusy(true);
    try {
      // L'API attend un pourcentage ; elle en déduit la quantité produite (arrondie à l'unité inférieure).
      const progress = value >= order.quantity ? 100 : Math.ceil((value / order.quantity) * 100 * 1000) / 1000;
      await api(`/production/orders/${order.id}/progress`, { method: "PATCH", body: { progress } });
      onDone(value >= order.quantity ? `Ordre ${order.orderNumber} terminé : ${order.quantity} unité(s) en stock.` : `Avancement enregistré : ${value} sur ${order.quantity}.`);
    } catch (err: any) {
      setError(err?.message || "L’enregistrement a échoué.");
      setBusy(false);
    }
  };
  return (
    <Modal title={`Avancement — ${order.orderNumber}`} onClose={() => { if (!busy) onClose(); }} footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={save}>Enregistrer</Btn></>}>
      <p style={{ margin: 0, fontSize: 14 }}><strong>{order.productName}</strong> — {order.completedQuantity || 0} produit(s) sur {order.quantity}.</p>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>Quantité produite à ce jour</span>
        <input type="number" min={order.completedQuantity || 0} max={order.quantity} step={1} value={produced} onChange={(e) => setProduced(e.target.value)} style={inputStyle} autoFocus />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setProduced(String(order.quantity))}>Tout est produit ({order.quantity})</Btn>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--theme-text-secondary)", lineHeight: 1.5 }}>
        {order.productId ? "Les nouvelles unités entrent en stock" : "Cet ordre n’est pas relié à une fiche produit : rien n’entre en stock"}{order.components?.length ? ", et les composants de la nomenclature en sortent (refusé si leur stock est insuffisant)." : "."}
      </p>
      {error ? <div role="alert" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 13.5 }}>{error}</div> : null}
    </Modal>
  );
}

export default function ProductionPage() {
  useRequireAuth();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api<ProductionOrder[]>("/production/orders"), api<ProductRef[]>("/products")]), []);
  const [notice, notify] = useNotice();
  const [filter, setFilter] = useState<string>("open");
  const [editing, setEditing] = useState<ProductionOrder | "new" | null>(null);
  const [advancing, setAdvancing] = useState<ProductionOrder | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const [orders, products] = data ?? [[], []];
  const productName = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);
  const shown = orders.filter((o) => (filter === "all" ? true : filter === "open" ? o.status === "pending" || o.status === "in_progress" : o.status === filter));
  const count = (status: string) => orders.filter((o) => o.status === status).length;
  const done = (message: string) => { setEditing(null); setAdvancing(null); notify(message); reload(); };

  const act = async (order: ProductionOrder, run: () => Promise<unknown>, message: string) => {
    setBusy(order.id);
    try { await run(); notify(message); reload(); } catch (err: any) { notify(err?.message || "L’action a échoué.", "err"); } finally { setBusy(null); }
  };

  return (
    <Page title="Production" subtitle="Ordres de fabrication, nomenclatures et entrées en stock des produits finis."
      actions={<Btn variant="primary" onClick={() => setEditing("new")}>Nouvel ordre de fabrication</Btn>}>
      {notice}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Stat label="En attente" value={count("pending")} />
        <Stat label="En cours" value={count("in_progress")} />
        <Stat label="Terminés" value={count("completed")} tone="good" />
        <Stat label="Unités produites" value={qty(orders.reduce((sum, o) => sum + Number(o.completedQuantity || 0), 0))} />
      </div>
      <Notice tone="blue">À chaque avancement, les unités produites entrent en stock et les composants de la nomenclature en sortent. Créez d’abord vos matières et vos produits finis dans « Produits ».</Notice>
      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {[["open", "À fabriquer"], ["completed", "Terminés"], ["cancelled", "Annulés"], ["all", "Tous"]].map(([value, label]) => (
          <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}
            style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "1px solid var(--theme-border)", background: filter === value ? "var(--theme-primary, #4f46e5)" : "var(--theme-surface)", color: filter === value ? "#fff" : "var(--theme-text)" }}>
            {label}
          </button>
        ))}
      </div>
      <Card pad={false}>
        {!data ? (loading ? <Loading /> : null) : shown.length === 0 ? <Empty>{orders.length === 0 ? "Aucun ordre de fabrication. Créez le premier pour suivre votre production." : "Aucun ordre dans cette vue."}</Empty> : (
          <TableWrap min={900}>
            <thead>
              <tr><th style={th}>N°</th><th style={th}>Produit fini</th><th style={{ ...th, ...num }}>Produit / prévu</th><th style={th}>Avancement</th><th style={th}>État</th><th style={th}>Dates</th><th style={th} /></tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const [label, tone] = STATUS[o.status] || [o.status, "gray" as const];
                const percent = Math.min(100, Math.max(0, Math.round(Number(o.progress) || 0)));
                const open = o.status === "pending" || o.status === "in_progress";
                return (
                  <tr key={o.id}>
                    <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 700 }}>{o.orderNumber}</td>
                    <td style={td}>
                      <strong>{o.productName}</strong>
                      {o.components?.length ? <div style={{ fontSize: 12.5, color: "var(--theme-text-secondary)", marginTop: 2 }}>{o.components.map((c) => `${qty(c.quantity)} × ${productName.get(c.productId) || `#${c.productId}`}`).join(" · ")}</div> : null}
                      {o.assignedTo || (o.priority && o.priority !== "normal") ? <div style={{ fontSize: 12.5, color: "var(--theme-text-secondary)" }}>{[o.assignedTo, o.priority && o.priority !== "normal" ? `priorité ${String(PRIORITY[o.priority] || o.priority).toLowerCase()}` : null].filter(Boolean).join(" · ")}</div> : null}
                    </td>
                    <td style={{ ...td, ...num }}>{o.completedQuantity || 0} / {o.quantity}</td>
                    <td style={{ ...td, minWidth: 140 }}>
                      <div style={{ height: 8, borderRadius: 999, background: "var(--theme-surface-hover)", overflow: "hidden" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                        <div style={{ height: "100%", width: `${percent}%`, borderRadius: 999, background: percent >= 100 ? "var(--theme-success, #10b981)" : "var(--theme-primary, #4f46e5)" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 3 }}>{percent} %</div>
                    </td>
                    <td style={td}><Badge tone={tone}>{label}</Badge></td>
                    <td style={{ ...td, whiteSpace: "nowrap", fontSize: 13 }}>{o.startDate ? fmtDate(dayOf(o.startDate)) : "—"} → {o.endDate ? fmtDate(dayOf(o.endDate)) : "—"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {open ? <Btn variant="success" onClick={() => setAdvancing(o)} disabled={busy === o.id}>Avancement</Btn> : null}
                        {open ? <Btn onClick={() => setEditing(o)} disabled={busy === o.id}>Modifier</Btn> : null}
                        {open && !(Number(o.completedQuantity) > 0) ? <Btn variant="danger" busy={busy === o.id} onClick={() => act(o, () => api(`/production/orders/${o.id}/status`, { method: "PATCH", body: { status: "cancelled" } }), `Ordre ${o.orderNumber} annulé.`)}>Annuler</Btn> : null}
                        {o.status === "cancelled" ? <Btn variant="danger" busy={busy === o.id} onClick={() => act(o, () => api(`/production/orders/${o.id}`, { method: "DELETE" }), `Ordre ${o.orderNumber} supprimé.`)}>Supprimer</Btn> : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
      {editing ? <OrderModal order={editing === "new" ? null : editing} products={products} onClose={() => setEditing(null)} onDone={done} /> : null}
      {advancing ? <ProgressModal order={advancing} onClose={() => setAdvancing(null)} onDone={done} /> : null}
    </Page>
  );
}
