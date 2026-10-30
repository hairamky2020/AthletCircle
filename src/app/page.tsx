import { RUNS } from "@/data/events";
import { Home } from "@/components/runs/Home";

const BUILT_AT = new Date().toISOString();

export default function HomePage() {
  return <Home runs={RUNS} builtAt={BUILT_AT} />;
}
