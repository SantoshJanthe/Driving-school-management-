-- Local auth gateway does not implement POST /auth/v1/admin/users. The app
-- creates and updates school logins through these service-role functions, which
-- match how seed.sql writes auth.users. On a full GoTrue project the app still
-- prefers the Admin API and only uses this path when that API is missing.
--
-- service_role also needs table grants to list every school for the software
-- owner. BYPASSRLS does not skip GRANT.

grant select on public.schools, public.profiles to service_role;

create or replace function app.provision_login(
  p_email text,
  p_password text,
  p_user_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email' using errcode = '22023';
  end if;
  if length(coalesce(p_password, '')) < 10
     or p_password !~ '[A-Za-z]'
     or p_password !~ '[0-9]' then
    raise exception 'Password must be at least 10 characters with a letter and a digit'
      using errcode = '22023';
  end if;
  if p_user_metadata is null or jsonb_typeof(p_user_metadata) <> 'object'
     or coalesce(p_user_metadata ->> 'school_id', '') = '' then
    raise exception 'School is required' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'That email already has a login' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    p_user_metadata,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false
  )
  returning id into v_id;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(),
    v_id,
    v_id::text,
    jsonb_build_object(
      'sub', v_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  return v_id;
end;
$$;

create or replace function app.set_login_password(p_user uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if length(coalesce(p_password, '')) < 10
     or p_password !~ '[A-Za-z]'
     or p_password !~ '[0-9]' then
    raise exception 'Password must be at least 10 characters with a letter and a digit'
      using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_user) then
    raise exception 'Login not found' using errcode = 'P0002';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user;
end;
$$;

create or replace function app.delete_login(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from auth.users where id = p_user;
end;
$$;

create or replace function public.provision_login(
  p_email text,
  p_password text,
  p_user_metadata jsonb
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select app.provision_login(p_email, p_password, p_user_metadata);
$$;

create or replace function public.set_login_password(p_user uuid, p_password text)
returns void
language sql
security definer
set search_path = ''
as $$
  select app.set_login_password(p_user, p_password);
$$;

create or replace function public.delete_login(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select app.delete_login(p_user);
$$;

revoke all on function public.provision_login(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.set_login_password(uuid, text) from public, anon, authenticated;
revoke all on function public.delete_login(uuid) from public, anon, authenticated;
grant execute on function public.provision_login(text, text, jsonb) to service_role;
grant execute on function public.set_login_password(uuid, text) to service_role;
grant execute on function public.delete_login(uuid) to service_role;
grant execute on function app.provision_login(text, text, jsonb) to service_role;
grant execute on function app.set_login_password(uuid, text) to service_role;
grant execute on function app.delete_login(uuid) to service_role;

notify pgrst, 'reload schema';
