-- SaaS tenancy controls.
--
-- Every tenant policy already reads app.current_school_id(). Making that
-- function ignore a school whose is_active is false suspends the whole school
-- in one place: tables, storage objects and RPCs all stop returning rows for
-- its users. public.current_profile() stays SECURITY DEFINER and keeps
-- working, so the app can still tell the user why access stopped.
--
-- Only the software owner (service role) can flip is_active. A school admin
-- cannot reactivate their own school, which is the point.

create or replace function app.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
    from public.profiles p
    join public.schools s on s.id = p.school_id
   where p.id = auth.uid()
     and p.is_active
     and s.is_active;
$$;

-- Access state for one school, readable by its own members even while the
-- school is suspended. Used by the app to show the right message.
create or replace function public.current_school_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'school_id', s.id,
           'name', s.name,
           'is_active', s.is_active
         )
    from public.profiles p
    join public.schools s on s.id = p.school_id
   where p.id = auth.uid();
$$;

revoke all on function public.current_school_access() from public, anon;
grant execute on function public.current_school_access() to authenticated;

-- The owner's control plane runs with the service role and needs to change a
-- school's access state and contact details.
grant update on public.schools to service_role;

-- -----------------------------------------------------------------------------
-- Tenant onboarding belongs to the software owner, not to school admins.
--
-- 0005 let any school admin call create_school, so one customer could open
-- tenants on the product. These three functions now answer the service role
-- only; the app gates them behind requirePlatformOwner() before calling.
-- -----------------------------------------------------------------------------
create or replace function public.create_school(
  p_name text,
  p_address text,
  p_phone text,
  p_email text,
  p_settings jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'only the software owner can create a school' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(trim(p_name)) > 120 then
    raise exception 'Enter the school name' using errcode = 'invalid_parameter_value';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email' using errcode = 'invalid_parameter_value';
  end if;
  if p_settings is not null and jsonb_typeof(p_settings) <> 'object' then
    raise exception 'Settings must be an object' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.schools (name, address, contact_phone, email, settings)
  values (
    trim(p_name),
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    v_email,
    coalesce(p_settings, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.school_has_admin(p_school uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.role() = 'service_role'
     and exists (
       select 1
       from public.profiles p
       where p.id = p_user
         and p.school_id = p_school
         and p.role = 'admin'
         and p.is_active
     );
$$;

create or replace function public.delete_empty_school(p_school uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'only the software owner can remove an unused school' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where school_id = p_school) then
    raise exception 'school already has a login' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.schools
    where id = p_school and created_at > now() - interval '15 minutes'
  ) then
    raise exception 'school cannot be removed' using errcode = '42501';
  end if;
  delete from public.schools where id = p_school;
end;
$$;

revoke all on function public.create_school(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.school_has_admin(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_empty_school(uuid) from public, anon, authenticated;
grant execute on function public.create_school(text, text, text, text, jsonb) to service_role;
grant execute on function public.school_has_admin(uuid, uuid) to service_role;
grant execute on function public.delete_empty_school(uuid) to service_role;

-- Table created by an earlier draft and never referenced by the app or by any
-- migration. Dropping it keeps a fresh Supabase project identical to local.
drop table if exists public.school_subscription_payments;

notify pgrst, 'reload schema';
