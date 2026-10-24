-- =============================================================================
-- RLS / permission-matrix test for supabase/migrations/0001_init.sql
--
-- Run against a local Supabase stack (after `supabase start` / `supabase db reset`):
--   npm run db:test
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--
-- Or against plain PostgreSQL 16 without Docker (stubs auth/storage first):
--   createdb dsm_test
--   psql -d dsm_test -f supabase/tests/helpers/supabase-stub.sql
--   psql -d dsm_test -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
--   psql -d dsm_test -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--
-- Everything runs inside one transaction that is rolled back, so the database
-- (including seed data) is left untouched. Every assertion prints PASS; the
-- first failure aborts with FAIL. The last line printed is ALL_RLS_TESTS_PASSED.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

begin;

-- helper: act as a given auth user. Sets both the legacy per-claim GUC and the
-- JSON claims GUC so auth.uid() resolves on every Supabase version and on the stub.
create or replace function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
  perform set_config('request.headers', '{"user-agent":"psql-test","x-client-ip":"203.0.113.9"}', true);
end $$;

create or replace function pg_temp.check(label text, ok boolean) returns void language plpgsql as $$
begin
  if ok then raise notice 'PASS %', label; else raise exception 'FAIL %', label; end if;
end $$;

-- seed two schools + users (service-role path)
insert into public.schools (id, name) values
  ('00000000-0000-0000-0000-00000000000a', 'School A'),
  ('00000000-0000-0000-0000-00000000000b', 'School B');

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', 'admin-a@x.io', '{"school_id":"00000000-0000-0000-0000-00000000000a","full_name":"Admin A","role":"admin"}'),
  ('10000000-0000-0000-0000-000000000002', 'staff-a1@x.io', '{"school_id":"00000000-0000-0000-0000-00000000000a","full_name":"Staff A1"}'),
  ('10000000-0000-0000-0000-000000000003', 'staff-a2@x.io', '{"school_id":"00000000-0000-0000-0000-00000000000a","full_name":"Staff A2","permissions":{"view_applicants":true,"create_applicant":true,"edit_applicant":true,"add_payment":true,"manage_training":true,"view_financials":false}}'),
  ('10000000-0000-0000-0000-000000000011', 'admin-b@x.io', '{"school_id":"00000000-0000-0000-0000-00000000000b","full_name":"Admin B","role":"admin"}'),
  ('10000000-0000-0000-0000-000000000099', 'orphan@x.io', '{}');

select pg_temp.check('profiles auto-created from auth.users (4, orphan skipped)',
  (select count(*) = 4 from public.profiles where school_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')));
select pg_temp.check('audit staff_created rows',
  (select count(*) = 4 from public.audit_logs where action = 'staff_created'
     and school_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')));

update auth.users set last_sign_in_at = now() where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.check('last_login_at synced', (select last_login_at is not null from public.profiles where id = '10000000-0000-0000-0000-000000000001'));

-- ---------------- Admin A ----------------
set role authenticated;
select pg_temp.login('10000000-0000-0000-0000-000000000001');
select pg_temp.check('is_admin', app.is_admin());
select pg_temp.check('current_school_id', app.current_school_id() = '00000000-0000-0000-0000-00000000000a');

insert into public.applicants (id, school_id, full_name, phone, application_number, total_fee)
values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Ravi Kumar', '9876543210', 'MH/2026/12345', 5000);

select pg_temp.check('applicant created log', (select count(*) = 1 from public.activity_logs where action = 'created' and applicant_id = '20000000-0000-0000-0000-000000000001'));
select pg_temp.check('ip captured from header', (select ip_address = '203.0.113.9' from public.activity_logs where action = 'created' limit 1));

-- client cannot force amount_paid
update public.applicants set amount_paid = 999 where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.check('amount_paid not trusted from client', (select amount_paid = 0 and balance_due = 5000 from public.applicants where id = '20000000-0000-0000-0000-000000000001'));

insert into public.payments (applicant_id, amount, payment_mode, receipt_number)
values ('20000000-0000-0000-0000-000000000001', 2000, 'upi', 'R-001');
select pg_temp.check('balance recomputed after payment', (select amount_paid = 2000 and balance_due = 3000 from public.applicants where id = '20000000-0000-0000-0000-000000000001'));
select pg_temp.check('payment_added log', (select count(*) = 1 from public.activity_logs where action = 'payment_added'));
select pg_temp.check('payment school_id inherited', (select school_id = '00000000-0000-0000-0000-00000000000a' from public.payments limit 1));

update public.applicants set application_status = 'll_issued' where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.check('status_changed log', (select count(*) = 1 from public.activity_logs where action = 'status_changed'));
update public.applicants set notes = 'called' where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.check('updated log with diff only', (select new_value = '{"notes":"called"}'::jsonb and old_value = '{"notes":null}'::jsonb from public.activity_logs where action = 'updated' and entity_type = 'applicants'));

select pg_temp.check('admin dashboard has financials', (public.dashboard_summary() ? 'total_balance_due'));
select pg_temp.check('search by partial name', (select count(*) = 1 from public.search_applicants('ravi')));
select pg_temp.check('search by app number', (select count(*) = 1 from public.search_applicants('12345')));
select pg_temp.check('search by phone', (select count(*) = 1 from public.search_applicants('98765')));
select pg_temp.check('search fuzzy', (select count(*) = 1 from public.search_applicants('ravi kumr')));

-- admin cannot deactivate self
do $$ begin
  update public.profiles set is_active = false where id = '10000000-0000-0000-0000-000000000001';
  raise exception 'FAIL admin self-deactivate allowed';
exception when insufficient_privilege then raise notice 'PASS admin cannot deactivate self'; end $$;

-- admin changes staff permissions -> audited
update public.profiles set permissions = permissions || '{"create_applicant": true}'::jsonb where id = '10000000-0000-0000-0000-000000000002';
select pg_temp.check('permissions_changed audited', (select count(*) = 1 from public.audit_logs where action = 'permissions_changed'));
update public.profiles set permissions = permissions || '{"create_applicant": false}'::jsonb where id = '10000000-0000-0000-0000-000000000002';

-- storage: admin upload in own school folder
insert into storage.objects (bucket_id, name) values ('applicant-documents', '00000000-0000-0000-0000-00000000000a/20000000-0000-0000-0000-000000000001/x.pdf');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('applicant-documents', '00000000-0000-0000-0000-00000000000b/20000000-0000-0000-0000-000000000001/x.pdf');
  raise exception 'FAIL cross-school storage upload allowed';
exception when insufficient_privilege then raise notice 'PASS storage upload blocked for other school folder'; end $$;

-- ---------------- Staff A1 (default perms) ----------------
select pg_temp.login('10000000-0000-0000-0000-000000000002');
select pg_temp.check('staff sees school applicants', (select count(*) = 1 from public.applicants));
select pg_temp.check('staff cannot see payments', (select count(*) = 0 from public.payments));
select pg_temp.check('staff cannot see audit logs', (select count(*) = 0 from public.audit_logs));
select pg_temp.check('staff sees history', (select count(*) >= 3 from public.activity_logs));
select pg_temp.check('staff dashboard hides financials', (not (public.dashboard_summary() ? 'total_balance_due')));
do $$ begin
  insert into public.applicants (school_id, full_name, phone) values ('00000000-0000-0000-0000-00000000000a', 'X', '1');
  raise exception 'FAIL staff without create perm inserted applicant';
exception when insufficient_privilege then raise notice 'PASS staff create blocked'; end $$;
do $$ begin
  insert into public.payments (applicant_id, amount, payment_mode) values ('20000000-0000-0000-0000-000000000001', 10, 'cash');
  raise exception 'FAIL staff without add_payment inserted payment';
exception when insufficient_privilege then raise notice 'PASS staff payment blocked'; end $$;
do $$ begin
  update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000002';
  raise exception 'FAIL staff self-promoted';
exception when insufficient_privilege then raise notice 'PASS staff cannot change own role'; end $$;
update public.profiles set phone = '9000000000' where id = '10000000-0000-0000-0000-000000000002';
select pg_temp.check('staff can edit own phone', (select phone = '9000000000' from public.profiles where id = '10000000-0000-0000-0000-000000000002'));
-- staff can upload documents + log a download
insert into public.documents (applicant_id, document_type, file_name, storage_path, file_size, mime_type)
values ('20000000-0000-0000-0000-000000000001', 'id_proof', 'id.pdf', '00000000-0000-0000-0000-00000000000a/20000000-0000-0000-0000-000000000001/id.pdf', 1234, 'application/pdf');
select pg_temp.check('document_uploaded log', (select count(*) = 1 from public.activity_logs where action = 'document_uploaded'));
select public.log_event('document_downloaded', 'documents', (select id from public.documents limit 1), '20000000-0000-0000-0000-000000000001', '{"file_name":"id.pdf"}');
select pg_temp.check('document_downloaded log', (select count(*) = 1 from public.activity_logs where action = 'document_downloaded'));
do $$ begin
  perform public.log_event('payment_added', 'payments');
  raise exception 'FAIL log_event accepted trigger-only action';
exception when invalid_parameter_value then raise notice 'PASS log_event rejects trigger-only actions'; end $$;
update public.documents set is_archived = true;
select pg_temp.check('staff cannot archive documents (0 rows affected)', (select count(*) = 0 from public.documents where is_archived));
delete from public.applicants;
select pg_temp.check('staff cannot delete applicants', (select count(*) = 1 from public.applicants));

-- ---------------- Staff A2 (create/edit/add_payment) ----------------
select pg_temp.login('10000000-0000-0000-0000-000000000003');
insert into public.applicants (id, school_id, full_name, phone, total_fee) values ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'Sita Devi', '9123456789', 4000);
insert into public.payments (applicant_id, amount, payment_mode) values ('20000000-0000-0000-0000-000000000002', 1500, 'cash');
select pg_temp.check('staff A2 payment visible + balance', (select amount_paid = 1500 and balance_due = 2500 from public.applicants where id = '20000000-0000-0000-0000-000000000002'));
insert into public.training_sessions (applicant_id, session_date, start_time, end_time, status) values ('20000000-0000-0000-0000-000000000002', current_date, '09:00', '10:00', 'completed');
select pg_temp.check('training created + logged', (select count(*) = 1 from public.activity_logs where entity_type = 'training_sessions' and action = 'created'));
do $$ begin
  update public.payments set amount = 1 where applicant_id = '20000000-0000-0000-0000-000000000002';
  if found then raise exception 'FAIL staff edited payment'; end if;
  raise notice 'PASS staff cannot edit payment';
end $$;

-- ---------------- Admin B (isolation) ----------------
select pg_temp.login('10000000-0000-0000-0000-000000000011');
select pg_temp.check('admin B sees no school A applicants', (select count(*) = 0 from public.applicants));
select pg_temp.check('admin B sees no school A profiles', (select count(*) = 1 from public.profiles));
select pg_temp.check('admin B sees no school A logs', (select count(*) = 0 from public.activity_logs));
select pg_temp.check('admin B sees only own audit', (select count(*) = 0 from public.audit_logs where school_id = '00000000-0000-0000-0000-00000000000a'));
do $$ begin
  insert into public.payments (applicant_id, amount, payment_mode) values ('20000000-0000-0000-0000-000000000001', 10, 'cash');
  raise exception 'FAIL cross-school payment insert';
exception when insufficient_privilege then raise notice 'PASS cross-school payment blocked'; end $$;
select pg_temp.check('admin B search empty', (select count(*) = 0 from public.search_applicants('ravi')));

-- ---------------- Deactivation ----------------
select pg_temp.login('10000000-0000-0000-0000-000000000001');
update public.profiles set is_active = false where id = '10000000-0000-0000-0000-000000000002';
select pg_temp.check('deactivation audited', (select count(*) = 1 from public.audit_logs where action = 'staff_deactivated'));
select pg_temp.login('10000000-0000-0000-0000-000000000002');
select pg_temp.check('deactivated staff sees nothing', (select count(*) = 0 from public.applicants) and (select count(*) = 0 from public.profiles));

-- admin deletes applicant: history retained with applicant_id null, cascades logged
select pg_temp.login('10000000-0000-0000-0000-000000000001');
delete from public.applicants where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.check('applicant deleted', (select count(*) = 1 from public.applicants));
select pg_temp.check('deleted log present', (select count(*) = 1 from public.activity_logs where action = 'deleted' and entity_type = 'applicants'));
select pg_temp.check('history retained after delete', (select count(*) >= 5 from public.activity_logs where applicant_id is null and entity_id = '20000000-0000-0000-0000-000000000001' or applicant_id is null));

-- ---------------- anon ----------------
reset role;
set role anon;
do $$ begin
  perform count(*) from public.applicants;
  raise exception 'FAIL anon could read applicants';
exception when insufficient_privilege then raise notice 'PASS anon has no table access'; end $$;
reset role;
select 'ALL_RLS_TESTS_PASSED';
rollback;
