-- A school owner pays the monthly software fee by UPI or bank transfer and
-- submits the payment reference. The software vendor checks the bank statement
-- and marks the request verified, which unlocks the app download.
--
-- Rows are read and written only by the server with the service role. RLS is on
-- with no policies, so the anon and authenticated roles cannot see or change them.

create table public.subscription_requests (
  id                 uuid primary key default gen_random_uuid(),
  school_name        text not null check (length(school_name) between 2 and 120),
  owner_name         text not null check (length(owner_name) between 2 and 120),
  phone              text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email              text check (email is null or length(email) <= 200),
  plan               text not null default 'monthly' check (plan = 'monthly'),
  amount_inr         numeric(10,2) not null check (amount_inr > 0),
  payment_method     text not null check (payment_method in ('upi', 'bank')),
  payment_reference  text not null check (length(payment_reference) between 6 and 40),
  status             text not null default 'pending'
                     check (status in ('pending', 'verified', 'rejected')),
  access_token_hash  text not null unique,
  review_note        text check (review_note is null or length(review_note) <= 300),
  reviewed_by        uuid references auth.users (id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  unique (payment_method, payment_reference)
);

create index subscription_requests_status_idx
  on public.subscription_requests (status, created_at desc);
create index subscription_requests_phone_idx
  on public.subscription_requests (phone, created_at desc);

alter table public.subscription_requests enable row level security;

revoke all on table public.subscription_requests from anon, authenticated;
grant select, insert, update on table public.subscription_requests to service_role;
