-- An instructor records a vehicle label and coordinates for today's own lesson.
-- There is no live tracker.

create table public.lesson_locations (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools (id) on delete restrict,
  session_id    uuid not null references public.training_sessions (id) on delete cascade,
  vehicle_id    uuid references public.vehicles (id) on delete set null,
  label         text not null check (char_length(label) between 1 and 80),
  latitude      numeric(9,6) not null check (latitude between -90 and 90),
  longitude     numeric(9,6) not null check (longitude between -180 and 180),
  recorded_by   uuid references public.profiles (id) on delete set null,
  recorded_at   timestamptz not null default now()
);

create index lesson_locations_school_idx on public.lesson_locations (school_id, recorded_at desc);
create index lesson_locations_session_idx on public.lesson_locations (session_id, recorded_at desc);

alter table public.lesson_locations enable row level security;

create policy "lesson_locations: admin read" on public.lesson_locations
  for select to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

create policy "lesson_locations: instructor read own" on public.lesson_locations
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and recorded_by = auth.uid()
    and app.is_instructor_only()
  );

create policy "lesson_locations: instructor insert today" on public.lesson_locations
  for insert to authenticated
  with check (
    school_id = app.current_school_id()
    and recorded_by = auth.uid()
    and app.is_instructor_only()
    and exists (
      select 1
      from public.training_sessions ts
      where ts.id = session_id
        and ts.school_id = school_id
        and ts.instructor_id = auth.uid()
        and ts.session_date = (timezone('Asia/Kolkata', now()))::date
    )
  );

grant select, insert on public.lesson_locations to authenticated;
