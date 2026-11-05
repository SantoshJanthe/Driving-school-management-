-- An instructor flag. Combined with no view_applicants permission, the login
-- can see only the lessons they teach, not fees or the rest of the staff.

alter table public.profiles
  add column is_instructor boolean not null default false;

create function app.is_instructor_only()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_instructor
       and p.is_active
       and p.role = 'staff'
       and not coalesce((p.permissions ->> 'view_applicants')::boolean, false)
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$$;

drop policy "profiles: read same school" on public.profiles;
create policy "profiles: read same school" on public.profiles
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (
      (app.current_user_role() is distinct from 'student' and not app.is_instructor_only())
      or id = auth.uid()
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

create policy "training: instructor own" on public.training_sessions
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and instructor_id = auth.uid()
    and app.is_instructor_only()
  );

create policy "training: instructor update own" on public.training_sessions
  for update to authenticated
  using (
    school_id = app.current_school_id()
    and instructor_id = auth.uid()
    and app.is_instructor_only()
  )
  with check (
    school_id = app.current_school_id()
    and instructor_id = auth.uid()
    and app.is_instructor_only()
  );

create policy "applicants: instructor students" on public.applicants
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and app.is_instructor_only()
    and exists (
      select 1
      from public.training_sessions ts
      where ts.applicant_id = applicants.id
        and ts.instructor_id = auth.uid()
    )
  );

grant execute on function app.is_instructor_only() to authenticated, service_role;
