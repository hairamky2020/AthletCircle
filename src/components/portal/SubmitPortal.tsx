"use client";

import { useEffect, useState } from "react";
import type { Submission, SubmissionInput } from "@/lib/backend";
import { SCOPE } from "@/data/events";
import { formatLong } from "@/lib/runs";
import { DemoNote, SignIn, StatusBadge, useBackend } from "./shared";

const EMPTY: SubmissionInput = {
  title: "", sport: SCOPE.sport, city: SCOPE.city, area: "", venue: "", startDate: "", startTime: "", distances: [],
  registrationUrl: "", websiteUrl: "", feeNote: "", prizeNote: "", description: "", organizerName: "", organizerEmail: "", source: "Organizer submission",
};

export function SubmitPortal() {
  const { be, user, refresh } = useBackend();
  const [mine, setMine] = useState<Submission[]>([]);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [form, setForm] = useState<SubmissionInput>(EMPTY);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (be && user) be.mySubmissions().then(setMine); }, [be, user]);
  useEffect(() => { if (user) setForm((f) => ({ ...f, organizerEmail: f.organizerEmail || user.email })); }, [user]);

  if (!be || user === undefined) return <p className="text-ink-500">Loading…</p>;
  if (!user) return <><DemoNote be={be} /><SignIn be={be} onDone={refresh} /></>;

  const set = (k: keyof SubmissionInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      if (editing) await be!.updateSubmission(editing.id, form); else await be!.submit(form);
      setMsg(editing ? "Changes saved and sent for review again." : "Thanks! Your event is now Pending Review. We'll email you when it's reviewed.");
      setEditing(null); setForm({ ...EMPTY, organizerEmail: user!.email, organizerName: form.organizerName });
      setMine(await be!.mySubmissions());
    } catch (x) { setErr((x as Error).message); }
  }
  function edit(s: Submission) {
    setEditing(s);
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(s).filter(([k]) => k in EMPTY)) } as SubmissionInput);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <DemoNote be={be} />
        <form onSubmit={save} className="panel grid gap-4" aria-label="Event details">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editing ? `Edit “${editing.title}”` : "Event details"}</h2>
            <span className="text-sm text-ink-500">Signed in as {user.email} · <button type="button" className="underline" onClick={async () => { await be.signOut(); refresh(); }}>Sign out</button></span>
          </div>
          <p className="text-sm text-ink-500">Only fill in what is announced. Leave the rest blank and it will show as Not Announced.</p>
          <Field label="Event name *"><input required minLength={3} value={form.title} onChange={set("title")} className="field" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date *"><input type="date" required value={form.startDate} onChange={set("startDate")} className="field" /></Field>
            <Field label="Start time"><input type="time" value={form.startTime} onChange={set("startTime")} className="field" /></Field>
            <Field label="Area"><input value={form.area} onChange={set("area")} className="field" placeholder="e.g. Gachibowli" /></Field>
            <Field label="Venue"><input value={form.venue} onChange={set("venue")} className="field" /></Field>
          </div>
          <Field label="Distances (comma separated)"><input value={form.distances.join(", ")} onChange={(e) => setForm({ ...form, distances: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="field" placeholder="5K, 10K, 21.1K" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration link"><input type="url" value={form.registrationUrl} onChange={set("registrationUrl")} className="field" placeholder="https://" /></Field>
            <Field label="Website"><input type="url" value={form.websiteUrl} onChange={set("websiteUrl")} className="field" placeholder="https://" /></Field>
            <Field label="Fees"><input value={form.feeNote} onChange={set("feeNote")} className="field" placeholder="e.g. 5K ₹600, 10K ₹900" /></Field>
            <Field label="Prizes"><input value={form.prizeNote} onChange={set("prizeNote")} className="field" /></Field>
          </div>
          <Field label="Description"><textarea rows={4} value={form.description} onChange={set("description")} className="field" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organizer name *"><input required value={form.organizerName} onChange={set("organizerName")} className="field" /></Field>
            <Field label="Contact email *"><input type="email" required value={form.organizerEmail} onChange={set("organizerEmail")} className="field" /></Field>
          </div>
          {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
          {msg && <p className="text-sm font-medium text-emerald-700" role="status">{msg}</p>}
          <div className="flex gap-3">
            <button className="btn-primary">{editing ? "Save and resubmit" : "Submit for review"}</button>
            {editing && <button type="button" className="chip" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      </div>
      <aside>
        <h2 className="text-lg font-bold">My submissions</h2>
        {mine.length === 0 ? <p className="mt-2 text-ink-500">Nothing yet.</p> : (
          <ul className="mt-3 grid gap-3" aria-label="My submissions">
            {mine.map((s) => (
              <li key={s.id} className="panel !p-4">
                <div className="flex items-start justify-between gap-2"><b>{s.title}</b><StatusBadge status={s.status} /></div>
                <p className="text-sm text-ink-500">{s.startDate ? formatLong(s.startDate) : "Date not set"}</p>
                {s.status === "rejected" && s.rejectReason && <p className="mt-2 text-sm text-red-700">Reason: {s.rejectReason}</p>}
                {(s.status === "pending_review" || s.status === "rejected") && <button className="mt-2 text-sm font-semibold text-brand-600 underline" onClick={() => edit(s)}>Edit</button>}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}
