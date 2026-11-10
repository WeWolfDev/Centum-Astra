-- Administración de cursos, grupos y módulos (#50). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(26);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor · 3 alumno · 4 admin suspendido
insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'admin@catalogo.mx'),
  ('c0000000-0000-0000-0000-000000000002', 'profe@catalogo.mx'),
  ('c0000000-0000-0000-0000-000000000003', 'alumno@catalogo.mx'),
  ('c0000000-0000-0000-0000-000000000004', 'suspendido@catalogo.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('c0000000-0000-0000-0000-000000000001', 'admin@catalogo.mx', 'Admin', 'admin', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'profe@catalogo.mx', 'Profe', 'teacher', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'alumno@catalogo.mx', 'Alumno', 'student', 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'suspendido@catalogo.mx', 'Suspendido', 'admin', 'suspended');

insert into public.courses (id, name) values ('c1000000-0000-0000-0000-000000000001', 'Curso base');
insert into public.groups (id, course_id, name, code) values
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Grupo base', 'GB');
insert into public.group_teachers (group_id, teacher_id) values
  ('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
insert into public.group_students (group_id, student_id) values
  ('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003');
insert into public.modules (id, course_id, title, status) values
  ('c3000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Módulo base', 'active');

-- ── Esquema ──────────────────────────────────────────────────────────────────
select has_column('public', 'courses', 'starts_on', 'el curso guarda su fecha de inicio');
select has_column('public', 'courses', 'ends_on', 'el curso guarda su fecha de fin');
select hasnt_column('public', 'groups', 'starts_on', 'el grupo ya no guarda fechas propias');
select has_column('public', 'groups', 'schedule', 'el grupo guarda su horario');

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.courses (id, name, starts_on, ends_on)
     values ('c1000000-0000-0000-0000-000000000002', 'Curso nuevo', '2027-01-10', '2027-06-30') $$,
  'el administrador crea un curso con fechas'
);
select throws_ok(
  $$ insert into public.courses (name, starts_on, ends_on) values ('Fechas al revés', '2027-06-30', '2027-01-10') $$,
  '23514', null, 'la fecha de fin no puede ser anterior a la de inicio'
);
select lives_ok(
  $$ update public.courses set name = 'Curso renombrado' where id = 'c1000000-0000-0000-0000-000000000002' $$,
  'el administrador edita un curso'
);
select is(
  (select name from public.courses where id = 'c1000000-0000-0000-0000-000000000002'),
  'Curso renombrado', 'la edición del curso persiste'
);
select lives_ok(
  $$ insert into public.groups (id, course_id, name, code, schedule)
     values ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002',
             'Sabatino', 'S1', 'Sábados, 8:00 a. m. a 12:00 p. m.') $$,
  'el administrador crea un grupo con horario'
);
select throws_ok(
  $$ insert into public.groups (course_id, name, code, schedule)
     values ('c1000000-0000-0000-0000-000000000002', 'Sin horario', 'S2', '   ') $$,
  '23514', null, 'el horario no puede quedar en blanco'
);
select lives_ok(
  $$ update public.groups set schedule = 'Martes y jueves, 7:00 a 9:00 p. m.'
     where id = 'c2000000-0000-0000-0000-000000000002' $$,
  'el administrador edita el horario'
);
select lives_ok(
  $$ insert into public.modules (id, course_id, title, position)
     values ('c3000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Módulo nuevo', 0) $$,
  'el administrador crea un módulo'
);
select lives_ok(
  $$ update public.modules set status = 'archived' where id = 'c3000000-0000-0000-0000-000000000002' $$,
  'el administrador archiva un módulo'
);
select lives_ok(
  $$ update public.groups set status = 'archived' where id = 'c2000000-0000-0000-0000-000000000002' $$,
  'el administrador archiva un grupo'
);
select lives_ok(
  $$ update public.courses set status = 'archived' where id = 'c1000000-0000-0000-0000-000000000002' $$,
  'el administrador archiva un curso'
);
delete from public.courses where id = 'c1000000-0000-0000-0000-000000000002';
select is(
  (select count(*) from public.courses where id = 'c1000000-0000-0000-0000-000000000002'),
  1::bigint, 'los cursos se archivan, no se borran'
);
reset role;

-- ── Profesor ─────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;

select throws_ok(
  $$ insert into public.courses (name) values ('Curso del profe') $$,
  '42501', null, 'el profesor no crea cursos'
);
select throws_ok(
  $$ insert into public.groups (course_id, name, code) values ('c1000000-0000-0000-0000-000000000001', 'G', 'X') $$,
  '42501', null, 'el profesor no crea grupos'
);
select throws_ok(
  $$ insert into public.modules (course_id, title, position) values ('c1000000-0000-0000-0000-000000000001', 'M', 5) $$,
  '42501', null, 'el profesor no crea módulos'
);
update public.courses set name = 'Cambiado por el profe' where id = 'c1000000-0000-0000-0000-000000000001';
update public.groups set schedule = 'Cambiado por el profe' where id = 'c2000000-0000-0000-0000-000000000001';
update public.modules set title = 'Cambiado por el profe' where id = 'c3000000-0000-0000-0000-000000000001';
reset role;

select is((select name from public.courses where id = 'c1000000-0000-0000-0000-000000000001'),
  'Curso base', 'el profesor no edita cursos');
select is((select schedule from public.groups where id = 'c2000000-0000-0000-0000-000000000001'),
  null, 'el profesor no edita grupos');
select is((select title from public.modules where id = 'c3000000-0000-0000-0000-000000000001'),
  'Módulo base', 'el profesor no edita módulos');

-- ── Alumno ───────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;

select throws_ok(
  $$ insert into public.courses (name) values ('Curso del alumno') $$,
  '42501', null, 'el alumno no crea cursos'
);
update public.modules set status = 'archived' where id = 'c3000000-0000-0000-0000-000000000001';
update public.groups set name = 'Cambiado por el alumno' where id = 'c2000000-0000-0000-0000-000000000001';
reset role;

select is((select status from public.modules where id = 'c3000000-0000-0000-0000-000000000001'),
  'active', 'el alumno no archiva módulos');
select is((select name from public.groups where id = 'c2000000-0000-0000-0000-000000000001'),
  'Grupo base', 'el alumno no edita grupos');

-- ── Administrador suspendido ─────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.courses (name) values ('Curso suspendido') $$,
  '42501', null, 'el administrador suspendido no crea cursos'
);
reset role;

select * from finish();
rollback;
