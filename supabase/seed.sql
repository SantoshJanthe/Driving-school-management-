-- =============================================================================
-- Local development seed: one school, one admin, one staff user.
-- Applied automatically by `supabase db reset` (see config.toml [db.seed]).
-- DEVELOPMENT ONLY — never run against staging/production. Production bootstrap
-- is documented in supabase/migrations/0001_init.sql section 14.
--
--   Admin:  admin@sample-dsm.local  / Admin@12345
--   Staff:  staff@sample-dsm.local  / Staff@12345  (default staff permissions)
-- =============================================================================

insert into public.schools (id, name, address, contact_phone, email, settings)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Sample Motor Driving School',
  '12, MG Road, Pune, Maharashtra 411001',
  '9800000000',
  'office@sample-dsm.local',
  '{"receipt_prefix": "R-2026-", "default_sessions": 12}'::jsonb
)
on conflict (id) do nothing;

-- Users go through auth.users so the on_auth_user_created trigger provisions
-- public.profiles exactly like an invite would in production.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated',
    'admin@sample-dsm.local',
    extensions.crypt('Admin@12345', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"school_id": "a0000000-0000-4000-8000-000000000001", "full_name": "Admin Owner", "role": "admin", "phone": "9800000001"}'::jsonb,
    now(), now(), '', '', '', '', false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated',
    'staff@sample-dsm.local',
    extensions.crypt('Staff@12345', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"school_id": "a0000000-0000-4000-8000-000000000001", "full_name": "Priya Nair", "role": "staff", "phone": "9800000002"}'::jsonb,
    now(), now(), '', '', '', '', false
  )
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email',
  now(), now(), now()
from auth.users u
where u.id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002')
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');
