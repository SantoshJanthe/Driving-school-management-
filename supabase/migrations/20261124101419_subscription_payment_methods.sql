-- The software vendor chooses which payment methods the landing page offers:
-- Razorpay checkout, manual UPI or bank transfer, or both.

alter table public.subscription_requests
  drop constraint subscription_requests_payment_method_check;
alter table public.subscription_requests
  add constraint subscription_requests_payment_method_check
  check (payment_method in ('upi', 'bank', 'razorpay'));

-- A Razorpay request is removed again when the payment link cannot be created.
grant delete on table public.subscription_requests to service_role;

create table public.platform_settings (
  key         text primary key check (key in ('subscription_payment_methods')),
  value       jsonb not null,
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

revoke all on table public.platform_settings from anon, authenticated;
grant select, insert, update on table public.platform_settings to service_role;
