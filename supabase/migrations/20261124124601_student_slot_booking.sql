-- Weekly hours an instructor is free, and student booking of those hours.
-- Occupancy is enforced in app.* triggers (same pattern as vehicle overlap).
-- No new functions are created in public.

create table public.instructor_availability (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete restrict,
  instructor_id  uuid not null references public.profiles (id) on delete cascade,
  weekday        smallint not null check (weekday between 0 and 6),
  start_time     time not null,
  end_time       time not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint instructor_availability_time_order check (end_time > start_time),
  unique (instructor_id, weekday, start_time, end_time)
);

create index instructor_availability_school_idx
  on public.instructor_availability (school_id, weekday, instructor_id);

alter table public.instructor_availability enable row level security;

create policy "availability: read school" on public.instructor_availability
  for select to authenticated
  using (school_id = app.current_school_id());

create policy "availability: instructor write own" on public.instructor_availability
  for insert to authenticated
  with check (
    school_id = app.current_school_id()
    and (
      app.is_admin()
      or app.has_permission('manage_training')
      or (instructor_id = auth.uid() and app.is_instructor_only())
    )
  );

create policy "availability: instructor update own" on public.instructor_availability
  for update to authenticated
  using (
    school_id = app.current_school_id()
    and (
      app.is_admin()
      or app.has_permission('manage_training')
      or (instructor_id = auth.uid() and app.is_instructor_only())
    )
  )
  with check (
    school_id = app.current_school_id()
    and (
      app.is_admin()
      or app.has_permission('manage_training')
      or (instructor_id = auth.uid() and app.is_instructor_only())
    )
  );

create policy "availability: instructor delete own" on public.instructor_availability
  for delete to authenticated
  using (
    school_id = app.current_school_id()
    and (
      app.is_admin()
      or app.has_permission('manage_training')
      or (instructor_id = auth.uid() and app.is_instructor_only())
    )
  );

grant select, insert, update, delete on public.instructor_availability to authenticated;
grant select, insert, update, delete on public.instructor_availability to service_role;

-- Occupied hours without learner names, so a student can see what is free.
create view public.instructor_busy_slots as
  select s.id, s.school_id, s.instructor_id, s.session_date, s.start_time, s.end_time
  from public.training_sessions s
  where s.status <> 'cancelled'
    and s.instructor_id is not null
    and s.school_id = app.current_school_id();

grant select on public.instructor_busy_slots to authenticated;

-- Students need to see school instructors in order to pick a slot.
drop policy "profiles: read same school" on public.profiles;
create policy "profiles: read same school" on public.profiles
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (
      (app.current_user_role() is distinct from 'student' and not app.is_instructor_only())
      or id = auth.uid()
      or (
        app.current_user_role() = 'student'
        and is_instructor
        and is_active
      )
      or id in (
        select ts.instructor_id
        from public.training_sessions ts
        where ts.applicant_id = app.current_applicant_id()
          and ts.instructor_id is not null
      )
      or id = (
        select a.assigned_staff_id
        from public.applicants a
        where a.id = app.current_applicant_id()
      )
    )
  );

create function app.block_instructor_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.instructor_id is null or new.status = 'cancelled' then
    return new;
  end if;
  if new.start_time is null or new.end_time is null then
    raise exception 'A booked instructor needs a start and end time'
      using errcode = 'invalid_parameter_value';
  end if;
  if exists (
    select 1
    from public.training_sessions s
    where s.instructor_id = new.instructor_id
      and s.session_date = new.session_date
      and s.status <> 'cancelled'
      and s.id is distinct from new.id
      and s.start_time < new.end_time
      and new.start_time < s.end_time
  ) then
    raise exception 'That instructor already has a lesson at this time'
      using errcode = 'exclusion_violation';
  end if;
  if exists (
    select 1
    from public.training_sessions s
    where s.applicant_id = new.applicant_id
      and s.session_date = new.session_date
      and s.status <> 'cancelled'
      and s.id is distinct from new.id
      and s.start_time < new.end_time
      and new.start_time < s.end_time
  ) then
    raise exception 'You already have a lesson at this time'
      using errcode = 'exclusion_violation';
  end if;
  return new;
end;
$$;

create trigger block_instructor_overlap
  before insert or update of instructor_id, applicant_id, session_date, start_time, end_time, status
  on public.training_sessions
  for each row execute function app.block_instructor_overlap();

create function app.require_instructor_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.instructor_id is null or new.status = 'cancelled' then
    return new;
  end if;
  if new.start_time is null or new.end_time is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.instructor_availability a
    where a.instructor_id = new.instructor_id
      and a.school_id = new.school_id
      and a.is_active
      and a.weekday = extract(dow from new.session_date)::smallint
      and a.start_time = new.start_time
      and a.end_time = new.end_time
  ) then
    -- Staff-created lessons may still use a custom time. Student bookings must
    -- match a published slot. Detect students via created_by role.
    if exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    ) then
      raise exception 'That time is not on the instructor’s available hours'
        using errcode = 'invalid_parameter_value';
    end if;
  end if;
  return new;
end;
$$;

create trigger require_instructor_availability
  before insert or update of instructor_id, session_date, start_time, end_time, status
  on public.training_sessions
  for each row execute function app.require_instructor_availability();

create policy "training: student book own" on public.training_sessions
  for insert to authenticated
  with check (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
    and created_by = auth.uid()
    and app.current_user_role() = 'student'
    and status = 'scheduled'
    and instructor_id is not null
    and start_time is not null
    and end_time is not null
    and session_date >= (timezone('Asia/Kolkata', now()))::date
  );

create policy "training: student reschedule own" on public.training_sessions
  for update to authenticated
  using (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
    and app.current_user_role() = 'student'
    and status = 'scheduled'
    and session_date >= (timezone('Asia/Kolkata', now()))::date
  )
  with check (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
    and app.current_user_role() = 'student'
    and status = 'scheduled'
    and instructor_id is not null
    and start_time is not null
    and end_time is not null
    and session_date >= (timezone('Asia/Kolkata', now()))::date
  );

-- Sample school: publish weekday hours so the demo student can book.
insert into public.instructor_availability (school_id, instructor_id, weekday, start_time, end_time)
select
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000004',
  d.weekday,
  t.start_time,
  t.end_time
from (values (1), (2), (3), (4), (5), (6)) as d(weekday)
cross join (
  values
    ('07:00'::time, '08:00'::time),
    ('08:00'::time, '09:00'::time),
    ('16:00'::time, '17:00'::time),
    ('17:00'::time, '18:00'::time)
) as t(start_time, end_time)
where exists (
  select 1 from public.profiles p
  where p.id = 'b0000000-0000-4000-8000-000000000004' and p.is_instructor
)
on conflict do nothing;
