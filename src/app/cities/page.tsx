import type { Metadata } from "next";
import Link from "next/link";
import { RUNS, SCOPE, listingHref } from "@/data/events";
import { launchCities } from "@/data/locations";

export const metadata: Metadata = { title: "Cities", alternates: { canonical: "/cities" } };

export default function CitiesPage() {
  const cities = launchCities();
  return (
    <div className="wrap pt-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Cities</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-600">We are live in {SCOPE.cityName} and adding more cities soon.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => {
          const live = c.path === SCOPE.city;
          return (
            <li key={c.path} className="rounded-2xl border border-line bg-white p-5">
              <p className="text-lg font-bold">{c.name}</p>
              {live ? <Link href={listingHref()} className="mt-1 inline-block font-semibold text-brand-600">{RUNS.length} {SCOPE.sportName.toLowerCase()} events →</Link>
                    : <p className="mt-1 text-ink-500">Coming soon</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
