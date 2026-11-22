-- Estadísticas para los paneles (#31). Todas las funciones son de solo lectura
-- y SECURITY INVOKER: leen public.attempts con la RLS de quien llama, así cada
-- rol solo agrega los intentos que ya puede ver (#30). El significado de cada
-- indicador está en docs/ESTADISTICAS.md.
--
-- Reglas del cliente (1.10): los quizzes se promedian en porcentaje y los
-- simuladores y cuestionarios en puntos, nunca mezclados; cuenta el mejor
-- intento de cada alumno en cada evaluación.

-- ── Apoyo ────────────────────────────────────────────────────────────────────
-- Tipo, módulo y título de cada evaluación, aunque quien llama ya no la vea
-- (por ejemplo, el alumno con una evaluación archivada): así su promedio es el
-- mismo que ven su maestro y el administrador. No expone nada más.
create function app_private.evaluation_meta()
returns table (id uuid, kind text, module_id uuid, title text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.kind, e.module_id, e.title from public.evaluations e
$$;

-- Mejor intento terminado de cada alumno en cada evaluación, dentro del periodo
-- [p_from, p_to). Mismo orden que keep_best_and_last: mayor porcentaje y, si
-- empatan, el más reciente. Sin periodo coincide con is_best.
create function app_private.best_attempts(p_from timestamptz, p_to timestamptz)
returns table (
  student_id uuid,
  evaluation_id uuid,
  kind text,
  module_id uuid,
  title text,
  percent numeric,
  score integer,
  correct_count integer,
  total_questions integer,
  finished_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select distinct on (a.student_id, a.evaluation_id)
         a.student_id, a.evaluation_id, m.kind, m.module_id, m.title,
         a.percent, a.score, a.correct_count, a.total_questions, a.finished_at
  from public.attempts a
  join app_private.evaluation_meta() m on m.id = a.evaluation_id
  where a.status <> 'in_progress'
    and (p_from is null or a.finished_at >= p_from)
    and (p_to is null or a.finished_at < p_to)
  order by a.student_id, a.evaluation_id, a.percent desc, a.finished_at desc
$$;

-- ── Alumno ───────────────────────────────────────────────────────────────────
-- p_student vacío significa "yo". Un maestro o el administrador pueden pedir
-- a otro alumno; la RLS devuelve vacío si no lo atienden.
create function public.student_stats(
  p_student uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (quiz_avg_percent numeric, quiz_count integer, exam_avg_score integer, exam_count integer)
language sql
stable
set search_path = ''
as $$
  select round(avg(b.percent) filter (where b.kind = 'quiz'), 2),
         (count(*) filter (where b.kind = 'quiz'))::integer,
         round(avg(b.score) filter (where b.kind <> 'quiz'))::integer,
         (count(*) filter (where b.kind <> 'quiz'))::integer
  from app_private.best_attempts(p_from, p_to) b
  where b.student_id = coalesce(p_student, (select auth.uid()))
$$;

-- Calificaciones: el mejor intento de cada evaluación.
create function public.student_results(
  p_student uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  evaluation_id uuid,
  title text,
  kind text,
  module_id uuid,
  percent numeric,
  score integer,
  correct_count integer,
  total_questions integer,
  finished_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select b.evaluation_id, b.title, b.kind, b.module_id, b.percent, b.score,
         b.correct_count, b.total_questions, b.finished_at
  from app_private.best_attempts(p_from, p_to) b
  where b.student_id = coalesce(p_student, (select auth.uid()))
  order by b.finished_at desc
$$;

-- Promedio de quizzes por módulo, para ver en qué áreas mejorar.
create function public.student_module_quiz_stats(
  p_student uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (module_id uuid, quiz_avg_percent numeric, quiz_count integer)
language sql
stable
set search_path = ''
as $$
  select b.module_id, round(avg(b.percent), 2), count(*)::integer
  from app_private.best_attempts(p_from, p_to) b
  where b.student_id = coalesce(p_student, (select auth.uid()))
    and b.kind = 'quiz'
  group by b.module_id
$$;

-- ── Grupos (maestro y administrador) ─────────────────────────────────────────
-- La RLS de groups ya limita al maestro a sus grupos asignados. El alumno no
-- recibe estadísticas de grupo: solo las suyas.
create function public.group_stats(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  group_id uuid,
  group_name text,
  course_id uuid,
  generation text,
  student_count integer,
  quiz_avg_percent numeric,
  quiz_count integer,
  exam_avg_score integer,
  exam_count integer
)
language sql
stable
set search_path = ''
as $$
  select g.id, g.name, g.course_id, g.generation,
         (select count(*) from public.group_students gs where gs.group_id = g.id)::integer,
         round(avg(b.percent) filter (where b.kind = 'quiz'), 2),
         (count(b.evaluation_id) filter (where b.kind = 'quiz'))::integer,
         round(avg(b.score) filter (where b.kind <> 'quiz'))::integer,
         (count(b.evaluation_id) filter (where b.kind <> 'quiz'))::integer
  from public.groups g
  left join public.group_students gs on gs.group_id = g.id
  left join app_private.best_attempts(p_from, p_to) b on b.student_id = gs.student_id
  where (select app_private.current_app_role()) in ('admin', 'teacher')
  group by g.id
  order by g.name
$$;

create function public.group_student_stats(
  p_group uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  student_id uuid,
  full_name text,
  quiz_avg_percent numeric,
  quiz_count integer,
  exam_avg_score integer,
  exam_count integer,
  last_finished_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select p.id, p.full_name,
         round(avg(b.percent) filter (where b.kind = 'quiz'), 2),
         (count(b.evaluation_id) filter (where b.kind = 'quiz'))::integer,
         round(avg(b.score) filter (where b.kind <> 'quiz'))::integer,
         (count(b.evaluation_id) filter (where b.kind <> 'quiz'))::integer,
         max(b.finished_at)
  from public.groups g
  join public.group_students gs on gs.group_id = g.id
  join public.profiles p on p.id = gs.student_id
  left join app_private.best_attempts(p_from, p_to) b on b.student_id = p.id
  where g.id = p_group
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  group by p.id
  order by p.full_name
$$;

-- ── Tendencia semanal ────────────────────────────────────────────────────────
-- Semanas de lunes a domingo según la fecha de entrega. p_group vacío: todos
-- los alumnos que quien llama puede ver.
create function public.weekly_stats(
  p_group uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (week_start date, quiz_avg_percent numeric, quiz_count integer, exam_avg_score integer, exam_count integer)
language sql
stable
set search_path = ''
as $$
  select date_trunc('week', b.finished_at at time zone 'America/Mexico_City')::date,
         round(avg(b.percent) filter (where b.kind = 'quiz'), 2),
         (count(*) filter (where b.kind = 'quiz'))::integer,
         round(avg(b.score) filter (where b.kind <> 'quiz'))::integer,
         (count(*) filter (where b.kind <> 'quiz'))::integer
  from app_private.best_attempts(p_from, p_to) b
  where p_group is null
     or exists (
       select 1 from public.group_students gs
       where gs.group_id = p_group and gs.student_id = b.student_id
     )
  group by 1
  order by 1
$$;

-- ── Resumen general (administrador) ──────────────────────────────────────────
create function public.stats_overview(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  students_with_results integer,
  quiz_avg_percent numeric,
  quiz_count integer,
  exam_avg_score integer,
  exam_count integer
)
language sql
stable
set search_path = ''
as $$
  select (count(distinct b.student_id))::integer,
         round(avg(b.percent) filter (where b.kind = 'quiz'), 2),
         (count(*) filter (where b.kind = 'quiz'))::integer,
         round(avg(b.score) filter (where b.kind <> 'quiz'))::integer,
         (count(*) filter (where b.kind <> 'quiz'))::integer
  from app_private.best_attempts(p_from, p_to) b
  -- HAVING y no WHERE: sin GROUP BY un agregado siempre da una fila, y quien no
  -- es administrador debe recibir ninguna, no una de ceros.
  having (select app_private.is_admin())
$$;

-- ── Permisos ─────────────────────────────────────────────────────────────────
-- Supabase da EXECUTE a anon en cada función nueva de public.
revoke all on function app_private.evaluation_meta() from public;
revoke all on function app_private.best_attempts(timestamptz, timestamptz) from public;
revoke all on function public.student_stats(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.student_results(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.student_module_quiz_stats(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.group_stats(timestamptz, timestamptz) from public, anon;
revoke all on function public.group_student_stats(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.weekly_stats(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.stats_overview(timestamptz, timestamptz) from public, anon;

grant execute on function app_private.evaluation_meta() to authenticated;
grant execute on function app_private.best_attempts(timestamptz, timestamptz) to authenticated;
grant execute on function public.student_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.student_results(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.student_module_quiz_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.group_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.group_student_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.weekly_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.stats_overview(timestamptz, timestamptz) to authenticated;
