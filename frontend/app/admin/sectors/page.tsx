"use client";
/**
 * Administration › Secteurs et suggestions.
 * Pour chaque secteur d'activité proposé à l'inscription : son nom (français, anglais), les modules ouverts
 * d'office aux nouveaux clients (chaque client ouvre et ferme ensuite les siens ; cette page ne modifie jamais les
 * comptes existants), les conseils de démarrage, ses catégories et ses suggestions de produits et de prestations (valeurs
 * indicatives), et les prestations de mise en service proposées.
 */
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Badge, Btn, Card, Empty, ErrorBox, inputStyle, Loading, Modal, Notice, Page, Row, Tabs, TableWrap, num, td, th, useLoad, useNotice } from "@/components/erp/kit";
import { Check, ConfirmModal, FormField, InlineError, LANG, codeStyle, errorText, helpStyle, mutedStyle, plural } from "@/components/admin/config/shared";
import { MODULE_LABELS, SELECTABLE_MODULES, formatMoney, type Sector, type SectorCategory, type SectorDetail, type SectorItem, type ServiceOffer } from "@/lib/saas";

type Tab = "sector" | "categories" | "items" | "offers";
const VAT_RATES = [0, 7, 13, 19];
const OFFER_CATEGORIES: Record<ServiceOffer["category"], string> = { setup: "Mise en service", training: "Formation", migration: "Reprise de données", support: "Assistance", module: "Module" };
const PRICE_UNITS: Record<ServiceOffer["priceUnit"], string> = { one_time: "forfait", per_month: "par mois", per_day: "par jour", per_hour: "par heure", per_user: "par utilisateur" };
const amountOf = (text: string): number | null | undefined => {
  if (!text.trim()) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};
const amountText = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

// ───────────── Fiche du secteur ─────────────

interface SectorForm { code: string; name: string; nameEn: string; description: string; modules: string[]; recommendations: string; isActive: boolean; sortOrder: string }
const sectorForm = (s: Sector | null, nextOrder: number): SectorForm => s
  ? { code: s.code, name: s.name, nameEn: s.nameEn || "", description: s.description || "", modules: s.modules || [], recommendations: (s.recommendations || []).join("\n"), isActive: s.isActive, sortOrder: String(s.sortOrder) }
  : { code: "", name: "", nameEn: "", description: "", modules: ["products", "categories", "clients", "invoices", "finance", "reports"], recommendations: "", isActive: true, sortOrder: String(nextOrder) };

function SectorEditor({ sector, nextOrder, onSaved, onDeleted, notify }: { sector: Sector | null; nextOrder: number; onSaved: (s: Sector) => void; onDeleted: () => void; notify: (m: string, t?: "ok" | "err") => void }) {
  const [form, setForm] = useState<SectorForm>(sectorForm(sector, nextOrder));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"delete" | null>(null);
  useEffect(() => { setForm(sectorForm(sector, nextOrder)); setError(null); }, [sector, nextOrder]);
  const set = <K extends keyof SectorForm>(key: K, value: SectorForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) { setError("Indiquez le nom du secteur."); return; }
    if (!sector && !/^[a-z0-9][a-z0-9_-]{1,38}$/.test(form.code.trim())) { setError("Code : lettres minuscules, chiffres et tirets (2 à 39 caractères), par exemple « pharmacie »."); return; }
    setBusy(true);
    setError(null);
    const body = {
      ...(sector ? {} : { code: form.code.trim() }), name: form.name.trim(), nameEn: form.nameEn.trim() || null, description: form.description.trim() || null,
      modules: form.modules, recommendations: form.recommendations.split("\n").map((line) => line.trim()).filter(Boolean), isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      const saved = sector ? await api<Sector>(`/admin/sectors/${sector.id}`, { method: "PATCH", body }) : await api<Sector>("/admin/sectors", { method: "POST", body });
      notify(sector ? "Secteur enregistré." : "Secteur créé.");
      onSaved(saved);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const act = async () => {
    if (!sector || !confirm) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/sectors/${sector.id}`, { method: "DELETE" });
      notify("Secteur supprimé.");
      onDeleted();
      setConfirm(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row>
        <FormField label="Nom (français)"><input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} style={inputStyle} /></FormField>
        <FormField label="Nom (anglais)"><input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} maxLength={120} style={inputStyle} /></FormField>
      </Row>
      <Row>
        <FormField label="Code" hint={sector ? "Le code ne change plus une fois le secteur créé." : "Identifiant technique, en minuscules."} basis={160}>
          <input value={form.code} onChange={(e) => set("code", e.target.value.toLowerCase())} disabled={!!sector} maxLength={39} style={{ ...inputStyle, ...codeStyle }} />
        </FormField>
        <FormField label="Ordre d’affichage" basis={120}><input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} style={inputStyle} /></FormField>
        <FormField label="Description (page Produits et inscription)" basis={360}><input value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={500} style={inputStyle} /></FormField>
      </Row>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)", marginBottom: 8 }}>Modules activés d’office pour un nouveau compte de ce secteur</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
          {SELECTABLE_MODULES.map((key) => (
            <Check key={key} checked={form.modules.includes(key)} onChange={(v) => set("modules", v ? [...form.modules, key] : form.modules.filter((m) => m !== key))} label={MODULE_LABELS[key] || key} />
          ))}
        </div>
        <p style={{ ...helpStyle, marginTop: 8 }}>Tableau de bord, profil et paramètres sont toujours ouverts. Ces modules sont ouverts d’office aux nouveaux clients du secteur ; chaque client ouvre ou ferme ensuite les siens lui-même, dans la limite de sa formule. Vos changements ne touchent pas les comptes existants.</p>
      </div>
      <FormField grow={false} label="Conseils de démarrage (un par ligne, 12 au plus)" hint="Affichés au client sur la page « Suggestions secteur ».">
        <textarea value={form.recommendations} onChange={(e) => set("recommendations", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
      </FormField>
      <Check checked={form.isActive} onChange={(v) => set("isActive", v)} label="Secteur proposé à l’inscription" hint="Un secteur désactivé n’est plus proposé, mais les comptes qui y sont rattachés le gardent." />
      {error ? <InlineError>{error}</InlineError> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sector ? <Btn type="button" variant="danger" onClick={() => { setError(null); setConfirm("delete"); }}>Supprimer</Btn> : null}
        </span>
        <Btn type="submit" variant="primary" busy={busy}>{sector ? "Enregistrer" : "Créer le secteur"}</Btn>
      </div>
      {confirm && sector ? (
        <ConfirmModal title="Supprimer ce secteur ?" confirmLabel="Supprimer" variant="danger" busy={busy} error={error} onCancel={() => setConfirm(null)} onConfirm={act}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
            {`Le secteur « ${sector.name} », ses catégories, ses suggestions et ses prestations sont supprimés. Impossible si des comptes y sont rattachés : désactivez-le plutôt.`}
          </p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}

// ───────────── Catégories, suggestions, prestations ─────────────

function CategoryModal({ sectorId, category, onClose, onDone }: { sectorId: number; category: SectorCategory | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (name.trim().length < 2) { setError("Indiquez le nom de la catégorie."); return; }
    setBusy(true);
    try {
      await api(category ? `/admin/sectors/${sectorId}/categories/${category.id}` : `/admin/sectors/${sectorId}/categories`, { method: category ? "PATCH" : "POST", body: { name: name.trim(), description: description.trim() || null } });
      onDone();
    } catch (err) { setError(errorText(err)); setBusy(false); }
  };
  return (
    <Modal title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} onClose={onClose} footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={save}>Enregistrer</Btn></>}>
      <FormField grow={false} label="Nom"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} style={inputStyle} autoFocus /></FormField>
      <FormField grow={false} label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} style={inputStyle} /></FormField>
      {error ? <InlineError>{error}</InlineError> : null}
    </Modal>
  );
}

function ItemModal({ sectorId, item, categories, onClose, onDone }: { sectorId: number; item: SectorItem | null; categories: SectorCategory[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "", description: item?.description || "", kind: item?.kind || "product", unit: item?.unit || "pièce", categoryId: item?.categoryId ? String(item.categoryId) : "",
    purchasePrice: amountText(item?.purchasePrice), sellingPrice: amountText(item?.sellingPrice), vatRate: item?.vatRate === null || item?.vatRate === undefined ? "" : String(item.vatRate),
    trackLots: !!item?.trackLots, basis: item?.basis || "", isActive: item ? item.isActive : true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = async () => {
    const purchasePrice = amountOf(form.purchasePrice);
    const sellingPrice = amountOf(form.sellingPrice);
    if (form.name.trim().length < 2) { setError("Indiquez la désignation."); return; }
    if (purchasePrice === undefined || sellingPrice === undefined) { setError("Montant invalide."); return; }
    setBusy(true);
    try {
      await api(item ? `/admin/sectors/${sectorId}/items/${item.id}` : `/admin/sectors/${sectorId}/items`, {
        method: item ? "PATCH" : "POST",
        body: {
          name: form.name.trim(), description: form.description.trim() || null, kind: form.kind, unit: form.unit.trim() || "pièce", categoryId: form.categoryId ? Number(form.categoryId) : null,
          purchasePrice, sellingPrice, vatRate: form.vatRate === "" ? null : Number(form.vatRate), trackLots: form.kind === "product" && form.trackLots, basis: form.basis.trim() || null, isActive: form.isActive,
        },
      });
      onDone();
    } catch (err) { setError(errorText(err)); setBusy(false); }
  };
  return (
    <Modal title={item ? "Modifier la suggestion" : "Nouvelle suggestion"} onClose={onClose} width={640} footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={save}>Enregistrer</Btn></>}>
      <Row>
        <FormField label="Désignation" basis={300}><input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={160} style={inputStyle} autoFocus /></FormField>
        <FormField label="Type" basis={140}>
          <select value={form.kind} onChange={(e) => set("kind", e.target.value)} style={inputStyle}><option value="product">Produit</option><option value="service">Prestation</option></select>
        </FormField>
      </Row>
      <FormField grow={false} label="Description"><input value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={400} style={inputStyle} /></FormField>
      <Row>
        <FormField label="Catégorie" basis={200}>
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} style={inputStyle}><option value="">Sans catégorie</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </FormField>
        <FormField label="Unité" basis={110}><input value={form.unit} onChange={(e) => set("unit", e.target.value)} maxLength={20} style={inputStyle} /></FormField>
        <FormField label="TVA" basis={110}>
          <select value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)} style={inputStyle}><option value="">Par défaut</option>{VAT_RATES.map((r) => <option key={r} value={r}>{r} %</option>)}</select>
        </FormField>
      </Row>
      <Row>
        <FormField label="Coût d’achat indicatif (HT)"><input inputMode="decimal" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} style={inputStyle} /></FormField>
        <FormField label="Prix de vente indicatif (HT)"><input inputMode="decimal" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} style={inputStyle} /></FormField>
      </Row>
      <FormField grow={false} label="Base du calcul" hint="D’où vient cette valeur : elle est montrée au client pour qu’il sache que ce n’est pas un prix de marché.">
        <input value={form.basis} onChange={(e) => set("basis", e.target.value)} maxLength={300} style={inputStyle} />
      </FormField>
      {form.kind === "product" ? <Check checked={form.trackLots} onChange={(v) => set("trackLots", v)} label="Suivi par lot conseillé (dates de péremption)" /> : null}
      <Check checked={form.isActive} onChange={(v) => set("isActive", v)} label="Suggestion proposée aux clients" />
      {error ? <InlineError>{error}</InlineError> : null}
    </Modal>
  );
}

function OfferModal({ sectorCode, offer, onClose, onDone }: { sectorCode: string; offer: ServiceOffer | null; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    name: offer?.name || "", description: offer?.description || "", category: offer?.category || "setup", price: amountText(offer?.price), priceUnit: offer?.priceUnit || "one_time",
    basis: offer?.basis || "", isPublic: !!offer?.isPublic, isActive: offer ? offer.isActive : true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = async () => {
    const price = amountOf(form.price);
    if (form.name.trim().length < 2) { setError("Indiquez le nom de la prestation."); return; }
    if (price === undefined) { setError("Montant invalide."); return; }
    setBusy(true);
    try {
      await api(offer ? `/admin/service-offers/${offer.id}` : "/admin/service-offers", {
        method: offer ? "PATCH" : "POST",
        body: { sectorCode, name: form.name.trim(), description: form.description.trim() || null, category: form.category, price, priceUnit: form.priceUnit, basis: form.basis.trim() || null, isPublic: form.isPublic, isActive: form.isActive },
      });
      onDone();
    } catch (err) { setError(errorText(err)); setBusy(false); }
  };
  return (
    <Modal title={offer ? "Modifier la prestation" : "Nouvelle prestation"} onClose={onClose} width={620} footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={save}>Enregistrer</Btn></>}>
      <Row>
        <FormField label="Nom" basis={300}><input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={160} style={inputStyle} autoFocus /></FormField>
        <FormField label="Type" basis={170}>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} style={inputStyle}>{Object.entries(OFFER_CATEGORIES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
        </FormField>
      </Row>
      <FormField grow={false} label="Description"><input value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={400} style={inputStyle} /></FormField>
      <Row>
        <FormField label="Prix proposé (HT)" hint="Vide = sur devis."><input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} style={inputStyle} /></FormField>
        <FormField label="Unité de prix">
          <select value={form.priceUnit} onChange={(e) => set("priceUnit", e.target.value)} style={inputStyle}>{Object.entries(PRICE_UNITS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
        </FormField>
      </Row>
      <FormField grow={false} label="Base du calcul"><input value={form.basis} onChange={(e) => set("basis", e.target.value)} maxLength={300} style={inputStyle} /></FormField>
      <Check checked={form.isPublic} onChange={(v) => set("isPublic", v)} label="Publiée" hint="Tant qu’elle n’est pas publiée, la prestation reste un brouillon que vous seul voyez." />
      {error ? <InlineError>{error}</InlineError> : null}
    </Modal>
  );
}

// ───────────── Page ─────────────

export default function AdminSectorsPage() {
  const list = useLoad(() => api<Sector[]>("/admin/sectors"), []);
  const [code, setCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<Tab>("sector");
  const detail = useLoad(() => (code ? api<SectorDetail>(`/admin/sectors/${code}/detail`) : Promise.resolve(null)), [code]);
  const [notice, notify] = useNotice();
  const [categoryModal, setCategoryModal] = useState<SectorCategory | "new" | null>(null);
  const [itemModal, setItemModal] = useState<SectorItem | "new" | null>(null);
  const [offerModal, setOfferModal] = useState<ServiceOffer | "new" | null>(null);
  const [removing, setRemoving] = useState<{ path: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const sectors = useMemo(() => list.data || [], [list.data]);
  useEffect(() => { if (!code && !creating && sectors.length) setCode(sectors[0].code); }, [sectors, code, creating]);
  const selected = sectors.find((s) => s.code === code) || null;
  const d = detail.data;
  const categoryName = (id: number | null) => (id ? d?.categories.find((c) => c.id === id)?.name || "—" : "—");
  const refresh = (message: string) => { notify(message); detail.reload(); list.reload(); };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    setRemoveError(null);
    try {
      await api(removing.path, { method: "DELETE" });
      setRemoving(null);
      refresh("Supprimé.");
    } catch (err) { setRemoveError(errorText(err)); } finally { setBusy(false); }
  };

  return (
    <Page title="Secteurs et suggestions" subtitle="Les secteurs proposés à l’inscription, leurs modules et leurs exemples de produits et de prestations."
      actions={<Btn variant="primary" onClick={() => { setCreating(true); setCode(null); setTab("sector"); }}>Nouveau secteur</Btn>}>
      {notice}
      {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)", gap: 16, alignItems: "start" }} className="adm-sectors">
        <Card pad={false} title={`${sectors.length} secteurs`}>
          {list.loading && !sectors.length ? <Loading /> : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "70vh", overflowY: "auto" }}>
              {sectors.map((s) => (
                <button key={s.id} type="button" onClick={() => { setCreating(false); setCode(s.code); }} aria-current={s.code === code ? "true" : undefined}
                  style={{ textAlign: "start", padding: "10px 14px", border: "none", borderTop: "1px solid var(--theme-border)", cursor: "pointer", background: s.code === code ? "rgba(var(--theme-primary-rgb, 79, 70, 229), .1)" : "transparent", color: "var(--theme-text)" }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{s.name}</strong>
                    {s.isActive ? null : <Badge tone="gray">Désactivé</Badge>}
                  </span>
                  <span style={mutedStyle}>{plural((s.modules || []).length, "module", "modules")} · {plural(s.itemCount, "suggestion", "suggestions")}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div style={{ minWidth: 0 }}>
          {creating ? (
            <Card title="Nouveau secteur">
              <SectorEditor sector={null} nextOrder={(Math.max(0, ...sectors.map((s) => s.sortOrder)) || 0) + 10} notify={notify} onDeleted={() => undefined}
                onSaved={(saved) => { setCreating(false); setCode(saved.code); list.reload(); }} />
            </Card>
          ) : !selected ? <Card><Empty>Choisissez un secteur.</Empty></Card> : (
            <Card title={selected.name} right={<span style={{ ...mutedStyle, ...codeStyle }}>{selected.code}</span>}>
              <Tabs<Tab> value={tab} onChange={setTab} tabs={[["sector", "Secteur et modules"], ["categories", `Catégories (${d?.categories.length ?? "…"})`], ["items", `Suggestions (${d?.items.length ?? "…"})`], ["offers", `Prestations (${d?.serviceOffers.length ?? "…"})`]]} />
              {tab === "sector" ? (
                <SectorEditor sector={selected} nextOrder={0} notify={notify} onSaved={() => { list.reload(); detail.reload(); }} onDeleted={() => { setCode(null); list.reload(); }} />
              ) : detail.error ? <ErrorBox message={detail.error} onRetry={detail.reload} /> : !d ? <Loading /> : tab === "categories" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><Btn variant="primary" onClick={() => setCategoryModal("new")}>Ajouter une catégorie</Btn></div>
                  {d.categories.length === 0 ? <Empty>Aucune catégorie.</Empty> : (
                    <TableWrap min={0}>
                      <thead><tr><th style={th}>Catégorie</th><th style={th}>Description</th><th style={{ ...th, ...num }}>Suggestions</th><th style={th} /></tr></thead>
                      <tbody>
                        {d.categories.map((c) => (
                          <tr key={c.id}>
                            <td style={td}><strong>{c.name}</strong></td><td style={{ ...td, ...mutedStyle }}>{c.description || "—"}</td>
                            <td style={{ ...td, ...num }}>{d.items.filter((i) => i.categoryId === c.id).length}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}><span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><Btn onClick={() => setCategoryModal(c)}>Modifier</Btn><Btn variant="danger" onClick={() => { setRemoveError(null); setRemoving({ path: `/admin/sectors/${selected.id}/categories/${c.id}`, label: `la catégorie « ${c.name} »` }); }}>Supprimer</Btn></span></td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}
                </>
              ) : tab === "items" ? (
                <>
                  <Notice>{d.disclaimer}</Notice>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><Btn variant="primary" onClick={() => setItemModal("new")}>Ajouter une suggestion</Btn></div>
                  {d.items.length === 0 ? <Empty>Aucune suggestion.</Empty> : (
                    <TableWrap min={760}>
                      <thead><tr><th style={th}>Désignation</th><th style={th}>Catégorie</th><th style={th}>Unité</th><th style={{ ...th, ...num }}>Coût indicatif</th><th style={{ ...th, ...num }}>Prix indicatif</th><th style={th} /></tr></thead>
                      <tbody>
                        {d.items.map((item) => (
                          <tr key={item.id} style={item.isActive ? undefined : { opacity: 0.55 }}>
                            <td style={td}><strong>{item.name}</strong> <Badge tone={item.kind === "service" ? "blue" : "gray"}>{item.kind === "service" ? "Prestation" : "Produit"}</Badge>{item.isActive ? null : <> <Badge tone="gray">Masquée</Badge></>}{item.basis ? <div style={mutedStyle}>{item.basis}</div> : null}</td>
                            <td style={td}>{categoryName(item.categoryId)}</td><td style={td}>{item.unit}</td>
                            <td style={{ ...td, ...num }}>{item.purchasePrice === null ? "—" : formatMoney(item.purchasePrice, LANG)}</td>
                            <td style={{ ...td, ...num }}>{item.sellingPrice === null ? "—" : formatMoney(item.sellingPrice, LANG)}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}><span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><Btn onClick={() => setItemModal(item)}>Modifier</Btn><Btn variant="danger" onClick={() => { setRemoveError(null); setRemoving({ path: `/admin/sectors/${selected.id}/items/${item.id}`, label: `la suggestion « ${item.name} »` }); }}>Supprimer</Btn></span></td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}
                </>
              ) : (
                <>
                  <p style={{ ...helpStyle, marginBottom: 10 }}>Prestations d’accompagnement que vous proposez aux sociétés de ce secteur (mise en service, formation, reprise de données). Les prix proposés sont des brouillons tant que vous ne les publiez pas.</p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><Btn variant="primary" onClick={() => setOfferModal("new")}>Ajouter une prestation</Btn></div>
                  {d.serviceOffers.length === 0 ? <Empty>Aucune prestation.</Empty> : (
                    <TableWrap min={640}>
                      <thead><tr><th style={th}>Prestation</th><th style={th}>Type</th><th style={{ ...th, ...num }}>Prix proposé (HT)</th><th style={th}>État</th><th style={th} /></tr></thead>
                      <tbody>
                        {d.serviceOffers.map((offer) => (
                          <tr key={offer.id}>
                            <td style={td}><strong>{offer.name}</strong>{offer.description ? <div style={mutedStyle}>{offer.description}</div> : null}</td>
                            <td style={td}>{OFFER_CATEGORIES[offer.category] || offer.category}</td>
                            <td style={{ ...td, ...num }}>{offer.price === null ? "Sur devis" : `${formatMoney(offer.price, LANG)} ${PRICE_UNITS[offer.priceUnit] || ""}`}</td>
                            <td style={td}><Badge tone={offer.isPublic ? "green" : "amber"}>{offer.isPublic ? "Publiée" : "Brouillon"}</Badge></td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}><span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><Btn onClick={() => setOfferModal(offer)}>Modifier</Btn><Btn variant="danger" onClick={() => { setRemoveError(null); setRemoving({ path: `/admin/service-offers/${offer.id}`, label: `la prestation « ${offer.name} »` }); }}>Supprimer</Btn></span></td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      {categoryModal && selected ? <CategoryModal sectorId={selected.id} category={categoryModal === "new" ? null : categoryModal} onClose={() => setCategoryModal(null)} onDone={() => { setCategoryModal(null); refresh("Catégorie enregistrée."); }} /> : null}
      {itemModal && selected && d ? <ItemModal sectorId={selected.id} item={itemModal === "new" ? null : itemModal} categories={d.categories} onClose={() => setItemModal(null)} onDone={() => { setItemModal(null); refresh("Suggestion enregistrée."); }} /> : null}
      {offerModal && selected ? <OfferModal sectorCode={selected.code} offer={offerModal === "new" ? null : offerModal} onClose={() => setOfferModal(null)} onDone={() => { setOfferModal(null); refresh("Prestation enregistrée."); }} /> : null}
      {removing ? (
        <ConfirmModal title="Confirmer la suppression" confirmLabel="Supprimer" variant="danger" busy={busy} error={removeError} onCancel={() => setRemoving(null)} onConfirm={remove}>
          <p style={{ margin: 0, fontSize: 14 }}>Supprimer {removing.label} ? Les produits déjà copiés par les clients ne sont pas touchés.</p>
        </ConfirmModal>
      ) : null}
      <style>{`@media (max-width: 860px) { .adm-sectors { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </Page>
  );
}
