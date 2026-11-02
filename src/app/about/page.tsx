import type { Metadata } from "next";
import Link from "next/link";
import { SPORT_LIST, SportIcon } from "@/components/SportIcon";
import { LogoIcon } from "@/components/Logo";
import { sportColour } from "@/lib/brand";
import { listingHref } from "@/data/events";

const TITLE = "About AthletCircle | Every Sport. Every Athlete. One Circle.";
const DESC = "Discover AthletCircle, a multi-sport discovery platform connecting athletes, sporting events, organizers and communities. Explore sports opportunities and events around you.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESC, url: "/about", type: "website", images: [{ url: "/brand/icon-512.png", width: 512, height: 512, alt: "AthletCircle logo" }] },
  twitter: { card: "summary", title: TITLE, description: DESC },
};

const HERO_SPORTS = ["running", "cycling", "swimming", "football", "cricket", "badminton"];

const FEATURES = [
  { title: "Discover Events", text: "Find upcoming sporting events across different cities.", icon: "search", c: "#0866E9" },
  { title: "Explore Nearby", text: "Discover events based on location and explore them on an interactive map.", icon: "pin", c: "#36B900" },
  { title: "Compare Events", text: "Explore event dates, categories, registration fees, prize money and venues.", icon: "compare", c: "#FF8A00" },
  { title: "Connect with Communities", text: "Discover sporting clubs, groups and communities.", icon: "people", c: "#0866E9" },
  { title: "Find Your Next Challenge", text: "Explore competitions and sporting opportunities across different disciplines.", icon: "flag", c: "#36B900" },
  { title: "For Organizers", text: "Submit and promote sporting events to reach more participants.", icon: "megaphone", c: "#FF8A00" },
];

const PHASES = [
  { n: 1, title: "Running Events", where: "Hyderabad", live: true },
  { n: 2, title: "Running Events", where: "Across India", live: false },
  { n: 3, title: "Multiple Sports", where: "Across India", live: false },
  { n: 4, title: "Global Sports Discovery", where: "Worldwide", live: false },
];

const PRINCIPLES = [
  { title: "Reviewed before publishing", text: "Organizer submissions are reviewed by our team before they go live.", icon: "check" },
  { title: "Transparent about missing information", text: "If a date, fee or prize isn’t announced, we show “Not Announced” instead of guessing.", icon: "eye" },
  { title: "Official registration links", text: "We link to the organizer’s own registration page when one is published.", icon: "link" },
];

function Glyph({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const d: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" {...p} /><path d="m20 20-4-4" {...p} /></>,
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" {...p} /><circle cx="12" cy="10" r="2.5" {...p} /></>,
    compare: <><path d="M4 6h10M4 12h16M4 18h7" {...p} /></>,
    people: <><circle cx="9" cy="8" r="3" {...p} /><circle cx="17" cy="9" r="2.5" {...p} /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5.5" {...p} /></>,
    flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" {...p} /></>,
    megaphone: <><path d="M3 11v3l12 5V6L3 11ZM15 9a4 4 0 0 1 0 6M6 15l1 5" {...p} /></>,
    check: <><circle cx="12" cy="12" r="9" {...p} /><path d="m8 12 3 3 5-6" {...p} /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" {...p} /><circle cx="12" cy="12" r="3" {...p} /></>,
    link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...p} /></>,
  };
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">{d[name]}</svg>;
}

function SportTile({ slug, big = false }: { slug: string; big?: boolean }) {
  const s = SPORT_LIST.find((x) => x.slug === slug)!;
  return (
    <div className={`ab-tile${big ? " ab-tile-big" : ""}`} style={{ ["--sport" as string]: sportColour(slug) }} role="img" aria-label={`${s.name} illustration`}>
      <SportIcon sport={slug} className="ab-tile-ic" />
      <span>{s.name}</span>
    </div>
  );
}

function MapIllustration() {
  const pins = [[120, 90, "#FF8A00"], [210, 150, "#0866E9"], [300, 80, "#36B900"], [260, 220, "#FF8A00"], [140, 210, "#7C3AED"]] as const;
  return (
    <svg viewBox="0 0 400 300" className="ab-map" role="img" aria-label="Illustration of an event map with coloured pins and a dashed straight-line distance from your area">
      <rect width="400" height="300" rx="16" fill="#EDF4FF" />
      <path d="M0 200 C80 170 140 240 220 200 S340 120 400 150" stroke="#FFFFFF" strokeWidth="14" fill="none" />
      <path d="M90 0 C110 90 70 180 130 300" stroke="#FFFFFF" strokeWidth="10" fill="none" />
      <path d="M260 0 C250 80 300 160 290 300" stroke="#FFFFFF" strokeWidth="8" fill="none" />
      <ellipse cx="330" cy="240" rx="40" ry="24" fill="#CFE3FF" />
      <circle cx="190" cy="120" r="34" fill="#0866E9" fillOpacity=".12" />
      <circle cx="190" cy="120" r="8" fill="#0866E9" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="190" y1="120" x2="300" y2="80" stroke="#10284B" strokeWidth="2" strokeDasharray="5 5" />
      <rect x="210" y="74" width="74" height="22" rx="11" fill="#10284B" />
      <text x="247" y="89" fill="#FFFFFF" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Manrope, sans-serif">≈ 6 km*</text>
      {pins.map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x - 11} ${y - 28})`}><path d="M11 28S0 18 0 11a11 11 0 0 1 22 0c0 7-11 17-11 17Z" fill={c} stroke="#FFFFFF" strokeWidth="2" /><circle cx="11" cy="11" r="4" fill="#FFFFFF" /></g>
      ))}
    </svg>
  );
}

export default function AboutPage() {
  const events = listingHref();
  return (
    <div className="about">
      {/* 1 · Hero */}
      <section className="ab-hero" aria-labelledby="ab-h1">
        <div className="wrap ab-hero-inner">
          <div className="ab-reveal">
            <p className="tagline tagline-dark">Discover. Participate. Achieve.</p>
            <h1 id="ab-h1">Every Sport. Every Athlete. <span className="text-orange">One Circle.</span></h1>
            <p className="ab-lead">AthletCircle is a sports discovery and information platform designed to bring the sporting world closer to everyone.</p>
            <p className="ab-sub">Discover sporting events, explore opportunities, connect with communities and find your next challenge.</p>
            <div className="ab-ctas">
              <Link href="/#upcoming" className="btn-primary">Explore Events</Link>
              <Link href="/submit" className="ab-btn-ghost">List Your Event</Link>
            </div>
          </div>
          <div className="ab-collage" aria-label="Sports on AthletCircle">
            {HERO_SPORTS.map((s) => <SportTile key={s} slug={s} />)}
          </div>
        </div>
      </section>

      {/* 2 · Vision */}
      <section className="wrap ab-section ab-vision" aria-labelledby="ab-vision">
        <div className="ab-vision-mark" aria-hidden="true"><LogoIcon size={112} /></div>
        <div>
          <p className="ab-eyebrow">Our vision</p>
          <h2 id="ab-vision">Bringing the Sporting World Together</h2>
          <p>We believe discovering a sporting event, finding the right opportunity and becoming part of a sports community should be simple.</p>
          <p>Whether you are a runner preparing for your next marathon, a cyclist looking for your next challenge, a swimmer exploring competitions, or someone passionate about cricket, football, badminton or any other sport, AthletCircle aims to be your destination.</p>
          <p className="ab-quote">Our vision is to bring sports events, athletes, organizers and sporting communities together on one platform.</p>
          <ul className="ab-sport-row" aria-label="Sports on our roadmap">
            {SPORT_LIST.map((s) => <li key={s.slug} style={{ ["--sport" as string]: sportColour(s.slug) }}><SportIcon sport={s.slug} className="h-4 w-4" />{s.name}</li>)}
            <li style={{ ["--sport" as string]: "#64748B" }}>+ Other sports</li>
          </ul>
        </div>
      </section>

      {/* 3 · What we do */}
      <section className="ab-band" aria-labelledby="ab-what">
        <div className="wrap ab-section">
          <p className="ab-eyebrow text-center">What we do</p>
          <h2 id="ab-what" className="text-center">Everything Sports. All in One Place.</h2>
          <ul className="ab-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="ab-feature" style={{ ["--accent" as string]: f.c }}>
                <span className="ab-feature-ic"><Glyph name={f.icon} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4 · Journey */}
      <section className="wrap ab-section" aria-labelledby="ab-journey">
        <div className="ab-two">
          <div>
            <p className="ab-eyebrow">Our journey</p>
            <h2 id="ab-journey">Starting Local. Thinking Global.</h2>
            <p>Every big journey starts somewhere.</p>
            <p>We are beginning with running events in Hyderabad, bringing upcoming races, marathons, race categories, venues, registration information and other event details together in one place.</p>
            <p>As we grow, we plan to expand to more cities and introduce more sports, making AthletCircle a comprehensive sports discovery platform.</p>
          </div>
          <ol className="ab-timeline">
            {PHASES.map((p) => (
              <li key={p.n} className={p.live ? "is-live" : ""}>
                <span className="ab-dot" aria-hidden="true">{p.n}</span>
                <div>
                  <p className="ab-phase">Phase {p.n} <span className={p.live ? "ab-pill-live" : "ab-pill-soon"}>{p.live ? "Live now" : "On our roadmap"}</span></p>
                  <p className="ab-phase-title">{p.title} <span>· {p.where}</span></p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="ab-note">Phases 2 to 4 are plans, not features available today.</p>
      </section>

      {/* 5 · Reliable information */}
      <section className="ab-band" aria-labelledby="ab-trust">
        <div className="wrap ab-section">
          <div className="ab-two">
            <div>
              <p className="ab-eyebrow">Reliable information</p>
              <h2 id="ab-trust">Information You Can Rely On</h2>
              <p>We want athletes and sports enthusiasts to make informed decisions.</p>
              <p>Event information on AthletCircle is collected from publicly available announcements and submissions from event organizers. We review submitted information before publishing it.</p>
              <p>We aim to display accurate details about event dates, venues, categories, registration fees, prize money and registration links. When information has not yet been announced or confirmed, we clearly indicate that rather than guessing.</p>
            </div>
            <ul className="ab-principles">
              {PRINCIPLES.map((p) => (
                <li key={p.title}><span className="ab-feature-ic" style={{ ["--accent" as string]: "#36B900" }}><Glyph name={p.icon} /></span><div><h3>{p.title}</h3><p>{p.text}</p></div></li>
              ))}
            </ul>
          </div>
          <p className="ab-disclaimer">Event details can change. Please confirm important information with the official event organizer before registering or travelling.</p>
        </div>
      </section>

      {/* 6 · Nearby */}
      <section className="wrap ab-section" aria-labelledby="ab-near">
        <div className="ab-two ab-two-rev">
          <MapIllustration />
          <div>
            <p className="ab-eyebrow">Around you</p>
            <h2 id="ab-near">Your Next Sporting Challenge Could Be Nearby</h2>
            <p>Finding an event should be easy, wherever you are.</p>
            <p>AthletCircle helps you explore events by location and view their approximate positions on an interactive map. You can discover sporting opportunities around your city and identify how far an event is from your location.</p>
            <p className="ab-small">*Distances are straight-line (as the crow flies), not road distance. Until a venue is announced, a pin marks the event’s area, not the exact start point.</p>
            <p className="ab-privacy"><Glyph name="eye" /> Location sharing is optional. You can browse and discover events without granting location access.</p>
            <Link href="/#nearby" className="btn-tertiary">Find events near me →</Link>
          </div>
        </div>
      </section>

      {/* 7 · Organizers */}
      <section className="wrap ab-section" aria-labelledby="ab-org">
        <div className="ab-org">
          <div>
            <p className="ab-eyebrow">For organizers</p>
            <h2 id="ab-org">Are You Organizing a Sports Event?</h2>
            <p>AthletCircle welcomes sports event organizers, clubs and communities. If you are organizing a marathon, cycling event, swimming competition, badminton tournament, football league or any other sporting event, you can submit your event for consideration.</p>
            <p>Our team reviews submissions before publishing them on the platform. Our goal is to help organizers reach more athletes and sports enthusiasts while making event discovery easier for everyone.</p>
            <Link href="/submit" className="btn-primary mt-2">Submit Your Event</Link>
          </div>
          <div className="ab-org-tiles" aria-hidden="true">
            {["running", "cycling", "swimming", "badminton"].map((s) => <SportTile key={s} slug={s} />)}
          </div>
        </div>
      </section>

      {/* 8 · Closing */}
      <section className="ab-close" aria-labelledby="ab-close">
        <div className="ab-close-icons" aria-hidden="true">{SPORT_LIST.map((s) => <SportIcon key={s.slug} sport={s.slug} className="ab-close-ic" />)}</div>
        <div className="wrap ab-close-inner">
          <h2 id="ab-close">One Platform. Endless Sporting Possibilities.</h2>
          <p>From your first event to your next big achievement, discover more opportunities with AthletCircle.</p>
          <p className="tagline tagline-dark justify-center">Discover. Participate. Achieve.</p>
          <div className="ab-ctas justify-center">
            <Link href={events} className="btn-primary">Explore Events</Link>
            <Link href="/#my-runs" className="ab-btn-ghost">Join the Circle</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
