-- An admin can queue a fee or class reminder. The row is the record.
-- A provider is used only by the app when its key is already set.

create table public.reminders (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools (id) on delete restrict,
  applicant_id  uuid not null references public.applicants (id) on delete cascade,
  channel       text not null check (channel in ('sms', 'whatsapp')),
  kind          text not null check (kind in ('fee', 'class')),
  body          text not null check (char_length(body) between 1 and 500),
  status        text not null default 'recorded' check (status in ('recorded', 'sent')),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index reminders_school_idx on public.reminders (school_id, created_at desc);
create index reminders_applicant_idx on public.reminders (applicant_id, created_at desc);

alter table public.reminders enable row level security;

create policy "reminders: admin read" on public.reminders
  for select to authenticated
  using (school_id = app.current_school_id() and app.is_admin());

create policy "reminders: admin insert" on public.reminders
  for insert to authenticated
  with check (
    school_id = app.current_school_id()
    and app.is_admin()
    and created_by = auth.uid()
  );

create policy "reminders: admin update" on public.reminders
  for update to authenticated
  using (school_id = app.current_school_id() and app.is_admin())
  with check (school_id = app.current_school_id() and app.is_admin());

grant select, insert, update on public.reminders to authenticated;
