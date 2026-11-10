-- Este archivo se ejecuta con `supabase db reset`.
-- Los usuarios de prueba deben crearse mediante Supabase Auth/Studio para
-- respetar la relación con auth.users; no se insertan credenciales aquí.

-- Cursos y grupos para probar en local. En la aplicación los administra el
-- panel del administrador (#50).
insert into public.courses (id, name, starts_on, ends_on) values
  ('10000000-0000-0000-0000-000000000001', 'Curso de prueba', '2027-01-11', '2027-06-26');

insert into public.groups (id, course_id, name, code, schedule) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Grupo A', 'A',
   'Entre semana: martes y jueves, 7:00 a 9:00 p. m.'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Grupo B', 'B',
   'Sabatino: sábados, 8:00 a. m. a 12:00 p. m.');
