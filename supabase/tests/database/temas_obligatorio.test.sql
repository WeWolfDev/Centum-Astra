-- Tema obligatorio en cada clase (#85). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso
insert into auth.users (id, email) values
  ('f8000000-0000-0000-0000-000000000001', 'admin@obligatorio.mx'),
  ('f8000000-0000-0000-0000-000000000002', 'profe@obligatorio.mx');
insert into public.profiles (id, email, full_name, role, status) values
  ('f8000000-0000-0000-0000-000000000001', 'admin@obligatorio.mx', 'Admin', 'admin', 'active'),
  ('f8000000-0000-0000-0000-000000000002', 'profe@obligatorio.mx', 'Profe', 'teacher', 'active');
insert into public.courses (id, name) values ('f8100000-0000-0000-0000-000000000001', 'Curso');
insert into public.groups (id, course_id, name, code) values
  ('f8200000-0000-0000-0000-000000000001', 'f8100000-0000-0000-0000-000000000001', 'Grupo', 'OB');
insert into public.group_teachers (group_id, teacher_id) values
  ('f8200000-0000-0000-0000-000000000001', 'f8000000-0000-0000-0000-000000000002');
insert into public.modules (id, course_id, title, position) values
  ('f8300000-0000-0000-0000-000000000001', 'f8100000-0000-0000-0000-000000000001', 'Matemático', 0),
  ('f8300000-0000-0000-0000-000000000002', 'f8100000-0000-0000-0000-000000000001', 'Lector', 1);
insert into public.topics (id, course_id, module_id, title, position) values
  ('f8400000-0000-0000-0000-000000000001', 'f8100000-0000-0000-0000-000000000001', 'f8300000-0000-0000-0000-000000000001', 'Álgebra', 1);

-- ── Columna obligatoria ──────────────────────────────────────────────────────
select col_not_null('public', 'sessions', 'topic_id', 'sessions.topic_id es obligatorio');
select is(
  (select count(*) from public.sessions where topic_id is null), 0::bigint,
  'ninguna clase queda sin tema'
);

-- ── Clase sin tema: va al tema General de su módulo ──────────────────────────
select set_config('request.jwt.claims', '{"sub":"f8000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.sessions (id, module_id, title, position) values
     ('f8500000-0000-0000-0000-000000000001', 'f8300000-0000-0000-0000-000000000001', 'Sin tema', 0) $$,
  'el profesor crea una clase sin indicar tema'
);
select is(
  (select t.title from public.sessions s join public.topics t on t.id = s.topic_id
   where s.id = 'f8500000-0000-0000-0000-000000000001'),
  'General',
  'la clase sin tema queda en General'
);
select lives_ok(
  $$ insert into public.sessions (id, module_id, title, position) values
     ('f8500000-0000-0000-0000-000000000002', 'f8300000-0000-0000-0000-000000000001', 'Otra sin tema', 1) $$,
  'una segunda clase sin tema también se crea'
);
select is(
  (select count(*) from public.topics where module_id = 'f8300000-0000-0000-0000-000000000001' and title = 'General'),
  1::bigint,
  'General se crea una sola vez por módulo'
);
select lives_ok(
  $$ insert into public.sessions (id, module_id, topic_id, title, position) values
     ('f8500000-0000-0000-0000-000000000003', 'f8300000-0000-0000-0000-000000000001',
      'f8400000-0000-0000-0000-000000000001', 'Ecuaciones', 2) $$,
  'una clase con tema elegido lo conserva'
);
select is(
  (select topic_id from public.sessions where id = 'f8500000-0000-0000-0000-000000000003'),
  'f8400000-0000-0000-0000-000000000001'::uuid,
  'el tema elegido no se reemplaza por General'
);

-- ── Archivar temas ───────────────────────────────────────────────────────────
select throws_ok(
  $$ update public.topics set status = 'archived' where id = 'f8400000-0000-0000-0000-000000000001' $$,
  'CA031', null, 'no se archiva un tema con clases activas'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"f8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
update public.sessions set status = 'archived' where id = 'f8500000-0000-0000-0000-000000000003';
reset role;

select set_config('request.jwt.claims', '{"sub":"f8000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ update public.topics set status = 'archived' where id = 'f8400000-0000-0000-0000-000000000001' $$,
  'el profesor archiva un tema sin clases activas'
);
select is(
  (select status from public.topics where id = 'f8400000-0000-0000-0000-000000000001'),
  'archived',
  'el tema queda archivado'
);
reset role;

select * from finish();
rollback;
