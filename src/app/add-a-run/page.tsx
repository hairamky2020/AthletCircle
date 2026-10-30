import type { Metadata } from "next";
import { AddRunForm } from "@/components/runs/AddRunForm";

export const metadata: Metadata = { title: "Add a run", description: "Organising a run in Hyderabad? Send us the details and we’ll list it.", alternates: { canonical: "/add-a-run" } };

export default function AddRunPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Add a run</h1>
      <p className="mb-8 mt-3 max-w-xl text-lg text-ink-600">Organising a run in Hyderabad, or know one we’ve missed? Send the details. We check every listing before it goes up, and it’s free.</p>
      <AddRunForm />
    </div>
  );
}
