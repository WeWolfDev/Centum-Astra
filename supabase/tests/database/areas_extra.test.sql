-- Áreas extra por alumno (#61). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(29);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor · 3 alumno con área extra · 4 alumno sin ella
-- 5 alumno sin grupo · 6 alumno suspendido con área extra
insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'admin@areas.mx'),
  ('e0000000-0000-0000-0000-000000000002', 'profe@areas.mx'),
  ('e0000000-0000-0000-0000-000000000003', 'conarea@areas.mx'),
  ('e0000000-0000-0000-0000-000000000004', 'sinarea@areas.mx'),
  ('e0000000-0000-0000-0000-000000000005', 'singrupo@areas.mx'),
  ('e0000000-0000-0000-0000-000000000006', 'suspendido@areas.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('e0000000-0000-0000-0000-000000000001', 'admin@areas.mx', 'Admin', 'admin', 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'profe@areas.mx', 'Profe', 'teacher', 'active'),
  ('e0000000-0000-0000-0000-000000000003', 'conarea@areas.mx', 'Con área', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000004', 'sinarea@areas.mx', 'Sin área', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000005', 'singrupo@areas.mx', 'Sin grupo', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000006', 'suspendido@areas.mx', 'Suspendido', 'student', 'suspended');

insert into public.courses (id, name) values ('e1000000-0000-0000-0000-000000000001', 'Curso');
insert into public.groups (id, course_id, name, code) values
  ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Grupo 1', 'G1'),
  ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Grupo 2', 'G2');
insert into public.group_teachers (group_id, teacher_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');
insert into public.group_students (group_id, student_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003'),
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004'),
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006');

-- M1 lo habilita el grupo; M2 es el área extra; M3 nadie la tiene.
insert into public.modules (id, course_id, title, position) values
  ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Pensamiento matemático', 0),
  ('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Premedicina', 1),
  ('e3000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Ciencias de la salud', 2);
insert into public.group_modules (group_id, module_id, course_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');

insert into public.sessions (id, module_id, title) values
  ('e4000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'Clase de M1'),
  ('e4000000-0000-0000-0000-000000000002', 'e3000000-0000-0000-0000-000000000002', 'Clase de M2');
insert into public.materials (session_id, title, kind, external_url, status, created_by) values
  ('e4000000-0000-0000-0000-000000000002', 'Publicado M2', 'external_link', 'https://a.test', 'published', 'e0000000-0000-0000-0000-000000000001'),
  ('e4000000-0000-0000-0000-000000000002', 'Borrador M2', 'external_link', 'https://b.test', 'draft', 'e0000000-0000-0000-0000-000000000001');

insert into public.student_extra_modules (student_id, module_id) values
  ('e0000000-0000-0000-0000-000000000005', 'e3000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000006', 'e3000000-0000-0000-0000-000000000002');

-- ── Integridad ───────────────────────────────────────────────────────────────
select throws_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000002', 'e3000000-0000-0000-0000-000000000002') $$,
  'P0001', null, 'un profesor no recibe áreas extra'
);
select throws_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000005', 'e3000000-0000-0000-0000-000000000002') $$,
  '23505', null, 'la misma área no se otorga dos veces'
);
select throws_ok(
  $$ update public.profiles set role = 'teacher' where id = 'e0000000-0000-0000-0000-000000000005' $$,
  'CA001', null, 'no se cambia el rol de quien tiene áreas extra'
);

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000002') $$,
  'el administrador otorga un área extra'
);
select is(
  (select granted_by from public.student_extra_modules
   where student_id = 'e0000000-0000-0000-0000-000000000003'),
  'e0000000-0000-0000-0000-000000000001'::uuid,
  'el área guarda quién la otorgó'
);
select lives_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000004', 'e3000000-0000-0000-0000-000000000003') $$,
  'el administrador otorga otra área a un segundo alumno'
);
select lives_ok(
  $$ delete from public.student_extra_modules
     where student_id = 'e0000000-0000-0000-0000-000000000004' $$,
  'el administrador retira un área'
);
select is(
  (select count(*) from public.student_extra_modules
   where student_id = 'e0000000-0000-0000-0000-000000000004'),
  0::bigint, 'el retiro persiste'
);
select is((select count(*) from public.student_extra_modules), 3::bigint, 'el administrador ve todas las áreas extra');
reset role;

select is(
  (select count(*) from public.group_students where student_id = 'e0000000-0000-0000-0000-000000000003'),
  1::bigint, 'el alumno con área extra sigue en un solo grupo'
);
select throws_ok(
  $$ insert into public.group_students (group_id, student_id) values
     ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003') $$,
  '23505', null, 'el área extra no inscribe al alumno en otro grupo'
);

-- ── Alumno con área extra ────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;

select results_eq(
  $$ select title from public.modules order by position $$,
  $$ values ('Pensamiento matemático'::text), ('Premedicina'::text) $$,
  'el alumno ve el módulo de su grupo y su área extra'
);
select is(
  (select count(*) from public.sessions where module_id = 'e3000000-0000-0000-0000-000000000002'),
  1::bigint, 'el alumno ve las sesiones de su área extra'
);
select results_eq(
  $$ select title from public.materials $$,
  $$ values ('Publicado M2'::text) $$,
  'el alumno ve el material publicado de su área extra, no los borradores'
);
select is((select count(*) from public.student_extra_modules), 1::bigint, 'el alumno solo ve sus propias áreas extra');
select throws_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'el alumno no se otorga áreas'
);
delete from public.student_extra_modules where student_id = 'e0000000-0000-0000-0000-000000000003';
select is((select count(*) from public.student_extra_modules), 1::bigint, 'el alumno no se retira áreas');
reset role;

-- ── Alumno sin ese permiso ───────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;

select results_eq(
  $$ select title from public.modules $$,
  $$ values ('Pensamiento matemático'::text) $$,
  'el alumno sin área extra solo ve el módulo de su grupo'
);
select is_empty(
  $$ select id from public.sessions where module_id = 'e3000000-0000-0000-0000-000000000002' $$,
  'el alumno sin área extra no lee sus sesiones'
);
select is_empty(
  $$ select id from public.materials $$,
  'el alumno sin área extra no lee sus materiales'
);
select is_empty(
  $$ select module_id from public.student_extra_modules $$,
  'el alumno no ve las áreas extra de otros'
);
reset role;

-- ── Alumno sin grupo, solo con área extra ────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000005"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.modules $$,
  $$ values ('Premedicina'::text) $$,
  'un alumno sin grupo ve solo su área extra'
);
reset role;

-- ── Alumno suspendido ────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000006"}', true);
set local role authenticated;
select is_empty($$ select id from public.modules $$, 'el alumno suspendido pierde sus áreas extra');
select is_empty($$ select module_id from public.student_extra_modules $$, 'el alumno suspendido no lee sus áreas');
reset role;

-- ── Profesor ─────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.student_extra_modules (student_id, module_id) values
     ('e0000000-0000-0000-0000-000000000004', 'e3000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no otorga áreas'
);
delete from public.student_extra_modules;
select is_empty($$ select module_id from public.student_extra_modules $$, 'el profesor no ve áreas extra');
reset role;

select is(
  (select count(*) from public.student_extra_modules),
  3::bigint, 'el profesor no retira áreas'
);

-- ── Área archivada ───────────────────────────────────────────────────────────
update public.modules set status = 'archived' where id = 'e3000000-0000-0000-0000-000000000002';

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.modules $$,
  $$ values ('Pensamiento matemático'::text) $$,
  'un área extra archivada deja de verse'
);
reset role;

-- ── Al borrar el módulo se borra el permiso ──────────────────────────────────
delete from public.materials;
delete from public.sessions where module_id = 'e3000000-0000-0000-0000-000000000002';
delete from public.modules where id = 'e3000000-0000-0000-0000-000000000002';
select is((select count(*) from public.student_extra_modules), 0::bigint, 'borrar el módulo retira sus áreas extra');

select * from finish();
rollback;
