-- School vehicles and a week timetable.
-- Two lessons cannot use the same vehicle at overlapping times.

create table public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools (id) on delete restrict,
  name         text not null,
  vehicle_type text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (school_id, name)
);

create index vehicles_school_idx on public.vehicles (school_id) where is_active;

alter table public.training_sessions
  add column vehicle_id uuid references public.vehicles (id) on delete set null;

create index training_sessions_vehicle_idx
  on public.training_sessions (vehicle_id, session_date);

create function app.block_vehicle_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.vehicle_id is null or new.status = 'cancelled' then
    return new;
  end if;
  if new.start_time is null or new.end_time is null then
    raise exception 'A booked vehicle needs a start and end time'
      using errcode = 'invalid_parameter_value';
  end if;
  if exists (
    select 1
    from public.training_sessions s
    where s.vehicle_id = new.vehicle_id
      and s.session_date = new.session_date
      and s.status <> 'cancelled'
      and s.id is distinct from new.id
      and s.start_time < new.end_time
      and new.start_time < s.end_time
  ) then
    raise exception 'That vehicle already has a lesson at this time'
      using errcode = 'exclusion_violation';
  end if;
  return new;
end;
$$;

create trigger block_vehicle_overlap
  before insert or update of vehicle_id, session_date, start_time, end_time, status
  on public.training_sessions
  for each row execute function app.block_vehicle_overlap();

alter table public.vehicles enable row level security;

create policy "vehicles: view" on public.vehicles
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (app.has_permission('view_applicants') or app.has_permission('manage_training'))
  );

create policy "vehicles: manage" on public.vehicles
  for insert to authenticated
  with check (school_id = app.current_school_id() and app.has_permission('manage_training'));

create policy "vehicles: update" on public.vehicles
  for update to authenticated
  using (school_id = app.current_school_id() and app.has_permission('manage_training'))
  with check (school_id = app.current_school_id() and app.has_permission('manage_training'));

grant select, insert, update on public.vehicles to authenticated;
