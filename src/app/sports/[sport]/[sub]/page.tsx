import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SPORTS } from "@/data/sports";
import { SportPage, sportPageData } from "../SportPage";

export const dynamicParams = false;
export const generateStaticParams = () => SPORTS.filter((s) => s.parent).map((s) => ({ sport: s.parent!, sub: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ sub: string }> }): Promise<Metadata> {
  const d = sportPageData((await params).sub);
  if (!d) return {};
  return {
    title: `${d.sport.name} events in India`,
    description: `Upcoming ${d.sport.name} events across India with dates, venues, distance and registration links.`,
    alternates: { canonical: `/sports/${d.sport.parent}/${d.sport.slug}/` },
    robots: d.events.length < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ sport: string; sub: string }> }) {
  const { sport, sub } = await params;
  const d = sportPageData(sub);
  if (!d || d.sport.parent !== sport) notFound();
  return <SportPage {...d} />;
}
