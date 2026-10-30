import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl" aria-hidden>🏟️</p>
      <h1 className="mt-4 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-ink-600">The event may have been removed or the link is wrong.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/search/" className="btn btn-primary">Find events</Link><Link href="/" className="btn btn-ghost">Home</Link></div>
    </div>
  );
}
