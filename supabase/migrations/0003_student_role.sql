-- Add the student value on its own.
-- PostgreSQL will not let the same transaction use an enum value it just added.

alter type public.user_role add value if not exists 'student';
