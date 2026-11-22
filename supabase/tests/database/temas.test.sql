-- Tema y generación (#51). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso · 3 profesor de otro curso · 4 alumno
insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000001', 'admin@temas.mx'),
  ('d0000000-0000-0000-0000-000000000002', 'profe@temas.mx'),
  ('d0000000-0000-0000-0000-000000000003', 'otro@temas.mx'),
  ('d0000000-0000-0000-0000-000000000004', 'alumno@temas.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('d0000000-0000-0000-0000-000000000001', 'admin@temas.mx', 'Admin', 'admin', 'active'),
  ('d0000000-0000-0000-0000-000000000002', 'profe@temas.mx', 'Profe', 'teacher', 'active'),
  ('d0000000-0000-0000-0000-000000000003', 'otro@temas.mx', 'Otro', 'teacher', 'active'),
  ('d0000000-0000-0000-0000-000000000004', 'alumno@temas.mx', 'Alumno', 'student', 'active');

insert into public.courses (id, name) values
  ('d1000000-0000-0000-0000-000000000001', 'Curso'),
  ('d1000000-0000-0000-0000-000000000002', 'Otro curso');
insert into public.groups (id, course_id, name, code) values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Grupo', 'TG'),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Otro', 'TO');
insert into public.group_teachers (group_id, teacher_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'),
  ('d2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
insert into public.group_students (group_id, student_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004');
-- Módulo 1 habilitado para el grupo; módulo 2 del mismo curso sin habilitar.
insert into public.modules (id, course_id, title, position) values
  ('d3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Matemático', 0),
  ('d3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Lector', 1),
  ('d3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Otro', 0);
insert into public.group_modules (group_id, module_id, course_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001');

insert into public.topics (id, course_id, module_id, title, status) values
  ('d5000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Álgebra', 'active'),
  ('d5000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Archivado', 'archived'),
  ('d5000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000002', 'Comprensión', 'active');

-- ── Integridad ───────────────────────────────────────────────────────────────
select throws_ok(
  $$ insert into public.topics (course_id, module_id, title) values
     ('d1000000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000001', 'Curso equivocado') $$,
  '23503', null, 'un tema no se liga a un módulo de otro curso'
);
select throws_ok(
  $$ insert into public.sessions (module_id, topic_id, title) values
     ('d3000000-0000-0000-0000-000000000002', 'd5000000-0000-0000-0000-000000000001', 'Clase cruzada') $$,
  '23503', null, 'una sesión no usa un tema de otro módulo'
);
select lives_ok(
  $$ insert into public.sessions (id, module_id, topic_id, title) values
     ('d4000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001',
      'd5000000-0000-0000-0000-000000000001', 'Ecuaciones') $$,
  'una sesión pertenece a un tema de su módulo: Curso, Módulo, Tema y Sesión'
);
select lives_ok(
  $$ insert into public.sessions (module_id, title, position) values
     ('d3000000-0000-0000-0000-000000000001', 'Clase sin tema', 1) $$,
  'una sesión sin tema se crea y queda en el tema General (#85)'
);
select throws_ok(
  $$ delete from public.topics where id = 'd5000000-0000-0000-0000-000000000001' $$,
  '23503', null, 'no se borra un tema que tiene sesiones'
);
select throws_ok(
  $$ update public.groups set generation = '  ' where id = 'd2000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'la generación no puede quedar en blanco'
);

-- Los permisos no dependen del ACL por omisión de cada versión de Supabase.
select ok(
  not has_table_privilege('authenticated', 'public.topics', 'DELETE')
    and has_table_privilege('authenticated', 'public.topics', 'SELECT, INSERT, UPDATE'),
  'authenticated lee, crea y edita temas, pero no los borra'
);
select ok(
  not has_table_privilege('anon', 'public.topics', 'SELECT, INSERT, UPDATE, DELETE'),
  'anon no tiene permisos sobre los temas'
);

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select lives_ok(
  $$ update public.groups set generation = '2027' where id = 'd2000000-0000-0000-0000-000000000001' $$,
  'el administrador asigna la generación del grupo'
);
select lives_ok(
  $$ insert into public.topics (course_id, module_id, title) values
     ('d1000000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000003', 'Tema del admin') $$,
  'el administrador crea temas en cualquier curso'
);
select throws_ok(
  $$ delete from public.topics where id = 'd5000000-0000-0000-0000-000000000003' $$,
  '42501', null, 'los temas se archivan, no se borran'
);
reset role;

-- ── Profesor del curso ───────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.topics (course_id, module_id, title, position) values
     ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Geometría', 1) $$,
  'el profesor crea un tema en un módulo de su curso'
);
select isnt_empty(
  $$ update public.topics set title = 'Álgebra básica' where id = 'd5000000-0000-0000-0000-000000000001' returning id $$,
  'el profesor renombra un tema de su curso'
);
select is(
  (select generation from public.groups where id = 'd2000000-0000-0000-0000-000000000001'),
  '2027',
  'el profesor ve la generación de su grupo'
);
reset role;

-- ── Profesor de otro curso ───────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.topics (course_id, module_id, title) values
     ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Ajeno') $$,
  '42501', null, 'el profesor no crea temas en un curso ajeno'
);
select is_empty(
  $$ select id from public.topics where course_id = 'd1000000-0000-0000-0000-000000000001' $$,
  'el profesor no ve los temas de un curso ajeno'
);
reset role;

-- ── Alumno ───────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.topics order by position, title $$,
  array['Álgebra básica', 'General', 'Geometría'],
  'el alumno ve solo los temas activos de sus módulos habilitados'
);
select throws_ok(
  $$ insert into public.topics (course_id, module_id, title) values
     ('d1000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Mío') $$,
  '42501', null, 'el alumno no crea temas'
);
select is(
  (select topic_id from public.sessions where id = 'd4000000-0000-0000-0000-000000000001'),
  'd5000000-0000-0000-0000-000000000001'::uuid,
  'el alumno ve a qué tema pertenece su sesión'
);
reset role;

select * from finish();
rollback;
