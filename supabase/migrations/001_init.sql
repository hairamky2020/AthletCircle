-- AthletCircle Phase 1 schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Security model: the browser only ever holds the public anon key. Row Level Security decides
-- what each role can see or change. Status changes go through set_event_status(), which checks
-- the caller's role and writes the audit trail. Public users can never approve or publish.

create extension if not exists pgcrypto;

-- ---------- Taxonomy (data-driven, nothing hardcoded) ----------
create table sports (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, active boolean not null default true
);
create table locations (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,            -- e.g. in/telangana/hyderabad
  slug text not null, name text not null,
  kind text not null check (kind in ('country','state','city','area')),
  parent_id uuid references locations(id),
  lat double precision, lng double precision,
  is_default boolean not null default false, active boolean not null default true
);
create table categories (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references sports(id),
  slug text not null, label text not null,
  min_km numeric, max_km numeric, sort int not null default 0, active boolean not null default true,
  unique (sport_id, slug)
);

-- ---------- People ----------
create type app_role as enum ('organizer','reviewer','editor','super_admin');
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text, email text,
  role app_role not null default 'organizer',
  created_at timestamptz not null default now()
);
create table organizers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), name text not null,
  email text, phone text, website text, verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Events ----------
create type event_status as enum ('pending_review','approved','rejected','published','archived');
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  sport_id uuid not null references sports(id),
  city_id uuid not null references locations(id),
  area_id uuid references locations(id),
  venue text, lat double precision, lng double precision,
  location_precision text check (location_precision in ('venue','area')),
  organizer_id uuid references organizers(id),
  submitted_by uuid references auth.users(id),
  description text,
  start_date date not null, end_date date, start_time time,
  distances text[] not null default '{}',
  registration_url text, website_url text, poster_path text,
  fee_note text, prize_note text,          -- null = "Not Announced"; never guessed
  source text not null,
  status event_status not null default 'pending_review',
  reject_reason text,
  featured_rank int,                        -- non-null = in the homepage carousel, ordered
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index on events (status, start_date);
create table event_categories (
  event_id uuid references events(id) on delete cascade,
  category_id uuid references categories(id),
  primary key (event_id, category_id)
);

-- ---------- Trail, email, ads, metrics ----------
create table status_history (
  id bigserial primary key, event_id uuid references events(id) on delete cascade,
  from_status event_status, to_status event_status not null, reason text,
  actor uuid references auth.users(id), at timestamptz not null default now()
);
create table audit_log (
  id bigserial primary key, actor uuid, action text not null, table_name text not null,
  row_id text, before jsonb, after jsonb, at timestamptz not null default now()
);
create table email_log (
  id bigserial primary key, to_email text not null, template text not null,
  event_id uuid references events(id) on delete set null, provider text, status text, error text,
  at timestamptz not null default now()
);
create table ad_slots (
  key text primary key, label text, image_url text, link_url text,
  active boolean not null default false, starts_on date, ends_on date
);
-- Anonymous interaction counts (no personal data, no IP, no cookies).
create table event_interactions (
  id bigserial primary key,
  event_slug text not null,
  kind text not null check (kind in ('view','register_click','calendar_add','share','save','ad_click')),
  device text check (device in ('mobile','desktop')),
  at timestamptz not null default now()
);
create index on event_interactions (at);

-- ---------- Helpers ----------
create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as
$$ select role from profiles where user_id = auth.uid() $$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(my_role() in ('reviewer','editor','super_admin'), false) $$;

-- New sign-ups become organizers; staff roles are granted only by a super admin.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id, email, display_name) values (new.id, new.email, split_part(new.email,'@',1));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Generic audit trigger.
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, table_name, row_id, before, after)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce((case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
                   (case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'key',
                   (case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'user_id'),
          case when tg_op='INSERT' then null else to_jsonb(old) end,
          case when tg_op='DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger audit_events after insert or update or delete on events for each row execute function audit_row();
create trigger audit_profiles after update on profiles for each row execute function audit_row();
create trigger audit_categories after insert or update or delete on categories for each row execute function audit_row();
create trigger audit_locations after insert or update or delete on locations for each row execute function audit_row();
create trigger audit_ads after insert or update or delete on ad_slots for each row execute function audit_row();

-- Organizers cannot set status, featured or publish dates directly.
create or replace function guard_event_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('ac.status_change', true) = 'on' then return new; end if;
  if tg_op = 'INSERT' and not is_staff() then
    new.status := 'pending_review'; new.featured_rank := null; new.published_at := null;
    new.submitted_by := auth.uid();
  elsif tg_op = 'UPDATE' and not is_staff() then
    if old.status not in ('pending_review','rejected') then raise exception 'Only pending or rejected events can be edited'; end if;
    new.status := 'pending_review'; new.featured_rank := old.featured_rank;
    new.published_at := old.published_at; new.submitted_by := old.submitted_by;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_events before insert or update on events for each row execute function guard_event_fields();

-- The only way to move an event through the workflow.
-- reviewer: approve / reject.  editor and super_admin: also publish, archive, feature.
create or replace function set_event_status(p_event uuid, p_to event_status, p_reason text default null)
returns events language plpgsql security definer set search_path = public as $$
declare r app_role := my_role(); e events; old_status event_status;
begin
  select * into e from events where id = p_event for update;
  if e.id is null then raise exception 'Event not found'; end if;
  old_status := e.status;
  if r is null or r = 'organizer' then raise exception 'Not allowed'; end if;
  if p_to in ('published','archived') and r not in ('editor','super_admin') then raise exception 'Editors only'; end if;
  if p_to = 'rejected' and coalesce(trim(p_reason),'') = '' then raise exception 'A reason is required to reject'; end if;
  if p_to = 'published' and e.status not in ('approved','archived') then raise exception 'Approve before publishing'; end if;
  perform set_config('ac.status_change','on', true);
  update events set status = p_to,
    reject_reason = case when p_to='rejected' then p_reason else null end,
    published_at = case when p_to='published' then now() else published_at end,
    featured_rank = case when p_to in ('published') then featured_rank else null end
  where id = p_event returning * into e;
  insert into status_history (event_id, from_status, to_status, reason, actor)
    values (p_event, old_status, p_to, p_reason, auth.uid());
  return e;
end $$;

create or replace function set_featured(p_event uuid, p_rank int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('editor','super_admin') then raise exception 'Editors only'; end if;
  perform set_config('ac.status_change','on', true);
  update events set featured_rank = p_rank where id = p_event and status = 'published';
end $$;

create or replace function set_role(p_user uuid, p_role app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'super_admin' then raise exception 'Super admin only'; end if;
  update profiles set role = p_role where user_id = p_user;
end $$;

-- Metrics for the admin dashboard (staff only).
create or replace function admin_metrics(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare out jsonb;
begin
  if not is_staff() then raise exception 'Staff only'; end if;
  select jsonb_build_object(
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from events group by status) s),
    'submissions', (select count(*) from events where created_at::date between p_from and p_to),
    'avg_review_hours', (select round(avg(extract(epoch from (h.at - e.created_at))/3600)::numeric, 1)
                          from status_history h join events e on e.id = h.event_id
                          where h.to_status in ('approved','rejected') and h.at::date between p_from and p_to),
    'interactions', (select coalesce(jsonb_object_agg(kind, n), '{}') from (select kind, count(*) n from event_interactions where at::date between p_from and p_to group by kind) i),
    'devices', (select coalesce(jsonb_object_agg(coalesce(device,'unknown'), n), '{}') from (select device, count(*) n from event_interactions where kind='view' and at::date between p_from and p_to group by device) d),
    'top_events', (select coalesce(jsonb_agg(t), '[]') from (select event_slug, count(*) filter (where kind='view') views, count(*) filter (where kind='register_click') register_clicks
                    from event_interactions where at::date between p_from and p_to group by event_slug order by 2 desc limit 10) t),
    'missing_details', (select count(*) from events where status='published' and (registration_url is null or start_time is null or fee_note is null)),
    'emails', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from email_log where at::date between p_from and p_to group by status) m),
    'db_bytes', pg_database_size(current_database())
  ) into out;
  return out;
end $$;

-- ---------- Row Level Security ----------
alter table sports enable row level security;
alter table locations enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;
alter table organizers enable row level security;
alter table events enable row level security;
alter table event_categories enable row level security;
alter table status_history enable row level security;
alter table audit_log enable row level security;
alter table email_log enable row level security;
alter table ad_slots enable row level security;
alter table event_interactions enable row level security;

create policy "public read" on sports for select using (active or is_staff());
create policy "public read" on locations for select using (active or is_staff());
create policy "public read" on categories for select using (active or is_staff());
create policy "staff write" on sports for all using (my_role() in ('editor','super_admin')) with check (my_role() in ('editor','super_admin'));
create policy "staff write" on locations for all using (my_role() in ('editor','super_admin')) with check (my_role() in ('editor','super_admin'));
create policy "staff write" on categories for all using (my_role() in ('editor','super_admin')) with check (my_role() in ('editor','super_admin'));

create policy "own or staff" on profiles for select using (user_id = auth.uid() or is_staff());

create policy "own or staff" on organizers for select using (user_id = auth.uid() or is_staff());
create policy "own insert" on organizers for insert with check (user_id = auth.uid());
create policy "own update" on organizers for update using (user_id = auth.uid() or is_staff());

create policy "published, own or staff" on events for select
  using (status = 'published' or submitted_by = auth.uid() or is_staff());
create policy "signed-in submit" on events for insert with check (auth.uid() is not null);
create policy "own pending or staff edit" on events for update
  using ((submitted_by = auth.uid() and status in ('pending_review','rejected')) or is_staff());
create policy "super admin delete" on events for delete using (my_role() = 'super_admin');

create policy "read with event" on event_categories for select using (true);
create policy "write with event" on event_categories for all
  using (exists (select 1 from events e where e.id = event_id and (e.submitted_by = auth.uid() or is_staff())))
  with check (exists (select 1 from events e where e.id = event_id and (e.submitted_by = auth.uid() or is_staff())));

create policy "own or staff" on status_history for select
  using (is_staff() or exists (select 1 from events e where e.id = event_id and e.submitted_by = auth.uid()));
create policy "staff" on audit_log for select using (is_staff());
create policy "staff" on email_log for select using (is_staff());
create policy "public active" on ad_slots for select using (active or is_staff());
create policy "staff write" on ad_slots for all using (my_role() in ('editor','super_admin')) with check (my_role() in ('editor','super_admin'));
create policy "anyone records" on event_interactions for insert with check (true);
create policy "staff reads" on event_interactions for select using (is_staff());

-- Posters bucket: signed-in users upload, everyone reads.
insert into storage.buckets (id, name, public) values ('posters','posters', true) on conflict do nothing;
create policy "read posters" on storage.objects for select using (bucket_id = 'posters');
create policy "upload posters" on storage.objects for insert with check (bucket_id = 'posters' and auth.uid() is not null);
