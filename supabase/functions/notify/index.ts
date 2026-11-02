// Supabase Edge Function: emails the organizer when an event is submitted or changes status.
// Wire it with a Database Webhook on INSERT into public.status_history and public.events.
// Provider is configurable with secrets (never in frontend code):
//   EMAIL_PROVIDER = brevo | resend      EMAIL_API_KEY = ...      EMAIL_FROM = "AthletCircle <events@athletcircle.com>"
//   SITE_URL = https://athletcircle.com
// Free tiers: Brevo 300 emails/day, Resend 3,000/month (100/day).
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = Deno.env.get("SITE_URL") ?? "";

const TEMPLATES: Record<string, (t: string, extra: { reason?: string; url?: string }) => { subject: string; text: string }> = {
  pending_review: (t) => ({ subject: `We received "${t}"`, text: `Thanks for submitting "${t}" to AthletCircle. Our team will review it and email you.` }),
  approved: (t) => ({ subject: `"${t}" is approved`, text: `"${t}" passed review and will be published shortly.` }),
  rejected: (t, x) => ({ subject: `"${t}" needs changes`, text: `"${t}" was not approved.\n\nReason: ${x.reason}\n\nYou can edit and resubmit it from your organizer page: ${SITE}/submit` }),
  published: (t, x) => ({ subject: `"${t}" is live`, text: `"${t}" is now live on AthletCircle: ${x.url}` }),
  archived: (t) => ({ subject: `"${t}" was archived`, text: `"${t}" has been archived on AthletCircle.` }),
};

async function send(to: string, subject: string, text: string) {
  const provider = Deno.env.get("EMAIL_PROVIDER") ?? "brevo";
  const key = Deno.env.get("EMAIL_API_KEY")!;
  const from = Deno.env.get("EMAIL_FROM") ?? "AthletCircle <events@athletcircle.com>";
  const m = from.match(/^(.*)<(.+)>$/);
  const res = provider === "resend"
    ? await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject, text }) })
    : await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ sender: { name: m?.[1].trim() || "AthletCircle", email: m?.[2] ?? from }, to: [{ email: to }], subject, textContent: text }) });
  return { provider, ok: res.ok, error: res.ok ? null : await res.text() };
}

Deno.serve(async (req) => {
  const body = await req.json();
  const rec = body.record ?? {};
  const eventId = body.table === "events" ? rec.id : rec.event_id;
  const status = body.table === "events" ? "pending_review" : rec.to_status;
  if (body.table === "events" && body.type !== "INSERT") return new Response("skip");
  const { data: e } = await db.from("events").select("title, slug, organizer:organizers(email), city:locations!events_city_id_fkey(path), sport:sports(slug)").eq("id", eventId).single();
  const to = (e as any)?.organizer?.email; // eslint-disable-line
  if (!e || !to || !TEMPLATES[status]) return new Response("no recipient");
  const citySlug = ((e as any).city?.path ?? "").split("/").pop(); // eslint-disable-line
  const url = `${SITE}/${citySlug}/${(e as any).sport?.slug}-events/${e.slug}`; // eslint-disable-line
  const { subject, text } = TEMPLATES[status](e.title, { reason: rec.reason, url });
  const r = await send(to, subject, text);
  await db.from("email_log").insert({ to_email: to, template: status, event_id: eventId, provider: r.provider, status: r.ok ? "sent" : "failed", error: r.error });
  return new Response(r.ok ? "sent" : "failed", { status: r.ok ? 200 : 502 });
});
