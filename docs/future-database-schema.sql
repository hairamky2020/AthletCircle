-- AthletCircle core schema (Phase 1). PostGIS geography points in SRID 4326 (metres for distances).
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE location_type AS ENUM ('country', 'state', 'city', 'locality');
CREATE TYPE event_state AS ENUM (
  'draft', 'pending_verification', 'verified', 'published',
  'completed', 'cancelled', 'postponed', 'rejected'
);
CREATE TYPE event_level AS ENUM ('open', 'amateur', 'professional', 'junior', 'masters');
CREATE TYPE admin_role AS ENUM ('super_admin', 'editor', 'verifier');

-- Country -> state -> city -> locality hierarchy.
CREATE TABLE location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES location(id) ON DELETE RESTRICT,
  type location_type NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  path text NOT NULL UNIQUE,                 -- e.g. 'in/telangana/hyderabad'
  centroid geography(Point, 4326),
  aliases text[] NOT NULL DEFAULT '{}',      -- e.g. {'Bangalore'} for Bengaluru
  is_launch_city boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);
CREATE INDEX location_centroid_gix ON location USING gist (centroid);
CREATE INDEX location_name_trgm ON location USING gin (name gin_trgm_ops);

CREATE TABLE pincode (
  pincode char(6) NOT NULL,
  name text NOT NULL,
  city_id uuid REFERENCES location(id),
  centroid geography(Point, 4326) NOT NULL,
  PRIMARY KEY (pincode, name)
);

-- Sports taxonomy: any depth; admins add sports without code changes.
CREATE TABLE sport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES sport(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🏅',
  colour text NOT NULL DEFAULT '#64748b',
  family text NOT NULL DEFAULT 'other',      -- outdoor | indoor | other
  attribute_schema jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organiser (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  description text,
  website text,
  email text,
  phone text,
  social jsonb NOT NULL DEFAULT '{}',
  is_verified boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A physical place, geocoded and verified once, reused by events (and facilities in Phase 2).
CREATE TABLE venue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  address text NOT NULL,
  city_id uuid NOT NULL REFERENCES location(id),
  locality_id uuid REFERENCES location(id),
  pincode char(6),
  geom geography(Point, 4326),               -- NULL until a pin is set
  geocode_source text,                       -- 'admin', 'ola', 'google', 'nominatim', 'csv'
  geocode_confidence real,
  pin_verified_at timestamptz,
  pin_verified_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX venue_geom_gix ON venue USING gist (geom);
CREATE INDEX venue_city_idx ON venue (city_id);

CREATE TABLE event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  description text,
  banner_url text,
  sport_id uuid NOT NULL REFERENCES sport(id),
  organiser_id uuid REFERENCES organiser(id) ON DELETE SET NULL,
  venue_id uuid REFERENCES venue(id) ON DELETE SET NULL,
  is_online boolean NOT NULL DEFAULT false,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  state event_state NOT NULL DEFAULT 'draft',
  level event_level NOT NULL DEFAULT 'open',
  competition_format text,
  age_min int,
  age_max int,
  is_free boolean NOT NULL DEFAULT false,
  price_min numeric(10,2),
  price_max numeric(10,2),
  currency char(3) NOT NULL DEFAULT 'INR',
  reg_opens_at timestamptz,
  reg_closes_at timestamptz,
  registration_url text,
  website_url text,
  contact_email text,
  contact_phone text,
  social jsonb NOT NULL DEFAULT '{}',
  attributes jsonb NOT NULL DEFAULT '{}',    -- sport-specific, validated by sport.attribute_schema
  is_featured boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,    -- demo rows are never shown when SHOW_DEMO_DATA is off
  seo_title text,
  seo_description text,
  published_at timestamptz,
  last_verified_at timestamptz,
  reg_url_checked_at timestamptz,
  reg_url_status int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) STORED,
  CHECK (end_at IS NULL OR end_at >= start_at)
);
CREATE INDEX event_public_start_idx ON event (start_at) WHERE state IN ('published', 'cancelled', 'postponed');
CREATE INDEX event_sport_idx ON event (sport_id);
CREATE INDEX event_venue_idx ON event (venue_id);
CREATE INDEX event_organiser_idx ON event (organiser_id);
CREATE INDEX event_attr_gin ON event USING gin (attributes);
CREATE INDEX event_tsv_gin ON event USING gin (search_tsv);
CREATE INDEX event_title_trgm ON event USING gin (title gin_trgm_ops);

-- Participation categories within an event: 5K/10K, U-15 singles, Open T20 ...
CREATE TABLE event_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name text NOT NULL,
  sport_id uuid REFERENCES sport(id),
  distance_m int,
  format text,
  gender text,
  age_min int,
  age_max int,
  fee numeric(10,2),
  registration_url text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX event_category_event_idx ON event_category (event_id);

CREATE TABLE event_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'official_site', -- official_site, federation, submission, feed, social, other
  url text NOT NULL,
  note text,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_source_event_idx ON event_source (event_id);

CREATE TABLE admin_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role admin_role NOT NULL DEFAULT 'editor',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE verification_log (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  from_state event_state,
  to_state event_state NOT NULL,
  actor_id uuid REFERENCES admin_user(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_log_event_idx ON verification_log (event_id, created_at DESC);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES admin_user(id),
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public submissions and (later) crawler candidates, before they become events.
CREATE TABLE submission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL DEFAULT 'public_form',  -- public_form, crawler, csv
  payload jsonb NOT NULL,
  contact_name text,
  contact_email text,
  status text NOT NULL DEFAULT 'new',          -- new, converted, rejected, duplicate
  event_id uuid REFERENCES event(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES admin_user(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE duplicate_candidate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_a uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  event_b uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  score real NOT NULL,
  reasons text[] NOT NULL DEFAULT '{}',
  resolution text,                              -- NULL (open), 'not_duplicate', 'merged'
  resolved_by uuid REFERENCES admin_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_a, event_b),
  CHECK (event_a < event_b)
);

CREATE TABLE correction_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  field text,
  message text NOT NULL,
  reporter_email text,
  status text NOT NULL DEFAULT 'open',          -- open, fixed, dismissed
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SEO overrides for landing pages (events carry their own seo_* columns).
CREATE TABLE seo_meta (
  path text PRIMARY KEY,
  title text,
  description text,
  intro text,
  noindex boolean
);

-- Routing results, shared by users in the same ~0.7 km² H3 cell.
CREATE TABLE route_cache (
  origin_cell text NOT NULL,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  mode text NOT NULL,
  distance_m int NOT NULL,
  duration_s int NOT NULL,
  provider text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (origin_cell, event_id, mode)
);

-- Outbound registration clicks: never stores user coordinates.
CREATE TABLE outbound_click (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  page text,
  city_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbound_click_event_idx ON outbound_click (event_id);

-- Product analytics (searches, map interactions) for the KPI dashboard.
CREATE TABLE analytics_event (
  id bigserial PRIMARY KEY,
  kind text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_event_kind_idx ON analytics_event (kind, created_at);

CREATE TABLE newsletter_subscriber (
  email text PRIMARY KEY,
  city_slug text,
  sports text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 1.5 (accounts) tables, created now so the model is ready.
CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  name text,
  home_locality_id uuid REFERENCES location(id),   -- a locality, never a GPS point
  preferred_sports uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE saved_event (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
