export function formatPrice(e: { isFree: boolean; priceMin: number | null; priceMax: number | null }): string | null {
  if (e.isFree) return "Free";
  if (e.priceMin == null) return null;
  const f = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return e.priceMax != null && e.priceMax !== e.priceMin ? `${f(e.priceMin)} – ${f(e.priceMax)}` : f(e.priceMin);
}

export function formatCategoryDistance(m: number): string {
  if (m === 21097 || m === 21100) return "21.1 KM";
  if (m === 42195 || m === 42200) return "42.2 KM";
  return m % 1000 === 0 ? `${m / 1000} KM` : `${(m / 1000).toFixed(1)} KM`;
}
