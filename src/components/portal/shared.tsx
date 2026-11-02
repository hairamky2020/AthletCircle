"use client";

import { useCallback, useEffect, useState } from "react";
import { getBackend, STATUS_LABEL, type Backend, type Role, type Status, type User } from "@/lib/backend";

export function useBackend() {
  const [be, setBe] = useState<Backend | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const refresh = useCallback(async () => { const b = await getBackend(); setBe(b); setUser(await b.currentUser()); }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { be, user, refresh };
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge s-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function DemoNote({ be }: { be: Backend | null }) {
  if (be?.mode !== "demo") return null;
  return (
    <p className="demo-note">
      <b>Demo mode.</b> Supabase isn&apos;t connected yet, so everything here is stored only in this browser and no emails are sent.
      Once the Supabase keys are added, the same screens use the real database.
    </p>
  );
}

export function SignIn({ be, onDone, staff = false }: { be: Backend; onDone: () => void; staff?: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(staff ? "super_admin" : "organizer");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      const r = await be.signIn(email.trim(), role);
      if ("sent" in r) setSent(true); else onDone();
    } catch (x) { setErr((x as Error).message); }
  }
  if (sent) return <p className="panel">Check your inbox: we sent a sign-in link to <b>{email}</b>.</p>;
  return (
    <form onSubmit={go} className="panel grid max-w-md gap-3">
      <h2 className="text-xl font-bold">{staff ? "Admin sign in" : "Sign in to submit an event"}</h2>
      <p className="text-sm text-ink-500">{be.mode === "demo" ? "Demo: any email works." : "We email you a one-time sign-in link. No password."}</p>
      <label className="grid gap-1 text-sm font-medium">Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" />
      </label>
      {be.mode === "demo" && (
        <label className="grid gap-1 text-sm font-medium">Try as (demo only)
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="field">
            <option value="organizer">Organizer</option><option value="reviewer">Reviewer</option>
            <option value="editor">Editor</option><option value="super_admin">Super admin</option>
          </select>
        </label>
      )}
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      <button className="btn-primary">{be.mode === "demo" ? "Sign in" : "Email me a link"}</button>
    </form>
  );
}
