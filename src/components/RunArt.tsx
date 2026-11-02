// Illustrated event banner, drawn in SVG from the run's name and type. No photos, so no licensing
// questions and every card looks consistent. Only brand colours plus a few tints.
import type { Run } from "@/data/schema";

type Theme = "night" | "forest" | "lake" | "campus" | "monument" | "heart" | "shield" | "women" | "paint" | "winter" | "temple" | "finance" | "festive" | "hands" | "city";

const RULES: [RegExp, Theme][] = [
  [/hallowe|night|moon/i, "night"],
  [/forest|trail|green/i, "forest"],
  [/ultra|gandipet|lake/i, "lake"],
  [/\biit\b|campus|university|college/i, "campus"],
  [/equity|equality|statue/i, "monument"],
  [/child|health|rehab|premie|heart|cancer/i, "heart"],
  [/suraksha|safety|police|army/i, "shield"],
  [/women|woman|pink|she/i, "women"],
  [/paint|colou?r|holi|red/i, "paint"],
  [/winter|cool|snow/i, "winter"],
  [/krishna|temple|spiritual|yoga/i, "temple"],
  [/\bfin|money|bank|wealth/i, "finance"],
  [/ethnic|culture|saree|heritage/i, "festive"],
  [/sign/i, "hands"],
];

export function runTheme(run: Pick<Run, "title" | "area" | "kind">): Theme {
  const text = `${run.title} ${run.area ?? ""}`;
  for (const [re, t] of RULES) if (re.test(text)) return t;
  return "city";
}

const SKY: Record<Theme, [string, string]> = {
  night: ["#10284B", "#24407A"], forest: ["#E9F8DF", "#C9EDB4"], lake: ["#FFE3BF", "#EDF4FF"], campus: ["#EDF4FF", "#D6E7FF"],
  monument: ["#FFF1DE", "#FFE0B8"], heart: ["#FFF0E3", "#FFE1EA"], shield: ["#E6F0FF", "#CFE2FF"], women: ["#F3E8FF", "#FFE7D1"],
  paint: ["#FFF4E8", "#FFE9E9"], winter: ["#EAF4FF", "#D7E9FF"], temple: ["#FFF3E0", "#FFE2BD"], finance: ["#EAF7E3", "#EDF4FF"],
  festive: ["#FFF1DE", "#EDF4FF"], hands: ["#EDF4FF", "#FFF1DE"], city: ["#FFF1DE", "#EDF4FF"],
};

function Scene({ t }: { t: Theme }) {
  switch (t) {
    case "night":
      return <g><circle cx="300" cy="34" r="18" fill="#FFE7B0" /><circle cx="308" cy="28" r="16" fill="#24407A" />
        {[[40, 20], [90, 40], [150, 18], [230, 30], [360, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" />)}
        <path d="M70 60q6-6 12 0q6-6 12 0q-6-2-12 4q-6-6-12-4Z" fill="#FF8A00" /><path d="M200 46q5-5 10 0q5-5 10 0q-5-2-10 3q-5-5-10-3Z" fill="#FF8A00" />
        <g fill="#FF8A00"><ellipse cx="340" cy="104" rx="16" ry="13" /><rect x="338" y="88" width="4" height="6" fill="#36B900" /></g>
        <g fill="#10284B"><path d="M332 100l4 3-4 3ZM348 100l-4 3 4 3Z" /></g></g>;
    case "forest":
      return <g>{[30, 70, 115, 250, 295, 345].map((x, i) => <g key={i}><rect x={x - 2} y={78 + (i % 2) * 6} width="4" height="22" fill="#7A4B22" /><path d={`M${x} ${36 + (i % 2) * 10}l-18 46h36Z`} fill={i % 2 ? "#36B900" : "#15803D"} /></g>)}</g>;
    case "lake":
      return <g><circle cx="300" cy="46" r="20" fill="#FF8A00" opacity=".85" /><path d="M0 92 70 40l50 34 60-48 80 66 50-30 70 40v30H0Z" fill="#10284B" opacity=".85" />
        <path d="M120 74l60-48 40 32" fill="none" stroke="#fff" strokeWidth="3" opacity=".6" /><rect y="96" width="380" height="14" fill="#0866E9" opacity=".55" />
        <path d="M30 103h40M150 101h60M260 104h50" stroke="#fff" strokeWidth="2" opacity=".7" /></g>;
    case "campus":
      return <g fill="#10284B"><rect x="120" y="50" width="140" height="56" /><path d="M110 52 190 20l80 32Z" />
        {[136, 162, 188, 214, 240].map((x) => <rect key={x} x={x} y="60" width="10" height="40" fill="#EDF4FF" />)}
        <rect x="30" y="70" width="60" height="36" opacity=".6" /><rect x="300" y="64" width="54" height="42" opacity=".6" /><path d="M175 28h30l-15-8Z" fill="#FF8A00" /></g>;
    case "monument":
      return <g><rect x="160" y="86" width="60" height="20" fill="#10284B" /><rect x="170" y="72" width="40" height="14" fill="#10284B" />
        <path d="M190 18c9 0 14 8 14 16 10 4 16 14 16 24v14h-60V58c0-10 6-20 16-24 0-8 5-16 14-16Z" fill="#C2410C" /><circle cx="190" cy="16" r="6" fill="#C2410C" />
        <circle cx="190" cy="40" r="44" fill="none" stroke="#FF8A00" strokeWidth="2" opacity=".35" /></g>;
    case "heart":
      return <g><path d="M190 96s-44-26-44-54a22 22 0 0 1 44-6 22 22 0 0 1 44 6c0 28-44 54-44 54Z" fill="#FF8A00" />
        <path d="M120 58h40l8-14 12 28 10-20 8 6h62" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M60 40c0-6 8-10 12-4 4-6 12-2 12 4 0 8-12 14-12 14s-12-6-12-14Z" fill="#0866E9" opacity=".6" /></g>;
    case "shield":
      return <g><path d="M190 14 230 28v28c0 28-18 44-40 52-22-8-40-24-40-52V28Z" fill="#0866E9" /><path d="m172 58 12 12 24-26" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="64" width="80" height="10" rx="5" fill="#FF8A00" opacity=".5" /><rect x="260" y="64" width="80" height="10" rx="5" fill="#36B900" opacity=".5" /></g>;
    case "women":
      return <g><circle cx="190" cy="44" r="24" fill="none" stroke="#7C3AED" strokeWidth="7" /><path d="M190 68v30M176 84h28" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" />
        {[[70, 40, "#FF8A00"], [310, 50, "#0866E9"], [110, 80, "#36B900"]].map(([x, y, c], i) => <g key={i} fill={c as string}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x as number} cy={(y as number) - 8} rx="5" ry="9" transform={`rotate(${a} ${x} ${y})`} />)}<circle cx={x as number} cy={y as number} r="4" fill="#fff" /></g>)}</g>;
    case "paint":
      return <g>{[[80, 40, 30, "#DC2626"], [190, 30, 36, "#FF8A00"], [300, 46, 28, "#0866E9"], [140, 74, 20, "#36B900"], [250, 78, 22, "#DC2626"]].map(([x, y, r, c], i) =>
        <g key={i} fill={c as string} opacity=".85"><circle cx={x as number} cy={y as number} r={r as number} /><circle cx={(x as number) + (r as number)} cy={(y as number) + 8} r="6" /><circle cx={(x as number) - (r as number) - 4} cy={(y as number) - 6} r="4" /></g>)}</g>;
    case "winter":
      return <g stroke="#0866E9" strokeWidth="3" strokeLinecap="round">{[[70, 36], [190, 26], [310, 44], [130, 70], [260, 76]].map(([x, y], i) =>
        <g key={i} opacity={i % 2 ? .5 : .85}>{[0, 60, 120].map((a) => <path key={a} d={`M${x - 12} ${y}h24`} transform={`rotate(${a} ${x} ${y})`} />)}</g>)}</g>;
    case "temple":
      return <g fill="#C2410C"><path d="M150 106V74h80v32Z" /><path d="M158 74l8-16h48l8 16Z" /><path d="M166 58l6-14h36l6 14Z" /><path d="M172 44l5-12h26l5 12Z" /><path d="M186 32l4-12 4 12Z" />
        <path d="M182 106V92a8 8 0 0 1 16 0v14Z" fill="#FFF1DE" /><path d="M60 106V84h30v22ZM290 106V84h30v22Z" opacity=".55" /><circle cx="300" cy="34" r="16" fill="#FF8A00" opacity=".5" /></g>;
    case "finance":
      return <g><path d="M60 90 130 66l50 12 70-36 70-14" fill="none" stroke="#36B900" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {[[90, 92], [120, 84], [150, 92]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="16" ry="6" fill="#FF8A00" /><ellipse cx={x} cy={y - 6} rx="16" ry="6" fill="#FFB547" /></g>)}
        <path d="m300 22 20-2-6 18" fill="none" stroke="#36B900" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></g>;
    case "festive":
      return <g><path d="M0 18q95 30 190 0t190 0" fill="none" stroke="#10284B" strokeWidth="2" />
        {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${18 + i * 34} ${22 + Math.sin(i) * 3}l10 20 10-20Z`} fill={["#FF8A00", "#0866E9", "#36B900"][i % 3]} />)}
        <circle cx="190" cy="72" r="22" fill="none" stroke="#FF8A00" strokeWidth="4" strokeDasharray="4 4" /><circle cx="190" cy="72" r="10" fill="#0866E9" /></g>;
    case "hands":
      return <g><rect x="120" y="22" width="80" height="44" rx="14" fill="#0866E9" /><path d="M140 66l-6 16 20-16Z" fill="#0866E9" />
        <rect x="190" y="40" width="80" height="44" rx="14" fill="#FF8A00" /><path d="M250 84l6 16-20-16Z" fill="#FF8A00" />
        {[150, 165, 180].map((x) => <circle key={x} cx={x} cy="44" r="4" fill="#fff" />)}{[220, 235, 250].map((x) => <circle key={x} cx={x} cy="62" r="4" fill="#fff" />)}</g>;
    default: // city: Hyderabad-style skyline with a Charminar-like gateway
      return <g fill="#10284B"><circle cx="300" cy="36" r="18" fill="#FF8A00" opacity=".75" />
        <rect x="20" y="58" width="26" height="48" opacity=".55" /><rect x="50" y="40" width="22" height="66" opacity=".7" /><rect x="76" y="64" width="30" height="42" opacity=".55" />
        <g><rect x="150" y="56" width="80" height="50" /><rect x="146" y="24" width="10" height="82" /><rect x="224" y="24" width="10" height="82" />
          <circle cx="151" cy="22" r="6" /><circle cx="229" cy="22" r="6" /><path d="M172 106V84a18 18 0 0 1 36 0v22Z" fill="#FFF1DE" /><rect x="160" y="62" width="60" height="6" fill="#FF8A00" /></g>
        <rect x="260" y="50" width="24" height="56" opacity=".7" /><rect x="288" y="66" width="34" height="40" opacity=".55" /><rect x="326" y="44" width="22" height="62" opacity=".7" /></g>;
  }
}

function Runner({ x, c, s = 1 }: { x: number; c: string; s?: number }) {
  return (
    <g transform={`translate(${x} 92) scale(${s})`} stroke={c} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="6" cy="-24" r="4" fill={c} stroke="none" /><path d="M4-18 0-6M2-15l8 4 4-6M2-15l-8 2M0-6l8 6 2 10M0-6l-6 6-8 0" />
    </g>
  );
}

export function RunArt({ run, className = "" }: { run: Pick<Run, "title" | "area" | "kind" | "slug">; className?: string }) {
  const t = runTheme(run);
  const [a, b] = SKY[t];
  const id = `g-${run.slug}`;
  const dark = t === "night";
  return (
    <svg viewBox="0 0 380 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Illustration for ${run.title}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <rect width="380" height="120" fill={`url(#${id})`} />
      <Scene t={t} />
      <rect y="106" width="380" height="14" fill={dark ? "#0B1C36" : "#10284B"} opacity={dark ? 1 : .9} />
      <path d="M0 113h380" stroke="#fff" strokeWidth="1.5" strokeDasharray="12 10" opacity=".55" />
      <Runner x={36} c={dark ? "#FFB547" : "#FF8A00"} />
      <Runner x={64} c={dark ? "#9CC3FF" : "#0866E9"} s={0.9} />
      <Runner x={88} c={dark ? "#9BE27A" : "#36B900"} s={0.82} />
    </svg>
  );
}
