-- Evaluaciones, intentos y resultados (#30). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(57);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 y 3 profesores · 4 y 6 alumnos del grupo 1 · 5 alumno del grupo 2
insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'eval-admin@test.mx'),
  ('e0000000-0000-0000-0000-000000000002', 'eval-profe1@test.mx'),
  ('e0000000-0000-0000-0000-000000000003', 'eval-profe2@test.mx'),
  ('e0000000-0000-0000-0000-000000000004', 'eval-alumno1@test.mx'),
  ('e0000000-0000-0000-0000-000000000005', 'eval-alumno2@test.mx'),
  ('e0000000-0000-0000-0000-000000000006', 'eval-alumno3@test.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('e0000000-0000-0000-0000-000000000001', 'eval-admin@test.mx', 'Admin', 'admin', 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'eval-profe1@test.mx', 'Profe 1', 'teacher', 'active'),
  ('e0000000-0000-0000-0000-000000000003', 'eval-profe2@test.mx', 'Profe 2', 'teacher', 'active'),
  ('e0000000-0000-0000-0000-000000000004', 'eval-alumno1@test.mx', 'Alumno 1', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000005', 'eval-alumno2@test.mx', 'Alumno 2', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000006', 'eval-alumno3@test.mx', 'Alumno 3', 'student', 'active');

insert into public.courses (id, name) values
  ('e1000000-0000-0000-0000-000000000001', 'Curso 1'),
  ('e1000000-0000-0000-0000-000000000002', 'Curso 2');

insert into public.groups (id, course_id, name, code) values
  ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Grupo 1', 'EG1'),
  ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Grupo 2', 'EG2');

insert into public.group_teachers (group_id, teacher_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003');

insert into public.group_students (group_id, student_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004'),
  ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005'),
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006');

insert into public.modules (id, course_id, title, position) values
  ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Módulo habilitado', 0),
  ('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Módulo sin habilitar', 1),
  ('e3000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'Módulo curso 2', 0);

insert into public.group_modules (group_id, module_id, course_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000002', 'e3000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002');

-- Simulador de todo el curso (2 preguntas), quiz del módulo habilitado (una pregunta
-- con varias respuestas correctas), borrador y quiz de un módulo sin habilitar.
insert into public.evaluations (id, course_id, module_id, kind, title, time_limit_minutes, created_by) values
  ('e5000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', null, 'simulador', 'Simulador 1', 120, 'e0000000-0000-0000-0000-000000000001'),
  ('e5000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'quiz', 'Quiz 1', null, 'e0000000-0000-0000-0000-000000000001'),
  ('e5000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'quiz', 'Borrador', null, 'e0000000-0000-0000-0000-000000000001'),
  ('e5000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000002', 'quiz', 'Quiz sin habilitar', null, 'e0000000-0000-0000-0000-000000000001');

insert into public.questions (id, evaluation_id, position, prompt) values
  ('e6000000-0000-0000-0000-000000000011', 'e5000000-0000-0000-0000-000000000001', 0, 'Simulador P1'),
  ('e6000000-0000-0000-0000-000000000012', 'e5000000-0000-0000-0000-000000000001', 1, 'Simulador P2'),
  ('e6000000-0000-0000-0000-000000000021', 'e5000000-0000-0000-0000-000000000002', 0, 'Quiz P1'),
  ('e6000000-0000-0000-0000-000000000022', 'e5000000-0000-0000-0000-000000000002', 1, 'Quiz P2 varias correctas'),
  ('e6000000-0000-0000-0000-000000000041', 'e5000000-0000-0000-0000-000000000004', 0, 'Sin habilitar P1');

insert into public.question_options (id, question_id, position, body) values
  ('e7000000-0000-0000-0000-000000000111', 'e6000000-0000-0000-0000-000000000011', 0, 'Correcta'),
  ('e7000000-0000-0000-0000-000000000112', 'e6000000-0000-0000-0000-000000000011', 1, 'Incorrecta'),
  ('e7000000-0000-0000-0000-000000000121', 'e6000000-0000-0000-0000-000000000012', 0, 'Correcta'),
  ('e7000000-0000-0000-0000-000000000122', 'e6000000-0000-0000-0000-000000000012', 1, 'Incorrecta'),
  ('e7000000-0000-0000-0000-000000000211', 'e6000000-0000-0000-0000-000000000021', 0, 'Correcta'),
  ('e7000000-0000-0000-0000-000000000212', 'e6000000-0000-0000-0000-000000000021', 1, 'Incorrecta'),
  ('e7000000-0000-0000-0000-000000000221', 'e6000000-0000-0000-0000-000000000022', 0, 'Correcta A'),
  ('e7000000-0000-0000-0000-000000000222', 'e6000000-0000-0000-0000-000000000022', 1, 'Correcta B'),
  ('e7000000-0000-0000-0000-000000000223', 'e6000000-0000-0000-0000-000000000022', 2, 'Incorrecta'),
  ('e7000000-0000-0000-0000-000000000411', 'e6000000-0000-0000-0000-000000000041', 0, 'Correcta'),
  ('e7000000-0000-0000-0000-000000000412', 'e6000000-0000-0000-0000-000000000041', 1, 'Incorrecta');

insert into public.question_keys (question_id, correct_option_ids, explanation) values
  ('e6000000-0000-0000-0000-000000000011', array['e7000000-0000-0000-0000-000000000111']::uuid[], null),
  ('e6000000-0000-0000-0000-000000000012', array['e7000000-0000-0000-0000-000000000121']::uuid[], null),
  ('e6000000-0000-0000-0000-000000000021', array['e7000000-0000-0000-0000-000000000211']::uuid[], null),
  ('e6000000-0000-0000-0000-000000000022', array['e7000000-0000-0000-0000-000000000222', 'e7000000-0000-0000-0000-000000000221']::uuid[], 'Porque sí'),
  ('e6000000-0000-0000-0000-000000000041', array['e7000000-0000-0000-0000-000000000411']::uuid[], null);

update public.evaluations set status = 'published'
where id in (
  'e5000000-0000-0000-0000-000000000001',
  'e5000000-0000-0000-0000-000000000002',
  'e5000000-0000-0000-0000-000000000004'
);

-- ── Integridad ───────────────────────────────────────────────────────────────
select throws_ok(
  $$ insert into public.evaluations (course_id, kind, title, created_by) values
     ('e1000000-0000-0000-0000-000000000001', 'simulador', 'Sin tiempo', 'e0000000-0000-0000-0000-000000000001') $$,
  '23514', null, 'un simulador necesita tiempo límite'
);
select throws_ok(
  $$ insert into public.evaluations (course_id, kind, title, time_limit_minutes, created_by) values
     ('e1000000-0000-0000-0000-000000000001', 'quiz', 'Con tiempo', 30, 'e0000000-0000-0000-0000-000000000001') $$,
  '23514', null, 'un quiz no tiene tiempo límite'
);
select throws_ok(
  $$ update public.question_keys
     set correct_option_ids = array['e7000000-0000-0000-0000-000000000111', 'e7000000-0000-0000-0000-000000000112']::uuid[]
     where question_id = 'e6000000-0000-0000-0000-000000000011' $$,
  'CA021', null, 'en un simulador cada pregunta tiene una sola respuesta correcta'
);
select throws_ok(
  $$ update public.question_keys
     set correct_option_ids = array['e7000000-0000-0000-0000-000000000111']::uuid[]
     where question_id = 'e6000000-0000-0000-0000-000000000021' $$,
  'CA021', null, 'la respuesta correcta es una opción de la misma pregunta'
);
select throws_ok(
  $$ update public.evaluations set status = 'published' where id = 'e5000000-0000-0000-0000-000000000003' $$,
  'CA020', null, 'no se publica una evaluación sin preguntas'
);
select isnt_empty(
  $$ select 1 from cron.job where jobname = 'cerrar-intentos-vencidos' and schedule = '* * * * *' $$,
  'pg_cron revisa cada minuto los intentos vencidos'
);

-- ── Anónimo ──────────────────────────────────────────────────────────────────
set local role anon;
select throws_ok($$ select * from public.evaluations $$, '42501', null, 'anon no lee evaluaciones');
select throws_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'anon no inicia intentos'
);
reset role;

-- ── Alumno 1 ─────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.evaluations order by title $$,
  array['Quiz 1', 'Simulador 1'],
  'el alumno ve evaluaciones publicadas de módulos habilitados y simuladores de su curso'
);
select is((select count(*) from public.question_keys), 0::bigint, 'el alumno no lee las respuestas correctas');
select is((select count(*) from public.questions), 4::bigint, 'el alumno ve las preguntas de sus evaluaciones');
select throws_ok(
  $$ insert into public.attempts (evaluation_id, student_id) values
     ('e5000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'el alumno no crea intentos sin pasar por el servidor'
);
select throws_ok(
  $$ insert into public.evaluations (course_id, kind, title, created_by) values
     ('e1000000-0000-0000-0000-000000000001', 'quiz', 'Mío', 'e0000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'el alumno no crea evaluaciones'
);
select throws_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'el alumno no inicia una evaluación de un módulo no habilitado'
);

-- Quiz: iniciar, retomar, responder y entregar.
select lives_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000002') $$,
  'el alumno inicia un quiz'
);
select is(
  (select expires_at from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000002'),
  null,
  'el quiz no tiene vencimiento'
);
select is(
  (select (public.start_attempt('e5000000-0000-0000-0000-000000000002')).id),
  (select id from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000002' and status = 'in_progress'),
  'iniciar de nuevo retoma el mismo intento'
);
select lives_ok(
  $$ select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000021', array['e7000000-0000-0000-0000-000000000211']::uuid[]),
            public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000022', array['e7000000-0000-0000-0000-000000000221']::uuid[])
     from public.attempts a
     where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002' and a.status = 'in_progress' $$,
  'el alumno guarda sus respuestas'
);
select throws_ok(
  $$ select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000021', array['e7000000-0000-0000-0000-000000000221']::uuid[])
     from public.attempts a
     where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002' and a.status = 'in_progress' $$,
  'CA022', null, 'no se guarda una opción de otra pregunta'
);
select throws_ok(
  $$ select public.attempt_review(a.id)
     from public.attempts a
     where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002' and a.status = 'in_progress' $$,
  'CA023', null, 'las respuestas correctas no se muestran antes de terminar'
);
select is(
  (select (public.submit_attempt(a.id)).percent
   from public.attempts a where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002'),
  50.00::numeric,
  'una pregunta con varias correctas cuenta solo si se marcan todas'
);
select is(
  (select (public.submit_attempt(a.id)).percent
   from public.attempts a where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002'),
  50.00::numeric,
  'repetir la entrega devuelve el mismo resultado'
);
select is(
  (select count(*) from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000002'),
  1::bigint,
  'repetir la entrega no duplica intentos'
);
select ok(
  (select score is null and duration_seconds is not null and correct_count = 1 and total_questions = 2
   from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000002'),
  'el quiz guarda aciertos, porcentaje y duración, sin puntaje'
);
select results_eq(
  $$ select question_position, is_correct, explanation
     from public.attempt_review(
       (select id from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000002')
     ) $$,
  $$ values (0, true, null::text), (1, false, 'Porque sí'::text) $$,
  'al terminar se muestran las respuestas correctas y las explicaciones'
);
select throws_ok(
  $$ select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000021', array['e7000000-0000-0000-0000-000000000212']::uuid[])
     from public.attempts a where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002' $$,
  'CA023', null, 'no se cambian respuestas de un intento entregado'
);

-- Segundo intento perfecto y tercero vacío: quedan el mejor y el último.
select lives_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000002') $$,
  'el alumno inicia otro intento'
);
select lives_ok(
  $$ select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000021', array['e7000000-0000-0000-0000-000000000211']::uuid[]),
            public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000022', array['e7000000-0000-0000-0000-000000000222', 'e7000000-0000-0000-0000-000000000221']::uuid[]),
            public.submit_attempt(a.id)
     from public.attempts a
     where a.evaluation_id = 'e5000000-0000-0000-0000-000000000002' and a.status = 'in_progress' $$,
  'el alumno entrega un intento con todas las respuestas correctas'
);
select lives_ok(
  $$ select public.submit_attempt((public.start_attempt('e5000000-0000-0000-0000-000000000002')).id) $$,
  'el alumno entrega un intento sin responder'
);
select results_eq(
  $$ select percent, is_best from public.attempts
     where evaluation_id = 'e5000000-0000-0000-0000-000000000002' order by percent $$,
  $$ values (0.00::numeric, false), (100.00::numeric, true) $$,
  'solo se guardan el mejor y el último intento, y el mejor queda marcado'
);

-- Simulador: vencimiento del servidor, una sola respuesta y puntaje estimado.
select lives_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000001') $$,
  'el alumno inicia un simulador'
);
select is(
  (select expires_at - started_at from public.attempts where evaluation_id = 'e5000000-0000-0000-0000-000000000001'),
  interval '120 minutes',
  'el servidor fija el vencimiento con el tiempo del simulador'
);
select throws_ok(
  $$ select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000011',
       array['e7000000-0000-0000-0000-000000000111', 'e7000000-0000-0000-0000-000000000112']::uuid[])
     from public.attempts a where a.evaluation_id = 'e5000000-0000-0000-0000-000000000001' $$,
  'CA022', null, 'en un simulador se elige una sola respuesta'
);
select is(
  (select (public.submit_attempt(a.id)).score
   from public.attempts a,
        lateral (select public.save_answer(a.id, 'e6000000-0000-0000-0000-000000000011', array['e7000000-0000-0000-0000-000000000111']::uuid[])) s
   where a.evaluation_id = 'e5000000-0000-0000-0000-000000000001'),
  1000,
  'el simulador calcula 700 + aciertos / total × 600'
);
reset role;

-- ── Vencimiento sin el navegador conectado ───────────────────────────────────
insert into public.attempts (id, evaluation_id, student_id, started_at, expires_at) values
  ('e8000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006',
   now() - interval '3 hours', now() - interval '1 hour');
insert into public.attempt_answers (attempt_id, question_id, selected_option_ids) values
  ('e8000000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000011', array['e7000000-0000-0000-0000-000000000111']::uuid[]);

select is(app_private.close_expired_attempts(), 1, 'la tarea programada cierra el intento vencido');
select ok(
  (select status = 'expired' and score = 1000 and finished_at = expires_at and duration_seconds = 7200
   from public.attempts where id = 'e8000000-0000-0000-0000-000000000001'),
  'el intento vencido se califica con lo que se alcanzó a responder'
);

insert into public.attempts (id, evaluation_id, student_id, started_at, expires_at) values
  ('e8000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006',
   now() - interval '150 minutes', now() - interval '30 minutes');

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000006"}', true);
set local role authenticated;
select is(
  (public.save_answer('e8000000-0000-0000-0000-000000000002', 'e6000000-0000-0000-0000-000000000012',
     array['e7000000-0000-0000-0000-000000000121']::uuid[])).status,
  'expired',
  'después del tiempo límite el intento se cierra'
);
select is(
  (select selected_option_ids from public.attempt_answers
   where attempt_id = 'e8000000-0000-0000-0000-000000000002'
     and question_id = 'e6000000-0000-0000-0000-000000000012'),
  '{}'::uuid[],
  'después del tiempo límite no se guarda la respuesta'
);
select is(
  (select count(*) from public.attempts where student_id = 'e0000000-0000-0000-0000-000000000004'),
  0::bigint,
  'un alumno no ve los intentos de otro'
);
reset role;

-- ── Profesor 1 ───────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select is((select count(*) from public.attempts), 5::bigint, 'el profesor ve los intentos de sus alumnos');
select is((select count(*) from public.question_keys), 5::bigint, 'el profesor ve las respuestas correctas de su curso');
select throws_ok(
  $$ select public.start_attempt('e5000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no resuelve evaluaciones'
);
select throws_ok(
  $$ insert into public.evaluations (course_id, kind, title, time_limit_minutes, created_by) values
     ('e1000000-0000-0000-0000-000000000001', 'simulador', 'Simulador profe', 60, 'e0000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no crea simuladores'
);
select throws_ok(
  $$ insert into public.evaluations (course_id, kind, title, created_by) values
     ('e1000000-0000-0000-0000-000000000002', 'quiz', 'Ajeno', 'e0000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'el profesor no crea evaluaciones en un curso ajeno'
);
select lives_ok(
  $$ insert into public.evaluations (id, course_id, module_id, kind, title, created_by) values
     ('e5000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001',
      'quiz', 'Quiz del profe', 'e0000000-0000-0000-0000-000000000002') $$,
  'el profesor crea un quiz en su curso'
);
select lives_ok(
  $$ insert into public.questions (id, evaluation_id, position, prompt, media_kind, media_url) values
     ('e6000000-0000-0000-0000-000000000101', 'e5000000-0000-0000-0000-000000000010', 0, 'Pregunta con video',
      'video_link', 'https://drive.google.com/file/d/x') $$,
  'el profesor agrega una pregunta con video de Drive'
);
select lives_ok(
  $$ insert into public.question_options (id, question_id, position, body) values
     ('e7000000-0000-0000-0000-000000001011', 'e6000000-0000-0000-0000-000000000101', 0, 'Sí'),
     ('e7000000-0000-0000-0000-000000001012', 'e6000000-0000-0000-0000-000000000101', 1, 'No') $$,
  'el profesor agrega las opciones'
);
select lives_ok(
  $$ insert into public.question_keys (question_id, correct_option_ids) values
     ('e6000000-0000-0000-0000-000000000101', array['e7000000-0000-0000-0000-000000001011']::uuid[]) $$,
  'el profesor define la respuesta correcta'
);
select lives_ok(
  $$ update public.evaluations set status = 'published' where id = 'e5000000-0000-0000-0000-000000000010' $$,
  'el profesor publica su quiz'
);
select throws_ok(
  $$ update public.evaluations set status = 'archived' where id = 'e5000000-0000-0000-0000-000000000010' $$,
  '42501', null, 'el profesor no retira una evaluación publicada'
);
select is_empty(
  $$ update public.evaluations set title = 'Cambiado' where id = 'e5000000-0000-0000-0000-000000000001' returning id $$,
  'el profesor no edita simuladores'
);
select is_empty(
  $$ update public.question_keys set explanation = 'Cambiada'
     where question_id = 'e6000000-0000-0000-0000-000000000021' returning question_id $$,
  'el profesor no cambia las respuestas de evaluaciones de otra persona'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000003"}', true);
set local role authenticated;
select is((select count(*) from public.attempts), 0::bigint, 'el profesor no ve intentos de alumnos de otros grupos');
reset role;

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.evaluations (course_id, kind, title, time_limit_minutes, created_by) values
     ('e1000000-0000-0000-0000-000000000001', 'simulador', 'Simulador 2', 90, 'e0000000-0000-0000-0000-000000000001') $$,
  'el administrador crea simuladores'
);
select lives_ok(
  $$ update public.evaluations set status = 'archived' where id = 'e5000000-0000-0000-0000-000000000002' $$,
  'el administrador retira una evaluación publicada'
);
select is(
  (select count(*) from public.attempts where evaluation_id in (
    select id from public.evaluations where course_id = 'e1000000-0000-0000-0000-000000000001')),
  5::bigint,
  'el administrador ve todos los intentos'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select results_eq(
  $$ select title from public.evaluations order by title $$,
  array['Quiz del profe', 'Simulador 1'],
  'el alumno deja de ver la evaluación retirada y ve la que publicó su profesor'
);
reset role;

select * from finish();
rollback;
