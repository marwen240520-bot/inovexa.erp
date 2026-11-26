"use client";
/**
 * Projets, chantiers et missions.
 * Chaque projet a un client, des dates, un budget et un coût réel, et ses tâches : l'avancement se calcule tout seul
 * (tâches terminées / total) dès que le projet a des tâches. Le vocabulaire suit le secteur de la société
 * (« Chantiers » dans le bâtiment) — voir lib/sectorLabels.ts.
 */
import React, { FormEvent, useEffect, useState } from "react";
import { api, Badge, Btn, Card, Empty, ErrorBox, fmtDate, inputStyle, Loading, Modal, moneyDT, Page, Row, Stat, TableWrap, num, td, th, todayISO, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";
import { projectWords } from "@/lib/sectorLabels";
import { MODULES_CHANGED_EVENT, getStoredUser } from "@/lib/session";

interface Task { id: number; title: string; assignee: string | null; dueDate: string | null; status: "todo" | "doing" | "done" | string }
interface Project {
  id: number; name: string; code: string | null; department: string | null; clientId: number | null; clientName: string | null; description: string | null; location: string | null;
  manager: string | null; startDate: string | null; endDate: string | null; budget: number | string; cost: number | string; status: string; progress: number; priority: string | null;
  tasksTotal: number; tasksDone: number; tasksLate: number; tasks?: Task[];
}
interface ClientRef { id: number; name: string }

const STATUS: Record<string, [string, "gray" | "blue" | "green" | "red" | "amber"]> = {
  planned: ["Planifié", "gray"], active: ["En cours", "blue"], on_hold: ["En pause", "amber"], done: ["Terminé", "green"], cancelled: ["Annulé", "red"],
};
const PRIORITY: Record<string, string> = { low: "Basse", normal: "Normale", high: "Haute" };
const TASK_STATUS: Record<string, [string, "gray" | "blue" | "green"]> = { todo: ["À faire", "gray"], doing: ["En cours", "blue"], done: ["Terminée", "green"] };
const OPEN = ["planned", "active", "on_hold"];
const n = (v: unknown) => Number(v) || 0;
const isLate = (p: Project) => OPEN.includes(p.status) && !!p.endDate && p.endDate < todayISO();
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" };
const field = (flex: string): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: 4, flex, minWidth: 0 });
const alertBox: React.CSSProperties = { padding: "9px 12px", borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 13.5 };

function ProgressBar({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ height: 8, borderRadius: 999, background: "var(--theme-surface-hover)", overflow: "hidden" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ height: "100%", width: `${percent}%`, borderRadius: 999, background: percent >= 100 ? "var(--theme-success, #10b981)" : "var(--theme-primary, #4f46e5)" }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 3 }}>{percent} %</div>
    </div>
  );
}

interface Form { name: string; code: string; clientId: string; clientName: string; manager: string; location: string; startDate: string; endDate: string; budget: string; cost: string; status: string; priority: string; progress: string; description: string }
const formOf = (p: Project | null): Form => ({
  name: p?.name || "", code: p?.code || "", clientId: p?.clientId ? String(p.clientId) : "", clientName: p?.clientName || "", manager: p?.manager || "", location: p?.location || "",
  startDate: p?.startDate || "", endDate: p?.endDate || "", budget: p && n(p.budget) ? String(n(p.budget)).replace(".", ",") : "", cost: p && n(p.cost) ? String(n(p.cost)).replace(".", ",") : "",
  status: p?.status || "active", priority: p?.priority || "normal", progress: p ? String(p.progress || 0) : "0", description: p?.description || "",
});

function ProjectModal({ project, clients, sector, onClose, onDone }: { project: Project | null; clients: ClientRef[]; sector: string | null; onClose: () => void; onDone: (message: string) => void }) {
  const words = projectWords(sector);
  const [form, setForm] = useState<Form>(formOf(project));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const hasTasks = !!project && project.tasksTotal > 0;

  const save = async (e: FormEvent | null) => {
    e?.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) { setError(`Indiquez le nom du ${words.one.fr}.`); return; }
    const budget = form.budget.trim() ? Number(form.budget.replace(/\s/g, "").replace(",", ".")) : 0;
    const cost = form.cost.trim() ? Number(form.cost.replace(/\s/g, "").replace(",", ".")) : 0;
    if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(cost) || cost < 0) { setError("Budget ou coût invalide."); return; }
    if (form.startDate && form.endDate && form.endDate < form.startDate) { setError("La date de fin doit être après la date de début."); return; }
    const progress = Number(form.progress);
    if (!hasTasks && (!Number.isFinite(progress) || progress < 0 || progress > 100)) { setError("Avancement : un pourcentage entre 0 et 100."); return; }
    setBusy(true);
    setError(null);
    const client = clients.find((c) => String(c.id) === form.clientId);
    const body: Record<string, unknown> = {
      name: form.name.trim(), code: form.code.trim() || null, clientId: form.clientId ? Number(form.clientId) : null, clientName: form.clientName.trim() || client?.name || null,
      manager: form.manager.trim() || null, location: form.location.trim() || null, startDate: form.startDate || null, endDate: form.endDate || null,
      budget, cost, status: form.status, priority: form.priority, description: form.description.trim() || null,
    };
    if (!hasTasks) body.progress = Math.round(progress);
    try {
      if (project) await api(`/projects/${project.id}`, { method: "PUT", body });
      else await api("/projects", { method: "POST", body });
      onDone(project ? "Modifications enregistrées." : `${words.one.fr.charAt(0).toUpperCase()}${words.one.fr.slice(1)} créé.`);
    } catch (err: any) {
      setError(err?.message || "L’enregistrement a échoué.");
      setBusy(false);
    }
  };

  return (
    <Modal title={project ? project.name : `Nouveau ${words.one.fr}`} onClose={() => { if (!busy) onClose(); }} width={680}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={() => save(null)}>Enregistrer</Btn></>}>
      <form onSubmit={(e) => save(e)} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <Row>
          <label style={field("3 1 280px")}><span style={label}>Nom</span><input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={160} style={inputStyle} autoFocus /></label>
          <label style={field("1 1 140px")}><span style={label}>Référence</span><input value={form.code} onChange={(e) => set("code", e.target.value)} maxLength={40} style={inputStyle} placeholder="CH-2026-001" /></label>
        </Row>
        <Row>
          <label style={field("1 1 220px")}>
            <span style={label}>Client enregistré</span>
            <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} style={inputStyle}>
              <option value="">— Aucune fiche (saisie libre) —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {form.clientId ? null : <label style={field("1 1 200px")}><span style={label}>Nom du client</span><input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} maxLength={160} style={inputStyle} /></label>}
          <label style={field("1 1 180px")}><span style={label}>Responsable</span><input value={form.manager} onChange={(e) => set("manager", e.target.value)} maxLength={120} style={inputStyle} /></label>
        </Row>
        <label style={field("1 1 auto")}><span style={label}>{words.location.fr}</span><input value={form.location} onChange={(e) => set("location", e.target.value)} maxLength={200} style={inputStyle} /></label>
        <Row>
          <label style={field("1 1 150px")}><span style={label}>Début</span><input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} style={inputStyle} /></label>
          <label style={field("1 1 150px")}><span style={label}>Fin prévue</span><input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} style={inputStyle} /></label>
          <label style={field("1 1 140px")}><span style={label}>État</span><select value={form.status} onChange={(e) => set("status", e.target.value)} style={inputStyle}>{Object.entries(STATUS).map(([code, [text]]) => <option key={code} value={code}>{text}</option>)}</select></label>
          <label style={field("1 1 120px")}><span style={label}>Priorité</span><select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={inputStyle}>{Object.entries(PRIORITY).map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select></label>
        </Row>
        <Row>
          <label style={field("1 1 160px")}><span style={label}>Budget (DT)</span><input inputMode="decimal" value={form.budget} onChange={(e) => set("budget", e.target.value)} style={inputStyle} /></label>
          <label style={field("1 1 160px")}><span style={label}>Coût réel à ce jour (DT)</span><input inputMode="decimal" value={form.cost} onChange={(e) => set("cost", e.target.value)} style={inputStyle} /></label>
          <label style={field("1 1 140px")}>
            <span style={label}>Avancement (%)</span>
            <input type="number" min={0} max={100} step={5} value={hasTasks ? String(project!.progress) : form.progress} onChange={(e) => set("progress", e.target.value)} style={inputStyle} disabled={hasTasks} />
          </label>
        </Row>
        {hasTasks ? <p style={{ margin: 0, fontSize: 12.5, color: "var(--theme-text-secondary)" }}>L’avancement est calculé à partir des tâches ({project!.tasksDone} terminée{project!.tasksDone > 1 ? "s" : ""} sur {project!.tasksTotal}).</p> : null}
        <label style={field("1 1 auto")}><span style={label}>Description</span><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={4000} style={{ ...inputStyle, resize: "vertical" }} /></label>
        {error ? <div role="alert" style={alertBox}>{error}</div> : null}
      </form>
    </Modal>
  );
}

/** Fiche d'un projet : ses chiffres et ses tâches (ajout, avancement, suppression). */
function TasksModal({ projectId, onClose, onChanged }: { projectId: number; onClose: () => void; onChanged: () => void }) {
  const { data: project, error, loading, setData } = useLoad(() => api<Project>(`/projects/${projectId}`), [projectId]);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const run = async (key: string, call: () => Promise<Project>) => {
    if (busy) return;
    setBusy(key);
    setFailure(null);
    try { setData(await call()); onChanged(); } catch (err: any) { setFailure(err?.message || "L’action a échoué."); } finally { setBusy(null); }
  };
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void run("add", async () => {
      const next = await api<Project>(`/projects/${projectId}/tasks`, { method: "POST", body: { title: title.trim(), assignee: assignee.trim() || null, dueDate: dueDate || null } });
      setTitle(""); setAssignee(""); setDueDate("");
      return next;
    });
  };
  const nextStatus = (s: string) => (s === "todo" ? "doing" : s === "doing" ? "done" : "todo");
  const tasks = project?.tasks || [];
  const today = todayISO();

  return (
    <Modal title={project ? project.name : "Projet"} onClose={onClose} width={720} footer={<Btn variant="primary" onClick={onClose}>Fermer</Btn>}>
      {error ? <div role="alert" style={alertBox}>{error}</div> : null}
      {!project ? (loading ? <Loading /> : null) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Stat label="Avancement" value={`${project.progress} %`} sub={`${project.tasksDone} / ${project.tasksTotal} tâche${project.tasksTotal > 1 ? "s" : ""}`} />
            <Stat label="Budget" value={moneyDT(project.budget)} />
            <Stat label="Coût réel" value={moneyDT(project.cost)} tone={n(project.budget) > 0 && n(project.cost) > n(project.budget) ? "bad" : undefined} sub={n(project.budget) > 0 ? `Reste ${moneyDT(n(project.budget) - n(project.cost))}` : undefined} />
          </div>
          {project.description ? <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{project.description}</p> : null}

          <form onSubmit={add} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
            <label style={field("3 1 220px")}><span style={label}>Nouvelle tâche</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} style={inputStyle} placeholder="Ex. Couler la dalle, livrer la maquette…" /></label>
            <label style={field("1 1 140px")}><span style={label}>Confiée à</span><input value={assignee} onChange={(e) => setAssignee(e.target.value)} maxLength={120} style={inputStyle} /></label>
            <label style={field("1 1 140px")}><span style={label}>Échéance</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} /></label>
            <Btn variant="primary" type="submit" busy={busy === "add"} disabled={!title.trim()}>Ajouter</Btn>
          </form>
          {failure ? <div role="alert" style={alertBox}>{failure}</div> : null}

          {tasks.length === 0 ? <Empty>Aucune tâche. Ajoutez les étapes du projet : l’avancement se calculera tout seul.</Empty> : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid var(--theme-border)", borderRadius: 10, overflow: "hidden" }}>
              {tasks.map((t, i) => {
                const [text, tone] = TASK_STATUS[t.status] || [t.status, "gray" as const];
                const late = t.status !== "done" && !!t.dueDate && t.dueDate < today;
                return (
                  <li key={t.id} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px 12px", borderTop: i ? "1px solid var(--theme-border)" : undefined }}>
                    <input type="checkbox" checked={t.status === "done"} disabled={busy !== null} aria-label={`Terminer « ${t.title} »`}
                      onChange={() => void run(`t${t.id}`, () => api<Project>(`/projects/${projectId}/tasks/${t.id}`, { method: "PATCH", body: { status: t.status === "done" ? "todo" : "done" } }))}
                      style={{ width: 18, height: 18, accentColor: "var(--theme-primary, #4f46e5)", cursor: "pointer" }} />
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, textDecoration: t.status === "done" ? "line-through" : undefined, opacity: t.status === "done" ? 0.65 : 1 }}>{t.title}</div>
                      <div style={{ fontSize: 12.5, color: late ? "var(--theme-danger, #ef4444)" : "var(--theme-text-secondary)" }}>
                        {[t.assignee, t.dueDate ? `${late ? "En retard — " : ""}échéance ${fmtDate(t.dueDate)}` : null].filter(Boolean).join(" · ") || "Sans échéance"}
                      </div>
                    </div>
                    <button type="button" disabled={busy !== null} title="Changer l’état"
                      onClick={() => void run(`t${t.id}`, () => api<Project>(`/projects/${projectId}/tasks/${t.id}`, { method: "PATCH", body: { status: nextStatus(t.status) } }))}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      <Badge tone={tone}>{text}</Badge>
                    </button>
                    <Btn variant="danger" disabled={busy !== null} aria-label={`Supprimer « ${t.title} »`} style={{ padding: "4px 10px" }}
                      onClick={() => void run(`t${t.id}`, () => api<Project>(`/projects/${projectId}/tasks/${t.id}`, { method: "DELETE" }))}>×</Btn>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}

export default function ProjectsPage() {
  useRequireAuth();
  const [sector, setSector] = useState<string | null>(null);
  useEffect(() => {
    setSector(getStoredUser()?.sector ?? null);
    const onChange = (event: Event) => { const d = (event as CustomEvent<{ sector?: string | null }>).detail; if (d && d.sector !== undefined) setSector(d.sector ?? null); };
    window.addEventListener(MODULES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MODULES_CHANGED_EVENT, onChange);
  }, []);
  const words = projectWords(sector);

  const { data, error, loading, reload } = useLoad(() => Promise.all([api<Project[]>("/projects"), api<ClientRef[]>("/clients").catch(() => [] as ClientRef[])]), []);
  const [notice, notify] = useNotice();
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const [removing, setRemoving] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  const projects: Project[] = data?.[0] ?? [];
  const clients: ClientRef[] = data?.[1] ?? [];
  const q = search.trim().toLowerCase();
  const shown = projects.filter((p) =>
    (filter === "all" ? true : filter === "open" ? OPEN.includes(p.status) : filter === "late" ? isLate(p) : p.status === filter) &&
    (!q || [p.name, p.code, p.clientName, p.manager, p.location].some((v) => (v || "").toLowerCase().includes(q))));
  const open = projects.filter((p) => OPEN.includes(p.status));
  const done = (message: string) => { setEditing(null); notify(message); reload(); };

  const remove = async () => {
    if (!removing || busy) return;
    setBusy(true);
    try { await api(`/projects/${removing.id}`, { method: "DELETE" }); setRemoving(null); notify("Supprimé."); reload(); } catch (err: any) { notify(err?.message || "La suppression a échoué.", "err"); } finally { setBusy(false); }
  };
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "1px solid var(--theme-border)",
    background: active ? "var(--theme-primary, #4f46e5)" : "var(--theme-surface)", color: active ? "#fff" : "var(--theme-text)",
  });

  return (
    <Page title={words.title.fr} subtitle="Budget, coût réel, tâches et avancement : chaque projet se suit au même endroit."
      actions={<Btn variant="primary" onClick={() => setEditing("new")}>Nouveau {words.one.fr}</Btn>}>
      {notice}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Stat label="En cours" value={open.length} />
        <Stat label="En retard" value={open.filter(isLate).length} tone={open.some(isLate) ? "bad" : undefined} sub="date de fin dépassée" />
        <Stat label="Budget des projets en cours" value={moneyDT(open.reduce((sum, p) => sum + n(p.budget), 0))} />
        <Stat label="Coût réel engagé" value={moneyDT(open.reduce((sum, p) => sum + n(p.cost), 0))} />
        <Stat label="Tâches en retard" value={projects.reduce((sum, p) => sum + (p.tasksLate || 0), 0)} tone={projects.some((p) => p.tasksLate > 0) ? "bad" : undefined} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[["open", "En cours"], ["late", "En retard"], ["done", "Terminés"], ["cancelled", "Annulés"], ["all", "Tous"]].map(([value, text]) => (
            <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} style={chip(filter === value)}>{text}</button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, client, responsable…)" style={{ ...inputStyle, flex: "1 1 240px", width: "auto" }} aria-label="Rechercher" />
      </div>

      <Card pad={false}>
        {!data ? (loading ? <Loading /> : null) : shown.length === 0 ? (
          <Empty>
            {projects.length === 0 ? `Aucun ${words.one.fr} pour l’instant. Créez le premier pour suivre son budget et ses étapes.` : "Aucun résultat dans cette vue."}
            {projects.length === 0 ? <div style={{ marginTop: 12 }}><Btn variant="primary" onClick={() => setEditing("new")}>Nouveau {words.one.fr}</Btn></div> : null}
          </Empty>
        ) : (
          <TableWrap min={980}>
            <thead>
              <tr><th style={th}>{words.title.fr}</th><th style={th}>Dates</th><th style={th}>Avancement</th><th style={{ ...th, ...num }}>Budget</th><th style={{ ...th, ...num }}>Coût réel</th><th style={th}>État</th><th style={th} /></tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const [text, tone] = STATUS[p.status] || [p.status === "completed" ? "Terminé" : p.status, "gray" as const];
                const over = n(p.budget) > 0 && n(p.cost) > n(p.budget);
                return (
                  <tr key={p.id}>
                    <td style={td}>
                      <button type="button" onClick={() => setOpened(p.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--theme-primary, #4f46e5)", fontWeight: 700, fontSize: 14.5, textAlign: "start" }}>{p.name}</button>
                      <div style={{ fontSize: 12.5, color: "var(--theme-text-secondary)", marginTop: 2 }}>
                        {[p.code, p.clientName, p.manager, p.location].filter(Boolean).join(" · ") || "—"}
                      </div>
                      {p.priority === "high" ? <div style={{ marginTop: 4 }}><Badge tone="red">Priorité haute</Badge></div> : null}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap", fontSize: 13 }}>
                      {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
                      {isLate(p) ? <div style={{ color: "var(--theme-danger, #ef4444)", fontWeight: 700, fontSize: 12.5 }}>En retard</div> : null}
                    </td>
                    <td style={td}>
                      <ProgressBar value={p.progress} />
                      <div style={{ fontSize: 12, color: p.tasksLate ? "var(--theme-danger, #ef4444)" : "var(--theme-text-secondary)" }}>
                        {p.tasksTotal ? `${p.tasksDone} / ${p.tasksTotal} tâche${p.tasksTotal > 1 ? "s" : ""}${p.tasksLate ? ` · ${p.tasksLate} en retard` : ""}` : "Sans tâche"}
                      </div>
                    </td>
                    <td style={{ ...td, ...num }}>{n(p.budget) ? moneyDT(p.budget) : "—"}</td>
                    <td style={{ ...td, ...num, color: over ? "var(--theme-danger, #ef4444)" : undefined, fontWeight: over ? 700 : undefined }}>{n(p.cost) ? moneyDT(p.cost) : "—"}{over ? <div style={{ fontSize: 12 }}>Budget dépassé</div> : null}</td>
                    <td style={td}><Badge tone={tone}>{text}</Badge></td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <Btn variant="primary" onClick={() => setOpened(p.id)}>Tâches</Btn>
                        <Btn onClick={() => setEditing(p)}>Modifier</Btn>
                        <Btn variant="danger" onClick={() => setRemoving(p)}>Supprimer</Btn>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {editing ? <ProjectModal project={editing === "new" ? null : editing} clients={clients} sector={sector} onClose={() => setEditing(null)} onDone={done} /> : null}
      {opened !== null ? <TasksModal projectId={opened} onClose={() => setOpened(null)} onChanged={reload} /> : null}
      {removing ? (
        <Modal title="Supprimer ?" onClose={() => { if (!busy) setRemoving(null); }} footer={<><Btn onClick={() => setRemoving(null)} disabled={busy}>Annuler</Btn><Btn variant="danger" busy={busy} onClick={remove}>Supprimer définitivement</Btn></>}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}><strong>{removing.name}</strong> et ses {removing.tasksTotal} tâche{removing.tasksTotal > 1 ? "s" : ""} seront supprimés. Cette action ne peut pas être annulée.</p>
        </Modal>
      ) : null}
    </Page>
  );
}
