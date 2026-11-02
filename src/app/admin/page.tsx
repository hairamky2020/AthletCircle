import type { Metadata } from "next";
import { AdminApp } from "@/components/portal/AdminApp";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Admin</h1>
      <AdminApp />
    </div>
  );
}
