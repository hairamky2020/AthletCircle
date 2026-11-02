// Supabase adapter. Uses only the public anon key; Row Level Security and the
// set_event_status / set_featured / set_role / admin_metrics functions enforce every rule.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuditEntry, Backend, Metrics, Role, Status, Submission, SubmissionInput } from "./types";
import { slugify } from "./types";

let client: SupabaseClient | null = null;
function sb() {
  if (!client) client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}
function check<T>(r: { data: T; error: { message: string } | null }): T { if (r.error) throw new Error(r.error.message); return r.data; }

const SELECT = "*, sport:sports(slug), city:locations!events_city_id_fkey(path), area:locations!events_area_id_fkey(name), organizer:organizers(name,email)";
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const toSubmission = (r: Row): Submission => ({
  id: r.id, slug: r.slug, title: r.title, sport: r.sport?.slug, city: r.city?.path, area: r.area?.name ?? undefined, venue: r.venue ?? undefined,
  startDate: r.start_date, startTime: r.start_time?.slice(0, 5) ?? undefined, distances: r.distances ?? [],
  registrationUrl: r.registration_url ?? undefined, websiteUrl: r.website_url ?? undefined, feeNote: r.fee_note ?? undefined, prizeNote: r.prize_note ?? undefined,
  description: r.description ?? undefined, organizerName: r.organizer?.name ?? "Not Announced", organizerEmail: r.organizer?.email ?? "",
  source: r.source, status: r.status, rejectReason: r.reject_reason ?? undefined, featuredRank: r.featured_rank, submittedBy: r.submitted_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

async function ids(input: SubmissionInput) {
  const sport = check(await sb().from("sports").select("id").eq("slug", input.sport).single()) as Row;
  const city = check(await sb().from("locations").select("id").eq("path", input.city).single()) as Row;
  let area: Row | null = null;
  if (input.area) area = (await sb().from("locations").select("id").eq("kind", "area").eq("parent_id", city.id).ilike("name", input.area).maybeSingle()).data;
  return { sport_id: sport.id, city_id: city.id, area_id: area?.id ?? null };
}
const fields = (i: SubmissionInput) => ({
  title: i.title, venue: i.venue || null, start_date: i.startDate, start_time: i.startTime || null, distances: i.distances,
  registration_url: i.registrationUrl || null, website_url: i.websiteUrl || null, fee_note: i.feeNote || null, prize_note: i.prizeNote || null,
  description: i.description || null, source: i.source,
});

export const supabaseBackend: Backend = {
  mode: "supabase",
  async currentUser() {
    const { data } = await sb().auth.getUser();
    if (!data.user) return null;
    const p = (await sb().from("profiles").select("role, display_name").eq("user_id", data.user.id).single()).data as Row | null;
    return { id: data.user.id, email: data.user.email ?? "", role: (p?.role ?? "organizer") as Role, name: p?.display_name ?? "" };
  },
  async signIn(email) {
    check(await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } }));
    return { sent: true };
  },
  async signOut() { await sb().auth.signOut(); },
  async mySubmissions() {
    const { data: u } = await sb().auth.getUser(); if (!u.user) return [];
    return (check(await sb().from("events").select(SELECT).eq("submitted_by", u.user.id).order("created_at", { ascending: false })) as Row[]).map(toSubmission);
  },
  async submit(input) {
    const { data: u } = await sb().auth.getUser(); if (!u.user) throw new Error("Please sign in");
    const org = check(await sb().from("organizers").insert({ user_id: u.user.id, name: input.organizerName, email: input.organizerEmail }).select("id").single()) as Row;
    const row = check(await sb().from("events").insert({ ...fields(input), ...(await ids(input)), slug: slugify(input.title, input.startDate) + "-" + Math.random().toString(36).slice(2, 6), organizer_id: org.id }).select(SELECT).single()) as Row;
    return toSubmission(row);
  },
  async updateSubmission(id, input) {
    return toSubmission(check(await sb().from("events").update({ ...fields(input), ...(await ids(input)) }).eq("id", id).select(SELECT).single()) as Row);
  },
  async listEvents(status?: Status) {
    let q = sb().from("events").select(SELECT).order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return (check(await q) as Row[]).map(toSubmission);
  },
  async setStatus(id, to, reason) { check(await sb().rpc("set_event_status", { p_event: id, p_to: to, p_reason: reason ?? null })); },
  async setFeatured(id, rank) { check(await sb().rpc("set_featured", { p_event: id, p_rank: rank })); },
  async audit(limit = 100): Promise<AuditEntry[]> {
    const rows = check(await sb().from("audit_log").select("*").order("at", { ascending: false }).limit(limit)) as Row[];
    return rows.map((r) => ({ at: r.at, actor: r.actor ?? "system", action: `${r.action} ${r.table_name}`, target: r.after?.title ?? r.before?.title ?? r.row_id ?? "", detail: r.after?.status }));
  },
  async users() {
    return (check(await sb().from("profiles").select("*").order("created_at")) as Row[]).map((p) => ({ id: p.user_id, email: p.email, role: p.role, name: p.display_name }));
  },
  async setRole(userId, role) { check(await sb().rpc("set_role", { p_user: userId, p_role: role })); },
  async metrics(from, to): Promise<Metrics> {
    const m = check(await sb().rpc("admin_metrics", { p_from: from, p_to: to })) as Row;
    return {
      byStatus: m.by_status, submissions: m.submissions, avgReviewHours: m.avg_review_hours, interactions: m.interactions, devices: m.devices,
      topEvents: (m.top_events ?? []).map((t: Row) => ({ slug: t.event_slug, views: t.views, registerClicks: t.register_clicks })),
      missingDetails: m.missing_details, emails: m.emails, dbBytes: m.db_bytes,
    };
  },
  track(slug, kind) {
    void sb().from("event_interactions").insert({ event_slug: slug, kind, device: matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop" });
  },
};
