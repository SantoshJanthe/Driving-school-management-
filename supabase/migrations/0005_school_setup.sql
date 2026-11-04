-- Operator helpers for opening a new school without SQL.
-- The caller must already be an admin of some school. The new school is a
-- separate tenant: this function does not grant the caller membership in it.

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
  if auth.uid() is null or not app.is_admin() then
    raise exception 'only an admin can create a school' using errcode = 'insufficient_privilege';
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
  select auth.uid() is not null
     and app.is_admin()
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
  if auth.uid() is null or not app.is_admin() then
    raise exception 'only an admin can remove an unused school' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.profiles where school_id = p_school) then
    raise exception 'school already has a login' using errcode = 'insufficient_privilege';
  end if;
  if not exists (
    select 1 from public.schools
    where id = p_school and created_at > now() - interval '15 minutes'
  ) then
    raise exception 'school cannot be removed' using errcode = 'insufficient_privilege';
  end if;
  delete from public.schools where id = p_school;
end;
$$;

revoke all on function public.create_school(text, text, text, text, jsonb) from public;
revoke all on function public.school_has_admin(uuid, uuid) from public;
revoke all on function public.delete_empty_school(uuid) from public;
grant execute on function public.create_school(text, text, text, text, jsonb) to authenticated;
grant execute on function public.school_has_admin(uuid, uuid) to authenticated;
grant execute on function public.delete_empty_school(uuid) to authenticated;
