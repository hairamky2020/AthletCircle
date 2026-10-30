# athletcircle

Upcoming running events in Hyderabad: by month, as a list, on a calendar and on a map. Phase 1 is a fast static site with no database, no server and free maps. The data model already carries sport and city, so more sports and cities can be added later.

## Pages

| URL | What |
| --- | --- |
| `/` | Runs grouped by month, with search, area, month and "nearest to me" filters |
| `/list` | Compact list |
| `/calendar` | Month grid (agenda on phones) |
| `/map` | Map of runs with a known area; runs without a venue are listed beside it |
| `/runs/hitech-marathon-2026` | One page per run: date, place, add to calendar, distance from you, map |
| `/add-a-run` | Form for organisers (email, or a Formspree endpoint) |
| `/about` | How listings, pins and location work |

Filters live in the URL (`/?month=2026-11&area=gachibowli`), so a filtered view can be shared.

## Rules the data follows

- Only announced facts. Unknown start time, distances, fees or links stay empty and the page says "Not announced yet".
- A pin with `"precision": "area"` marks the locality, not the start line, and the site says so.
- Distances are straight-line and labelled that way.
- Visitor location is asked only on tap, stored in the browser rounded to ~1 KM, never sent anywhere.

## Run it

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # static site in out/
npm start                # serve out/ locally
npm run build:offline    # copy in out-offline/ that opens by double-clicking index.html
```

Checks: `npm run typecheck`, `npm test`, `npm run validate:data`, and `BASE=http://localhost:3000 npm run test:e2e` (or `FILE=/abs/path/out-offline npm run test:e2e`).

## Adding or updating runs

Edit `content/events.json`. Each record is validated at build time (see `src/data/schema.ts`):

```json
{
  "slug": "hitech-marathon-2026",
  "title": "Hitech Marathon",
  "date": "2026-11-01",
  "startTime": "05:30",
  "area": "Gachibowli",
  "venue": "GMC Balayogi Athletic Stadium",
  "location": { "lat": 17.4401, "lng": 78.3489, "precision": "venue" },
  "distances": ["5K", "10K", "21.1K"],
  "registrationUrl": "https://…",
  "featured": true,
  "source": "Organiser's Instagram, 2 Nov 2026",
  "added": "2026-10-30"
}
```

Only `slug`, `title`, `date`, `source` and `added` are required. Finished runs drop off the lists automatically (the browser checks today's date), so the file doesn't need cleaning up.

## Deploy for free

`out/` is plain files. Cloudflare Pages or Netlify: build command `npm run build`, output folder `out`. Vercel detects Next.js. These hosts serve clean URLs (`/list` → `list.html`). Set `NEXT_PUBLIC_SITE_URL` to the real domain.

## Later phases

`src/data/events.ts` is the only place that reads events, so it can move to an API or database without touching pages. The sport taxonomy (`src/data/taxonomy.ts`) and India gazetteer (`src/data/gazetteer.ts`) are kept for adding sports and cities. A PostGIS schema is drafted in `docs/future-database-schema.sql`.
