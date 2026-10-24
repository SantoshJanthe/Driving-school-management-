-- =============================================================================
-- Driving School Management MVP — Supabase / PostgreSQL schema
-- Migration 0001_init.sql
--
-- Run once on a fresh Supabase project (SQL editor or `supabase db push`).
-- Implements spec section 4 (tables), section 5 (permission matrix via RLS),
-- section 6 (private storage, immutable logs). Multi-tenant-ready: every
-- row carries school_id and every policy is scoped to the caller's school.
--
-- Deviations from the spec (all deliberate, see docs/design/build-plan.md):
--   * `users` is implemented as `public.profiles` (id = auth.users.id).
--   * `school_id` is denormalised onto training_sessions and payments so RLS
--     never has to join through applicants (filled by trigger).
--   * `updated_at` is present on every mutable table, not just applicants.
--   * Staff permissions live in `profiles.permissions` (JSONB) with an extra
--     `manage_training` key (spec has no training permission row).
--   * `schools` gains `logo_path` and `settings` (JSONB) for the Settings page.
--   * activity_logs.user_id / audit_logs.user_id are nullable so service-role
--     scripts (seed, import) can still be logged.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Helper functions live in a private schema that PostgREST does not expose.
create schema if not exists app;
grant usage on schema app to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'staff');

create type public.gender as enum ('male', 'female', 'other');

create type public.application_status as enum (
  'enquiry',
  'documents_pending',
  'application_submitted',
  'll_issued',            -- learner's licence
  'dl_test_scheduled',
  'dl_issued',
  'rejected',
  'closed'
);

create type public.training_status as enum (
  'not_started', 'in_progress', 'completed', 'discontinued'
);

create type public.session_status as enum (
  'scheduled', 'completed', 'absent', 'cancelled'
);

create type public.payment_mode as enum ('cash', 'upi', 'bank', 'card');

create type public.document_type as enum (
  'application_form', 'receipt', 'sarathi_pdf', 'id_proof', 'other'
);

create type public.activity_action as enum (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'document_uploaded',
  'document_downloaded',
  'document_archived',
  'payment_added',
  'payment_updated',
  'payment_deleted',
  'login'
);

create type public.audit_action as enum (
  'staff_created',
  'staff_updated',
  'staff_deactivated',
  'staff_reactivated',
  'role_changed',
  'permissions_changed',
  'school_updated',
  'data_exported'
);

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------
create table public.schools (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text,
  contact_phone  text,
  email          text,
  logo_path      text,                          -- storage path, bucket below
  settings       jsonb not null default '{}'::jsonb,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Default staff permissions. Admins ignore this column (always allowed).
create function app.default_staff_permissions()
returns jsonb
language sql immutable
as $$
  select jsonb_build_object(
    'view_applicants',  true,
    'create_applicant', false,
    'edit_applicant',   false,
    'add_payment',      false,
    'manage_training',  true,
    'view_financials',  false
  );
$$;

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  school_id      uuid not null references public.schools (id) on delete restrict,
  full_name      text not null,
  email          text not null,
  phone          text,
  role           public.user_role not null default 'staff',
  permissions    jsonb not null default app.default_staff_permissions(),
  is_active      boolean not null default true,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint profiles_permissions_is_object check (jsonb_typeof(permissions) = 'object')
);

create table public.applicants (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools (id) on delete restrict,
  application_number  text,                     -- SARATHI number, entered manually
  full_name           text not null,
  date_of_birth       date,
  gender              public.gender,
  phone               text not null,
  alternate_phone     text,
  email               text,
  address             text,
  city                text,
  state               text,
  pincode             text check (pincode is null or pincode ~ '^[0-9]{6}$'),
  aadhaar_last4       text check (aadhaar_last4 is null or aadhaar_last4 ~ '^[0-9]{4}$'),
  license_category    text,                     -- e.g. LMV, MCWG, LMV+MCWG
  application_status  public.application_status not null default 'enquiry',
  training_status     public.training_status not null default 'not_started',
  total_fee           numeric(10,2) not null default 0 check (total_fee >= 0),
  amount_paid         numeric(10,2) not null default 0,   -- trigger-maintained
  balance_due         numeric(10,2) not null default 0,   -- trigger-maintained
  assigned_staff_id   uuid references public.profiles (id) on delete set null,
  notes               text,
  created_by          uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.training_sessions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete restrict,
  applicant_id   uuid not null references public.applicants (id) on delete cascade,
  session_date   date not null,
  start_time     time,
  end_time       time,
  vehicle_type   text,
  instructor_id  uuid references public.profiles (id) on delete set null,
  status         public.session_status not null default 'scheduled',
  remarks        text,
  created_by     uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint training_sessions_time_order check (
    start_time is null or end_time is null or end_time > start_time
  )
);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools (id) on delete restrict,
  applicant_id    uuid not null references public.applicants (id) on delete cascade,
  amount          numeric(10,2) not null check (amount > 0),
  payment_date    date not null default current_date,
  payment_mode    public.payment_mode not null,
  receipt_number  text,
  remarks         text,
  recorded_by     uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete restrict,
  applicant_id   uuid not null references public.applicants (id) on delete cascade,
  document_type  public.document_type not null default 'other',
  file_name      text not null,                 -- sanitised original name
  storage_path   text not null unique,          -- <school_id>/<applicant_id>/<document_id>-<file_name>
  file_size      bigint not null check (file_size > 0),
  mime_type      text not null,
  uploaded_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  uploaded_at    timestamptz not null default now(),
  is_archived    boolean not null default false,
  updated_at     timestamptz not null default now()
);

-- Applicant work history. Append-only: no update/delete policies, ever.
create table public.activity_logs (
  id            bigint generated always as identity primary key,
  school_id     uuid not null references public.schools (id) on delete restrict,
  user_id       uuid references public.profiles (id) on delete set null,
  applicant_id  uuid references public.applicants (id) on delete set null,
  action        public.activity_action not null,
  entity_type   text not null,                  -- table name or 'document_download', 'session'
  entity_id     uuid,
  old_value     jsonb,
  new_value     jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

-- Admin-level security events. Append-only, admin-read-only.
create table public.audit_logs (
  id              bigint generated always as identity primary key,
  school_id       uuid not null references public.schools (id) on delete restrict,
  user_id         uuid references public.profiles (id) on delete set null,
  action          public.audit_action not null,
  target_user_id  uuid references public.profiles (id) on delete set null,
  details         jsonb,
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------
create index profiles_school_idx            on public.profiles (school_id);

create unique index applicants_school_appno_uidx
  on public.applicants (school_id, application_number) where application_number is not null;
create index applicants_school_idx          on public.applicants (school_id);
create index applicants_assigned_staff_idx  on public.applicants (assigned_staff_id);
create index applicants_status_idx          on public.applicants (school_id, application_status, training_status);
create index applicants_balance_idx         on public.applicants (school_id) where balance_due > 0;
create index applicants_name_trgm_idx       on public.applicants using gin (full_name extensions.gin_trgm_ops);
create index applicants_phone_trgm_idx      on public.applicants using gin (phone extensions.gin_trgm_ops);
create index applicants_appno_trgm_idx      on public.applicants using gin (application_number extensions.gin_trgm_ops);

create index training_sessions_applicant_idx on public.training_sessions (applicant_id, session_date desc);
create index training_sessions_school_date_idx on public.training_sessions (school_id, session_date desc);
create index training_sessions_instructor_idx on public.training_sessions (instructor_id, session_date desc);

create index payments_applicant_idx         on public.payments (applicant_id, payment_date desc);
create index payments_school_date_idx       on public.payments (school_id, payment_date desc);
create unique index payments_school_receipt_uidx
  on public.payments (school_id, receipt_number) where receipt_number is not null;

create index documents_applicant_idx        on public.documents (applicant_id) where not is_archived;
create index documents_school_uploaded_idx  on public.documents (school_id, uploaded_at desc);

create index activity_logs_school_idx       on public.activity_logs (school_id, created_at desc);
create index activity_logs_applicant_idx    on public.activity_logs (applicant_id, created_at desc);
create index activity_logs_user_idx         on public.activity_logs (user_id, created_at desc);

create index audit_logs_school_idx          on public.audit_logs (school_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Session helpers (used by RLS policies and the app)
-- -----------------------------------------------------------------------------
-- All are SECURITY DEFINER so policies on `profiles` do not recurse, and all
-- return NULL/false for deactivated users, which denies every policy at once.

create function app.current_school_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select school_id from public.profiles where id = auth.uid() and is_active;
$$;

create function app.current_user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create function app.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid() and is_active),
    false
  );
$$;

-- Admin => always true. Staff => permissions ->> key. Unknown key => false.
create function app.has_permission(perm text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select case
              when role = 'admin' then true
              else coalesce((permissions ->> perm)::boolean, false)
            end
       from public.profiles
      where id = auth.uid() and is_active),
    false
  );
$$;

-- Request metadata forwarded by PostgREST. The Next.js server client adds
-- x-client-ip / x-client-user-agent with the end user's values (see build plan).
create function app.request_header(header_name text)
returns text
language sql stable set search_path = ''
as $$
  select nullif(nullif(current_setting('request.headers', true), '')::jsonb ->> header_name, '');
$$;

create function app.request_ip()
returns text
language sql stable set search_path = ''
as $$
  select coalesce(
    app.request_header('x-client-ip'),
    nullif(split_part(app.request_header('x-forwarded-for'), ',', 1), ''),
    app.request_header('x-real-ip')
  );
$$;

create function app.request_user_agent()
returns text
language sql stable set search_path = ''
as $$
  select coalesce(app.request_header('x-client-user-agent'), app.request_header('user-agent'));
$$;

-- Exposed to the client via RPC for display/guards; RLS remains the enforcer.
create function public.current_profile()
returns public.profiles
language sql stable security definer set search_path = ''
as $$
  select * from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 5. Generic triggers: updated_at, school_id inheritance
-- -----------------------------------------------------------------------------
create function app.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.schools
  for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.applicants
  for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.training_sessions
  for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.documents
  for each row execute function app.set_updated_at();

-- Child rows always take school_id from their applicant; clients cannot
-- attach a row to another school's applicant.
create function app.inherit_school_id()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.applicants where id = new.applicant_id;
  if v_school is null then
    raise exception 'applicant % not found', new.applicant_id using errcode = 'foreign_key_violation';
  end if;
  if auth.uid() is not null and v_school is distinct from app.current_school_id() then
    raise exception 'applicant belongs to another school' using errcode = 'insufficient_privilege';
  end if;
  new.school_id := v_school;
  return new;
end;
$$;

create trigger inherit_school_id before insert or update of applicant_id on public.training_sessions
  for each row execute function app.inherit_school_id();
create trigger inherit_school_id before insert or update of applicant_id on public.payments
  for each row execute function app.inherit_school_id();
create trigger inherit_school_id before insert or update of applicant_id on public.documents
  for each row execute function app.inherit_school_id();

-- -----------------------------------------------------------------------------
-- 6. Money: amount_paid / balance_due are derived from payments, never trusted
--    from the client.
-- -----------------------------------------------------------------------------
create function app.compute_applicant_totals()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.amount_paid := coalesce(
    (select sum(amount) from public.payments where applicant_id = new.id), 0
  );
  new.balance_due := new.total_fee - new.amount_paid;
  return new;
end;
$$;

create trigger compute_totals before insert or update on public.applicants
  for each row execute function app.compute_applicant_totals();

create function app.refresh_applicant_totals()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Touching the row re-runs compute_applicant_totals above.
  update public.applicants set amount_paid = amount_paid
   where id = coalesce(new.applicant_id, old.applicant_id);
  if tg_op = 'UPDATE' and new.applicant_id is distinct from old.applicant_id then
    update public.applicants set amount_paid = amount_paid where id = old.applicant_id;
  end if;
  return null;
end;
$$;

create trigger refresh_applicant_totals after insert or update or delete on public.payments
  for each row execute function app.refresh_applicant_totals();

-- -----------------------------------------------------------------------------
-- 7. Activity log trigger (applicant work history)
-- -----------------------------------------------------------------------------
create function app.log_activity()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_row        jsonb := coalesce(to_jsonb(new), to_jsonb(old));
  v_old        jsonb := to_jsonb(old);
  v_new        jsonb := to_jsonb(new);
  v_diff       jsonb;
  v_action     public.activity_action;
  v_applicant  uuid;
  v_noise      text[] := array['updated_at', 'amount_paid', 'balance_due'];
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, n.value)
      into v_diff
      from jsonb_each(v_new) n
     where n.value is distinct from v_old -> n.key
       and not (n.key = any (v_noise));
    if v_diff is null then
      return null;                              -- nothing meaningful changed
    end if;
    select jsonb_object_agg(k, v_old -> k) into v_old from jsonb_object_keys(v_diff) k;
    v_new := v_diff;
  end if;

  v_action := case tg_table_name
    when 'payments' then
      case tg_op when 'INSERT' then 'payment_added'
                 when 'UPDATE' then 'payment_updated'
                 else 'payment_deleted' end
    when 'documents' then
      case tg_op when 'INSERT' then 'document_uploaded'
                 when 'UPDATE' then case when v_diff ? 'is_archived' and (v_diff ->> 'is_archived')::boolean
                                         then 'document_archived' else 'updated' end
                 else 'deleted' end
    when 'applicants' then
      case tg_op when 'INSERT' then 'created'
                 when 'UPDATE' then case when v_diff ?| array['application_status', 'training_status']
                                         then 'status_changed' else 'updated' end
                 else 'deleted' end
    else
      case tg_op when 'INSERT' then 'created'
                 when 'UPDATE' then 'updated'
                 else 'deleted' end
  end;

  v_applicant := case when tg_table_name = 'applicants'
                      then (v_row ->> 'id')::uuid
                      else (v_row ->> 'applicant_id')::uuid end;
  -- Keep the row even when the applicant itself is being deleted (FK would fail).
  if not exists (select 1 from public.applicants where id = v_applicant) then
    v_applicant := null;
  end if;

  insert into public.activity_logs
    (school_id, user_id, applicant_id, action, entity_type, entity_id,
     old_value, new_value, ip_address, user_agent)
  values
    ((v_row ->> 'school_id')::uuid, auth.uid(), v_applicant, v_action, tg_table_name,
     (v_row ->> 'id')::uuid, v_old, v_new, app.request_ip(), app.request_user_agent());
  return null;
end;
$$;

create trigger log_activity after insert or update or delete on public.applicants
  for each row execute function app.log_activity();
create trigger log_activity after insert or update or delete on public.training_sessions
  for each row execute function app.log_activity();
create trigger log_activity after insert or update or delete on public.payments
  for each row execute function app.log_activity();
create trigger log_activity after insert or update or delete on public.documents
  for each row execute function app.log_activity();

-- App-side entries that are not table mutations (download, login).
create function public.log_event(
  p_action       public.activity_action,
  p_entity_type  text,
  p_entity_id    uuid default null,
  p_applicant_id uuid default null,
  p_details      jsonb default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or app.current_school_id() is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  if p_action not in ('document_downloaded', 'login') then
    raise exception 'action % is written by triggers only', p_action
      using errcode = 'invalid_parameter_value';
  end if;
  insert into public.activity_logs
    (school_id, user_id, applicant_id, action, entity_type, entity_id,
     new_value, ip_address, user_agent)
  values
    (app.current_school_id(), auth.uid(), p_applicant_id, p_action, p_entity_type,
     p_entity_id, p_details, app.request_ip(), app.request_user_agent());
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Profiles: protection + audit trail
-- -----------------------------------------------------------------------------
create function app.protect_profile_columns()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;                                 -- service role / auth triggers
  end if;
  if new.school_id is distinct from old.school_id then
    raise exception 'school_id cannot be changed' using errcode = 'insufficient_privilege';
  end if;
  if new.last_login_at is distinct from old.last_login_at then
    new.last_login_at := old.last_login_at;     -- only the auth sync trigger sets this
  end if;
  if not app.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.permissions is distinct from old.permissions
       or new.email is distinct from old.email then
      raise exception 'only admins can change role, status, permissions or email'
        using errcode = 'insufficient_privilege';
    end if;
  elsif new.id = auth.uid()
        and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'admins cannot change their own role or deactivate themselves'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger protect_columns before update on public.profiles
  for each row execute function app.protect_profile_columns();

create function app.audit_profile_changes()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (school_id, user_id, action, target_user_id, details)
    values (new.school_id, auth.uid(), 'staff_created', new.id,
            jsonb_build_object('email', new.email, 'role', new.role, 'permissions', new.permissions));
    return null;
  end if;

  if new.role is distinct from old.role then
    insert into public.audit_logs (school_id, user_id, action, target_user_id, details)
    values (new.school_id, auth.uid(), 'role_changed', new.id,
            jsonb_build_object('old', old.role, 'new', new.role));
  end if;
  if new.is_active is distinct from old.is_active then
    insert into public.audit_logs (school_id, user_id, action, target_user_id, details)
    values (new.school_id, auth.uid(),
            (case when new.is_active then 'staff_reactivated' else 'staff_deactivated' end)::public.audit_action,
            new.id, null);
  end if;
  if new.permissions is distinct from old.permissions then
    insert into public.audit_logs (school_id, user_id, action, target_user_id, details)
    values (new.school_id, auth.uid(), 'permissions_changed', new.id,
            jsonb_build_object('old', old.permissions, 'new', new.permissions));
  end if;
  if new.full_name is distinct from old.full_name or new.phone is distinct from old.phone
     or new.email is distinct from old.email then
    insert into public.audit_logs (school_id, user_id, action, target_user_id, details)
    values (new.school_id, auth.uid(), 'staff_updated', new.id,
            jsonb_build_object('full_name', new.full_name, 'phone', new.phone, 'email', new.email));
  end if;
  return null;
end;
$$;

create trigger audit_changes after insert or update on public.profiles
  for each row execute function app.audit_profile_changes();

create function app.audit_school_changes()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs (school_id, user_id, action, details)
  values (new.id, auth.uid(), 'school_updated',
          jsonb_build_object('old', to_jsonb(old) - 'updated_at', 'new', to_jsonb(new) - 'updated_at'));
  return null;
end;
$$;

create trigger audit_changes after update on public.schools
  for each row execute function app.audit_school_changes();

-- -----------------------------------------------------------------------------
-- 9. auth.users -> profiles sync
--    Staff are created by an admin through supabase.auth.admin.inviteUserByEmail
--    (service role, server-side) with user_metadata { school_id, full_name,
--    role, phone, permissions }. Public sign-up must be disabled in Auth
--    settings so nobody can self-provision a profile.
-- -----------------------------------------------------------------------------
create function app.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'school_id' then
    insert into public.profiles (id, school_id, full_name, email, phone, role, permissions)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'school_id')::uuid,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data ->> 'phone',
      coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'staff'),
      coalesce(new.raw_user_meta_data -> 'permissions', app.default_staff_permissions())
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_auth_user();

create function app.sync_auth_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles
     set email         = new.email,
         last_login_at = coalesce(new.last_sign_in_at, last_login_at)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email, last_sign_in_at on auth.users
  for each row execute function app.sync_auth_user();

-- -----------------------------------------------------------------------------
-- 10. Search + dashboard RPCs (SECURITY INVOKER: RLS still applies)
-- -----------------------------------------------------------------------------
create function public.search_applicants(q text, result_limit int default 20)
returns setof public.applicants
language sql stable security invoker set search_path = ''
as $$
  with needle as (select trim(q) as q)
  select a.*
    from public.applicants a, needle n
   where a.school_id = app.current_school_id()
     and n.q <> ''
     and (
          a.full_name ilike '%' || n.q || '%'
       or a.phone like '%' || n.q || '%'
       or coalesce(a.alternate_phone, '') like '%' || n.q || '%'
       or coalesce(a.application_number, '') ilike '%' || n.q || '%'
       or extensions.similarity(a.full_name, n.q) > 0.3
     )
   order by greatest(
              extensions.similarity(a.full_name, n.q),
              extensions.similarity(coalesce(a.application_number, ''), n.q),
              case when a.phone like '%' || n.q || '%' then 1 else 0 end
            ) desc,
            a.updated_at desc
   limit greatest(1, least(result_limit, 100));
$$;

create function public.dashboard_summary()
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_school uuid := app.current_school_id();
  v_result jsonb;
begin
  select jsonb_build_object(
           'total_applicants',         count(*),
           'active_trainees',          count(*) filter (where training_status = 'in_progress'),
           'applications_in_progress', count(*) filter (where application_status not in ('dl_issued', 'rejected', 'closed')),
           'applicants_with_balance',  count(*) filter (where balance_due > 0)
         )
    into v_result
    from public.applicants
   where school_id = v_school;

  v_result := v_result || jsonb_build_object(
    'documents_this_month',
    (select count(*) from public.documents
      where school_id = v_school and not is_archived
        and uploaded_at >= date_trunc('month', now()))
  );

  if app.has_permission('view_financials') then
    v_result := v_result || jsonb_build_object(
      'total_balance_due',
      (select coalesce(sum(balance_due), 0) from public.applicants where school_id = v_school),
      'collected_this_month',
      (select coalesce(sum(amount), 0) from public.payments
        where school_id = v_school and payment_date >= date_trunc('month', now())::date)
    );
  end if;
  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11. Row Level Security (spec section 5 matrix + school isolation)
-- -----------------------------------------------------------------------------
alter table public.schools            enable row level security;
alter table public.profiles           enable row level security;
alter table public.applicants         enable row level security;
alter table public.training_sessions  enable row level security;
alter table public.payments           enable row level security;
alter table public.documents          enable row level security;
alter table public.activity_logs      enable row level security;
alter table public.audit_logs         enable row level security;

-- schools: everyone sees their own school; only admin edits; no API insert/delete.
create policy "schools: read own" on public.schools
  for select to authenticated
  using (id = app.current_school_id());

create policy "schools: admin update" on public.schools
  for update to authenticated
  using (id = app.current_school_id() and app.is_admin())
  with check (id = app.current_school_id() and app.is_admin());

-- profiles: read colleagues (names for dropdowns / "uploaded by"); admin manages;
-- staff may edit their own row (protected columns enforced by trigger).
create policy "profiles: read same school" on public.profiles
  for select to authenticated
  using (school_id = app.current_school_id());

create policy "profiles: admin insert" on public.profiles
  for insert to authenticated
  with check (school_id = app.current_school_id() and app.is_admin());

create policy "profiles: admin or self update" on public.profiles
  for update to authenticated
  using (school_id = app.current_school_id() and (app.is_admin() or id = auth.uid()))
  with check (school_id = app.current_school_id() and (app.is_admin() or id = auth.uid()));
-- no delete policy: deactivate instead (keeps log attribution intact)

-- applicants
create policy "applicants: view" on public.applicants
  for select to authenticated
  using (school_id = app.current_school_id() and app.has_permission('view_applicants'));

create policy "applicants: create" on public.applicants
  for insert to authenticated
  with check (school_id = app.current_school_id()
              and app.has_permission('create_applicant')
              and created_by = auth.uid());

create policy "applicants: edit" on public.applicants
  for update to authenticated
  using (school_id = app.current_school_id() and app.has_permission('edit_applicant'))
  with check (school_id = app.current_school_id() and app.has_permission('edit_applicant'));

create policy "applicants: admin delete" on public.applicants
  for delete to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

-- training_sessions
create policy "training: view" on public.training_sessions
  for select to authenticated
  using (school_id = app.current_school_id() and app.has_permission('view_applicants'));

create policy "training: create" on public.training_sessions
  for insert to authenticated
  with check (school_id = app.current_school_id()
              and app.has_permission('manage_training')
              and created_by = auth.uid());

create policy "training: edit" on public.training_sessions
  for update to authenticated
  using (school_id = app.current_school_id() and app.has_permission('manage_training'))
  with check (school_id = app.current_school_id() and app.has_permission('manage_training'));

create policy "training: admin delete" on public.training_sessions
  for delete to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

-- payments: staff see payments only if they can add them or view financials.
create policy "payments: view" on public.payments
  for select to authenticated
  using (school_id = app.current_school_id()
         and (app.has_permission('view_financials') or app.has_permission('add_payment')));

create policy "payments: add" on public.payments
  for insert to authenticated
  with check (school_id = app.current_school_id()
              and app.has_permission('add_payment')
              and recorded_by = auth.uid());

create policy "payments: admin edit" on public.payments
  for update to authenticated
  using (school_id = app.current_school_id() and app.is_admin())
  with check (school_id = app.current_school_id() and app.is_admin());

create policy "payments: admin delete" on public.payments
  for delete to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

-- documents: all staff upload/view; only admin archives or deletes.
create policy "documents: view" on public.documents
  for select to authenticated
  using (school_id = app.current_school_id() and app.has_permission('view_applicants'));

create policy "documents: upload" on public.documents
  for insert to authenticated
  with check (school_id = app.current_school_id()
              and app.has_permission('view_applicants')
              and uploaded_by = auth.uid());

create policy "documents: admin update" on public.documents
  for update to authenticated
  using (school_id = app.current_school_id() and app.is_admin())
  with check (school_id = app.current_school_id() and app.is_admin());

create policy "documents: admin delete" on public.documents
  for delete to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

-- activity_logs: history is visible to anyone who can view applicants; rows are
-- written by triggers / log_event() only. No update or delete policies.
create policy "activity: view" on public.activity_logs
  for select to authenticated
  using (school_id = app.current_school_id() and app.has_permission('view_applicants'));

-- audit_logs: admin-only read; written by triggers or the admin export action.
create policy "audit: admin view" on public.audit_logs
  for select to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

create policy "audit: admin insert" on public.audit_logs
  for insert to authenticated
  with check (school_id = app.current_school_id() and app.is_admin()
              and user_id = auth.uid() and action = 'data_exported');

-- -----------------------------------------------------------------------------
-- 12. Grants (tighten Supabase defaults)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;
revoke all on all functions in schema app from public;

grant select, insert, update, delete on public.schools, public.profiles, public.applicants,
  public.training_sessions, public.payments, public.documents to authenticated;
grant select on public.activity_logs to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage on all sequences in schema public to authenticated;

grant execute on all functions in schema app to authenticated, service_role;
grant execute on function public.current_profile(), public.log_event(public.activity_action, text, uuid, uuid, jsonb),
  public.search_applicants(text, int), public.dashboard_summary() to authenticated;

-- -----------------------------------------------------------------------------
-- 13. Storage: private bucket + object policies
--     Path convention: <school_id>/<applicant_id>/<document_id>-<file_name>
--     Files are only ever read through signed URLs minted server-side.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-documents', 'applicant-documents', false,
  10485760,                                     -- 10 MiB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "applicant-documents: read"   on storage.objects;
drop policy if exists "applicant-documents: upload" on storage.objects;
drop policy if exists "applicant-documents: update" on storage.objects;
drop policy if exists "applicant-documents: delete" on storage.objects;

create policy "applicant-documents: read" on storage.objects
  for select to authenticated
  using (bucket_id = 'applicant-documents'
         and (storage.foldername(name))[1] = app.current_school_id()::text
         and app.has_permission('view_applicants'));

create policy "applicant-documents: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'applicant-documents'
              and (storage.foldername(name))[1] = app.current_school_id()::text
              and app.has_permission('view_applicants'));

create policy "applicant-documents: update" on storage.objects
  for update to authenticated
  using (bucket_id = 'applicant-documents'
         and (storage.foldername(name))[1] = app.current_school_id()::text
         and app.is_admin());

create policy "applicant-documents: delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'applicant-documents'
         and (storage.foldername(name))[1] = app.current_school_id()::text
         and app.is_admin());

-- -----------------------------------------------------------------------------
-- 14. Bootstrap (run manually after the migration)
-- -----------------------------------------------------------------------------
-- 1. insert into public.schools (name, contact_phone, email)
--      values ('Sample Motor Driving School', '9800000000', 'office@example.com')
--      returning id;
-- 2. Dashboard > Authentication > Users > "Add user" (or auth.admin.createUser)
--    with user_metadata:
--      {"school_id": "<id from step 1>", "full_name": "Owner Name", "role": "admin"}
--    The on_auth_user_created trigger creates the admin profile.
-- 3. Authentication > Providers > Email: disable "Allow new users to sign up".
-- 4. Authentication > Settings: enable leaked-password protection, set minimum
--    password length >= 10, enable MFA (TOTP) for the admin account.
