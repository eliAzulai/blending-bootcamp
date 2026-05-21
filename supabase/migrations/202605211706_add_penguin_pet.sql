alter table students
  drop constraint if exists students_pet_type_check;

alter table students
  add constraint students_pet_type_check
  check (pet_type in ('cat', 'dog', 'guinea_pig', 'bird', 'bunny', 'penguin'));
