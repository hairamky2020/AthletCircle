#!/usr/bin/env bash
# Runs the migration, seed and workflow/RLS checks against a throwaway local Postgres 16.
set -euo pipefail
B=${PG_BIN:-/usr/lib/postgresql/16/bin}; D=$(mktemp -d /var/tmp/acdb.XXXX); chown postgres "$D" 2>/dev/null || true
su postgres -c "$B/initdb -D $D/data -A trust >/dev/null && $B/pg_ctl -D $D/data -o '-k $D -p 5498' -l $D/log start >/dev/null"; sleep 2
P="psql -h $D -p 5498 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "create database t"; for f in supabase/tests/00_supabase_stub.sql supabase/migrations/*.sql supabase/seed.sql supabase/tests/10_workflow.sql; do cp "$f" "$D/x.sql"; $P -d t -f "$D/x.sql"; done
su postgres -c "$B/pg_ctl -D $D/data stop >/dev/null"; rm -rf "$D"
