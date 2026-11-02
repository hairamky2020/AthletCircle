// Demo adapter: everything lives in this browser's localStorage. Nothing is sent anywhere.
// Lets Ramki try organizer and admin flows before the Supabase project is created.
import { RUNS } from "@/data/events";
import type { AuditEntry, Backend, Interaction, Metrics, Role, Status, Submission, SubmissionInput, User } from "./types";
import { canMoveTo, slugify } from "./types";
import { getSport } from "@/data/sports";

const KEY = "ac.demo.v1";
type Db = { sportSchemas?: Record<string, Record<string, unknown>>; user: User | null; users: User[]; events: Submission[]; audit: AuditEntry[]; hits: { slug: string; kind: Interaction; device: string; at: string }[]; emails: { to: string; template: string; at: string }[] };

function seed(): Db {
  const now = new Date().toISOString();
  return {
    user: null,
    users: [
      { id: "u-admin", email: "admin@demo.local", role: "super_admin", name: "Demo admin" },
      { id: "u-editor", email: "editor@demo.local", role: "editor", name: "Demo editor" },
      { id: "u-review", email: "reviewer@demo.local", role: "reviewer", name: "Demo reviewer" },
      { id: "u-org", email: "organizer@demo.local", role: "organizer", name: "Demo organizer" },
    ],
    events: RUNS.map((r, i) => ({
      id: `e-${r.slug}`, slug: r.slug, title: r.title, sport: r.sport, city: r.city, area: r.area, venue: r.venue,
      startDate: r.date, startTime: r.startTime, distances: r.distances, registrationUrl: r.registrationUrl, websiteUrl: r.websiteUrl,
      organizerName: "Not Announced", organizerEmail: "", source: r.source, status: "published" as Status,
      featuredRank: r.featured ? i : null, createdAt: now, updatedAt: now, details: r.details,
    })),
    audit: [], hits: [], emails: [],
  };
}
function load(): Db {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch {}
  return seed();
}
function save(db: Db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} }
function mutate<T>(fn: (db: Db) => T): T { const db = load(); const out = fn(db); save(db); return out; }
const need = (db: Db, ok: (r: Role) => boolean) => { if (!db.user || !ok(db.user.role)) throw new Error("Not allowed"); return db.user; };
const isStaff = (r: Role) => r !== "organizer";
const log = (db: Db, action: string, target: string, detail?: string) =>
  db.audit.unshift({ at: new Date().toISOString(), actor: db.user?.email ?? "anonymous", action, target, detail });
const notify = (db: Db, to: string, template: string) => { if (to) db.emails.unshift({ to, template, at: new Date().toISOString() }); };

export const demoBackend: Backend = {
  mode: "demo",
  async currentUser() { return load().user; },
  async signIn(email, demoRole = "organizer") {
    return mutate((db) => {
      let u = db.users.find((x) => x.email === email.toLowerCase());
      if (!u) { u = { id: `u-${Date.now()}`, email: email.toLowerCase(), role: demoRole, name: email.split("@")[0] }; db.users.push(u); }
      else u.role = demoRole;
      db.user = u; return u;
    });
  },
  async signOut() { mutate((db) => { db.user = null; }); },
  async mySubmissions() { const db = load(); return db.user ? db.events.filter((e) => e.submittedBy === db.user!.id) : []; },
  async submit(input: SubmissionInput) {
    return mutate((db) => {
      const u = need(db, () => true);
      const now = new Date().toISOString();
      let slug = slugify(input.title, input.startDate);
      while (db.events.some((e) => e.slug === slug)) slug += "-x";
      const e: Submission = { ...input, id: `e-${Date.now()}`, slug, status: "pending_review", submittedBy: u.id, featuredRank: null, createdAt: now, updatedAt: now };
      db.events.unshift(e); log(db, "submit", e.title); notify(db, input.organizerEmail, "received");
      return e;
    });
  },
  async updateSubmission(id, input) {
    return mutate((db) => {
      const u = need(db, () => true);
      const e = db.events.find((x) => x.id === id);
      if (!e) throw new Error("Not found");
      if (!isStaff(u.role) && (e.submittedBy !== u.id || !["pending_review", "rejected"].includes(e.status))) throw new Error("Only pending or rejected events can be edited");
      Object.assign(e, input, { updatedAt: new Date().toISOString() });
      if (!isStaff(u.role)) { e.status = "pending_review"; e.rejectReason = undefined; }
      log(db, "edit", e.title); return e;
    });
  },
  async listEvents(status?: Status) { const db = load(); need(db, isStaff); return status ? db.events.filter((e) => e.status === status) : db.events; },
  async setStatus(id, to, reason) {
    mutate((db) => {
      const u = need(db, isStaff);
      const e = db.events.find((x) => x.id === id);
      if (!e) throw new Error("Not found");
      if (!canMoveTo(u.role, e.status, to)) throw new Error(`${u.role} cannot move ${e.status} to ${to}`);
      if (to === "rejected" && !reason?.trim()) throw new Error("A reason is required to reject");
      const from = e.status;
      e.status = to; e.rejectReason = to === "rejected" ? reason : undefined; e.updatedAt = new Date().toISOString();
      if (to !== "published") e.featuredRank = null;
      log(db, `status ${from} → ${to}`, e.title, reason); notify(db, e.organizerEmail, to);
    });
  },
  async setFeatured(id, rank) {
    mutate((db) => {
      need(db, (r) => r === "editor" || r === "super_admin");
      const e = db.events.find((x) => x.id === id);
      if (!e || e.status !== "published") throw new Error("Only published events can be featured");
      e.featuredRank = rank; log(db, rank === null ? "unfeature" : "feature", e.title);
    });
  },
  async updateDetails(id, details) {
    mutate((db) => { const u = need(db, (r) => r === "editor" || r === "super_admin"); void u;
      const e = db.events.find((x) => x.id === id); if (!e) throw new Error("Not found");
      e.details = details; e.updatedAt = new Date().toISOString(); log(db, "Edited details", e.title); });
  },
  async sportSchema(slug) { return load().sportSchemas?.[slug] ?? (getSport(slug)?.schema as Record<string, unknown>) ?? {}; },
  async setSportSchema(slug, schema) {
    mutate((db) => { need(db, (r) => r === "editor" || r === "super_admin"); db.sportSchemas = { ...db.sportSchemas, [slug]: schema }; log(db, "Edited sport fields", slug); });
  },
  async audit(limit = 100) { const db = load(); need(db, isStaff); return db.audit.slice(0, limit); },
  async users() { const db = load(); need(db, isStaff); return db.users; },
  async setRole(userId, role) {
    mutate((db) => {
      need(db, (r) => r === "super_admin");
      const u = db.users.find((x) => x.id === userId); if (!u) throw new Error("Not found");
      log(db, `role ${u.role} → ${role}`, u.email); u.role = role;
    });
  },
  async metrics(from, to): Promise<Metrics> {
    const db = load(); need(db, isStaff);
    const inRange = (at: string) => at.slice(0, 10) >= from && at.slice(0, 10) <= to;
    const hits = db.hits.filter((h) => inRange(h.at));
    const count = <K extends string>(xs: K[]) => xs.reduce((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {} as Record<K, number>);
    const top = Object.entries(count(hits.map((h) => h.slug))).map(([slug]) => ({
      slug, views: hits.filter((h) => h.slug === slug && h.kind === "view").length, registerClicks: hits.filter((h) => h.slug === slug && h.kind === "register_click").length,
    })).sort((a, b) => b.views - a.views).slice(0, 10);
    return {
      byStatus: count(db.events.map((e) => e.status)),
      submissions: db.events.filter((e) => e.submittedBy && inRange(e.createdAt)).length,
      avgReviewHours: null,
      interactions: count(hits.map((h) => h.kind)),
      devices: count(hits.filter((h) => h.kind === "view").map((h) => h.device)),
      topEvents: top,
      missingDetails: db.events.filter((e) => e.status === "published" && (!e.registrationUrl || !e.startTime || !e.feeNote)).length,
      emails: { sent: db.emails.filter((m) => inRange(m.at)).length },
      dbBytes: null,
    };
  },
  track(slug, kind) {
    mutate((db) => { db.hits.push({ slug, kind, device: matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop", at: new Date().toISOString() }); if (db.hits.length > 5000) db.hits.splice(0, 1000); });
  },
};
