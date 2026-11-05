-- An instructor can update a lesson they teach, but not who it belongs to.

create function app.freeze_instructor_applicant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if app.is_instructor_only() and new.applicant_id is distinct from old.applicant_id then
    raise exception 'an instructor cannot change which learner a lesson belongs to'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger freeze_instructor_applicant
  before update on public.training_sessions
  for each row execute function app.freeze_instructor_applicant();

revoke all on function app.freeze_instructor_applicant() from public;
grant execute on function app.freeze_instructor_applicant() to authenticated, service_role;
