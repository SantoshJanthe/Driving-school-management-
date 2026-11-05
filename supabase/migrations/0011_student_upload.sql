-- A student may add a document only for the applicant linked to their login.
-- They cannot update, archive, or delete documents, or write into another folder.

create policy "documents: student upload own" on public.documents
  for insert to authenticated
  with check (
    school_id = app.current_school_id()
    and applicant_id = app.current_applicant_id()
    and uploaded_by = auth.uid()
    and app.current_user_role() = 'student'
  );

create policy "applicant-documents: student upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = app.current_school_id()::text
    and (storage.foldername(name))[2] = app.current_applicant_id()::text
    and app.current_user_role() = 'student'
  );
