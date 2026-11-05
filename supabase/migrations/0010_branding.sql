-- Public page reads the oldest active school's name, phone, and whether a logo is set.
-- The product title is not stored here.

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
    'has_logo', s.logo_path is not null,
    'packages', coalesce(s.settings -> 'packages', '[]'::jsonb)
  )
  from public.schools s
  where s.is_active
  order by s.created_at, s.id
  limit 1;
$$;

create or replace function public.school_logo_path()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.logo_path
  from public.schools s
  where s.is_active
  order by s.created_at, s.id
  limit 1;
$$;

revoke all on function public.school_logo_path() from public;
grant execute on function public.school_logo_path() to anon, authenticated;
