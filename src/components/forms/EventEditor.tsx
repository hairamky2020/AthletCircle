"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { SPORTS, schemaFor } from "@/data/sports";
import { allCities, children, getPlace } from "@/data/locations";
import { eventSchema } from "@/data/schema";
import { isInIndia, type LatLng } from "@/lib/geo";
import { SITE } from "@/lib/site";

const PinPicker = dynamic(() => import("@/components/map/PinPicker").then((m) => m.PinPicker), { ssr: false, loading: () => <div className="h-72 rounded-xl bg-ink-100" /> });

type Cat = { name: string; distanceKm: string; ageMin: string; ageMax: string; gender: string; fee: string };
const emptyCat: Cat = { name: "", distanceKm: "", ageMin: "", ageMax: "", gender: "", fee: "" };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const iso = (d: string, t: string) => (d ? `${d}T${t || "06:00"}:00+05:30` : undefined);

// Declared at module scope so inputs keep focus while typing.
function L({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}</label>;
}

/**
 * One form, two uses:
 *  - mode "public": organisers submit an event (sent by email or to a form service for review).
 *  - mode "builder": our team prepares a verified record and copies the JSON into content/events.json.
 */
export function EventEditor({ mode }: { mode: "public" | "builder" }) {
  const cities = useMemo(() => allCities().sort((a, b) => Number(!!b.launch) - Number(!!a.launch) || a.name.localeCompare(b.name)), []);
  const [f, setF] = useState({
    title: "", sport: "running", startDate: "", startTime: "06:00", endDate: "", endTime: "", summary: "", description: "",
    venueName: "", address: "", city: "in/telangana/hyderabad", locality: "", pincode: "",
    registrationUrl: "", websiteUrl: "", regOpens: "", regCloses: "", isFree: false, priceMin: "", priceMax: "",
    level: "open", format: "", ageMin: "", ageMax: "", organiser: "", contactName: "", contactEmail: "", contactPhone: "",
    instagram: "", facebook: "", sources: "", verified: false, featured: false, isOrganiser: true,
  });
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});
  const [cats, setCats] = useState<Cat[]>([]);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [lookup, setLookup] = useState<"idle" | "loading" | "none">("idle");
  const [sent, setSent] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const localities = children(f.city, "locality");
  const centrePlace = getPlace(f.locality ? `${f.city}/${f.locality}` : f.city) ?? getPlace(f.city)!;
  const centre = { lat: centrePlace.lat!, lng: centrePlace.lng! };
  const schema = schemaFor(f.sport).properties ?? {};

  const record = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sources = f.sources.split(/\s+/).filter(Boolean);
    return {
      slug: slugify(`${f.title} ${f.startDate.slice(0, 4)}`),
      title: f.title.trim(),
      sport: f.sport,
      summary: f.summary.trim() || undefined,
      description: f.description.trim() || undefined,
      start: iso(f.startDate, f.startTime),
      end: f.endDate || f.endTime ? iso(f.endDate || f.startDate, f.endTime || "23:00") : undefined,
      status: "scheduled",
      venue: {
        name: f.venueName.trim(), address: f.address.trim(), city: f.city, locality: f.locality || undefined,
        pincode: f.pincode || undefined, lat: pin?.lat, lng: pin?.lng, pinVerified: mode === "builder" ? pinConfirmed : false,
      },
      organiser: f.organiser ? slugify(f.organiser) : undefined,
      level: f.level,
      format: f.format || undefined,
      ageMin: num(f.ageMin), ageMax: num(f.ageMax),
      isFree: f.isFree,
      priceMin: f.isFree ? 0 : num(f.priceMin), priceMax: f.isFree ? 0 : num(f.priceMax) ?? num(f.priceMin),
      registrationOpens: f.regOpens ? iso(f.regOpens, "00:00") : undefined,
      registrationCloses: f.regCloses ? iso(f.regCloses, "23:59") : undefined,
      registrationUrl: f.registrationUrl.trim() || undefined,
      websiteUrl: f.websiteUrl.trim() || undefined,
      contactEmail: f.contactEmail.trim() || undefined,
      contactPhone: f.contactPhone.trim() || undefined,
      social: Object.fromEntries([["instagram", f.instagram], ["facebook", f.facebook]].filter(([, v]) => v.trim())),
      attributes: Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== "" && v !== undefined && !(Array.isArray(v) && !v.length))),
      categories: cats.filter((c) => c.name.trim()).map((c) => ({
        name: c.name.trim(), distanceM: c.distanceKm ? Math.round(Number(c.distanceKm) * 1000) : undefined,
        ageMin: num(c.ageMin), ageMax: num(c.ageMax), gender: c.gender || undefined, fee: num(c.fee),
      })),
      featured: f.featured,
      verification: {
        verified: mode === "builder" ? f.verified : false,
        lastVerified: mode === "builder" && f.verified ? today : undefined,
        sources: sources.length ? sources : f.registrationUrl ? [f.registrationUrl.trim()] : [],
      },
      added: today,
    };
  }, [f, attrs, cats, pin, pinConfirmed, mode]);

  const validation = eventSchema.safeParse(record);
  const issues = validation.success ? [] : validation.error.issues.map((i) => `${i.path.join(".") || "event"}: ${i.message}`);
  const json = JSON.stringify(validation.success ? validation.data : record, null, 2);

  const findPin = async () => {
    const q = [f.venueName, f.address, centrePlace.name, "India"].filter(Boolean).join(", ");
    setLookup("loading");
    try {
      const r = await fetch(`${SITE.geocoderUrl}/search?format=jsonv2&countrycodes=in&limit=1&q=${encodeURIComponent(q)}`);
      const [hit] = (await r.json()) as { lat: string; lon: string }[];
      const p = hit ? { lat: +(+hit.lat).toFixed(6), lng: +(+hit.lon).toFixed(6) } : null;
      if (p && isInIndia(p)) { setPin(p); setPinConfirmed(false); setLookup("idle"); } else setLookup("none");
    } catch { setLookup("none"); }
  };

  const submitPublic = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = process.env.NEXT_PUBLIC_SUBMIT_ENDPOINT;
    const payload = { ...record, contactName: f.contactName, isOrganiser: f.isOrganiser, organiserName: f.organiser };
    if (endpoint) {
      setSent("sending");
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        setSent(r.ok ? "done" : "error");
      } catch { setSent("error"); }
      return;
    }
    const body = `New event submission\n\n${f.title}\n${f.startDate} ${f.startTime}\n${f.venueName}, ${f.address}\nRegistration: ${f.registrationUrl}\nContact: ${f.contactName} ${f.contactEmail} ${f.contactPhone}\n\n--- Data ---\n${JSON.stringify(payload, null, 2)}`;
    window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Event submission: ${f.title}`)}&body=${encodeURIComponent(body)}`;
    setSent("done");
  };

  const input = "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 outline-none focus:border-ink-900";

  if (mode === "public" && sent === "done") {
    return (
      <div className="rounded-2xl bg-green-50 p-6 ring-1 ring-green-200">
        <p className="text-lg font-bold text-green-900">Thanks! Your event is with our team.</p>
        <p className="mt-1 text-green-900">We check the details against the official page, confirm the venue on the map and publish it, usually within 2 working days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={mode === "public" ? submitPublic : (e) => e.preventDefault()} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Event</legend>
        <div className="sm:col-span-2"><L label="Event name *"><input required className={input} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Hyderabad Half Marathon 2026" /></L></div>
        <L label="Sport *">
          <select className={input} value={f.sport} onChange={(e) => { set("sport", e.target.value); setAttrs({}); }}>
            {SPORTS.map((s) => <option key={s.slug} value={s.slug}>{s.parent ? "— " : ""}{s.name}</option>)}
          </select>
        </L>
        <L label="Level">
          <select className={input} value={f.level} onChange={(e) => set("level", e.target.value)}>
            {["open", "amateur", "professional", "junior", "masters"].map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
          </select>
        </L>
        <L label="Start date *"><input required type="date" className={input} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></L>
        <L label="Start time (IST) *"><input required type="time" className={input} value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /></L>
        <L label="End date" hint="For multi-day events"><input type="date" className={input} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></L>
        <L label="End time (IST)"><input type="time" className={input} value={f.endTime} onChange={(e) => set("endTime", e.target.value)} /></L>
        <div className="sm:col-span-2"><L label="Short summary" hint="One or two sentences, max 300 characters"><input maxLength={300} className={input} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></L></div>
        <div className="sm:col-span-2"><L label="Description"><textarea rows={4} className={input} value={f.description} onChange={(e) => set("description", e.target.value)} /></L></div>
        <L label="Competition format" hint="e.g. League + knockout, Swiss 7 rounds"><input className={input} value={f.format} onChange={(e) => set("format", e.target.value)} /></L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Min age"><input type="number" className={input} value={f.ageMin} onChange={(e) => set("ageMin", e.target.value)} /></L>
          <L label="Max age"><input type="number" className={input} value={f.ageMax} onChange={(e) => set("ageMax", e.target.value)} /></L>
        </div>
      </fieldset>

      {Object.keys(schema).length > 0 && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-lg font-bold">{SPORTS.find((s) => s.slug === f.sport)?.name} details</legend>
          {Object.entries(schema).map(([k, fld]) => (
            <L key={k} label={fld.title ?? k}>
              {fld.type === "array" ? (
                <span className="flex flex-wrap gap-2">
                  {(fld.items?.enum ?? []).map((opt) => {
                    const cur = (attrs[k] as string[] | undefined) ?? [];
                    const on = cur.includes(opt);
                    return <button type="button" key={opt} className="chip" aria-pressed={on} onClick={() => setAttrs((a) => ({ ...a, [k]: on ? cur.filter((x) => x !== opt) : [...cur, opt] }))}>{opt}</button>;
                  })}
                </span>
              ) : fld.enum ? (
                <select className={input} value={(attrs[k] as string) ?? ""} onChange={(e) => setAttrs((a) => ({ ...a, [k]: e.target.value }))}>
                  <option value="">Not specified</option>{fld.enum.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : fld.type === "boolean" ? (
                <input type="checkbox" className="h-5 w-5" checked={!!attrs[k]} onChange={(e) => setAttrs((a) => ({ ...a, [k]: e.target.checked }))} />
              ) : fld.type === "number" || fld.type === "integer" ? (
                <input type="number" className={input} value={(attrs[k] as number | undefined) ?? ""} onChange={(e) => setAttrs((a) => ({ ...a, [k]: e.target.value === "" ? undefined : Number(e.target.value) }))} />
              ) : (
                <input className={input} value={(attrs[k] as string) ?? ""} onChange={(e) => setAttrs((a) => ({ ...a, [k]: e.target.value }))} />
              )}
            </L>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-lg font-bold">Categories</legend>
        <p className="mb-3 text-sm text-ink-600">Distances, age groups or divisions (e.g. 5K, 10K; U-15 Singles; Open T20).</p>
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-ink-50 p-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto]">
              {(["name", "distanceKm", "ageMin", "ageMax", "gender", "fee"] as (keyof Cat)[]).map((k) => (
                <input key={k} aria-label={k} placeholder={{ name: "Name", distanceKm: "Distance KM", ageMin: "Min age", ageMax: "Max age", gender: "Gender", fee: "Fee ₹" }[k]}
                  className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" value={c[k]} onChange={(e) => setCats((cs) => cs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
              ))}
              <button type="button" className="rounded-lg px-2 text-ink-500 hover:bg-white" onClick={() => setCats((cs) => cs.filter((_, j) => j !== i))} aria-label="Remove category">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost mt-2 !py-1.5 text-sm" onClick={() => setCats((c) => [...c, { ...emptyCat }])}>+ Add category</button>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Venue</legend>
        <L label="Venue name *"><input required className={input} value={f.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="e.g. GMC Balayogi Stadium" /></L>
        <L label="PIN code"><input inputMode="numeric" pattern="\d{6}" className={input} value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></L>
        <div className="sm:col-span-2"><L label="Address *"><input required className={input} value={f.address} onChange={(e) => set("address", e.target.value)} /></L></div>
        <L label="City *">
          <select className={input} value={f.city} onChange={(e) => { set("city", e.target.value); set("locality", ""); }}>
            {cities.map((c) => <option key={c.path} value={c.path}>{c.name}, {c.parentName}</option>)}
          </select>
        </L>
        <L label="Area / locality" hint={localities.length ? undefined : "Not listed for this city yet"}>
          <select className={input} value={f.locality} onChange={(e) => set("locality", e.target.value)} disabled={!localities.length}>
            <option value="">—</option>{localities.map((l) => <option key={l.path} value={l.path.split("/").pop()}>{l.name}</option>)}
          </select>
        </L>
        <div className="sm:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Venue pin {mode === "builder" ? "*" : "(optional)"}</span>
            <button type="button" className="text-sm font-semibold text-brand-600 hover:underline" onClick={findPin} disabled={lookup === "loading"}>
              {lookup === "loading" ? "Looking up…" : "Suggest from address"}
            </button>
          </div>
          <PinPicker value={pin} centre={pin ?? centre} onChange={(p) => { setPin(p); setPinConfirmed(false); }} />
          <p className="mt-2 text-xs text-ink-500">
            {pin ? `Pin: ${pin.lat}, ${pin.lng}. Drag to adjust.` : "Click the map at the venue entrance."}
            {lookup === "none" && " No match for that address; place the pin by hand."}
          </p>
          {mode === "builder" && pin && (
            <label className="mt-2 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4" checked={pinConfirmed} onChange={(e) => setPinConfirmed(e.target.checked)} />
              I checked this pin against the official venue location
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Registration</legend>
        <div className="sm:col-span-2"><L label="Official registration link *"><input required type="url" className={input} value={f.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} placeholder="https://" /></L></div>
        <L label="Registration opens"><input type="date" className={input} value={f.regOpens} onChange={(e) => set("regOpens", e.target.value)} /></L>
        <L label="Registration closes"><input type="date" className={input} value={f.regCloses} onChange={(e) => set("regCloses", e.target.value)} /></L>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={f.isFree} onChange={(e) => set("isFree", e.target.checked)} /> Free to enter</label>
        {!f.isFree && (
          <div className="grid grid-cols-2 gap-3">
            <L label="Fee from (₹)"><input type="number" className={input} value={f.priceMin} onChange={(e) => set("priceMin", e.target.value)} /></L>
            <L label="Fee up to (₹)"><input type="number" className={input} value={f.priceMax} onChange={(e) => set("priceMax", e.target.value)} /></L>
          </div>
        )}
        <L label="Official website"><input type="url" className={input} value={f.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://" /></L>
        <L label="Instagram"><input type="url" className={input} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" /></L>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Organiser and contact</legend>
        <L label="Organiser name"><input className={input} value={f.organiser} onChange={(e) => set("organiser", e.target.value)} /></L>
        {mode === "public" && <L label="Your name *"><input required className={input} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} /></L>}
        <L label={mode === "public" ? "Your email *" : "Public contact email"}><input required={mode === "public"} type="email" className={input} value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></L>
        <L label="Phone"><input type="tel" className={input} value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></L>
        {mode === "public" && (
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" className="h-4 w-4" checked={f.isOrganiser} onChange={(e) => set("isOrganiser", e.target.checked)} /> I am the organiser or represent them</label>
        )}
      </fieldset>

      {mode === "builder" ? (
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-bold">Verification</legend>
          <L label="Source URLs *" hint="Where you confirmed the details (official page, federation calendar). One per line.">
            <textarea rows={3} className={input} value={f.sources} onChange={(e) => set("sources", e.target.value)} />
          </L>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={f.verified} onChange={(e) => set("verified", e.target.checked)} /> I verified this event on the official source today</label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
          <div className={`rounded-xl p-3 text-sm ${issues.length ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-green-50 text-green-900 ring-1 ring-green-200"}`}>
            {issues.length ? <><strong>Not ready yet:</strong><ul className="mt-1 list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul></> : <strong>Valid. Add this record to content/events.json.</strong>}
            {!issues.length && (!f.verified || !pinConfirmed) && <p className="mt-1">It will stay hidden until “verified” and the pin check are both ticked.</p>}
          </div>
          <div className="relative">
            <pre className="max-h-96 overflow-auto rounded-xl bg-ink-900 p-4 text-xs text-ink-100">{json}</pre>
            <button type="button" className="btn btn-primary absolute right-3 top-3 !py-1.5 text-sm" onClick={() => { void navigator.clipboard.writeText(json + ","); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
        </fieldset>
      ) : (
        <div>
          <button className="btn btn-primary px-8" disabled={sent === "sending"}>{sent === "sending" ? "Sending…" : "Submit event for review"}</button>
          {sent === "error" && <p className="mt-2 text-sm text-red-700">Sending failed. Please email us at {SITE.contactEmail}.</p>}
          {!process.env.NEXT_PUBLIC_SUBMIT_ENDPOINT && <p className="mt-2 text-xs text-ink-500">This opens your email app with the details filled in, addressed to {SITE.contactEmail}.</p>}
        </div>
      )}
    </form>
  );
}
