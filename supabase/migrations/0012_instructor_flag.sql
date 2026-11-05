-- Only an admin can mark a staff login as an instructor.
-- An instructor's permission flags are cleared so they cannot open fees,
-- applicants, or the staff directory. Their lessons stay on the instructor policies.

create or replace function app.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.school_id is distinct from old.school_id then
    raise exception 'school_id cannot be changed' using errcode = 'insufficient_privilege';
  end if;
  if new.last_login_at is distinct from old.last_login_at then
    new.last_login_at := old.last_login_at;
  end if;
  if new.role is distinct from 'staff' then
    new.is_instructor := false;
  end if;
  if new.role = 'staff' and new.is_instructor then
    new.permissions := jsonb_build_object(
      'view_applicants', false,
      'create_applicant', false,
      'edit_applicant', false,
      'add_payment', false,
      'manage_training', false,
      'view_financials', false
    );
  end if;
  if not app.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.permissions is distinct from old.permissions
       or new.email is distinct from old.email
       or new.is_instructor is distinct from old.is_instructor then
      raise exception 'only admins can change role, status, permissions, email, or instructor'
        using errcode = 'insufficient_privilege';
    end if;
  elsif new.id = auth.uid()
        and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'admins cannot change their own role or deactivate themselves'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

update public.profiles
set permissions = jsonb_build_object(
  'view_applicants', false,
  'create_applicant', false,
  'edit_applicant', false,
  'add_payment', false,
  'manage_training', false,
  'view_financials', false
)
where role = 'staff' and is_instructor;
