-- Rich event details and admin-configurable sport fields.
-- events.details holds optional sections (categories with fees, prizes, schedule, facilities, rules,
-- organizer contact, gallery, FAQs, sport-specific values). Shape: src/data/details.ts.
-- sports.field_schema is a small JSON Schema that admins edit to add sport-specific fields without
-- code changes. Every change is written to audit_log by the existing audit triggers.

alter table events add column if not exists details jsonb not null default '{}'::jsonb;
alter table events add column if not exists provenance text not null default 'organizer'
  check (provenance in ('public','organizer'));
alter table sports add column if not exists field_schema jsonb not null default '{}'::jsonb;

create trigger audit_sports after insert or update or delete on sports for each row execute function audit_row();

-- Only staff can mark a section as independently verified, or change provenance.
create or replace function guard_event_details() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_staff() then return new; end if;
  if tg_op = 'INSERT' then
    new.details := jsonb_set(coalesce(new.details, '{}'), '{verified}', '[]');
    new.provenance := 'organizer';
  else
    new.details := jsonb_set(coalesce(new.details, '{}'), '{verified}', coalesce(old.details->'verified', '[]'));
    new.provenance := old.provenance;
  end if;
  return new;
end $$;
create trigger guard_event_details before insert or update on events for each row execute function guard_event_details();

-- Public update history for one event (dates and which fields changed; no actor identities).
create or replace function event_history(p_slug text)
returns table (at timestamptz, fields text[]) language sql stable security definer set search_path = public as $$
  select a.at, array(select k from jsonb_object_keys(a.after) k
                     where k not in ('updated_at') and a.before is not null and (a.before->k) is distinct from (a.after->k)) as fields
  from audit_log a join events e on a.table_name = 'events' and a.row_id = e.id::text
  where e.slug = p_slug and e.status = 'published' and a.action = 'update'
  order by a.at desc limit 20;
$$;
grant execute on function event_history(text) to anon, authenticated;
