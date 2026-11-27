"use client";
// components/account/ModulesCard.tsx
// « Mon activité et mes modules » : le client choisit lui-même son secteur et les modules affichés dans son ERP,
// dans la limite de ce que sa formule inclut (pendant l'essai, tout est ouvert). Aucune intervention de l'administrateur.
// C'est le serveur qui ouvre ou ferme réellement chaque module ; ici on ne fait qu'enregistrer le choix.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/erp/kit";
import { useLanguage } from "@/contexts/LanguageContext";
import { MODULE_GROUPS, MODULE_INFO, pick, type CatalogModule } from "@/lib/catalog";
import { ModuleIcon, MODULE_ICON_PATHS, type ModuleIconKey } from "@/components/site/ModuleIcon";
import { fill } from "@/lib/saasTexts";
import { sectorName, type ModulesView } from "@/lib/saas";
import { useOnlineTexts } from "@/lib/onlineTexts";
import { moduleLabel } from "@/lib/sectorLabels";
import { applyModulesChange } from "@/lib/session";

const ico = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IconLock = () => <svg {...ico}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

/** Configuration de modules telle que la barre latérale la lit : chaque module à vrai ou faux, les modules de base à vrai. */
const toMap = (view: ModulesView): Record<string, boolean> => {
  const map: Record<string, boolean> = { dashboard: true, profile: true, settings: true };
  for (const m of view.modules) map[m.key] = m.enabled;
  return map;
};

export default function ModulesCard({ canManage, notify, errorText }: {
  canManage: boolean;
  notify: (text: string, tone?: "ok" | "err") => void;
  errorText: (error: unknown) => string;
}) {
  const o = useOnlineTexts();
  const m = o.modules;
  const { language } = useLanguage();
  const [view, setView] = useState<ModulesView | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sector, setSector] = useState("");
  const [busy, setBusy] = useState<"modules" | "sector" | null>(null);
  const alive = useRef(true);

  /** Reprend l'état renvoyé par le serveur. */
  const adopt = useCallback((next: ModulesView) => {
    setView(next);
    setSelected(new Set(next.modules.filter((x) => x.enabled).map((x) => x.key)));
    setSector(next.sector || "");
  }, []);

  useEffect(() => {
    alive.current = true;
    api<ModulesView>("/billing/modules")
      .then((data) => { if (alive.current) adopt(data); })
      .catch(() => { if (alive.current) setFailed(true); });
    return () => { alive.current = false; };
  }, [adopt]);

  const byKey = useMemo(() => new Map((view?.modules || []).map((x) => [x.key, x])), [view]);
  const dirty = useMemo(() => !!view && view.modules.some((x) => x.enabled !== selected.has(x.key)), [view, selected]);
  const sectorChanged = !!view && sector !== (view.sector || "");

  if (failed || !view) return null;

  const labelOf = (key: string) =>
    key === "appointments" || key === "projects" ? moduleLabel(key, sector || view.sector, language) : MODULE_INFO[key as CatalogModule] ? pick(MODULE_INFO[key as CatalogModule].label, language) : key;
  const descOf = (key: string) => (MODULE_INFO[key as CatalogModule] ? pick(MODULE_INFO[key as CatalogModule].desc, language) : "");

  const toggle = (key: string) => {
    const info = byKey.get(key);
    if (!info?.included || !canManage) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const useRecommended = () => setSelected(new Set(view.modules.filter((x) => x.recommended && x.included).map((x) => x.key)));

  const saveModules = async () => {
    if (busy || !canManage) return;
    setBusy("modules");
    try {
      const next = await api<ModulesView>("/billing/modules", { method: "PUT", body: { modules: Array.from(selected) } });
      if (!alive.current) return;
      adopt(next);
      applyModulesChange(toMap(next), next.sector);
      notify(m.saved);
    } catch (e) {
      notify(errorText(e), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const saveSector = async (applyModules: boolean) => {
    if (busy || !canManage || !sector) return;
    setBusy("sector");
    try {
      const next = await api<ModulesView>("/billing/sector", { method: "PUT", body: { sector, applyModules } });
      if (!alive.current) return;
      adopt(next);
      applyModulesChange(toMap(next), next.sector);
      notify(m.sectorSaved);
    } catch (e) {
      notify(errorText(e), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  // Regroupés comme dans la barre latérale ; un module inconnu du catalogue reste affiché, à la fin.
  const grouped = MODULE_GROUPS.map((g) => ({ id: g.id, label: pick(g.label, language), keys: g.modules.filter((k) => byKey.has(k)) })).filter((g) => g.keys.length);
  const placed = new Set(grouped.flatMap((g) => g.keys as string[]));
  const others = view.modules.map((x) => x.key).filter((k) => !placed.has(k));

  const renderModule = (key: string) => {
    const info = byKey.get(key)!;
    const on = selected.has(key) && info.included;
    return (
      <label key={key} className={"sub-mod" + (on ? " is-on" : "") + (info.included ? "" : " is-locked")}>
        <input type="checkbox" checked={on} disabled={!info.included || !canManage || busy !== null} onChange={() => toggle(key)} />
        {key in MODULE_ICON_PATHS ? (
          <span className="sub-mod-ico" aria-hidden="true"><ModuleIcon name={key as ModuleIconKey} size={20} /></span>
        ) : null}
        <span className="sub-mod-body">
          <span className="sub-mod-name">
            {labelOf(key)}
            {info.recommended ? <span className="sub-chip">{m.recommended}</span> : null}
            {info.included ? null : <span className="sub-chip sub-chip-lock"><IconLock />{m.locked}</span>}
          </span>
          <span className="sub-mod-desc">{descOf(key)}</span>
        </span>
      </label>
    );
  };

  return (
    <section className="sub-card" id="modules">
      <div className="sub-card-head">
        <h2>{m.title}</h2>
        <span className="sub-muted">{fill(m.count, { n: selected.size })}</span>
      </div>
      <p className="sub-muted" style={{ marginBottom: 14 }}>{m.intro}</p>
      {!canManage ? <p className="sub-empty" style={{ marginBottom: 14 }}>{m.ownerOnly}</p> : null}

      <div className="sub-sector">
        <div className="sub-field">
          <label htmlFor="sub-sector">{m.sector}</label>
          <select id="sub-sector" value={sector} onChange={(e) => setSector(e.target.value)} disabled={!canManage || busy !== null}>
            {view.sector ? null : <option value="">—</option>}
            {view.sectors.map((s) => <option key={s.code} value={s.code}>{sectorName(s, language)}</option>)}
          </select>
          <p className="sub-field-hint">{m.sectorHint}</p>
        </div>
        {sectorChanged && canManage ? (
          <div className="sub-sector-actions">
            <button type="button" className="sub-btn sub-btn-primary" onClick={() => void saveSector(true)} disabled={busy !== null} aria-busy={busy === "sector"}>{m.applySector}</button>
            <button type="button" className="sub-btn sub-btn-ghost" onClick={() => void saveSector(false)} disabled={busy !== null}>{m.keepModules}</button>
          </div>
        ) : null}
      </div>

      {view.trial || !view.plan ? <p className="sub-tip" style={{ marginBottom: 14 }}>{m.trialAll}</p>
        : view.plan.allModules ? null : <p className="sub-tip" style={{ marginBottom: 14 }}>{fill(m.planLimit, { plan: view.plan.name })}</p>}

      {grouped.map((g) => (
        <fieldset key={g.id} className="sub-mod-group">
          <legend>{g.label}</legend>
          <div className="sub-mod-grid">{g.keys.map((k) => renderModule(k))}</div>
        </fieldset>
      ))}
      {others.length ? <div className="sub-mod-grid" style={{ marginBottom: 14 }}>{others.map((k) => renderModule(k))}</div> : null}

      {canManage ? (
        <div className="sub-mod-actions">
          <button type="button" className="sub-btn sub-btn-primary" onClick={() => void saveModules()} disabled={!dirty || busy !== null} aria-busy={busy === "modules"}>{m.save}</button>
          <button type="button" className="sub-btn sub-btn-ghost" onClick={useRecommended} disabled={busy !== null}>{m.useRecommended}</button>
          {dirty ? <span className="sub-muted" role="status">{m.unsaved}</span> : null}
        </div>
      ) : null}
      <p className="sub-muted sub-small" style={{ marginTop: 10 }}>{m.always}</p>
    </section>
  );
}
