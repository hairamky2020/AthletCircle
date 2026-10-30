export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl space-y-4 text-[17px] leading-relaxed text-ink-700 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc">{children}</div>;
}
