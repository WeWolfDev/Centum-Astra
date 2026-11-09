-- Accesos permitidos y denegados por rol (#27). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(35);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 y 3 profesores · 4 y 5 alumnos · 6 admin suspendido
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'admin@test.mx'),
  ('00000000-0000-0000-0000-000000000002', 'profe1@test.mx'),
  ('00000000-0000-0000-0000-000000000003', 'profe2@test.mx'),
  ('00000000-0000-0000-0000-000000000004', 'alumno1@test.mx'),
  ('00000000-0000-0000-0000-000000000005', 'alumno2@test.mx'),
  ('00000000-0000-0000-0000-000000000006', 'suspendido@test.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('00000000-0000-0000-0000-000000000001', 'admin@test.mx', 'Admin', 'admin', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'profe1@test.mx', 'Profe 1', 'teacher', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'profe2@test.mx', 'Profe 2', 'teacher', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'alumno1@test.mx', 'Alumno 1', 'student', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'alumno2@test.mx', 'Alumno 2', 'student', 'active'),
  ('00000000-0000-0000-0000-000000000006', 'suspendido@test.mx', 'Suspendido', 'admin', 'suspended');

insert into public.courses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Curso 1'),
  ('10000000-0000-0000-0000-000000000002', 'Curso 2');

insert into public.groups (id, course_id, name, code) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Grupo 1', 'G1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Grupo 2', 'G2');

insert into public.group_teachers (group_id, teacher_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

insert into public.group_students (group_id, student_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005');

insert into public.modules (id, course_id, title) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Módulo 1'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Módulo 2');

insert into public.sessions (id, module_id, title) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Sesión 1'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Sesión 2');

insert into public.materials (session_id, title, kind, external_url, status, created_by) values
  ('40000000-0000-0000-0000-000000000001', 'Publicado 1', 'external_link', 'https://a.test', 'published', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 'Borrador 1', 'external_link', 'https://b.test', 'draft', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'Publicado 2', 'external_link', 'https://c.test', 'published', '00000000-0000-0000-0000-000000000001');

insert into public.audit_logs (actor_id, action, entity_type) values
  ('00000000-0000-0000-0000-000000000001', 'user.suspended', 'profile');

-- ── Integridad ───────────────────────────────────────────────────────────────
select throws_ok(
  $$ insert into public.group_students (group_id, student_id) values
     ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004') $$,
  '23505', null, 'un alumno no puede pertenecer a dos grupos'
);
select throws_ok(
  $$ insert into public.group_students (group_id, student_id) values
     ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') $$,
  'P0001', null, 'un profesor no puede inscribirse como alumno'
);
select throws_ok(
  $$ update public.profiles set role = 'teacher' where id = '00000000-0000-0000-0000-000000000004' $$,
  'CA001', null, 'no se cambia el rol de quien tiene grupos asignados'
);
select throws_matching(
  $$ delete from auth.users where id = '00000000-0000-0000-0000-000000000004' $$,
  'profiles_id_fkey', 'la cuenta con perfil no se borra físicamente'
);

-- ── Anónimo ──────────────────────────────────────────────────────────────────
set local role anon;
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon no lee perfiles');
select throws_ok($$ select * from public.materials $$, '42501', null, 'anon no lee materiales');
reset role;

-- ── Alumno ───────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select is((select count(*) from public.profiles), 1::bigint, 'el alumno solo ve su perfil');
select is_empty(
  $$ select id from public.profiles where id = '00000000-0000-0000-0000-000000000005' $$,
  'el alumno no ve a otro alumno cambiando el ID'
);
select is((select count(*) from public.groups), 1::bigint, 'el alumno solo ve su grupo');
select is((select count(*) from public.courses), 1::bigint, 'el alumno solo ve su curso');
select results_eq(
  $$ select title from public.materials $$,
  array['Publicado 1'],
  'el alumno solo ve materiales publicados de su curso'
);
select is((select count(*) from public.audit_logs), 0::bigint, 'el alumno no ve la auditoría');
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000004' $$,
  '42501', null, 'el alumno no puede cambiar su propio rol'
);
select is_empty(
  $$ delete from public.group_students where student_id = '00000000-0000-0000-0000-000000000004' returning student_id $$,
  'el alumno no puede borrar su asignación'
);
select throws_ok(
  $$ insert into public.courses (name) values ('Curso nuevo') $$,
  '42501', null, 'el alumno no crea cursos'
);
reset role;

-- ── Profesor ─────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select is((select count(*) from public.profiles), 2::bigint, 'el profesor ve su perfil y a sus alumnos');
select is_empty(
  $$ select id from public.profiles where id = '00000000-0000-0000-0000-000000000005' $$,
  'el profesor no ve alumnos de otros grupos'
);
select is((select count(*) from public.groups), 1::bigint, 'el profesor solo ve sus grupos');
select is((select count(*) from public.group_students), 1::bigint, 'el profesor solo ve inscripciones de sus grupos');
select is((select count(*) from public.materials), 2::bigint, 'el profesor ve borradores y publicados de su curso');
select lives_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by) values
     ('40000000-0000-0000-0000-000000000001', 'Nuevo', 'external_link', 'https://d.test', 'draft', '00000000-0000-0000-0000-000000000002') $$,
  'el profesor crea un borrador en su curso'
);
select throws_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by) values
     ('40000000-0000-0000-0000-000000000001', 'Directo', 'external_link', 'https://e.test', 'published', '00000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no publica directamente'
);
select throws_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by) values
     ('40000000-0000-0000-0000-000000000002', 'Ajeno', 'external_link', 'https://f.test', 'draft', '00000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no crea material en un curso ajeno'
);
select throws_ok(
  $$ update public.materials set status = 'published'
     where title = 'Nuevo' $$,
  '42501', null, 'el profesor no publica su propio borrador'
);
select is_empty(
  $$ update public.materials set title = 'Editado' where title = 'Borrador 1' returning id $$,
  'el profesor no edita borradores de otra persona'
);
select throws_ok(
  $$ insert into public.group_teachers (group_id, teacher_id) values
     ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no se asigna a otro grupo'
);
reset role;

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select is((select count(*) from public.profiles), 6::bigint, 'el administrador ve todas las cuentas');
select is((select count(*) from public.audit_logs), 1::bigint, 'el administrador ve la auditoría');
select lives_ok(
  $$ insert into public.courses (name) values ('Curso admin') $$,
  'el administrador crea cursos'
);
select lives_ok(
  $$ insert into public.group_students (group_id, student_id) values
     ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')
     on conflict (student_id) do update set group_id = excluded.group_id $$,
  'el administrador cambia de grupo a un alumno'
);
select throws_ok(
  $$ update public.profiles set full_name = 'Directo' where id = '00000000-0000-0000-0000-000000000004' $$,
  '42501', null, 'los cambios de cuenta pasan por la función admin-users'
);
reset role;

-- ── Cuenta suspendida con token aún vigente ──────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006"}', true);
set local role authenticated;
select is((select count(*) from public.profiles), 1::bigint, 'el admin suspendido solo ve su perfil');
select is((select count(*) from public.audit_logs), 0::bigint, 'el admin suspendido pierde la auditoría');
select is((select count(*) from public.courses), 0::bigint, 'el admin suspendido pierde los cursos');
select throws_ok(
  $$ insert into public.courses (name) values ('Curso suspendido') $$,
  '42501', null, 'el admin suspendido no puede escribir'
);
reset role;

select * from finish();
rollback;
