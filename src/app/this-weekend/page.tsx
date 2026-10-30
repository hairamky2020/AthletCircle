import type { Metadata } from "next";
import Link from "next/link";
import { LiveEventList } from "@/components/events/LiveEventList";
import { upcoming } from "@/data/events";
import { launchCities, placeHref } from "@/data/locations";

export const metadata: Metadata = {
  title: "Sports events this weekend",
  description: "Runs, rides, tournaments and sports events happening this weekend across India.",
  alternates: { canonical: "/this-weekend/" },
};

export default function ThisWeekend() {
  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Sports events this weekend</h1>
      <p className="mt-2 text-ink-600">Saturday and Sunday, across India. By city:{" "}
        {launchCities().map((c, i) => <span key={c.path}>{i > 0 && " · "}<Link className="font-semibold text-brand-600 hover:underline" href={`${placeHref(c.path)}/this-weekend/`}>{c.name}</Link></span>)}
      </p>
      <div className="mt-6">
        <LiveEventList events={upcoming()} filters={{ when: "weekend" }} limit={200} from="weekend"
          empty={<p className="rounded-2xl bg-white p-6 text-ink-600 ring-1 ring-ink-100">No events listed for this weekend yet. <Link className="font-semibold text-brand-600" href="/calendar/">Browse the calendar</Link>.</p>} />
      </div>
    </div>
  );
}
