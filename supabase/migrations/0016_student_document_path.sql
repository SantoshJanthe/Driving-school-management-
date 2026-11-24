-- A student may store a file only under their own school and applicant folder.

create or replace function app.guard_student_document_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
begin
  if app.current_user_role() is distinct from 'student' then
    return new;
  end if;
  if new.applicant_id is distinct from app.current_applicant_id()
     or new.school_id is distinct from app.current_school_id() then
    raise exception 'that folder is not yours' using errcode = 'insufficient_privilege';
  end if;
  v_prefix := app.current_school_id()::text || '/' || app.current_applicant_id()::text || '/';
  if new.storage_path is null
     or left(new.storage_path, length(v_prefix)) is distinct from v_prefix
     or new.storage_path like '%..%'
     or new.storage_path like '%\%' then
    raise exception 'that folder is not yours' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_student_document_path on public.documents;
create trigger guard_student_document_path
  before insert or update on public.documents
  for each row execute function app.guard_student_document_path();

revoke all on function app.guard_student_document_path() from public;
grant execute on function app.guard_student_document_path() to authenticated, service_role;
