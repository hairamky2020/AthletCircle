import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RUNS, getRun, scopeParams } from "@/data/events";
import { EventDetails } from "@/components/event/EventDetails";
import { formatLong, formatShort, placeLabel, runHref } from "@/lib/runs";

export const dynamicParams = false;
export const generateStaticParams = () => RUNS.map((r) => ({ ...scopeParams(), slug: r.slug }));

type Params = { params: Promise<{ city: string; listing: string; slug: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const run = getRun((await params).slug);
  if (!run) return {};
  const where = placeLabel(run) ? `${placeLabel(run)}, Hyderabad` : "Hyderabad";
  const title = `${run.title} · ${formatShort(run.date)}`;
  const description = `${run.title} on ${formatLong(run.date)} in ${where}. Categories, fees, prizes, schedule, venue and how to register.`;
  return { title, description, alternates: { canonical: runHref(run.slug) }, openGraph: { title, description, url: runHref(run.slug), type: "website" } };
}


export default async function RunPage({ params }: Params) {
  const run = getRun((await params).slug);
  if (!run) notFound();
  return <EventDetails run={run} />;
}
