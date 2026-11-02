# AthletCircle: going live

Everything below is free tier. Nothing here needs a credit card.

## 1. Supabase (database, logins, poster storage)
1. Create a free project at supabase.com (region: Mumbai).
2. SQL editor: run `supabase/migrations/001_init.sql`, then `supabase/seed.sql` (regenerate it any time with `npx tsx scripts/gen-seed.ts`).
3. Sign in once on `/admin` with your email, then in the SQL editor make yourself super admin:
   `update profiles set role = 'super_admin' where email = 'you@example.com';`
   From then on you grant roles from Admin → Users & roles.
4. Copy Project URL and the **anon** key into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never put the service-role key in the site.
5. Auth → URL configuration: add your site URL as a redirect.

Free limits: 500 MB database, 1 GB storage, 50k monthly users. Free projects pause after 7 days with no traffic.

## 2. Email
1. Create a free Brevo account (300 emails/day) or Resend (3,000/month) and verify the sending domain.
2. `supabase functions deploy notify`, then set secrets: `supabase secrets set EMAIL_PROVIDER=brevo EMAIL_API_KEY=... EMAIL_FROM="AthletCircle <events@athletcircle.in>" SITE_URL=https://athletcircle.in`
3. Database → Webhooks: call the `notify` function on INSERT into `public.events` and `public.status_history`.
Every email is logged in `email_log` and counted in Admin → Metrics.

## 3. Hosting
Cloudflare Pages (free, commercial use allowed) or Vercel Hobby (free, non-commercial). Build command `npm run build`, output `out`. Add the env vars above.
New published events appear on the public pages at the next build; schedule a daily deploy hook (free) or trigger one after publishing.

## 4. Maps
MapLibre GL with OpenFreeMap tiles: free, no key, no hard limit, fair use. Change `NEXT_PUBLIC_MAP_STYLE_URL` to switch provider (e.g. MapTiler free 100k loads/month, needs a key; self-hosted Protomaps). Do not point it at tile.openstreetmap.org: its policy forbids app-level use.

## Roles
| Role | Can do |
|---|---|
| Organizer | Submit events, edit while Pending Review or Rejected, see status |
| Reviewer | Approve or reject (reason required) |
| Editor | Also publish, archive, feature on the homepage carousel |
| Super admin | Also change roles |
The database enforces these (row level security and `set_event_status`), not just the screens. Run `bash scripts/test-db.sh` to check.
