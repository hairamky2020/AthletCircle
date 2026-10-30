import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/events/Explorer";
import { upcoming } from "@/data/events";
import { sportOptions, cityOptions } from "@/lib/options";

export const metadata: Metadata = {
  title: "Find sports events",
  description: "Search upcoming sports events across India by sport, city, date, distance and registration status.",
  alternates: { canonical: "/search/" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense>
      <Explorer events={upcoming()} sports={sportOptions()} cities={cityOptions()} title="Find sports events" />
    </Suspense>
  );
}
