import type { Backend } from "./types";
export * from "./types";

/** Supabase when its public URL and anon key are configured, otherwise the in-browser demo. */
export async function getBackend(): Promise<Backend> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (await import("./supabase")).supabaseBackend;
  }
  return (await import("./demo")).demoBackend;
}

/** Fire-and-forget interaction counter for the admin metrics. */
export function track(slug: string, kind: Parameters<Backend["track"]>[1]) {
  if (typeof window === "undefined") return;
  getBackend().then((b) => b.track(slug, kind)).catch(() => {});
}
