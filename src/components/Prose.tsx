export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="container-page mt-8 max-w-3xl space-y-4 text-ink-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc [&_a]:font-semibold [&_a]:text-brand-600">{children}</div>;
}
