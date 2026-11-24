-- A public enquiry can be sent without a course. The office assigns the course later.

create or replace function public.submit_enquiry(
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
  v_code text;
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

  v_code := nullif(trim(coalesce(p_package_code, '')), '');
  if v_code is not null then
    select value into v_package
    from jsonb_array_elements(v_packages) value
    where value ->> 'code' = v_code
    limit 1;
    if v_package is null then
      raise exception 'Choose a course' using errcode = 'invalid_parameter_value';
    end if;
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
    coalesce((v_package ->> 'fee')::numeric, 0),
    'enquiry',
    'not_started',
    nullif(left(trim(coalesce(p_message, '')), 1000), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;
