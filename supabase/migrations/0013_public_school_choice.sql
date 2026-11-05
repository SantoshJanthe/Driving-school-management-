-- The public page can name a school. With no id, the oldest active school is used.
-- An enquiry is stored on the school the visitor chose.

drop function if exists public.public_school();

create function public.public_school(p_school uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', s.name,
    'address', s.address,
    'phone', s.contact_phone,
    'email', s.email,
    'has_logo', s.logo_path is not null,
    'packages', coalesce(s.settings -> 'packages', '[]'::jsonb)
  )
  from public.schools s
  where s.is_active
    and (p_school is null or s.id = p_school)
  order by (p_school is not null and s.id = p_school) desc, s.created_at, s.id
  limit 1;
$$;

create function public.public_schools()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', s.id, 'name', s.name)
      order by s.created_at, s.id
    ),
    '[]'::jsonb
  )
  from public.schools s
  where s.is_active;
$$;

drop function if exists public.school_logo_path();

create function public.school_logo_path(p_school uuid default null)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.logo_path
  from public.schools s
  where s.is_active
    and s.logo_path is not null
    and (p_school is null or s.id = p_school)
  order by (p_school is not null and s.id = p_school) desc, s.created_at, s.id
  limit 1;
$$;

drop function if exists public.submit_enquiry(text, text, text, text, text);

create function public.submit_enquiry(
  p_full_name text,
  p_phone text,
  p_email text,
  p_package_code text,
  p_message text,
  p_school uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school uuid;
  v_packages jsonb;
  v_package jsonb;
  v_phone text;
  v_email text;
  v_id uuid;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if v_phone like '91%' and length(v_phone) = 12 then
    v_phone := substring(v_phone from 3);
  elsif v_phone like '0%' and length(v_phone) = 11 then
    v_phone := substring(v_phone from 2);
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a 10-digit Indian mobile number' using errcode = 'invalid_parameter_value';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Enter your name' using errcode = 'invalid_parameter_value';
  end if;
  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email' using errcode = 'invalid_parameter_value';
  end if;

  select s.id, coalesce(s.settings -> 'packages', '[]'::jsonb)
    into v_school, v_packages
  from public.schools s
  where s.is_active
    and (p_school is null or s.id = p_school)
  order by (p_school is not null and s.id = p_school) desc, s.created_at, s.id
  limit 1;
  if v_school is null or (p_school is not null and v_school is distinct from p_school) then
    raise exception 'School is not available' using errcode = 'invalid_parameter_value';
  end if;

  select value into v_package
  from jsonb_array_elements(v_packages) value
  where value ->> 'code' = trim(p_package_code)
  limit 1;
  if v_package is null then
    raise exception 'Choose a course' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.applicants (
    school_id, full_name, phone, email, license_category, total_fee,
    application_status, training_status, notes
  ) values (
    v_school,
    trim(p_full_name),
    v_phone,
    v_email,
    v_package ->> 'name',
    (v_package ->> 'fee')::numeric,
    'enquiry',
    'not_started',
    nullif(left(trim(coalesce(p_message, '')), 1000), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.public_school(uuid) from public;
revoke all on function public.public_schools() from public;
revoke all on function public.school_logo_path(uuid) from public;
revoke all on function public.submit_enquiry(text, text, text, text, text, uuid) from public;
grant execute on function public.public_school(uuid) to anon, authenticated;
grant execute on function public.public_schools() to anon, authenticated;
grant execute on function public.school_logo_path(uuid) to anon, authenticated;
grant execute on function public.submit_enquiry(text, text, text, text, text, uuid) to anon, authenticated;
