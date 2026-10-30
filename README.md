# AthletCircle

India's sports event discovery website. Phase 1 is a fast static site: no database, no server, free maps.

## What it does

- **Sports near me**: tap to use your location (or pick a city, area or PIN), choose a radius of 5 to 200 KM, and see events sorted by distance. Distances are straight-line ("as the crow flies") unless marked as road distance.
- **Map**: free OpenStreetMap tiles (OpenFreeMap) with sport icons, clusters, radius ring and "Search this area".
- **Road distance**: on event pages, from the free OSRM server, labelled "by car, without live traffic". If the server can't answer, nothing is shown; nothing is guessed.
- **Search and filters**: sport, city, date, level, price, registration open, sorted by date or distance. Filters live in the URL so searches can be shared.
- **Calendar**: month, week and list views with registration deadlines; add any event to Google Calendar or download an .ics file.
- **Landing pages** for every state, city, city + sport, locality and "this weekend in {city}", plus sport and organiser pages. Thin pages are kept out of the sitemap and marked noindex.
- **List your event** form (email or Formspree) and an internal **event entry helper** at `/tools/event-builder` that outputs validated JSON.

Privacy: location is asked only when the visitor taps. Only a rounded location (about 1 KM) is remembered on their device; nothing is sent to us.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static site in out/
npm start            # serve out/ locally
npm run build:offline # copy in out-offline/ that opens by double-clicking index.html
```

Checks: `npm run typecheck`, `npm test` (unit tests), `npm run test:e2e` (browser smoke test against a running `npm start`).

## Adding real events

Events live in `content/events.json` and organisers in `content/organisers.json`. Every record is checked at build time, so a bad record fails the build rather than reaching the site.

An event is shown only when **both** are true:
- `verification.verified` is `true` and at least one source is listed (the official page you checked), and
- `venue.pinVerified` is `true` (you confirmed the map pin is on the venue).

Three ways to add events:
1. **Entry helper**: run the site, open `/tools/event-builder`, fill the form, copy the JSON into `content/events.json`.
2. **Spreadsheet**: fill `content/templates/events-template.csv`, then `npm run import:csv -- path/to/file.csv` (add `--dry-run` to check first). Rows are matched by `slug`, so re-importing updates them.
3. **By hand** in the JSON file.

Run `npm run validate:data` to see how many records are valid, public and hidden, and why.

Never add an event you haven't confirmed from the organiser's own page, and always check the registration link opens.

## Demo data

Until real events are added, the site shows demo events marked "(Demo)" with example.com links. Turn them off by building with `NEXT_PUBLIC_SHOW_DEMO=false` (see `.env.example`). Demo events are never put in the sitemap or event schema.

## Deploy for free

The build is plain files in `out/`, so any static host works:
- **Cloudflare Pages** or **Netlify**: build command `npm run build`, output folder `out`.
- **Vercel**: import the repo; it detects Next.js.

Set `NEXT_PUBLIC_SITE_URL` to your domain and `NEXT_PUBLIC_SHOW_DEMO=false` once real events are in. Rebuild once a day (a scheduled deploy hook) so "this weekend" pages and past events stay fresh; lists also re-check dates in the visitor's browser.

## Later phases

The data layer (`src/data/events.ts`) is the only place that reads events, so it can be switched to an API or database without touching pages. A PostGIS schema for that is drafted in `docs/future-database-schema.sql`.
