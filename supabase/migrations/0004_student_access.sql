-- Student login for one school.
-- Identity, course, training, fees, and documents stay on the existing tables.
-- This table only links a student auth profile to that applicant.
-- Aadhaar remains last-4 on applicants. There is no full-number column.

create table public.student_accounts (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  school_id    uuid not null references public.schools (id) on delete restrict,
  applicant_id uuid not null unique references public.applicants (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index student_accounts_school_idx on public.student_accounts (school_id);

create function app.guard_student_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_school uuid;
  v_profile_role   public.user_role;
  v_applicant_school uuid;
begin
  select p.school_id, p.role
    into v_profile_school, v_profile_role
  from public.profiles p
  where p.id = new.profile_id;

  select a.school_id
    into v_applicant_school
  from public.applicants a
  where a.id = new.applicant_id;

  if v_profile_role is distinct from 'student' then
    raise exception 'only a student login can be linked to an applicant'
      using errcode = 'insufficient_privilege';
  end if;
  if v_profile_school is distinct from new.school_id
     or v_applicant_school is distinct from new.school_id then
    raise exception 'student, school, and applicant must belong to one school'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger guard_student_account
  before insert or update on public.student_accounts
  for each row execute function app.guard_student_account();

-- Students do not inherit staff permissions, even when metadata omits the JSON.
create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'staff');
begin
  if new.raw_user_meta_data ? 'school_id' then
    insert into public.profiles (id, school_id, full_name, email, phone, role, permissions)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'school_id')::uuid,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data ->> 'phone',
      v_role,
      case
        when v_role = 'student' then '{}'::jsonb
        else coalesce(new.raw_user_meta_data -> 'permissions', app.default_staff_permissions())
      end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function app.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select case
              when role = 'admin' then true
              when role = 'student' then false
              else coalesce((permissions ->> perm)::boolean, false)
            end
       from public.profiles
      where id = auth.uid() and is_active),
    false
  );
$$;

create function app.current_applicant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sa.applicant_id
  from public.student_accounts sa
  join public.profiles p on p.id = sa.profile_id
  where sa.profile_id = auth.uid()
    and p.is_active
    and p.role = 'student';
$$;

create or replace function public.log_event(
  p_action       public.activity_action,
  p_entity_type  text,
  p_entity_id    uuid default null,
  p_applicant_id uuid default null,
  p_details      jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or app.current_school_id() is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  if p_action not in ('document_downloaded', 'login') then
    raise exception 'action % is written by triggers only', p_action
      using errcode = 'invalid_parameter_value';
  end if;
  if app.current_user_role() = 'student'
     and p_action = 'document_downloaded'
     and p_applicant_id is distinct from app.current_applicant_id() then
    raise exception 'students can only record their own document downloads'
      using errcode = 'insufficient_privilege';
  end if;
  insert into public.activity_logs
    (school_id, user_id, applicant_id, action, entity_type, entity_id,
     new_value, ip_address, user_agent)
  values
    (app.current_school_id(), auth.uid(), p_applicant_id, p_action, p_entity_type,
     p_entity_id, p_details, app.request_ip(), app.request_user_agent());
end;
$$;

alter table public.student_accounts enable row level security;

-- Staff and admins still see every colleague in their school.
-- A student sees their own profile, plus the instructor and assigned staff on their record.
drop policy "profiles: read same school" on public.profiles;
create policy "profiles: read same school" on public.profiles
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (
      app.current_user_role() is distinct from 'student'
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

create policy "student_accounts: read" on public.student_accounts
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (profile_id = auth.uid() or app.has_permission('view_applicants'))
  );

create policy "student_accounts: admin insert" on public.student_accounts
  for insert to authenticated
  with check (school_id = app.current_school_id() and app.is_admin());

create policy "student_accounts: admin update" on public.student_accounts
  for update to authenticated
  using (school_id = app.current_school_id() and app.is_admin())
  with check (school_id = app.current_school_id() and app.is_admin());

create policy "student_accounts: admin delete" on public.student_accounts
  for delete to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

create policy "applicants: student read own" on public.applicants
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and id = app.current_applicant_id()
  );

create policy "training: student read own" on public.training_sessions
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
  );

create policy "payments: student read own" on public.payments
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
  );

create policy "documents: student read own" on public.documents
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
  );

create policy "activity: student read own" on public.activity_logs
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
  );

create policy "applicant-documents: student read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = app.current_school_id()::text
    and (storage.foldername(name))[2] = app.current_applicant_id()::text
  );

grant select, insert, update, delete on public.student_accounts to authenticated;
grant execute on function app.current_applicant_id(), app.guard_student_account() to authenticated, service_role;
