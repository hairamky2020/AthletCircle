import Link from "next/link";

export type View = "months" | "list" | "calendar" | "map";

const TABS: { view: View; href: string; label: string }[] = [
  { view: "months", href: "/", label: "By month" },
  { view: "list", href: "/list", label: "List" },
  { view: "calendar", href: "/calendar", label: "Calendar" },
  { view: "map", href: "/map", label: "Map" },
];

export function ViewTabs({ active }: { active: View }) {
  return (
    <nav className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line" aria-label="Views">
      {TABS.map((t) => (
        <Link key={t.view} href={t.href} aria-current={t.view === active ? "page" : undefined}
          className={`-mb-px shrink-0 border-b-2 pb-2.5 text-[15px] ${t.view === active ? "border-ink-900 font-semibold text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
