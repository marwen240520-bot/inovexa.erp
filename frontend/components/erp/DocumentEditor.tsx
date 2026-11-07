"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, addDaysISO, Btn, Card, Field, Row, inputStyle, money, moneyDT, num, td, th, TableWrap, todayISO, useLoad, Notice } from "./kit";

export interface DocMetaType {
  type: string;
  label: string;
  plural: string;
  party: "client" | "supplier";
  settles: boolean;
  stamp: boolean;
  isCredit: boolean;
}

interface EditorLine {
  key: number;
  productId: number | "";
  description: string;
  quantity: string;
  unitPriceHT: string;
  discountPct: string;
  vatRate: string;
}

const emptyLine = (key: number): EditorLine => ({ key, productId: "", description: "", quantity: "1", unitPriceHT: "", discountPct: "", vatRate: "" });
const numOrUndef = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? undefined : Number(s));

/**
 * Éditeur de brouillon (création ou modification) pour les 8 types de documents.
 * Les montants affichés sont indicatifs : le calcul définitif (arrondis, timbre, retenue) est fait par le serveur à l'enregistrement.
 */
export default function DocumentEditor({ type, initial, onNotify }: { type: string; initial?: any; onNotify: (msg: string, tone?: "ok" | "err") => void }) {
  const router = useRouter();
  const meta = useLoad(() => api<{ types: DocMetaType[]; vatRates: number[] }>("/documents/meta"), []);
  const docMeta = meta.data?.types.find((t) => t.type === type);
  const partyKind = docMeta?.party || (["purchase_order", "goods_receipt", "supplier_invoice", "supplier_credit_note"].includes(type) ? "supplier" : "client");
  const vatRates = meta.data?.vatRates || [0, 7, 13, 19];

  const parties = useLoad(() => api<any[]>(partyKind === "client" ? "/clients" : "/suppliers"), [partyKind]);
  const products = useLoad(() => api<any[]>("/products"), []);

  const [partyId, setPartyId] = useState<number | "">(initial?.partyId ?? "");
  const [partyName, setPartyName] = useState<string>(initial?.partyId ? "" : initial?.partyName ?? "");
  const [issueDate, setIssueDate] = useState<string>(initial?.issueDate ? String(initial.issueDate).slice(0, 10) : todayISO());
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ? String(initial.dueDate).slice(0, 10) : "");
  const [validUntil, setValidUntil] = useState<string>(initial?.validUntil ? String(initial.validUntil).slice(0, 10) : type === "quote" ? addDaysISO(30) : "");
  const [externalRef, setExternalRef] = useState<string>(initial?.externalRef ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [globalDiscountPct, setGlobalDiscountPct] = useState<string>(initial?.globalDiscountPct ? String(initial.globalDiscountPct) : "");
  const [applyStamp, setApplyStamp] = useState<"auto" | "yes" | "no">("auto");
  const [seq, setSeq] = useState(1);
  const [lines, setLines] = useState<EditorLine[]>(() =>
    initial?.lines?.length
      ? initial.lines.map((l: any, i: number) => ({
          key: i + 1, productId: l.productId ?? "", description: l.description ?? "", quantity: String(l.quantity), unitPriceHT: String(l.unitPriceHT),
          discountPct: l.discountPct ? String(l.discountPct) : "", vatRate: String(l.vatRate),
        }))
      : [emptyLine(0)],
  );
  const [saving, setSaving] = useState(false);

  const setLine = (key: number, patch: Partial<EditorLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const pickProduct = (key: number, id: string) => {
    if (!id) return setLine(key, { productId: "" });
    const p = products.data?.find((x) => String(x.id) === id);
    setLine(key, { productId: Number(id), description: p?.name ?? "", unitPriceHT: partyKind === "client" ? String(p?.price ?? "") : "", vatRate: p?.vatRate !== undefined ? String(p.vatRate) : "" });
  };

  const preview = useMemo(() => {
    const g = Number(globalDiscountPct) || 0;
    let ht = 0;
    const byRate = new Map<number, number>();
    for (const l of lines) {
      const q = Number(l.quantity) || 0;
      const price = Number(l.unitPriceHT) || 0;
      const d = Number(l.discountPct) || 0;
      const net = q * price * (1 - d / 100) * (1 - g / 100);
      const rate = l.vatRate === "" ? 19 : Number(l.vatRate);
      ht += net;
      byRate.set(rate, (byRate.get(rate) || 0) + net);
    }
    let vat = 0;
    byRate.forEach((base, rate) => { vat += (base * rate) / 100; });
    return { ht, vat, ttc: ht + vat };
  }, [lines, globalDiscountPct]);

  const save = async () => {
    const body: any = {
      partyId: partyId === "" ? undefined : Number(partyId),
      partyName: partyId === "" ? partyName.trim() || undefined : undefined,
      issueDate, dueDate: dueDate || undefined, validUntil: type === "quote" ? validUntil || undefined : undefined,
      externalRef: externalRef.trim() || undefined, notes: notes.trim() || undefined,
      globalDiscountPct: numOrUndef(globalDiscountPct) ?? 0,
      applyStamp: applyStamp === "auto" ? undefined : applyStamp === "yes",
      lines: lines
        .filter((l) => l.productId !== "" || l.description.trim() !== "")
        .map((l) => ({
          productId: l.productId === "" ? undefined : l.productId,
          description: l.description.trim() || undefined,
          quantity: Number(l.quantity),
          unitPriceHT: numOrUndef(l.unitPriceHT),
          discountPct: numOrUndef(l.discountPct),
          vatRate: numOrUndef(l.vatRate),
        })),
    };
    if (!body.lines.length) return onNotify("Ajoutez au moins une ligne.", "err");
    if (partyId === "" && !body.partyName) return onNotify(partyKind === "client" ? "Choisissez un client ou saisissez un nom." : "Choisissez un fournisseur.", "err");
    setSaving(true);
    try {
      const saved = initial?.id
        ? await api(`/documents/${initial.id}`, { method: "PUT", body })
        : await api("/documents", { method: "POST", body: { ...body, type } });
      onNotify("Brouillon enregistré.");
      router.push(`/dashboard/documents/${saved.id}`);
    } catch (e: any) {
      onNotify(e.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const partyLabel = partyKind === "client" ? "Client" : "Fournisseur";
  return (
    <>
      <Card title="Informations">
        <Row>
          <Field label={partyLabel} grow>
            <select style={inputStyle} value={partyId} onChange={(e) => setPartyId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">{partyKind === "client" ? "— Client de passage (saisie libre) —" : "— Choisir —"}</option>
              {(parties.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {partyId === "" && partyKind === "client" && (
            <Field label="Nom du client" grow><input style={inputStyle} value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Raison sociale" /></Field>
          )}
          <Field label="Date"><input type="date" style={inputStyle} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field>
          {docMeta?.settles && <Field label="Échéance" hint="Vide = délai du client"><input type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>}
          {type === "quote" && <Field label="Valable jusqu’au"><input type="date" style={inputStyle} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>}
          <Field label={partyKind === "client" ? "N° bon de commande client" : "N° facture du fournisseur"} grow><input style={inputStyle} value={externalRef} onChange={(e) => setExternalRef(e.target.value)} /></Field>
        </Row>
      </Card>

      <Card title="Lignes" pad={false}>
        <TableWrap>
          <thead>
            <tr>
              <th style={{ ...th, minWidth: 190 }}>Produit</th><th style={{ ...th, minWidth: 180 }}>Désignation</th>
              <th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>Prix HT</th><th style={{ ...th, ...num }}>Remise %</th><th style={{ ...th, ...num }}>TVA %</th><th style={th} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key}>
                <td style={td}>
                  <select aria-label="Produit" style={inputStyle} value={l.productId} onChange={(e) => pickProduct(l.key, e.target.value)}>
                    <option value="">— Libre —</option>
                    {(products.data || []).map((p) => <option key={p.id} value={p.id}>{p.sku ? `${p.sku} · ` : ""}{p.name}</option>)}
                  </select>
                </td>
                <td style={td}><input aria-label="Désignation" style={inputStyle} value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} /></td>
                <td style={{ ...td, width: 90 }}><input aria-label="Quantité" inputMode="decimal" style={{ ...inputStyle, ...num }} value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} /></td>
                <td style={{ ...td, width: 120 }}><input aria-label="Prix unitaire HT" inputMode="decimal" style={{ ...inputStyle, ...num }} value={l.unitPriceHT} placeholder="catalogue" onChange={(e) => setLine(l.key, { unitPriceHT: e.target.value })} /></td>
                <td style={{ ...td, width: 90 }}><input aria-label="Remise" inputMode="decimal" style={{ ...inputStyle, ...num }} value={l.discountPct} onChange={(e) => setLine(l.key, { discountPct: e.target.value })} /></td>
                <td style={{ ...td, width: 110 }}>
                  <select aria-label="TVA" style={inputStyle} value={l.vatRate} onChange={(e) => setLine(l.key, { vatRate: e.target.value })}>
                    <option value="">auto</option>
                    {vatRates.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={td}><Btn aria-label="Supprimer la ligne" variant="danger" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>×</Btn></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <div style={{ padding: 12 }}><Btn onClick={() => { setLines((ls) => [...ls, emptyLine(seq)]); setSeq(seq + 1); }}>+ Ajouter une ligne</Btn></div>
      </Card>

      <Card title="Totaux et options">
        <Row gap={24}>
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Remise globale %"><input inputMode="decimal" style={{ ...inputStyle, maxWidth: 140 }} value={globalDiscountPct} onChange={(e) => setGlobalDiscountPct(e.target.value)} /></Field>
            {docMeta?.stamp && (
              <Field label="Droit de timbre">
                <select style={{ ...inputStyle, maxWidth: 260 }} value={applyStamp} onChange={(e) => setApplyStamp(e.target.value as any)}>
                  <option value="auto">Selon les réglages de la société</option><option value="yes">Appliquer</option><option value="no">Ne pas appliquer</option>
                </select>
              </Field>
            )}
            <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
          <div style={{ flex: "0 1 300px", minWidth: 240, fontVariantNumeric: "tabular-nums" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Total HT</span><strong>{money(preview.ht)}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>TVA</span><strong>{money(preview.vat)}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--theme-border)", fontSize: 18 }}><span>Total TTC</span><strong>{moneyDT(preview.ttc)}</strong></div>
            <Notice tone="blue">Montants indicatifs. Timbre, retenue à la source et arrondis sont calculés par le serveur à l’enregistrement.</Notice>
          </div>
        </Row>
      </Card>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={() => router.back()}>Annuler</Btn>
        <Btn variant="primary" busy={saving} onClick={save}>Enregistrer le brouillon</Btn>
      </div>
    </>
  );
}
