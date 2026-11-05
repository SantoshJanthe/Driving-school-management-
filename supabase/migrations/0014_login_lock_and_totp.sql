-- Failed sign-ins for one email, and TOTP secrets for the auth provider.
-- Neither table is readable by anon or authenticated. The service role and the
-- auth gateway are the only writers.

create table public.login_locks (
  email         text primary key,
  failures      integer not null default 0 check (failures >= 0),
  locked_until  timestamptz,
  updated_at    timestamptz not null default now()
);

create table public.auth_factors (
  id             uuid primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  factor_type    text not null check (factor_type = 'totp'),
  status         text not null check (status in ('unverified', 'verified')),
  secret         text not null,
  friendly_name  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index auth_factors_user_idx on public.auth_factors (user_id);

alter table public.login_locks enable row level security;
alter table public.auth_factors enable row level security;

revoke all on public.login_locks from anon, authenticated;
revoke all on public.auth_factors from anon, authenticated;
