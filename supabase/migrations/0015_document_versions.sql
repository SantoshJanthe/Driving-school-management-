-- When a file of the same type is uploaded again, the previous bytes are kept.

create table public.document_versions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete restrict,
  applicant_id   uuid not null references public.applicants (id) on delete cascade,
  document_id    uuid references public.documents (id) on delete set null,
  document_type  public.document_type not null,
  file_name      text not null,
  storage_path   text not null unique,
  file_size      bigint not null check (file_size > 0),
  mime_type      text not null,
  replaced_at    timestamptz not null default now()
);

alter table public.document_versions enable row level security;

create policy "versions: view" on public.document_versions
  for select to authenticated
  using (
    school_id = app.current_school_id()
    and (
      app.has_permission('view_applicants')
      or (
        app.current_user_role() = 'student'
        and applicant_id = app.current_applicant_id()
      )
    )
  );

revoke all on public.document_versions from anon;
grant select on public.document_versions to authenticated;

create function public.keep_replaced_document(p_document uuid, p_version_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.documents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  select * into v_doc from public.documents where id = p_document;
  if not found or v_doc.school_id is distinct from app.current_school_id() then
    raise exception 'document not found' using errcode = 'insufficient_privilege';
  end if;
  if app.current_user_role() = 'student' then
    if v_doc.applicant_id is distinct from app.current_applicant_id() then
      raise exception 'not allowed' using errcode = 'insufficient_privilege';
    end if;
  elsif not app.has_permission('view_applicants') then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  if p_version_path is distinct from (v_doc.school_id::text || '/' || v_doc.applicant_id::text || '/versions/' || split_part(p_version_path, '/versions/', 2))
     or p_version_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/versions/[0-9a-f-]{36}-[A-Za-z0-9._-]{1,120}$' then
    raise exception 'invalid version path' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.document_versions (
    school_id, applicant_id, document_id, document_type, file_name, storage_path, file_size, mime_type
  ) values (
    v_doc.school_id, v_doc.applicant_id, v_doc.id, v_doc.document_type, v_doc.file_name,
    p_version_path, v_doc.file_size, v_doc.mime_type
  );
  update public.documents set is_archived = true, updated_at = now() where id = v_doc.id;
end;
$$;

revoke all on function public.keep_replaced_document(uuid, text) from public;
grant execute on function public.keep_replaced_document(uuid, text) to authenticated;
