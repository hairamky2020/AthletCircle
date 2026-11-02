"use client";

import { useCallback, useEffect, useState } from "react";
import { canMoveTo, STATUS_LABEL, type AuditEntry, type Metrics, type Role, type Status, type Submission, type User } from "@/lib/backend";
import { formatLong } from "@/lib/runs";
import { DemoNote, SignIn, StatusBadge, useBackend } from "./shared";
import { detailsSchema, emptyDetails } from "@/data/details";
import { topSports } from "@/data/sports";

const TABS = ["Review queue", "All events", "Sport fields", "Metrics", "Users & roles", "Audit trail"] as const;
type Tab = (typeof TABS)[number];
const ROLE_LABEL: Record<Role, string> = { organizer: "Organizer", reviewer: "Reviewer", editor: "Editor", super_admin: "Super admin" };

export function AdminApp() {
  const { be, user, refresh } = useBackend();
  const [tab, setTab] = useState<Tab>("Review queue");
  if (!be || user === undefined) return <p className="text-ink-500">Loading…</p>;
  if (!user) return <><DemoNote be={be} /><SignIn be={be} onDone={refresh} staff /></>;
  if (user.role === "organizer") return <p className="panel">Your account ({user.email}) doesn&apos;t have admin access. A super admin can grant it. <button className="underline" onClick={async () => { await be.signOut(); refresh(); }}>Sign out</button></p>;
  return (
    <div>
      <DemoNote be={be} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="admin-tabs">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <span className="text-sm text-ink-500">{user.email} · {ROLE_LABEL[user.role]} · <button className="underline" onClick={async () => { await be.signOut(); refresh(); }}>Sign out</button></span>
      </div>
      <div className="mt-6">
        {tab === "Review queue" && <EventsTable role={user.role} filter="pending_review" />}
        {tab === "All events" && <EventsTable role={user.role} />}
        {tab === "Sport fields" && <SportFieldsView role={user.role} />}
        {tab === "Metrics" && <MetricsView />}
        {tab === "Users & roles" && <UsersView me={user} />}
        {tab === "Audit trail" && <AuditView />}
      </div>
    </div>
  );
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  const reload = useCallback(() => { fn().then(setData).catch((e) => setErr(e.message)); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(reload, [reload]);
  return { data, err, reload, setErr };
}

function EventsTable({ role, filter }: { role: Role; filter?: Status }) {
  const { be } = useBackend();
  const [status, setStatus] = useState<Status | "">(filter ?? "");
  const { data, err, reload, setErr } = useLoad(async () => (be ? be.listEvents(status || undefined) : []), [be, status]);
  const canFeature = role === "editor" || role === "super_admin";
  const [editing, setEditing] = useState<Submission | null>(null);

  async function move(e: Submission, to: Status) {
    let reason: string | undefined;
    if (to === "rejected") { reason = prompt(`Why is “${e.title}” rejected? The organizer sees this.`) ?? undefined; if (!reason?.trim()) return; }
    try { await be!.setStatus(e.id, to, reason); reload(); } catch (x) { setErr((x as Error).message); }
  }
  async function feature(e: Submission) {
    try { await be!.setFeatured(e.id, e.featuredRank == null ? Date.now() % 100000 : null); reload(); } catch (x) { setErr((x as Error).message); }
  }

  return (
    <div>
      {!filter && (
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as Status | "")} className="field mb-4">
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      )}
      {err && <p className="mb-3 text-sm text-red-600" role="alert">{err}</p>}
      {!data ? <p className="text-ink-500">Loading…</p> : data.length === 0 ? <p className="panel">{filter ? "Nothing waiting for review." : "No events."}</p> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="admin-table">
            <thead><tr><th>Event</th><th>Date</th><th>Organizer</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.title}</b>{e.featuredRank != null && <span className="ml-2 text-xs font-bold text-brand-600">FEATURED</span>}
                    <div className="text-xs text-ink-500">{e.area || "Area not announced"} · {e.distances.join(", ") || "Distances not announced"}</div>
                    {e.rejectReason && <div className="text-xs text-red-700">Rejected: {e.rejectReason}</div>}</td>
                  <td className="whitespace-nowrap">{formatLong(e.startDate)}</td>
                  <td className="text-sm">{e.organizerName}<div className="text-xs text-ink-500">{e.organizerEmail}</div></td>
                  <td><StatusBadge status={e.status} /></td>
                  <td><div className="flex flex-wrap gap-1.5">
                    {(["approved", "rejected", "published", "archived"] as Status[]).filter((to) => canMoveTo(role, e.status, to)).map((to) => (
                      <button key={to} className={`act act-${to}`} onClick={() => move(e, to)}>{{ approved: "Approve", rejected: "Reject", published: "Publish", archived: "Archive" }[to as "approved"]}</button>
                    ))}
                    {canFeature && e.status === "published" && <button className="act" onClick={() => feature(e)}>{e.featuredRank == null ? "Feature" : "Unfeature"}</button>}
                    {canFeature && <button className="act" onClick={() => setEditing(e)}>Edit details</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <DetailsEditor ev={editing} onClose={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

/** JSON editor for an event's rich details, validated against the same schema the site uses. */
function DetailsEditor({ ev, onClose }: { ev: Submission; onClose: () => void }) {
  const { be } = useBackend();
  const [text, setText] = useState(JSON.stringify(ev.details ?? emptyDetails(), null, 2));
  const [msg, setMsg] = useState("");
  const { data: history } = useLoad<AuditEntry[]>(async () => (be ? (await be.audit(500)).filter((a) => a.target === ev.title) : []), [be, ev.title]);
  async function save() {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { setMsg("That isn't valid JSON."); return; }
    const r = detailsSchema.safeParse(parsed);
    if (!r.success) { setMsg(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")); return; }
    try { await be!.updateDetails(ev.id, r.data); onClose(); } catch (x) { setMsg((x as Error).message); }
  }
  return (
    <div className="details-editor panel mt-6" role="dialog" aria-label={`Edit details for ${ev.title}`}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold">Details · {ev.title}</h3><button className="act" onClick={onClose}>Close</button></div>
      <p className="mt-1 text-sm text-ink-500">Only enter what has been announced. Leave anything unknown out and the page shows “Not Announced”. List sections our team checked against an official source in <code>verified</code>; everything else shows as “From the organizer”.</p>
      <textarea aria-label="Event details JSON" className="field mt-3 h-80 w-full font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {msg && <p className="mt-2 text-sm text-red-600" role="alert">{msg}</p>}
      <div className="mt-3 flex gap-2"><button className="btn-primary" onClick={save}>Save details</button></div>
      <h4 className="mt-6 font-bold">Update history</h4>
      {!history?.length ? <p className="text-sm text-ink-500">No changes recorded yet.</p> : (
        <ul className="mt-2 space-y-1 text-sm">{history.map((h, i) => <li key={i}>{new Date(h.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {h.actor} · {h.action}</li>)}</ul>
      )}
    </div>
  );
}

/** Admins add or change sport-specific fields here; event pages render them without code changes. */
function SportFieldsView({ role }: { role: Role }) {
  const { be } = useBackend();
  const [slug, setSlug] = useState("running");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const canEdit = role === "editor" || role === "super_admin";
  useEffect(() => { if (be) be.sportSchema(slug).then((s) => setText(JSON.stringify(s, null, 2))).catch((e) => setMsg(e.message)); }, [be, slug]);
  async function save() {
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(text); } catch { setMsg("That isn't valid JSON."); return; }
    if (typeof parsed !== "object" || !parsed || typeof (parsed as { properties?: unknown }).properties !== "object") { setMsg("Needs a \"properties\" object, e.g. {\"properties\": {\"overs\": {\"type\": \"integer\", \"title\": \"Overs\"}}}"); return; }
    try { await be!.setSportSchema(slug, parsed); setMsg("Saved."); } catch (x) { setMsg((x as Error).message); }
  }
  return (
    <div className="panel">
      <p className="text-sm text-ink-500">Each sport has its own extra fields (for example running: route, cut-off time; cricket: overs, fixtures). Fields have a <code>title</code> and a <code>type</code> (string, number, integer, boolean, or array with <code>items.enum</code>). Event details store values under <code>sportFields</code> using the same keys.</p>
      <label className="mt-3 block text-sm font-semibold" htmlFor="sf-sport">Sport</label>
      <select id="sf-sport" className="field mt-1" value={slug} onChange={(e) => { setSlug(e.target.value); setMsg(""); }}>{topSports().map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
      <textarea aria-label="Sport fields JSON" className="field mt-3 h-72 w-full font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} readOnly={!canEdit} spellCheck={false} />
      {msg && <p className="mt-2 text-sm" role="status">{msg}</p>}
      {canEdit ? <button className="btn-primary mt-3" onClick={save}>Save fields</button> : <p className="mt-2 text-sm text-ink-500">Editors and super admins can change these.</p>}
    </div>
  );
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function MetricsView() {
  const { be } = useBackend();
  const [from, setFrom] = useState(iso(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(iso(new Date()));
  const { data: m, err } = useLoad<Metrics | null>(async () => (be ? be.metrics(from, to) : null), [be, from, to]);
  function exportCsv() {
    if (!m) return;
    const rows = [["slug", "views", "register_clicks"], ...m.topEvents.map((t) => [t.slug, t.views, t.registerClicks])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = `athletcircle-metrics-${from}-to-${to}.csv`; a.click();
  }
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-medium">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" /></label>
        <label className="grid gap-1 text-sm font-medium">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" /></label>
        <button className="chip" onClick={exportCsv}>Export CSV</button>
      </div>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {m && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Event page views" value={m.interactions.view ?? 0} />
            <Stat label="Register clicks" value={m.interactions.register_click ?? 0} />
            <Stat label="Added to calendar" value={m.interactions.calendar_add ?? 0} />
            <Stat label="Saved to My runs" value={m.interactions.save ?? 0} />
            <Stat label="New submissions" value={m.submissions} />
            <Stat label="Waiting for review" value={m.byStatus.pending_review ?? 0} />
            <Stat label="Avg review time" value={m.avgReviewHours == null ? "–" : `${m.avgReviewHours} h`} />
            <Stat label="Live events missing details" value={m.missingDetails} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="panel">
              <h3 className="font-bold">Top events</h3>
              {m.topEvents.length === 0 ? <p className="mt-2 text-sm text-ink-500">No visits recorded in this range yet.</p> : (
                <table className="admin-table mt-2"><thead><tr><th>Event</th><th>Views</th><th>Register clicks</th></tr></thead>
                  <tbody>{m.topEvents.map((t) => <tr key={t.slug}><td>{t.slug}</td><td>{t.views}</td><td>{t.registerClicks}</td></tr>)}</tbody></table>
              )}
            </section>
            <section className="panel grid gap-4">
              <Bars title="Events by status" data={Object.fromEntries((Object.keys(STATUS_LABEL) as Status[]).map((s) => [STATUS_LABEL[s], m.byStatus[s] ?? 0]))} />
              <Bars title="Devices" data={m.devices} />
              <p className="text-sm text-ink-500">Emails: {Object.entries(m.emails).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}
                {m.dbBytes != null && <> · Database {(m.dbBytes / 1048576).toFixed(1)} MB of 500 MB free tier</>}</p>
            </section>
          </div>
          <p className="mt-4 text-xs text-ink-500">Counts are anonymous: no cookies, IPs or personal data.</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="panel !p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p><p className="mt-1 text-3xl font-black tabular-nums">{value}</p></div>;
}
function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div><h3 className="font-bold">{title}</h3>
      <ul className="mt-2 grid gap-1.5">{Object.entries(data).map(([k, v]) => (
        <li key={k} className="grid grid-cols-[120px_1fr_40px] items-center gap-2 text-sm"><span>{k}</span>
          <span className="h-2.5 rounded-full bg-ink-50"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${(v / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums">{v}</span></li>))}</ul>
    </div>
  );
}

function UsersView({ me }: { me: User }) {
  const { be } = useBackend();
  const { data, err, reload, setErr } = useLoad(async () => (be ? be.users() : []), [be]);
  async function change(u: User, role: Role) { try { await be!.setRole(u.id, role); reload(); } catch (x) { setErr((x as Error).message); } }
  return (
    <div>
      <p className="mb-3 text-sm text-ink-500">Reviewers approve or reject. Editors also publish, archive and feature. Super admins also manage roles. Only a super admin can change roles.</p>
      {err && <p className="mb-3 text-sm text-red-600" role="alert">{err}</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="admin-table"><thead><tr><th>Email</th><th>Role</th></tr></thead>
          <tbody>{(data ?? []).map((u) => (
            <tr key={u.id}><td>{u.email}</td><td>
              {me.role === "super_admin" && u.id !== me.id
                ? <select aria-label={`Role for ${u.email}`} value={u.role} onChange={(e) => change(u, e.target.value as Role)} className="field">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                : ROLE_LABEL[u.role]}
            </td></tr>))}</tbody></table>
      </div>
    </div>
  );
}

function AuditView() {
  const { be } = useBackend();
  const { data } = useLoad<AuditEntry[]>(async () => (be ? be.audit(200) : []), [be]);
  if (!data) return <p className="text-ink-500">Loading…</p>;
  if (!data.length) return <p className="panel">No changes recorded yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="admin-table"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Item</th></tr></thead>
        <tbody>{data.map((a, i) => <tr key={i}><td className="whitespace-nowrap text-sm">{new Date(a.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td className="text-sm">{a.actor}</td><td>{a.action}</td><td>{a.target}{a.detail ? <span className="text-ink-500"> · {a.detail}</span> : null}</td></tr>)}</tbody></table>
    </div>
  );
}
