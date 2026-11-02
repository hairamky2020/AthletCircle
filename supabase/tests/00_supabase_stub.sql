create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text);
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id serial, bucket_id text);
alter table storage.objects enable row level security;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create role anon; create role authenticated;
