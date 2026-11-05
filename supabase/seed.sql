-- =============================================================================
-- Local development seed: one school, one admin, one staff user.
-- Applied automatically by `supabase db reset` (see config.toml [db.seed]).
-- DEVELOPMENT ONLY — never run against staging/production. Production bootstrap
-- is documented in supabase/migrations/0001_init.sql section 14.
--
--   Admin:   admin@sample-dsm.local    / Admin@12345
--   Staff:   staff@sample-dsm.local    / Staff@12345  (default staff permissions)
--   Student: student@sample-dsm.local  / Student@12345  (own applicant only)
-- =============================================================================

insert into public.schools (id, name, address, contact_phone, email, settings)
values (
  'a0000000-0000-4000-8000-000000000001',
  'MOTOR DRIVING SCHOOL SOFTWARE',
  '12, MG Road, Pune, Maharashtra 411001',
  '9800000000',
  'office@sample-dsm.local',
  '{"receipt_prefix": "R-2026-", "default_sessions": 12, "packages": [{"code": "lmv", "name": "Light motor vehicle", "fee": 8000, "sessions": 15, "summary": "Car lessons covering the learner stage and the driving test."}, {"code": "mcwg", "name": "Motorcycle with gear", "fee": 4500, "sessions": 10, "summary": "Two-wheeler lessons for riders who need a geared motorcycle licence."}, {"code": "lmv-mcwg", "name": "Car and motorcycle", "fee": 11000, "sessions": 20, "summary": "Combined car and geared motorcycle training."}]}'::jsonb
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

-- Demo learner. The office record holds the course, fee, and last-4-only identity fields.
-- The login is a separate student profile linked by student_accounts.
insert into public.applicants (
  id, school_id, full_name, phone, email, license_category,
  application_status, training_status, total_fee, created_by
)
values (
  'c0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'Meera Joshi',
  '9811111111',
  'student@sample-dsm.local',
  'Light motor vehicle',
  'documents_pending',
  'not_started',
  8000,
  'b0000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
)
values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-4000-8000-000000000003',
  'authenticated', 'authenticated',
  'student@sample-dsm.local',
  extensions.crypt('Student@12345', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"school_id": "a0000000-0000-4000-8000-000000000001", "full_name": "Meera Joshi", "role": "student", "phone": "9811111111"}'::jsonb,
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
where u.id = 'b0000000-0000-4000-8000-000000000003'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
)
values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-4000-8000-000000000004',
  'authenticated', 'authenticated',
  'instructor@sample-dsm.local',
  extensions.crypt('Instructor@12345', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"school_id": "a0000000-0000-4000-8000-000000000001", "full_name": "Arun Kulkarni", "role": "staff", "phone": "9811111112", "permissions": {}}'::jsonb,
  now(), now(), '', '', '', '', false
)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u
where u.id = 'b0000000-0000-4000-8000-000000000004'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

update public.profiles
set is_instructor = true,
    permissions = '{"view_applicants":false,"create_applicant":false,"edit_applicant":false,"add_payment":false,"manage_training":false,"view_financials":false}'::jsonb
where id = 'b0000000-0000-4000-8000-000000000004';

insert into public.student_accounts (profile_id, school_id, applicant_id)
values (
  'b0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000003'
)
on conflict (profile_id) do nothing;

insert into public.vehicles (id, school_id, name, vehicle_type)
values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Car 1 · MH12', 'LMV'),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Bike 1 · MH12', 'MCWG')
on conflict (id) do nothing;

insert into public.training_sessions (
  id, applicant_id, session_date, start_time, end_time, vehicle_type,
  instructor_id, status, created_by, vehicle_id
)
values (
  'd0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000003',
  current_date,
  '07:00',
  '08:00',
  'LMV',
  'b0000000-0000-4000-8000-000000000004',
  'scheduled',
  'b0000000-0000-4000-8000-000000000001',
  'f0000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set vehicle_id = excluded.vehicle_id, instructor_id = excluded.instructor_id;

insert into public.training_sessions (
  id, applicant_id, session_date, start_time, end_time, vehicle_type,
  instructor_id, status, attendance, created_by, vehicle_id
)
values (
  'd0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000003',
  current_date - 1,
  '09:00',
  '10:00',
  'LMV',
  'b0000000-0000-4000-8000-000000000004',
  'completed',
  'present',
  'b0000000-0000-4000-8000-000000000001',
  'f0000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

update public.applicants
set ll_number = 'MH12 2026001234',
    ll_issued_on = current_date - 30,
    dl_test_date = current_date + 14,
    dl_result = 'pending',
    application_number = 'MH/2026/00421'
where id = 'c0000000-0000-4000-8000-000000000003';

insert into public.documents (
  id, school_id, applicant_id, document_type, file_name, storage_path, file_size, mime_type, uploaded_by
)
values (
  'd1000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000003',
  'id_proof',
  'identity.pdf',
  'a0000000-0000-4000-8000-000000000001/c0000000-0000-4000-8000-000000000003/d1000000-0000-4000-8000-000000000003-identity.pdf',
  24,
  'application/pdf',
  'b0000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.payments (id, applicant_id, amount, payment_date, payment_mode, receipt_number, recorded_by)
values (
  'e0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000003',
  2000,
  current_date,
  'upi',
  'R-DEMO-1',
  'b0000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;
