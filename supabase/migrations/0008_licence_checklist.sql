-- Learner's licence and driving-licence test details. Aadhaar stays last-4 only.

alter table public.applicants
  add column ll_number text,
  add column ll_issued_on date,
  add column dl_test_date date,
  add column dl_result text;

alter table public.applicants
  add constraint applicants_dl_result_check
  check (dl_result is null or dl_result in ('pending', 'pass', 'fail'));
