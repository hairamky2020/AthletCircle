import { RUNS } from "@/data/events";
import { formatShort } from "@/lib/runs";
import { RunsExplorer } from "./RunsExplorer";
import { ViewTabs, type View } from "./ViewTabs";

const BUILT_AT = new Date().toISOString();

/** Shared shell for the four views of the run list. */
export function RunsPage({ view, intro }: { view: View; intro?: boolean }) {
  const first = RUNS[0];
  const last = RUNS[RUNS.length - 1];
  return (
    <div className="wrap">
      {intro ? (
        <section className="pb-8 pt-10 md:pt-16">
          <p className="eyebrow">Hyderabad · Running</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">Upcoming runs in Hyderabad</h1>
          {first && (
            <p className="mt-4 max-w-2xl text-lg text-ink-600">
              {RUNS.length} runs from {formatShort(first.date)} {first.date.slice(0, 4)} to {formatShort(last.date)} {last.date.slice(0, 4)}. Pick a month, look at the calendar, or find the ones closest to you.
            </p>
          )}
        </section>
      ) : (
        <h1 className="pb-6 pt-10 text-3xl font-bold tracking-tight md:text-4xl">
          {view === "calendar" ? "Run calendar" : view === "map" ? "Runs on the map" : "All runs"}
          <span className="ml-3 align-middle font-mono text-sm font-normal text-ink-500">Hyderabad</span>
        </h1>
      )}
      <ViewTabs active={view} />
      <RunsExplorer runs={RUNS} view={view} builtAt={BUILT_AT} />
    </div>
  );
}
