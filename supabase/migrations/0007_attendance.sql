-- Attendance is separate from the lesson status (scheduled, completed, cancelled).

create type public.attendance_mark as enum ('present', 'absent', 'late');

alter table public.training_sessions
  add column attendance public.attendance_mark;
