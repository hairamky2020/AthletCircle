import type { Metadata } from "next";
import { RunsPage } from "@/components/runs/RunsPage";

export const metadata: Metadata = { title: "All runs in Hyderabad", description: "Every upcoming run in Hyderabad in one list, with dates and areas.", alternates: { canonical: "/list" } };

export default function ListPage() {
  return <RunsPage view="list" />;
}
