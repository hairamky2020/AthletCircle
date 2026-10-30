import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { topSports } from "@/data/sports";
import { SportPage, sportPageData } from "./SportPage";

export const dynamicParams = false;
export const generateStaticParams = () => topSports().map((s) => ({ sport: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const d = sportPageData((await params).sport);
  if (!d) return {};
  return {
    title: `${d.sport.name} events in India: upcoming ${d.sport.name.toLowerCase()} competitions`,
    description: `Find upcoming ${d.sport.name.toLowerCase()} events, races and tournaments across India with dates, venues, distance and registration links.`,
    alternates: { canonical: `/sports/${d.sport.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ sport: string }> }) {
  const d = sportPageData((await params).sport);
  if (!d) notFound();
  return <SportPage {...d} />;
}
