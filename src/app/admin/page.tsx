import type { Metadata } from "next";
import { AdminApp } from "@/components/portal/AdminApp";
import { PORTAL_ON } from "@/lib/live";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Admin</h1>
      {PORTAL_ON ? <AdminApp /> : <p className="panel">Admin is not available yet. It turns on when the database is connected.</p>}
    </div>
  );
}
