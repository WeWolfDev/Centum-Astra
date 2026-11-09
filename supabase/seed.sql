-- Este archivo se ejecuta con `supabase db reset`.
-- Los usuarios de prueba deben crearse mediante Supabase Auth/Studio para
-- respetar la relación con auth.users; no se insertan credenciales aquí.

-- Cursos y grupos para probar asignaciones en local. La pantalla para
-- administrarlos todavía no existe.
insert into public.courses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Curso de prueba');

insert into public.groups (id, course_id, name, code) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Grupo A', 'A'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Grupo B', 'B');
