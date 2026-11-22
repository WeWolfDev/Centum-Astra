-- Estadísticas por rol (#31). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(23);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profe del grupo 1 · 3 profe del grupo 2 · 4 y 5 alumnos del grupo 1 · 6 alumno del grupo 2
insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-000000000001', 'admin@stats.mx'),
  ('b0000000-0000-0000-0000-000000000002', 'profe1@stats.mx'),
  ('b0000000-0000-0000-0000-000000000003', 'profe2@stats.mx'),
  ('b0000000-0000-0000-0000-000000000004', 'alumno1@stats.mx'),
  ('b0000000-0000-0000-0000-000000000005', 'alumno2@stats.mx'),
  ('b0000000-0000-0000-0000-000000000006', 'alumno3@stats.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('b0000000-0000-0000-0000-000000000001', 'admin@stats.mx', 'Admin', 'admin', 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'profe1@stats.mx', 'Profe 1', 'teacher', 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'profe2@stats.mx', 'Profe 2', 'teacher', 'active'),
  ('b0000000-0000-0000-0000-000000000004', 'alumno1@stats.mx', 'Ana', 'student', 'active'),
  ('b0000000-0000-0000-0000-000000000005', 'alumno2@stats.mx', 'Beto', 'student', 'active'),
  ('b0000000-0000-0000-0000-000000000006', 'alumno3@stats.mx', 'Caro', 'student', 'active');

insert into public.courses (id, name) values ('b1000000-0000-0000-0000-000000000001', 'Curso');
insert into public.groups (id, course_id, name, code, generation) values
  ('b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Grupo 1', 'SG1', '2027'),
  ('b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Grupo 2', 'SG2', '2027');
insert into public.group_teachers (group_id, teacher_id) values
  ('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003');
insert into public.group_students (group_id, student_id) values
  ('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'),
  ('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005'),
  ('b2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006');
insert into public.modules (id, course_id, title, position) values
  ('b3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Matemático', 0),
  ('b3000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Lector', 1);

-- Quiz 1 (Matemático), quiz 2 (Lector), simulador y cuestionario.
insert into public.evaluations (id, course_id, module_id, kind, title, time_limit_minutes, created_by) values
  ('b5000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'quiz', 'Quiz 1', null, 'b0000000-0000-0000-0000-000000000001'),
  ('b5000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 'quiz', 'Quiz 2', null, 'b0000000-0000-0000-0000-000000000001'),
  ('b5000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', null, 'simulador', 'Simulador', 120, 'b0000000-0000-0000-0000-000000000001'),
  ('b5000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'cuestionario', 'Cuestionario', null, 'b0000000-0000-0000-0000-000000000001');

-- Solo se guardan el mejor y el último intento (keep_best_and_last), así que
-- los datos imitan eso. Ana: quiz 1 con 90 % (1 nov, el mejor) y 60 % (10 nov,
-- el último), quiz 2 con 50 %, simulador 1000 y cuestionario 1200. Beto: quiz 1
-- con 70 % (11 nov, el mejor) y 40 % (16 nov, el último). Caro (grupo 2): quiz 1
-- con 100 % y simulador 1300. Un intento en curso no cuenta.
insert into public.attempts
  (evaluation_id, student_id, status, started_at, finished_at, total_questions, correct_count, percent, score, duration_seconds, is_best)
values
  ('b5000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'submitted', '2026-11-01 10:00-06', '2026-11-01 10:10-06', 10, 9, 90, null, 600, true),
  ('b5000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'submitted', '2026-11-10 10:00-06', '2026-11-10 10:10-06', 10, 6, 60, null, 600, false),
  ('b5000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'submitted', '2026-11-12 10:00-06', '2026-11-12 10:10-06', 10, 5, 50, null, 600, true),
  ('b5000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'expired',   '2026-11-05 08:00-06', '2026-11-05 10:00-06', 10, 5, 50, 1000, 7200, true),
  ('b5000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'submitted', '2026-11-15 10:00-06', '2026-11-15 11:00-06', 6, 5, 83.33, 1200, 3600, true),
  ('b5000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'submitted', '2026-11-11 10:00-06', '2026-11-11 10:10-06', 10, 7, 70, null, 600, true),
  ('b5000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'submitted', '2026-11-16 10:00-06', '2026-11-16 10:10-06', 10, 4, 40, null, 600, false),
  ('b5000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'submitted', '2026-11-11 10:00-06', '2026-11-11 10:10-06', 10, 10, 100, null, 600, true),
  ('b5000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'submitted', '2026-11-13 08:00-06', '2026-11-13 09:00-06', 10, 10, 100, 1300, 3600, true);
insert into public.attempts (evaluation_id, student_id, started_at) values
  ('b5000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', '2026-11-14 10:00-06');

-- ── Anónimo ──────────────────────────────────────────────────────────────────
set local role anon;
select throws_ok($$ select * from public.group_stats() $$, '42501', null, 'anon no obtiene estadísticas');
reset role;

-- ── Alumna (Ana) ─────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000004"}', true);
set local role authenticated;
select results_eq(
  $$ select quiz_avg_percent, quiz_count, exam_avg_score, exam_count from public.student_stats() $$,
  $$ values (70.00::numeric, 2, 1100, 2) $$,
  'la alumna ve su promedio de quizzes en % y el de simuladores y cuestionarios en puntos, separados y con el mejor intento'
);
select results_eq(
  $$ select quiz_avg_percent, quiz_count, exam_avg_score, exam_count
     from public.student_stats(null, '2026-11-01 00:00-06', '2026-11-08 00:00-06') $$,
  $$ values (90.00::numeric, 1, 1000, 1) $$,
  'el periodo limita los intentos guardados; dentro de él cuenta el mejor de ese periodo'
);
select results_eq(
  $$ select title, percent, score from public.student_results() order by title $$,
  $$ values ('Cuestionario'::text, 83.33::numeric, 1200), ('Quiz 1', 90.00, null), ('Quiz 2', 50.00, null), ('Simulador', 50.00, 1000) $$,
  'la alumna ve sus calificaciones: el mejor intento de cada evaluación'
);
select results_eq(
  $$ select module_id, quiz_avg_percent from public.student_module_quiz_stats() order by quiz_avg_percent $$,
  $$ values ('b3000000-0000-0000-0000-000000000002'::uuid, 50.00::numeric), ('b3000000-0000-0000-0000-000000000001', 90.00) $$,
  'la alumna ve su promedio de quizzes por módulo'
);
select results_eq(
  $$ select quiz_count, exam_count from public.student_stats('b0000000-0000-0000-0000-000000000005') $$,
  $$ values (0, 0) $$,
  'la alumna no obtiene las estadísticas de otro alumno'
);
select is_empty($$ select * from public.group_stats() $$, 'la alumna no recibe estadísticas de grupo');
select is_empty($$ select * from public.stats_overview() $$, 'la alumna no recibe el resumen general');
reset role;

-- ── Profesor del grupo 1 ─────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select results_eq(
  $$ select group_name, student_count, quiz_avg_percent, quiz_count, exam_avg_score, exam_count from public.group_stats() $$,
  $$ values ('Grupo 1'::text, 2, 70.00::numeric, 3, 1100, 2) $$,
  'el profesor ve solo su grupo, con los promedios separados'
);
select results_eq(
  $$ select full_name, quiz_avg_percent, exam_avg_score from public.group_student_stats('b2000000-0000-0000-0000-000000000001') $$,
  $$ values ('Ana'::text, 70.00::numeric, 1100), ('Beto', 70.00, null) $$,
  'el profesor ve las calificaciones de cada alumno de su grupo'
);
select is(
  (select last_finished_at from public.group_student_stats('b2000000-0000-0000-0000-000000000001')
   where full_name = 'Beto'),
  '2026-11-16 10:10-06'::timestamptz,
  'la última entrega es la del último intento, aunque no sea el mejor'
);
select is_empty(
  $$ select * from public.group_student_stats('b2000000-0000-0000-0000-000000000002') $$,
  'el profesor no obtiene estadísticas de un grupo que no tiene asignado'
);
select results_eq(
  $$ select quiz_count, exam_count from public.student_stats('b0000000-0000-0000-0000-000000000006') $$,
  $$ values (0, 0) $$,
  'el profesor no obtiene las estadísticas de un alumno de otro grupo'
);
select results_eq(
  $$ select quiz_avg_percent from public.student_stats('b0000000-0000-0000-0000-000000000004') $$,
  $$ values (70.00::numeric) $$,
  'el profesor ve el mismo promedio que la alumna'
);
select is(
  (select sum(quiz_count)::integer from public.weekly_stats()),
  3,
  'la tendencia semanal del profesor solo cuenta a sus alumnos'
);
select is_empty($$ select * from public.stats_overview() $$, 'el profesor no recibe el resumen general');
reset role;

-- ── Administrador ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select results_eq(
  $$ select group_name, student_count, quiz_avg_percent, exam_avg_score from public.group_stats() where course_id = 'b1000000-0000-0000-0000-000000000001' $$,
  $$ values ('Grupo 1'::text, 2, 70.00::numeric, 1100), ('Grupo 2', 1, 100.00, 1300) $$,
  'el administrador ve todos los grupos'
);
select results_eq(
  $$ select students_with_results, quiz_avg_percent, quiz_count, exam_avg_score, exam_count from public.stats_overview() $$,
  $$ values (3, 77.50::numeric, 4, 1167, 3) $$,
  'el resumen general promedia el mejor intento de cada alumno, sin mezclar escalas'
);
select results_eq(
  $$ select students_with_results, quiz_count, exam_count
     from public.stats_overview('2026-11-10 00:00-06', '2026-11-12 00:00-06') $$,
  $$ values (3, 3, 0) $$,
  'el administrador elige el periodo'
);
select results_eq(
  $$ select group_name, quiz_count from public.group_stats('2026-11-12 00:00-06', null) where course_id = 'b1000000-0000-0000-0000-000000000001' $$,
  $$ values ('Grupo 1'::text, 2), ('Grupo 2', 0) $$,
  'las estadísticas de grupo respetan el periodo'
);
select is(
  (select sum(quiz_count)::integer from public.weekly_stats('b2000000-0000-0000-0000-000000000001')),
  3,
  'la tendencia semanal se filtra por grupo'
);
select is(
  (select sum(quiz_count)::integer from public.weekly_stats()),
  4,
  'la tendencia semanal del administrador cuenta a todos'
);
select is(
  (select count(*)::integer from public.student_results('b0000000-0000-0000-0000-000000000005')),
  1,
  'un intento en curso no cuenta como calificación'
);
reset role;

select * from finish();
rollback;
