-- Public school profile and website enquiries.
-- No new tables: an enquiry is an applicant with status 'enquiry'.
-- Fees come from schools.settings.packages, not from the visitor.

update public.schools
set settings = settings || jsonb_build_object(
  'packages', jsonb_build_array(
    jsonb_build_object('code', 'lmv', 'name', 'Light motor vehicle', 'fee', 8000, 'sessions', 15,
      'summary', 'Car lessons covering the learner stage and the driving test.'),
    jsonb_build_object('code', 'mcwg', 'name', 'Motorcycle with gear', 'fee', 4500, 'sessions', 10,
      'summary', 'Two-wheeler lessons for riders who need a geared motorcycle licence.'),
    jsonb_build_object('code', 'lmv-mcwg', 'name', 'Car and motorcycle', 'fee', 11000, 'sessions', 20,
      'summary', 'Combined car and geared motorcycle training.')
  )
)
where not (settings ? 'packages');

create or replace function public.public_school()
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
    'packages', coalesce(s.settings -> 'packages', '[]'::jsonb)
  )
  from public.schools s
  where s.is_active
  order by s.created_at, s.id
  limit 1;
$$;

create or replace function public.submit_enquiry(
  p_full_name text,
  p_phone text,
  p_email text,
  p_package_code text,
  p_message text
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
  order by s.created_at, s.id
  limit 1;
  if v_school is null then
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

revoke all on function public.public_school() from public;
revoke all on function public.submit_enquiry(text, text, text, text, text) from public;
grant execute on function public.public_school() to anon, authenticated;
grant execute on function public.submit_enquiry(text, text, text, text, text) to anon, authenticated;
