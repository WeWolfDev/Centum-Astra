-- Clases y enlaces del material (#34). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso · 3 profesor de otro curso · 4 alumno
insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-000000000001', 'admin@material.mx'),
  ('f0000000-0000-0000-0000-000000000002', 'profe@material.mx'),
  ('f0000000-0000-0000-0000-000000000003', 'otro@material.mx'),
  ('f0000000-0000-0000-0000-000000000004', 'alumno@material.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('f0000000-0000-0000-0000-000000000001', 'admin@material.mx', 'Admin', 'admin', 'active'),
  ('f0000000-0000-0000-0000-000000000002', 'profe@material.mx', 'Profe', 'teacher', 'active'),
  ('f0000000-0000-0000-0000-000000000003', 'otro@material.mx', 'Otro', 'teacher', 'active'),
  ('f0000000-0000-0000-0000-000000000004', 'alumno@material.mx', 'Alumno', 'student', 'active');

insert into public.courses (id, name) values
  ('f1000000-0000-0000-0000-000000000001', 'Curso'),
  ('f1000000-0000-0000-0000-000000000002', 'Otro curso');
insert into public.groups (id, course_id, name, code) values
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Grupo', 'G'),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'Otro', 'O');
insert into public.group_teachers (group_id, teacher_id) values
  ('f2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002'),
  ('f2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003');
insert into public.group_students (group_id, student_id) values
  ('f2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004');
insert into public.modules (id, course_id, title) values
  ('f3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Matemático');
insert into public.group_modules (group_id, module_id, course_id) values
  ('f2000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001');

-- ── Profesor del curso ───────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.sessions (id, module_id, title, position) values
     ('f4000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000001', 'Clase 1', 0) $$,
  'el profesor crea una clase en un módulo de su curso'
);
select lives_ok(
  $$ update public.sessions set title = 'Clase 1: álgebra' where id = 'f4000000-0000-0000-0000-000000000001' $$,
  'el profesor renombra su clase'
);
select lives_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by, published_by, published_at) values
     ('f4000000-0000-0000-0000-000000000001', 'Video de álgebra', 'video_link', 'https://drive.google.com/x',
      'published', 'f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', now()) $$,
  'el profesor publica un enlace sin aprobación previa'
);
select throws_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by, published_by) values
     ('f4000000-0000-0000-0000-000000000001', 'Malicioso', 'external_link', 'javascript:alert(1)',
      'published', 'f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'un enlace que no es http(s) se rechaza'
);
select throws_ok(
  $$ update public.materials set status = 'archived' where title = 'Video de álgebra' $$,
  '42501', null, 'el profesor no retira material publicado'
);
reset role;

-- ── Profesor de otro curso ───────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.sessions (module_id, title, position) values
     ('f3000000-0000-0000-0000-000000000001', 'Ajena', 1) $$,
  '42501', null, 'el profesor no crea clases en cursos ajenos'
);
reset role;

-- ── Alumno ───────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.materials $$,
  $$ values ('Video de álgebra'::text) $$,
  'el alumno ve el enlace publicado de su módulo'
);
reset role;

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select lives_ok(
  $$ update public.materials set status = 'archived' where title = 'Video de álgebra' $$,
  'el administrador retira el enlace'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select is_empty($$ select id from public.materials $$, 'el alumno deja de ver el enlace retirado');
reset role;

select * from finish();
rollback;
