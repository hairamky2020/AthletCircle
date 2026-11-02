// One interface, two adapters: Supabase (real) and Demo (in-browser, for trying the flows
// before the Supabase project exists). Pages only talk to this interface.
import type { EventDetails } from "@/data/details";

export type Role = "organizer" | "reviewer" | "editor" | "super_admin";
export type Status = "pending_review" | "approved" | "rejected" | "published" | "archived";
export const STATUS_LABEL: Record<Status, string> = {
  pending_review: "Pending Review", approved: "Approved", rejected: "Rejected", published: "Published", archived: "Archived",
};

export type User = { id: string; email: string; role: Role; name: string };

export type Submission = {
  id: string;
  slug: string;
  title: string;
  sport: string;
  city: string;
  area?: string;
  venue?: string;
  startDate: string;
  startTime?: string;
  distances: string[];
  registrationUrl?: string;
  websiteUrl?: string;
  feeNote?: string;
  prizeNote?: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  source: string;
  status: Status;
  rejectReason?: string;
  featuredRank?: number | null;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
  details?: EventDetails;
};

export type SubmissionInput = Omit<Submission, "id" | "slug" | "status" | "rejectReason" | "featuredRank" | "submittedBy" | "createdAt" | "updatedAt" | "details">;

export type AuditEntry = { at: string; actor: string; action: string; target: string; detail?: string };
export type Interaction = "view" | "register_click" | "calendar_add" | "share" | "save" | "ad_click";

export type Metrics = {
  byStatus: Partial<Record<Status, number>>;
  submissions: number;
  avgReviewHours: number | null;
  interactions: Partial<Record<Interaction, number>>;
  devices: Record<string, number>;
  topEvents: { slug: string; views: number; registerClicks: number }[];
  missingDetails: number;
  emails: Record<string, number>;
  dbBytes: number | null;
};

export interface Backend {
  mode: "supabase" | "demo";
  currentUser(): Promise<User | null>;
  signIn(email: string, demoRole?: Role): Promise<{ sent: boolean } | User>;
  signOut(): Promise<void>;
  mySubmissions(): Promise<Submission[]>;
  submit(input: SubmissionInput): Promise<Submission>;
  updateSubmission(id: string, input: SubmissionInput): Promise<Submission>;
  // staff
  listEvents(status?: Status): Promise<Submission[]>;
  setStatus(id: string, to: Status, reason?: string): Promise<void>;
  setFeatured(id: string, rank: number | null): Promise<void>;
  audit(limit?: number): Promise<AuditEntry[]>;
  users(): Promise<User[]>;
  setRole(userId: string, role: Role): Promise<void>;
  metrics(from: string, to: string): Promise<Metrics>;
  updateDetails(id: string, details: EventDetails): Promise<void>;   // editor / super admin
  sportSchema(slug: string): Promise<Record<string, unknown>>;
  setSportSchema(slug: string, schema: Record<string, unknown>): Promise<void>; // editor / super admin
  // public
  track(slug: string, kind: Interaction): void;
}

/** Role rules, mirrored from set_event_status() in the database (the database is the real gate). */
export function canMoveTo(role: Role | undefined, from: Status, to: Status) {
  if (!role || role === "organizer") return false;
  if (to === "approved" || to === "rejected") return from === "pending_review" || (from === "rejected" && to === "approved");
  if (role === "reviewer") return false;
  if (to === "published") return from === "approved" || from === "archived";
  if (to === "archived") return from === "published";
  return false;
}

export function slugify(title: string, date: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base}-${date.slice(0, 4)}`;
}
