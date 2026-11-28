-- Guardar preguntas sin dejarlas a medias (#104). Ejecutar con `supabase test db`.
-- La concurrencia con dos sesiones no cabe en una transacción de pgTAP: está en
-- scripts/probar-concurrencia-preguntas.sh.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(24);

create function pg_temp.como(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', usuario)::text, true)
$$;
grant execute on function pg_temp.como(text) to authenticated;

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso 1 · 3 profesor del curso 2 · 4 alumno
insert into auth.users (id, email) values
  ('b4000000-0000-0000-0000-000000000001', 'preg-admin@test.mx'),
  ('b4000000-0000-0000-0000-000000000002', 'preg-profe1@test.mx'),
  ('b4000000-0000-0000-0000-000000000003', 'preg-profe2@test.mx'),
  ('b4000000-0000-0000-0000-000000000004', 'preg-alumno@test.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('b4000000-0000-0000-0000-000000000001', 'preg-admin@test.mx', 'Admin', 'admin', 'active'),
  ('b4000000-0000-0000-0000-000000000002', 'preg-profe1@test.mx', 'Profe 1', 'teacher', 'active'),
  ('b4000000-0000-0000-0000-000000000003', 'preg-profe2@test.mx', 'Profe 2', 'teacher', 'active'),
  ('b4000000-0000-0000-0000-000000000004', 'preg-alumno@test.mx', 'Alumno', 'student', 'active');

insert into public.courses (id, name) values
  ('b4100000-0000-0000-0000-000000000001', 'Curso preguntas 1'),
  ('b4100000-0000-0000-0000-000000000002', 'Curso preguntas 2');

insert into public.groups (id, course_id, name, code) values
  ('b4200000-0000-0000-0000-000000000001', 'b4100000-0000-0000-0000-000000000001', 'Grupo preguntas 1', 'PQ1'),
  ('b4200000-0000-0000-0000-000000000002', 'b4100000-0000-0000-0000-000000000002', 'Grupo preguntas 2', 'PQ2');

insert into public.group_teachers (group_id, teacher_id) values
  ('b4200000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000002'),
  ('b4200000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000003');

insert into public.group_students (group_id, student_id) values
  ('b4200000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000004');

insert into public.modules (id, course_id, title, position) values
  ('b4300000-0000-0000-0000-000000000001', 'b4100000-0000-0000-0000-000000000001', 'Módulo preguntas', 0);

insert into public.group_modules (group_id, module_id, course_id) values
  ('b4200000-0000-0000-0000-000000000001', 'b4300000-0000-0000-0000-000000000001', 'b4100000-0000-0000-0000-000000000001');

-- 1 quiz del profesor 1 (dos preguntas) · 2 simulador (una pregunta)
-- 3 quiz en borrador (una pregunta) · 4 quiz con un intento
insert into public.evaluations (id, course_id, module_id, kind, title, time_limit_minutes, created_by) values
  ('b4500000-0000-0000-0000-000000000001', 'b4100000-0000-0000-0000-000000000001', 'b4300000-0000-0000-0000-000000000001', 'quiz', 'Quiz', null, 'b4000000-0000-0000-0000-000000000002'),
  ('b4500000-0000-0000-0000-000000000002', 'b4100000-0000-0000-0000-000000000001', null, 'simulador', 'Simulador', 60, 'b4000000-0000-0000-0000-000000000001'),
  ('b4500000-0000-0000-0000-000000000003', 'b4100000-0000-0000-0000-000000000001', 'b4300000-0000-0000-0000-000000000001', 'quiz', 'Borrador', null, 'b4000000-0000-0000-0000-000000000002'),
  ('b4500000-0000-0000-0000-000000000004', 'b4100000-0000-0000-0000-000000000001', 'b4300000-0000-0000-0000-000000000001', 'quiz', 'Con intento', null, 'b4000000-0000-0000-0000-000000000002');

insert into public.questions (id, evaluation_id, position, prompt) values
  ('b4600000-0000-0000-0000-000000000011', 'b4500000-0000-0000-0000-000000000001', 0, 'Quiz P1'),
  ('b4600000-0000-0000-0000-000000000012', 'b4500000-0000-0000-0000-000000000001', 4, 'Quiz P2'),
  ('b4600000-0000-0000-0000-000000000021', 'b4500000-0000-0000-0000-000000000002', 0, 'Simulador P1'),
  ('b4600000-0000-0000-0000-000000000031', 'b4500000-0000-0000-0000-000000000003', 0, 'Borrador P1'),
  ('b4600000-0000-0000-0000-000000000041', 'b4500000-0000-0000-0000-000000000004', 0, 'Con intento P1');

insert into public.question_options (id, question_id, position, body)
select ('b4700000-0000-0000-0000-000000000' || n || o)::uuid, q, o, 'Opción ' || o
from (values
  ('11', 'b4600000-0000-0000-0000-000000000011'::uuid),
  ('12', 'b4600000-0000-0000-0000-000000000012'),
  ('21', 'b4600000-0000-0000-0000-000000000021'),
  ('31', 'b4600000-0000-0000-0000-000000000031'),
  ('41', 'b4600000-0000-0000-0000-000000000041')
) as p(n, q), generate_series(0, 1) as o;

insert into public.question_keys (question_id, correct_option_ids)
select q.id, array[(select o.id from public.question_options o where o.question_id = q.id and o.position = 0)]
from public.questions q
where q.evaluation_id::text like 'b4500000-%';

update public.evaluations set status = 'published'
where id in ('b4500000-0000-0000-0000-000000000001', 'b4500000-0000-0000-0000-000000000002', 'b4500000-0000-0000-0000-000000000004');

insert into public.attempts (evaluation_id, student_id)
values ('b4500000-0000-0000-0000-000000000004', 'b4000000-0000-0000-0000-000000000004');

-- ── Permisos de la función ───────────────────────────────────────────────────
select ok(
  not has_function_privilege('anon', 'public.save_question(uuid, uuid, text, text[], integer[], text)', 'execute'),
  'anon no puede guardar preguntas'
);

-- ── El profesor guarda en su quiz publicado ─────────────────────────────────
select pg_temp.como('b4000000-0000-0000-0000-000000000002');
set local role authenticated;

create temp table nueva on commit drop as
select public.save_question(
  'b4500000-0000-0000-0000-000000000001', null, 'Quiz P3', array['A', 'B', 'C'], array[1, 2], ' Porque sí '
) as id;

select is(
  (select position from public.questions where id = (select id from nueva)), 5,
  'una pregunta nueva va después de la última, aunque haya huecos'
);
select results_eq(
  $$ select body from public.question_options where question_id = (select id from nueva) order by position $$,
  $$ values ('A'), ('B'), ('C') $$,
  'guarda las opciones en orden'
);
select results_eq(
  $$ select k.correct_option_ids, k.explanation from public.question_keys k where k.question_id = (select id from nueva) $$,
  $$ select array(select o.id from public.question_options o where o.question_id = (select id from nueva) and o.position in (1, 2) order by o.id),
            'Porque sí'::text $$,
  'la clave apunta a las opciones marcadas, sin espacios en la explicación'
);

select public.save_question(
  'b4500000-0000-0000-0000-000000000001', 'b4600000-0000-0000-0000-000000000011',
  'Quiz P1 editada', array['X', 'Y'], array[0], null
);
select is(
  (select prompt from public.questions where id = 'b4600000-0000-0000-0000-000000000011'), 'Quiz P1 editada',
  'editar cambia el enunciado'
);
select results_eq(
  $$ select body from public.question_options where question_id = 'b4600000-0000-0000-0000-000000000011' order by position $$,
  $$ values ('X'), ('Y') $$,
  'editar reemplaza las opciones'
);
select is(
  (select k.correct_option_ids from public.question_keys k where k.question_id = 'b4600000-0000-0000-0000-000000000011'),
  array(select o.id from public.question_options o where o.question_id = 'b4600000-0000-0000-0000-000000000011' and o.body = 'X'),
  'la clave queda con la opción nueva'
);

-- ── Si falla a la mitad, queda como estaba ──────────────────────────────────
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', 'b4600000-0000-0000-0000-000000000012',
       'Cambio que falla', array['M', 'N'], array[0, 5], null) $$,
  'CA021', null,
  'un índice de respuesta fuera de las opciones se rechaza'
);
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', 'b4600000-0000-0000-0000-000000000012',
       'Cambio que falla', array['M'], array[0], null) $$,
  'CA020', null,
  'una sola opción se rechaza'
);
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', 'b4600000-0000-0000-0000-000000000012',
       'Cambio que falla', array['M', ' '], array[0], null) $$,
  '23514', null,
  'una opción vacía falla después de cambiar el enunciado y de borrar las opciones'
);
select is(
  (select prompt from public.questions where id = 'b4600000-0000-0000-0000-000000000012'), 'Quiz P2',
  'tras el fallo, el enunciado sigue igual'
);
select results_eq(
  $$ select body from public.question_options where question_id = 'b4600000-0000-0000-0000-000000000012' order by position $$,
  $$ values ('Opción 0'), ('Opción 1') $$,
  'tras el fallo, las opciones siguen igual'
);
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', null, 'Alta que falla', array['M', ' '], array[0], null) $$,
  '23514', null,
  'un alta falla después de insertar la pregunta'
);
select is(
  (select count(*)::int from public.questions where evaluation_id = 'b4500000-0000-0000-0000-000000000001'), 3,
  'un alta que falla no deja una pregunta sin opciones'
);

-- ── Permisos ─────────────────────────────────────────────────────────────────
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000004', 'b4600000-0000-0000-0000-000000000041',
       'Con intento editada', array['A', 'B'], array[0], null) $$,
  'CA024', null,
  'con un intento, editar una pregunta falla'
);
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000004', null, 'Nueva', array['A', 'B'], array[0], null) $$,
  'CA024', null,
  'con un intento, agregar una pregunta falla'
);
reset role;

select pg_temp.como('b4000000-0000-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', 'b4600000-0000-0000-0000-000000000012',
       'Ajena', array['A', 'B'], array[0], null) $$,
  '42501', null,
  'un profesor de otro curso no edita la pregunta'
);
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000001', null, 'Ajena', array['A', 'B'], array[0], null) $$,
  '42501', null,
  'un profesor de otro curso no agrega preguntas'
);
reset role;

-- ── El simulador valida una sola respuesta, sin dejar rastro ─────────────────
select pg_temp.como('b4000000-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok(
  $$ select public.save_question('b4500000-0000-0000-0000-000000000002', 'b4600000-0000-0000-0000-000000000021',
       'Dos correctas', array['A', 'B'], array[0, 1], null) $$,
  'CA021', null,
  'en un simulador, dos respuestas correctas fallan al guardar la clave'
);
select is(
  (select prompt from public.questions where id = 'b4600000-0000-0000-0000-000000000021'), 'Simulador P1',
  'el simulador queda como estaba'
);

-- ── Una evaluación publicada no se queda sin preguntas ───────────────────────
select throws_ok(
  $$ update public.questions set evaluation_id = 'b4500000-0000-0000-0000-000000000003', position = 9
     where id = 'b4600000-0000-0000-0000-000000000021' $$,
  'CA025', null,
  'mover la única pregunta de una evaluación publicada a otra falla'
);
select throws_ok(
  $$ delete from public.questions where id = 'b4600000-0000-0000-0000-000000000021' $$,
  'CA025', null,
  'borrar la única pregunta de una evaluación publicada falla'
);
select lives_ok(
  $$ delete from public.questions where id = 'b4600000-0000-0000-0000-000000000031' $$,
  'en un borrador sí se puede borrar la única pregunta'
);
reset role;

select lives_ok(
  $$ delete from public.evaluations where id = 'b4500000-0000-0000-0000-000000000002' $$,
  'borrar una evaluación publicada sin intentos borra sus preguntas en cascada'
);

select * from finish();
rollback;
