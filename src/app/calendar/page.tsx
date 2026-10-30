import type { Metadata } from "next";
import { RunsPage } from "@/components/runs/RunsPage";

export const metadata: Metadata = { title: "Hyderabad running calendar", description: "Month-by-month calendar of upcoming runs in Hyderabad.", alternates: { canonical: "/calendar" } };

export default function CalendarPage() {
  return <RunsPage view="calendar" />;
}
