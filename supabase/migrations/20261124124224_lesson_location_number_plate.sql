-- Instructors save a vehicle number plate with the place name.
-- Latitude and longitude are no longer collected.

alter table public.lesson_locations
  add column number_plate text;

update public.lesson_locations
set number_plate = 'NOTSET'
where number_plate is null;

alter table public.lesson_locations
  alter column number_plate set not null;

alter table public.lesson_locations
  add constraint lesson_locations_number_plate_check
  check (char_length(trim(number_plate)) between 4 and 15);

alter table public.lesson_locations
  drop column latitude,
  drop column longitude;
