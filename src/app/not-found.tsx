import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap py-24">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Nothing here.</h1>
      <p className="mt-3 text-ink-600">The run may have been removed, or the link is wrong.</p>
      <Link href="/#upcoming" className="btn btn-primary mt-6">See all runs</Link>
    </div>
  );
}
