import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { SITE } from "@/lib/site";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-500">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {it.href && i < all.length - 1 ? <Link href={it.href} className="hover:text-ink-900 hover:underline">{it.name}</Link> : <span className="text-ink-700">{it.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: all.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.href ? { item: SITE.url + it.href } : {}) })),
      }} />
    </>
  );
}
