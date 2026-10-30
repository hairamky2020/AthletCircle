// Sports taxonomy. Add or edit sports here — no other code changes needed.
// attribute_schema is a small JSON Schema; event pages and the entry helper render fields from it.
export type SportSeed = {
  slug: string;
  name: string;
  icon: string;
  colour: string;
  family: "outdoor" | "indoor" | "other";
  schema?: Record<string, unknown>;
  children?: { slug: string; name: string }[];
};

const enumField = (title: string, values: string[]) => ({ type: "string", title, enum: values });
const multiField = (title: string, values: string[]) => ({ type: "array", title, items: { type: "string", enum: values } });

export const sports: SportSeed[] = [
  {
    slug: "running", name: "Running", icon: "🏃", colour: "#ef4444", family: "outdoor",
    schema: { type: "object", properties: {
      terrain: enumField("Terrain", ["Road", "Trail", "Track", "Mixed"]),
      timing: enumField("Timing", ["Chip timed", "Manual", "Not timed"]),
      certified_course: { type: "boolean", title: "Certified course (AIMS / AFI)" },
      elevation_gain_m: { type: "integer", title: "Elevation gain (m)" },
    } },
    children: [
      { slug: "3k", name: "3K" }, { slug: "5k", name: "5K" }, { slug: "10k", name: "10K" },
      { slug: "half-marathon", name: "Half Marathon" }, { slug: "marathon", name: "Marathon" },
      { slug: "ultra-marathon", name: "Ultra Marathon" }, { slug: "trail-running", name: "Trail Running" },
    ],
  },
  {
    slug: "cycling", name: "Cycling", icon: "🚴", colour: "#f97316", family: "outdoor",
    schema: { type: "object", properties: {
      discipline: enumField("Discipline", ["Road", "MTB", "Gravel", "Track", "Brevet / Audax", "Criterium"]),
      distance_km: { type: "number", title: "Main distance (km)" },
      timing: enumField("Timing", ["Chip timed", "Manual", "Not timed"]),
    } },
    children: [{ slug: "road-cycling", name: "Road Cycling" }, { slug: "mountain-biking", name: "Mountain Biking" }, { slug: "brevet", name: "Brevet / Audax" }],
  },
  {
    slug: "triathlon", name: "Triathlon", icon: "🏊", colour: "#0ea5e9", family: "outdoor",
    schema: { type: "object", properties: {
      distance_type: enumField("Distance", ["Super sprint", "Sprint", "Olympic", "Half (70.3)", "Full (140.6)", "Aquathlon", "Duathlon"]),
      swim_venue: enumField("Swim", ["Pool", "Open water", "None"]),
    } },
  },
  {
    slug: "swimming", name: "Swimming", icon: "🏊‍♀️", colour: "#06b6d4", family: "outdoor",
    schema: { type: "object", properties: {
      water: enumField("Water", ["Pool (25 m)", "Pool (50 m)", "Open water"]),
      strokes: multiField("Strokes", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual medley"]),
    } },
    children: [{ slug: "open-water-swimming", name: "Open Water Swimming" }],
  },
  {
    slug: "football", name: "Football", icon: "⚽", colour: "#22c55e", family: "outdoor",
    schema: { type: "object", properties: {
      format: enumField("Format", ["5-a-side", "6-a-side", "7-a-side", "9-a-side", "11-a-side"]),
      surface: enumField("Surface", ["Natural grass", "Artificial turf", "Indoor"]),
      team_size_max: { type: "integer", title: "Max squad size" },
    } },
    children: [{ slug: "futsal", name: "Futsal" }],
  },
  {
    slug: "cricket", name: "Cricket", icon: "🏏", colour: "#16a34a", family: "outdoor",
    schema: { type: "object", properties: {
      format: enumField("Format", ["T10", "T20", "One-day", "Multi-day", "Box cricket", "Tennis-ball cricket"]),
      ball_type: enumField("Ball", ["Leather", "Tennis", "Tape-ball"]),
      overs: { type: "integer", title: "Overs per side" },
      tournament_type: enumField("Tournament type", ["League", "Knockout", "League + knockout", "Corporate", "School", "Open"]),
    } },
    children: [{ slug: "box-cricket", name: "Box Cricket" }, { slug: "tennis-ball-cricket", name: "Tennis-ball Cricket" }],
  },
  { slug: "hockey", name: "Hockey", icon: "🏑", colour: "#15803d", family: "outdoor" },
  {
    slug: "basketball", name: "Basketball", icon: "🏀", colour: "#ea580c", family: "outdoor",
    schema: { type: "object", properties: { format: enumField("Format", ["5x5", "3x3"]) } },
  },
  { slug: "volleyball", name: "Volleyball", icon: "🏐", colour: "#eab308", family: "outdoor", children: [{ slug: "beach-volleyball", name: "Beach Volleyball" }] },
  {
    slug: "tennis", name: "Tennis", icon: "🎾", colour: "#84cc16", family: "outdoor",
    schema: { type: "object", properties: {
      event_types: multiField("Events", ["Singles", "Doubles", "Mixed doubles"]),
      surface: enumField("Surface", ["Hard", "Clay", "Grass", "Synthetic"]),
      ranking: enumField("Ranking", ["AITA ranking", "Club / open", "None"]),
    } },
  },
  {
    slug: "badminton", name: "Badminton", icon: "🏸", colour: "#8b5cf6", family: "indoor",
    schema: { type: "object", properties: {
      event_types: multiField("Events", ["Singles", "Doubles", "Mixed doubles"]),
      shuttle: enumField("Shuttle", ["Feather", "Nylon"]),
      sanctioned_by: { type: "string", title: "Sanctioned by (association)" },
    } },
  },
  { slug: "kabaddi", name: "Kabaddi", icon: "🤼", colour: "#d97706", family: "outdoor" },
  { slug: "athletics", name: "Athletics", icon: "🏅", colour: "#dc2626", family: "outdoor", children: [{ slug: "track-and-field", name: "Track and Field" }] },
  { slug: "golf", name: "Golf", icon: "⛳", colour: "#059669", family: "outdoor" },
  { slug: "rugby", name: "Rugby", icon: "🏉", colour: "#a16207", family: "outdoor" },
  {
    slug: "adventure-sports", name: "Adventure Sports", icon: "🧗", colour: "#78716c", family: "outdoor",
    children: [{ slug: "trekking", name: "Trekking" }, { slug: "climbing", name: "Climbing" }, { slug: "kayaking", name: "Kayaking" }, { slug: "obstacle-racing", name: "Obstacle Racing" }],
  },
  {
    slug: "table-tennis", name: "Table Tennis", icon: "🏓", colour: "#7c3aed", family: "indoor",
    schema: { type: "object", properties: { event_types: multiField("Events", ["Singles", "Doubles", "Mixed doubles", "Team"]) } },
  },
  {
    slug: "chess", name: "Chess", icon: "♟️", colour: "#334155", family: "indoor",
    schema: { type: "object", properties: {
      time_control: enumField("Time control", ["Classical", "Rapid", "Blitz", "Bullet"]),
      fide_rated: { type: "boolean", title: "FIDE rated" },
      rounds: { type: "integer", title: "Rounds" },
    } },
  },
  { slug: "carrom", name: "Carrom", icon: "🎯", colour: "#b45309", family: "indoor" },
  { slug: "squash", name: "Squash", icon: "🎾", colour: "#4f46e5", family: "indoor" },
  { slug: "gymnastics", name: "Gymnastics", icon: "🤸", colour: "#db2777", family: "indoor" },
  { slug: "boxing", name: "Boxing", icon: "🥊", colour: "#b91c1c", family: "indoor" },
  { slug: "wrestling", name: "Wrestling", icon: "🤼‍♂️", colour: "#9a3412", family: "indoor" },
  {
    slug: "martial-arts", name: "Martial Arts", icon: "🥋", colour: "#1e293b", family: "indoor",
    children: [{ slug: "karate", name: "Karate" }, { slug: "taekwondo", name: "Taekwondo" }, { slug: "judo", name: "Judo" }, { slug: "kalaripayattu", name: "Kalaripayattu" }],
  },
  { slug: "weightlifting", name: "Weightlifting", icon: "🏋️", colour: "#475569", family: "indoor", children: [{ slug: "powerlifting", name: "Powerlifting" }] },
  { slug: "yoga", name: "Yoga", icon: "🧘", colour: "#14b8a6", family: "other" },
  { slug: "crossfit", name: "CrossFit", icon: "💪", colour: "#0f766e", family: "other" },
  { slug: "fitness-competitions", name: "Fitness Competitions", icon: "🏆", colour: "#0d9488", family: "other", children: [{ slug: "hyrox-style-racing", name: "Fitness Racing" }] },
  { slug: "bodybuilding", name: "Bodybuilding", icon: "🏋️‍♂️", colour: "#57534e", family: "other" },
  { slug: "skating", name: "Skating", icon: "⛸️", colour: "#2563eb", family: "other", children: [{ slug: "roller-skating", name: "Roller Skating" }] },
  { slug: "shooting", name: "Shooting", icon: "🎯", colour: "#525252", family: "other", children: [{ slug: "archery", name: "Archery" }] },
  { slug: "esports", name: "E-sports", icon: "🎮", colour: "#9333ea", family: "other" },
  {
    slug: "traditional-sports", name: "Traditional and Indigenous Sports", icon: "🪁", colour: "#c2410c", family: "other",
    children: [{ slug: "kho-kho", name: "Kho Kho" }, { slug: "mallakhamb", name: "Mallakhamb" }, { slug: "silambam", name: "Silambam" }, { slug: "gilli-danda", name: "Gilli Danda" }, { slug: "kite-flying", name: "Kite Flying" }],
  },
];
