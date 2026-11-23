-- Catálogo de videos de Drive (#29). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(18);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso · 3 alumno · 4 alumno de otro curso
insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000001', 'admin@videos.mx'),
  ('d0000000-0000-0000-0000-000000000002', 'profe@videos.mx'),
  ('d0000000-0000-0000-0000-000000000003', 'alumno@videos.mx'),
  ('d0000000-0000-0000-0000-000000000004', 'ajeno@videos.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('d0000000-0000-0000-0000-000000000001', 'admin@videos.mx', 'Admin', 'admin', 'active'),
  ('d0000000-0000-0000-0000-000000000002', 'profe@videos.mx', 'Profe', 'teacher', 'active'),
  ('d0000000-0000-0000-0000-000000000003', 'alumno@videos.mx', 'Alumno', 'student', 'active'),
  ('d0000000-0000-0000-0000-000000000004', 'ajeno@videos.mx', 'Ajeno', 'student', 'active');

insert into public.courses (id, name) values
  ('d1000000-0000-0000-0000-000000000001', 'Curso'),
  ('d1000000-0000-0000-0000-000000000002', 'Otro curso');
insert into public.groups (id, course_id, name, code) values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Grupo', 'VG'),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Otro', 'VO');
insert into public.group_teachers (group_id, teacher_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002');
insert into public.group_students (group_id, student_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003'),
  ('d2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004');
insert into public.modules (id, course_id, title) values
  ('d3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Matemático');
insert into public.group_modules (group_id, module_id, course_id) values
  ('d2000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001');
insert into public.sessions (id, module_id, title, position) values
  ('d4000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'Clase 1', 0);

create function pg_temp.como(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', usuario)::text, true)
$$;
grant execute on function pg_temp.como(text) to authenticated;

-- ── Profesor: solo videos de Drive ───────────────────────────────────────────
select pg_temp.como('d0000000-0000-0000-0000-000000000002');
set local role authenticated;

select throws_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by, published_by, published_at) values
     ('d4000000-0000-0000-0000-000000000001', 'YouTube', 'video_link', 'https://www.youtube.com/watch?v=x',
      'published', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', now()) $$,
  '23514', null, 'un video que no es de Drive se rechaza'
);
select throws_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by) values
     ('d4000000-0000-0000-0000-000000000001', 'Disfrazado', 'video_link', 'https://drive.google.com.evil.mx/x',
      'draft', 'd0000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'un dominio que solo empieza como Drive se rechaza'
);
select lives_ok(
  $$ insert into public.materials (id, session_id, title, kind, external_url, status, created_by, published_by, published_at) values
     ('d5000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'Álgebra en video', 'video_link',
      'https://drive.google.com/file/d/abc/view', 'published',
      'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', now()),
     ('d5000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000001', 'Borrador', 'video_link',
      'https://drive.google.com/file/d/def/view', 'draft', 'd0000000-0000-0000-0000-000000000002', null, null) $$,
  'el profesor publica un video de Drive y guarda un borrador'
);
select lives_ok(
  $$ insert into public.materials (session_id, title, kind, external_url, status, created_by, published_by, published_at) values
     ('d4000000-0000-0000-0000-000000000001', 'Página', 'external_link', 'https://es.khanacademy.org/x',
      'published', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', now()) $$,
  'los enlaces de página siguen aceptando cualquier https'
);
reset role;

-- ── Alumno: abrir y reportar ─────────────────────────────────────────────────
select pg_temp.como('d0000000-0000-0000-0000-000000000003');
set local role authenticated;

select is(
  public.open_material_link('d5000000-0000-0000-0000-000000000001'),
  'https://drive.google.com/file/d/abc/view',
  'el alumno abre el video publicado de su módulo'
);
select results_eq(
  $$ select material_id, file_version from public.material_views $$,
  $$ values ('d5000000-0000-0000-0000-000000000001'::uuid, 0) $$,
  'la apertura queda registrada'
);
select throws_ok(
  $$ select public.open_material_link('d5000000-0000-0000-0000-000000000002') $$,
  'CA004', null, 'el alumno no recibe el enlace de un borrador'
);
select lives_ok(
  $$ insert into public.material_reports (material_id, reporter_id, reason) values
     ('d5000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'sin_permiso') $$,
  'el alumno reporta que Drive no le da permiso'
);
select throws_ok(
  $$ insert into public.material_reports (material_id, reporter_id, reason) values
     ('d5000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'no_carga') $$,
  '23505', null, 'no se duplica un reporte abierto'
);
select throws_ok(
  $$ insert into public.material_reports (material_id, reporter_id, reason) values
     ('d5000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'no_carga') $$,
  '42501', null, 'no se reporta material que el alumno no ve'
);
select throws_ok(
  $$ insert into public.material_reports (material_id, reporter_id, reason, resolved_at, resolved_by) values
     ('d5000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'otro', now(),
      'd0000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'el alumno no crea un reporte ya resuelto'
);
-- La RLS de UPDATE filtra la fila: no hay error, pero no cambia nada.
update public.material_reports set resolved_at = now(), resolved_by = 'd0000000-0000-0000-0000-000000000003';
select is(
  (select count(*)::int from public.material_reports where resolved_at is null), 1,
  'el alumno no resuelve su reporte'
);
reset role;

select pg_temp.como('d0000000-0000-0000-0000-000000000004');
set local role authenticated;
select throws_ok(
  $$ select public.open_material_link('d5000000-0000-0000-0000-000000000001') $$,
  'CA004', null, 'el alumno de otro curso no recibe el enlace'
);
select is_empty($$ select id from public.material_reports $$, 'el alumno de otro curso no ve reportes ajenos');
reset role;

select pg_temp.como('d0000000-0000-0000-0000-000000000002');
set local role authenticated;
select is_empty($$ select id from public.material_reports $$, 'el profesor no ve los reportes');
reset role;

-- ── Administrador: ve y resuelve ─────────────────────────────────────────────
select pg_temp.como('d0000000-0000-0000-0000-000000000001');
set local role authenticated;
select lives_ok(
  $$ update public.material_reports set resolved_at = now(), resolved_by = 'd0000000-0000-0000-0000-000000000001'
     where material_id = 'd5000000-0000-0000-0000-000000000001' $$,
  'el administrador resuelve los reportes del video'
);
select is(
  (select count(*)::int from public.material_reports where resolved_at is null), 0,
  'no quedan reportes abiertos'
);
reset role;

select pg_temp.como('d0000000-0000-0000-0000-000000000003');
set local role authenticated;
select lives_ok(
  $$ insert into public.material_reports (material_id, reporter_id, reason) values
     ('d5000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'no_carga') $$,
  'resuelto el anterior, el alumno puede volver a reportar'
);
reset role;

select * from finish();
rollback;
