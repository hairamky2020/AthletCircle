"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const FIELDS = [
  { name: "title", label: "Name of the run", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "place", label: "Area or venue", placeholder: "e.g. Gachibowli Stadium" },
  { name: "distances", label: "Distances", placeholder: "e.g. 5K, 10K, 21.1K" },
  { name: "link", label: "Registration or website link", type: "url" },
  { name: "email", label: "Your email (so we can check details)", type: "email" },
] as const;

/** Sends to NEXT_PUBLIC_SUBMIT_ENDPOINT (e.g. a free Formspree form) if set, otherwise opens an email. */
export function AddRunForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const endpoint = process.env.NEXT_PUBLIC_SUBMIT_ENDPOINT;
    if (endpoint) {
      setState("sending");
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        setState(r.ok ? "sent" : "error");
      } catch { setState("error"); }
      return;
    }
    const body = FIELDS.map((f) => `${f.label}: ${data[f.name] || "-"}`).join("\n");
    window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`New run: ${data.title}`)}&body=${encodeURIComponent(body)}`;
  };

  if (state === "sent") return <p className="border-l-4 border-ink-900 bg-white px-4 py-3">Thanks. We’ll check the details and add it.</p>;

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      {FIELDS.map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1 block text-sm font-medium">{f.label}{"required" in f && f.required ? "" : <span className="font-normal text-ink-400"> (optional)</span>}</span>
          <input name={f.name} type={"type" in f ? f.type : "text"} required={"required" in f && f.required} placeholder={"placeholder" in f ? f.placeholder : undefined} className="field w-full" />
        </label>
      ))}
      <button className="btn btn-primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send"}</button>
      {state === "error" && <p className="text-sm text-brand-700">That didn’t go through. Please email {SITE.contactEmail}.</p>}
      {!process.env.NEXT_PUBLIC_SUBMIT_ENDPOINT && <p className="text-xs text-ink-500">This opens your email app with the details filled in.</p>}
    </form>
  );
}
