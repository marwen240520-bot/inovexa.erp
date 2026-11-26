"use client";
/**
 * Rendez-vous, réservations, séances.
 * Un créneau horaire pour un client, éventuellement sur une ressource (praticien, table, salle, pont d'atelier…) :
 * le serveur refuse deux rendez-vous qui se chevauchent sur la même ressource. Le vocabulaire suit le secteur de la
 * société (« Réservations » au restaurant, « Séances » en formation) — voir lib/sectorLabels.ts.
 */
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { api, ApiError, Badge, Btn, Card, Empty, ErrorBox, inputStyle, Loading, Modal, moneyDT, Notice, Page, Row, Stat, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";
import { appointmentWords } from "@/lib/sectorLabels";
import { MODULES_CHANGED_EVENT, getStoredUser } from "@/lib/session";

interface Appointment {
  id: number; title: string; clientId: number | null; clientName: string | null; clientPhone: string | null; service: string | null; resource: string | null;
  startAt: string; endAt: string; status: "scheduled" | "confirmed" | "done" | "cancelled" | "no_show" | string; partySize: number | null; price: number | null; notes: string | null;
}
interface Summary { resources: string[]; services: string[]; today: { planned: number; done: number; cancelled: number; noShow: number }; upcoming7Days: number }
interface ClientRef { id: number; name: string; phone?: string | null }

type Range = "day" | "week" | "month";
/** Listes vides stables (tant que les données ne sont pas arrivées) : les calculs mémorisés ne se relancent pas. */
const NO_APPOINTMENTS: Appointment[] = [];
const NO_CLIENTS: ClientRef[] = [];
const STATUS: Record<string, [string, "gray" | "blue" | "green" | "red" | "amber"]> = {
  scheduled: ["Prévu", "gray"], confirmed: ["Confirmé", "blue"], done: ["Terminé", "green"], cancelled: ["Annulé", "red"], no_show: ["Absent", "amber"],
};
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOf = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const durationLabel = (minutes: number) => (minutes < 60 ? `${minutes} min` : minutes % 60 === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${minutes % 60}`);
const longDay = (d: Date) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);

/** Période affichée : la journée, la semaine (lundi → dimanche) ou le mois de la date choisie. */
function rangeOf(anchor: Date, range: Range): { from: Date; to: Date } {
  const day = startOfDay(anchor);
  if (range === "day") return { from: day, to: addDays(day, 1) };
  if (range === "week") {
    const monday = addDays(day, -((day.getDay() + 6) % 7));
    return { from: monday, to: addDays(monday, 7) };
  }
  return { from: new Date(day.getFullYear(), day.getMonth(), 1), to: new Date(day.getFullYear(), day.getMonth() + 1, 1) };
}

interface Form { title: string; clientId: string; clientName: string; clientPhone: string; service: string; resource: string; date: string; time: string; duration: string; partySize: string; price: string; notes: string }
const formOf = (a: Appointment | null, day: Date): Form => {
  if (!a) {
    // Prochaine demi-heure ronde pour aujourd'hui, 9 h pour un autre jour.
    const now = new Date();
    const today = dayKey(day) === dayKey(now);
    const minutes = today ? Math.min(23 * 60 + 30, Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 30) * 30) : 9 * 60;
    return { title: "", clientId: "", clientName: "", clientPhone: "", service: "", resource: "", date: dayKey(day), time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`, duration: "30", partySize: "", price: "", notes: "" };
  }
  const start = new Date(a.startAt);
  return {
    title: a.title, clientId: a.clientId ? String(a.clientId) : "", clientName: a.clientName || "", clientPhone: a.clientPhone || "", service: a.service || "", resource: a.resource || "",
    date: dayKey(start), time: timeOf(a.startAt), duration: String(Math.max(5, Math.round((new Date(a.endAt).getTime() - start.getTime()) / 60_000))),
    partySize: a.partySize ? String(a.partySize) : "", price: a.price === null || a.price === undefined ? "" : String(a.price).replace(".", ","), notes: a.notes || "",
  };
};

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" };
const field = (flex: string): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: 4, flex, minWidth: 0 });

function AppointmentModal({ item, day, clients, summary, sector, onClose, onDone }: {
  item: Appointment | null; day: Date; clients: ClientRef[]; summary: Summary | null; sector: string | null; onClose: () => void; onDone: (message: string) => void;
}) {
  const words = appointmentWords(sector);
  const one = words.one.fr;
  const [form, setForm] = useState<Form>(formOf(item, day));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Le serveur a signalé que la ressource est déjà prise : on propose d'enregistrer quand même. */
  const [taken, setTaken] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((prev) => ({ ...prev, [key]: value })); setTaken(false); };

  const pickClient = (id: string) => {
    const client = clients.find((c) => String(c.id) === id);
    setForm((prev) => ({ ...prev, clientId: id, clientName: client ? client.name : prev.clientName, clientPhone: client?.phone || prev.clientPhone }));
    setTaken(false);
  };

  const save = async (e: FormEvent | null, allowOverlap = false) => {
    e?.preventDefault();
    if (busy) return;
    const title = form.title.trim() || form.service.trim() || form.clientName.trim();
    if (title.length < 2) { setError(`Indiquez l’objet ${words.feminine ? "de la" : "du"} ${one} (ou le client).`); return; }
    const start = new Date(`${form.date}T${form.time || "00:00"}`);
    if (!form.date || Number.isNaN(start.getTime())) { setError("Indiquez la date et l’heure."); return; }
    const duration = Number(form.duration);
    if (!Number.isFinite(duration) || duration < 5 || duration > 24 * 60) { setError("Durée invalide (5 minutes à 24 heures)."); return; }
    const party = form.partySize.trim() ? Number(form.partySize) : null;
    if (party !== null && (!Number.isInteger(party) || party < 1)) { setError(`${words.party?.fr || "Nombre de personnes"} : un nombre entier.`); return; }
    const price = form.price.trim() ? Number(form.price.replace(",", ".")) : null;
    if (price !== null && (!Number.isFinite(price) || price < 0)) { setError("Montant invalide."); return; }
    setBusy(true);
    setError(null);
    const body = {
      title, clientId: form.clientId ? Number(form.clientId) : null, clientName: form.clientName.trim() || null, clientPhone: form.clientPhone.trim() || null,
      service: form.service.trim() || null, resource: form.resource.trim() || null, startAt: start.toISOString(), durationMinutes: Math.round(duration),
      partySize: party, price, notes: form.notes.trim() || null, ...(allowOverlap ? { allowOverlap: true } : {}),
    };
    try {
      if (item) await api(`/appointments/${item.id}`, { method: "PUT", body });
      else await api("/appointments", { method: "POST", body });
      onDone(`${one.charAt(0).toUpperCase()}${one.slice(1)} ${words.feminine ? "enregistrée" : "enregistré"}.`);
    } catch (err: any) {
      setTaken(err instanceof ApiError && err.status === 409);
      setError(err?.message || "L’enregistrement a échoué.");
      setBusy(false);
    }
  };

  return (
    <Modal title={item ? `Modifier ${words.feminine ? "la" : "le"} ${one}` : `${words.feminine ? "Nouvelle" : "Nouveau"} ${one}`} onClose={() => { if (!busy) onClose(); }} width={640}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn>{taken ? <Btn busy={busy} onClick={() => save(null, true)}>Enregistrer quand même</Btn> : null}<Btn variant="primary" busy={busy} onClick={() => save(null)}>Enregistrer</Btn></>}>
      <form onSubmit={(e) => save(e)} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <Row>
          <label style={field("1 1 150px")}><span style={label}>Date</span><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} required /></label>
          <label style={field("1 1 110px")}><span style={label}>Heure</span><input type="time" step={300} value={form.time} onChange={(e) => set("time", e.target.value)} style={inputStyle} required /></label>
          <label style={field("1 1 130px")}>
            <span style={label}>Durée</span>
            <select value={DURATIONS.includes(Number(form.duration)) ? form.duration : "custom"} onChange={(e) => { if (e.target.value !== "custom") set("duration", e.target.value); }} style={inputStyle}>
              {DURATIONS.map((m) => <option key={m} value={m}>{durationLabel(m)}</option>)}
              {DURATIONS.includes(Number(form.duration)) ? null : <option value="custom">{durationLabel(Number(form.duration) || 0)}</option>}
            </select>
          </label>
        </Row>
        <Row>
          <label style={field("1 1 220px")}>
            <span style={label}>{words.client.fr} enregistré</span>
            <select value={form.clientId} onChange={(e) => pickClient(e.target.value)} style={inputStyle}>
              <option value="">— Aucune fiche (saisie libre) —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label style={field("1 1 200px")}><span style={label}>Nom</span><input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} maxLength={160} style={inputStyle} autoComplete="off" /></label>
          <label style={field("1 1 150px")}><span style={label}>Téléphone</span><input type="tel" dir="ltr" value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} maxLength={40} style={inputStyle} autoComplete="off" /></label>
        </Row>
        <Row>
          <label style={field("2 1 240px")}>
            <span style={label}>{words.service.fr}</span>
            <input list="apt-services" value={form.service} onChange={(e) => set("service", e.target.value)} maxLength={160} style={inputStyle} autoComplete="off" />
            <datalist id="apt-services">{(summary?.services || []).map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label style={field("1 1 200px")}>
            <span style={label}>{words.resource.fr}</span>
            <input list="apt-resources" value={form.resource} onChange={(e) => set("resource", e.target.value)} maxLength={120} style={inputStyle} autoComplete="off" />
            <datalist id="apt-resources">{(summary?.resources || []).map((r) => <option key={r} value={r} />)}</datalist>
          </label>
        </Row>
        <Row>
          <label style={field("2 1 240px")}><span style={label}>Intitulé affiché dans l’agenda (facultatif)</span><input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={160} style={inputStyle} placeholder={form.service || form.clientName || ""} /></label>
          {words.party ? <label style={field("1 1 110px")}><span style={label}>{words.party.fr}</span><input type="number" min={1} step={1} value={form.partySize} onChange={(e) => set("partySize", e.target.value)} style={inputStyle} /></label> : null}
          <label style={field("1 1 130px")}><span style={label}>Montant prévu (DT)</span><input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} style={inputStyle} /></label>
        </Row>
        <label style={field("1 1 auto")}><span style={label}>Notes</span><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={2000} style={{ ...inputStyle, resize: "vertical" }} /></label>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--theme-text-secondary)", lineHeight: 1.5 }}>
          Renseignez « {words.resource.fr} » pour bloquer le créneau : deux {one}s ne peuvent pas se chevaucher sur la même ressource.
        </p>
        {error ? <div role="alert" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 13.5 }}>{error}</div> : null}
      </form>
    </Modal>
  );
}

export default function AppointmentsPage() {
  useRequireAuth();
  const [sector, setSector] = useState<string | null>(null);
  useEffect(() => {
    setSector(getStoredUser()?.sector ?? null);
    const onChange = (event: Event) => { const d = (event as CustomEvent<{ sector?: string | null }>).detail; if (d && d.sector !== undefined) setSector(d.sector ?? null); };
    window.addEventListener(MODULES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MODULES_CHANGED_EVENT, onChange);
  }, []);
  const words = appointmentWords(sector);
  const one = words.one.fr;

  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [range, setRange] = useState<Range>("week");
  const [status, setStatus] = useState("");
  const [resource, setResource] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Appointment | "new" | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, notify] = useNotice();

  const period = useMemo(() => rangeOf(anchor, range), [anchor, range]);
  const { data, error, loading, reload } = useLoad(
    () => Promise.all([
      api<Appointment[]>("/appointments", { query: { from: period.from.toISOString(), to: new Date(period.to.getTime() - 1).toISOString() } }),
      api<Summary>("/appointments/summary"),
      api<ClientRef[]>("/clients").catch(() => [] as ClientRef[]),
    ]),
    [period.from.getTime(), period.to.getTime()],
  );
  const items: Appointment[] = data?.[0] ?? NO_APPOINTMENTS;
  const summary: Summary | null = data?.[1] ?? null;
  const clients: ClientRef[] = data?.[2] ?? NO_CLIENTS;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) =>
      (!status || a.status === status) &&
      (!resource || (a.resource || "").toLowerCase() === resource.toLowerCase()) &&
      (!q || [a.title, a.clientName, a.clientPhone, a.service, a.resource].some((v) => (v || "").toLowerCase().includes(q))));
  }, [items, status, resource, search]);

  const days = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const a of shown) {
      const key = dayKey(new Date(a.startAt));
      groups.set(key, [...(groups.get(key) || []), a]);
    }
    return Array.from(groups.entries()).sort(([x], [y]) => x.localeCompare(y));
  }, [shown]);

  const move = (direction: number) => setAnchor((d) => (range === "day" ? addDays(d, direction) : range === "week" ? addDays(d, 7 * direction) : new Date(d.getFullYear(), d.getMonth() + direction, 1)));
  const periodLabel = range === "day" ? longDay(period.from)
    : range === "week" ? `Semaine du ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(period.from)} au ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(addDays(period.to, -1))}`
    : new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(period.from);

  const done = (message: string) => { setEditing(null); notify(message); reload(); };
  const act = async (a: Appointment, run: () => Promise<unknown>, message: string) => {
    setBusy(a.id);
    try { await run(); notify(message); reload(); } catch (err: any) { notify(err?.message || "L’action a échoué.", "err"); } finally { setBusy(null); }
  };
  const setState = (a: Appointment, next: string, message: string) => act(a, () => api(`/appointments/${a.id}/status`, { method: "PATCH", body: { status: next } }), message);
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "1px solid var(--theme-border)",
    background: active ? "var(--theme-primary, #4f46e5)" : "var(--theme-surface)", color: active ? "#fff" : "var(--theme-text)",
  });
  const todayKey = dayKey(new Date());

  return (
    <Page title={words.title.fr} subtitle={`Agenda de la société : chaque ${one} bloque son créneau sur la ressource choisie.`}
      actions={<Btn variant="primary" onClick={() => setEditing("new")}>{words.feminine ? "Nouvelle" : "Nouveau"} {one}</Btn>}>
      {notice}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Stat label="Aujourd’hui" value={summary?.today.planned ?? "—"} sub={summary ? `${summary.today.done} terminé${summary.today.done > 1 ? "s" : ""}` : undefined} />
        <Stat label="À venir sur 7 jours" value={summary?.upcoming7Days ?? "—"} />
        <Stat label="Annulés aujourd’hui" value={summary?.today.cancelled ?? "—"} />
        <Stat label="Absents aujourd’hui" value={summary?.today.noShow ?? "—"} tone={summary && summary.today.noShow > 0 ? "bad" : undefined} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div role="tablist" aria-label="Période" style={{ display: "flex", gap: 6 }}>
          {([["day", "Jour"], ["week", "Semaine"], ["month", "Mois"]] as Array<[Range, string]>).map(([value, text]) => (
            <button key={value} role="tab" aria-selected={range === value} onClick={() => setRange(value)} style={chip(range === value)}>{text}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Btn onClick={() => move(-1)} aria-label="Période précédente">‹</Btn>
          <Btn onClick={() => setAnchor(startOfDay(new Date()))}>Aujourd’hui</Btn>
          <Btn onClick={() => move(1)} aria-label="Période suivante">›</Btn>
          <input type="date" value={dayKey(anchor)} onChange={(e) => { const d = new Date(`${e.target.value}T00:00`); if (!Number.isNaN(d.getTime())) setAnchor(d); }} style={{ ...inputStyle, width: 150 }} aria-label="Aller à une date" />
        </div>
        <strong style={{ fontSize: 14.5, textTransform: "capitalize" }}>{periodLabel}</strong>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, téléphone, prestation…)" style={{ ...inputStyle, flex: "2 1 240px", width: "auto" }} aria-label="Rechercher" />
        <select value={resource} onChange={(e) => setResource(e.target.value)} style={{ ...inputStyle, flex: "1 1 180px", width: "auto" }} aria-label={words.resource.fr}>
          <option value="">{words.resource.fr} : tous</option>
          {(summary?.resources || []).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, flex: "1 1 150px", width: "auto" }} aria-label="État">
          <option value="">Tous les états</option>
          {Object.entries(STATUS).map(([code, [text]]) => <option key={code} value={code}>{text}</option>)}
        </select>
      </div>

      {!data ? (loading ? <Card><Loading /></Card> : null) : days.length === 0 ? (
        <Card>
          <Empty>
            {items.length === 0 ? `Rien de prévu sur cette période.` : "Aucun résultat avec ces filtres."}
            <div style={{ marginTop: 12 }}><Btn variant="primary" onClick={() => setEditing("new")}>{words.feminine ? "Nouvelle" : "Nouveau"} {one}</Btn></div>
          </Empty>
        </Card>
      ) : days.map(([key, list]) => (
        <Card key={key} pad={false} title={<span style={{ textTransform: "capitalize" }}>{longDay(new Date(`${key}T00:00`))}{key === todayKey ? " — aujourd’hui" : ""}</span>} right={<span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>{list.length}</span>}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {list.map((a) => {
              const [text, tone] = STATUS[a.status] || [a.status, "gray" as const];
              const open = a.status === "scheduled" || a.status === "confirmed";
              const minutes = Math.round((new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60_000);
              return (
                <li key={a.id} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderTop: "1px solid var(--theme-border)", opacity: a.status === "cancelled" ? 0.65 : 1 }}>
                  <div style={{ flex: "0 0 92px", fontVariantNumeric: "tabular-nums" }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{timeOf(a.startAt)}</div>
                    <div style={{ fontSize: 12.5, color: "var(--theme-text-secondary)" }}>→ {timeOf(a.endAt)} · {durationLabel(minutes)}</div>
                  </div>
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <strong style={{ fontSize: 15 }}>{a.title}</strong>
                      <Badge tone={tone}>{text}</Badge>
                      {a.resource ? <Badge tone="violet">{a.resource}</Badge> : null}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--theme-text-secondary)", marginTop: 3, lineHeight: 1.5 }}>
                      {[a.clientName && a.clientName !== a.title ? a.clientName : null, a.clientPhone ? <bdi key="p" dir="ltr">{a.clientPhone}</bdi> : null, a.service && a.service !== a.title ? a.service : null,
                        a.partySize ? `${a.partySize} ${(words.party?.fr || "personnes").toLowerCase()}` : null, a.price ? moneyDT(a.price) : null]
                        .filter(Boolean).map((part, i) => <span key={i}>{i > 0 ? " · " : ""}{part}</span>)}
                    </div>
                    {a.notes ? <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{a.notes}</div> : null}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end", flex: "1 1 240px" }}>
                    {a.status === "scheduled" ? <Btn onClick={() => setState(a, "confirmed", "Confirmé.")} disabled={busy === a.id}>Confirmer</Btn> : null}
                    {open ? <Btn variant="success" onClick={() => setState(a, "done", "Marqué comme terminé.")} disabled={busy === a.id}>Terminé</Btn> : null}
                    {open ? <Btn onClick={() => setState(a, "no_show", "Marqué comme absent.")} disabled={busy === a.id}>Absent</Btn> : null}
                    {open ? <Btn onClick={() => setEditing(a)} disabled={busy === a.id}>Modifier</Btn> : null}
                    {open ? <Btn variant="danger" onClick={() => setState(a, "cancelled", "Annulé : le créneau est libéré.")} disabled={busy === a.id}>Annuler</Btn> : null}
                    {!open ? <Btn onClick={() => setState(a, "scheduled", "Remis au planning.")} disabled={busy === a.id}>Replanifier</Btn> : null}
                    {a.status === "cancelled" ? <Btn variant="danger" busy={busy === a.id} onClick={() => act(a, () => api(`/appointments/${a.id}`, { method: "DELETE" }), "Supprimé.")}>Supprimer</Btn> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}

      <Notice tone="blue">La facturation se fait dans « Ventes » ou « Factures &amp; devis » : le montant saisi ici est indicatif et sert à préparer la journée.</Notice>
      {editing ? <AppointmentModal item={editing === "new" ? null : editing} day={anchor} clients={clients} summary={summary} sector={sector} onClose={() => setEditing(null)} onDone={done} /> : null}
    </Page>
  );
}
