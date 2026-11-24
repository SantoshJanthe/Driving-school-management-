-- Staff type the SARATHI application reference themselves.
-- The app does not call the portal.

alter table public.applicants
  add column sarathi_reference text,
  add column sarathi_status text,
  add column sarathi_checked_on date;

alter table public.applicants
  add constraint applicants_sarathi_reference_len
    check (sarathi_reference is null or char_length(sarathi_reference) <= 40),
  add constraint applicants_sarathi_status_len
    check (sarathi_status is null or char_length(sarathi_status) <= 40);
