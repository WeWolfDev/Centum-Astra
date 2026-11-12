-- Evaluaciones, intentos y resultados (#30). El servidor controla el tiempo, la
-- calificación y cuándo se muestran las respuestas correctas; el navegador solo
-- llama a las funciones start_attempt, save_answer, submit_attempt y attempt_review.

-- ── Tablas ───────────────────────────────────────────────────────────────────
-- Un simulador puede abarcar varias áreas del curso, por eso module_id es opcional.
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  module_id uuid,
  kind text not null check (kind in ('quiz', 'cuestionario', 'simulador')),
  title text not null check (length(btrim(title)) > 0),
  description text,
  time_limit_minutes integer check (time_limit_minutes > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint evaluations_module_same_course foreign key (module_id, course_id)
    references public.modules (id, course_id) on delete restrict,
  -- Regla del cliente: el simulador tiene temporizador y el quiz no.
  constraint evaluations_time_limit_by_kind check (
    (kind = 'simulador' and time_limit_minutes is not null)
    or (kind = 'quiz' and time_limit_minutes is null)
    or kind = 'cuestionario'
  )
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  position integer not null check (position >= 0),
  prompt text not null check (length(btrim(prompt)) > 0),
  -- Imagen o audio en Storage; video como enlace de Google Drive.
  media_kind text check (media_kind in ('image', 'audio', 'video_link')),
  media_path text,
  media_url text,
  created_at timestamptz not null default now(),
  unique (evaluation_id, position),
  constraint questions_media_matches_kind check (
    (media_kind is null and media_path is null and media_url is null)
    or (media_kind in ('image', 'audio') and media_path is not null and media_url is null)
    or (media_kind = 'video_link' and media_url is not null and media_path is null)
  )
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position integer not null check (position >= 0),
  body text not null check (length(btrim(body)) > 0),
  unique (question_id, position)
);

-- Respuestas correctas y explicación. El alumno nunca lee esta tabla; las recibe
-- de attempt_review cuando termina su intento.
create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_option_ids uuid[] not null check (cardinality(correct_option_ids) >= 1),
  explanation text
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired')),
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  finished_at timestamptz,
  total_questions integer,
  correct_count integer,
  percent numeric(5, 2),
  -- Puntaje estimado de 700 a 1300 (cuestionario y simulador); no es oficial del EXANI-II.
  score integer,
  duration_seconds integer,
  is_best boolean not null default false,
  constraint attempts_finished_has_result check (
    status = 'in_progress'
    or (finished_at is not null and total_questions is not null and correct_count is not null
        and percent is not null and duration_seconds is not null)
  )
);

create table public.attempt_answers (
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_ids uuid[] not null default '{}',
  is_correct boolean,
  answered_at timestamptz not null default clock_timestamp(),
  primary key (attempt_id, question_id)
);

create index evaluations_course_id_idx on public.evaluations (course_id);
create index evaluations_module_course_idx on public.evaluations (module_id, course_id);
create index evaluations_created_by_idx on public.evaluations (created_by);
create index attempts_student_id_idx on public.attempts (student_id);
create index attempts_evaluation_student_idx on public.attempts (evaluation_id, student_id);
create index attempts_open_expires_at_idx on public.attempts (expires_at) where status = 'in_progress';
create index attempt_answers_question_id_idx on public.attempt_answers (question_id);
-- Un solo intento en curso por alumno y evaluación: iniciar dos veces lo retoma.
create unique index attempts_one_in_progress on public.attempts (evaluation_id, student_id)
  where status = 'in_progress';
create unique index attempts_one_best on public.attempts (evaluation_id, student_id) where is_best;

alter table public.evaluations enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_keys enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

-- Los intentos solo cambian a través de las funciones de este archivo.
grant select, insert, update, delete on
  public.evaluations, public.questions, public.question_options, public.question_keys
to authenticated;
grant select on public.attempts, public.attempt_answers to authenticated;
grant all on
  public.evaluations, public.questions, public.question_options, public.question_keys,
  public.attempts, public.attempt_answers
to service_role;

-- ── Funciones de apoyo para RLS ──────────────────────────────────────────────
create function app_private.can_see_evaluation(target_evaluation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.evaluations e
    where e.id = target_evaluation
      and (
        app_private.is_admin()
        or app_private.teaches_course(e.course_id)
        or (
          e.status = 'published'
          and case
            when e.module_id is null then app_private.studies_course(e.course_id)
            else app_private.studies_module(e.module_id)
          end
        )
      )
  )
$$;

-- Administradores y maestros del curso: ven el contenido completo, incluidas las claves.
create function app_private.manages_evaluation(target_evaluation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.evaluations e
    where e.id = target_evaluation
      and (app_private.is_admin() or app_private.teaches_course(e.course_id))
  )
$$;

-- Solo el administrador edita simuladores; el maestro edita sus quizzes y cuestionarios.
create function app_private.can_edit_evaluation(target_evaluation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.evaluations e
    where e.id = target_evaluation
      and (
        app_private.is_admin()
        or (
          e.kind <> 'simulador'
          and e.created_by = (select auth.uid())
          and app_private.teaches_course(e.course_id)
        )
      )
  )
$$;

create function app_private.evaluation_of_question(target_question uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select q.evaluation_id from public.questions q where q.id = target_question
$$;

create function app_private.can_see_attempt(target_attempt uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attempts a
    where a.id = target_attempt
      and (
        app_private.is_admin()
        or app_private.teaches_student(a.student_id)
        or (
          a.student_id = (select auth.uid())
          and app_private.current_app_role() = 'student'
        )
      )
  )
$$;

revoke all on function
  app_private.can_see_evaluation(uuid),
  app_private.manages_evaluation(uuid),
  app_private.can_edit_evaluation(uuid),
  app_private.evaluation_of_question(uuid),
  app_private.can_see_attempt(uuid)
from public;
grant execute on function
  app_private.can_see_evaluation(uuid),
  app_private.manages_evaluation(uuid),
  app_private.can_edit_evaluation(uuid),
  app_private.evaluation_of_question(uuid),
  app_private.can_see_attempt(uuid)
to authenticated;

-- ── Políticas: contenido de la evaluación ────────────────────────────────────
create policy "evaluations_select"
  on public.evaluations for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(course_id)
    or (
      status = 'published'
      and case
        when module_id is null then app_private.studies_course(course_id)
        else app_private.studies_module(module_id)
      end
    )
  );

-- Regla del cliente: el maestro crea y publica quizzes y cuestionarios en su
-- curso; los simuladores son solo del administrador.
create policy "evaluations_insert"
  on public.evaluations for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (select app_private.is_admin())
      or (
        kind <> 'simulador'
        and status in ('draft', 'published')
        and app_private.teaches_course(course_id)
      )
    )
  );

create policy "evaluations_update"
  on public.evaluations for update
  to authenticated
  using (
    (select app_private.is_admin())
    or (
      kind <> 'simulador'
      and created_by = (select auth.uid())
      and app_private.teaches_course(course_id)
    )
  )
  with check (
    (select app_private.is_admin())
    or (
      kind <> 'simulador'
      and status in ('draft', 'published')
      and created_by = (select auth.uid())
      and app_private.teaches_course(course_id)
    )
  );

create policy "evaluations_delete"
  on public.evaluations for delete
  to authenticated
  using (
    (select app_private.is_admin())
    or (
      status = 'draft'
      and kind <> 'simulador'
      and created_by = (select auth.uid())
      and app_private.teaches_course(course_id)
    )
  );

create policy "questions_select"
  on public.questions for select
  to authenticated
  using (app_private.can_see_evaluation(evaluation_id));

create policy "question_options_select"
  on public.question_options for select
  to authenticated
  using (app_private.can_see_evaluation(app_private.evaluation_of_question(question_id)));

create policy "question_keys_select"
  on public.question_keys for select
  to authenticated
  using (app_private.manages_evaluation(app_private.evaluation_of_question(question_id)));

-- Escritura de preguntas, opciones y claves: quien puede editar la evaluación.
do $$
declare
  target text;
  evaluacion text;
begin
  foreach target in array array['questions', 'question_options', 'question_keys']
  loop
    evaluacion := case
      when target = 'questions' then 'evaluation_id'
      else 'app_private.evaluation_of_question(question_id)'
    end;
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app_private.can_edit_evaluation(%s))',
      target || '_insert', target, evaluacion
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (app_private.can_edit_evaluation(%s)) with check (app_private.can_edit_evaluation(%s))',
      target || '_update', target, evaluacion, evaluacion
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (app_private.can_edit_evaluation(%s))',
      target || '_delete', target, evaluacion
    );
  end loop;
end;
$$;

-- ── Políticas: intentos (solo lectura) ───────────────────────────────────────
create policy "attempts_select"
  on public.attempts for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_student(student_id)
    or (
      student_id = (select auth.uid())
      and (select app_private.current_app_role()) = 'student'
    )
  );

create policy "attempt_answers_select"
  on public.attempt_answers for select
  to authenticated
  using (app_private.can_see_attempt(attempt_id));

-- ── Integridad de evaluaciones y claves ──────────────────────────────────────
create function app_private.guard_evaluation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'published' and new.status <> 'published'
      and app_private.current_app_role() = 'teacher'
    then
      raise exception 'Solo un administrador puede retirar una evaluación publicada.'
        using errcode = '42501';
    end if;
    if new.kind <> old.kind and old.status <> 'draft' then
      raise exception 'No se cambia el tipo de una evaluación ya publicada.'
        using errcode = 'CA020';
    end if;
  end if;

  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    if not exists (select 1 from public.questions q where q.evaluation_id = new.id) then
      raise exception 'La evaluación necesita al menos una pregunta.' using errcode = 'CA020';
    end if;
    if exists (
      select 1
      from public.questions q
      where q.evaluation_id = new.id
        and (
          (select count(*) from public.question_options o where o.question_id = q.id) < 2
          or not exists (
            select 1
            from public.question_keys k
            where k.question_id = q.id
              and k.correct_option_ids <@ array(
                select o.id from public.question_options o where o.question_id = q.id
              )
          )
        )
    ) then
      raise exception 'Cada pregunta necesita al menos dos opciones y su respuesta correcta.'
        using errcode = 'CA020';
    end if;
    new.published_at := now();
  end if;
  return new;
end;
$$;

revoke all on function app_private.guard_evaluation() from public, authenticated;

create trigger evaluations_guard
before insert or update on public.evaluations
for each row
execute function app_private.guard_evaluation();

-- Guarda la clave ordenada y sin repetir, para compararla con la respuesta del alumno.
create function app_private.validate_question_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
begin
  new.correct_option_ids := array(
    select distinct x from unnest(new.correct_option_ids) as x order by x
  );
  if exists (
    select 1
    from unnest(new.correct_option_ids) as x
    where not exists (
      select 1 from public.question_options o where o.id = x and o.question_id = new.question_id
    )
  ) then
    raise exception 'La respuesta correcta debe ser una opción de la misma pregunta.'
      using errcode = 'CA021';
  end if;
  select e.kind into v_kind
  from public.questions q
  join public.evaluations e on e.id = q.evaluation_id
  where q.id = new.question_id;
  if v_kind = 'simulador' and cardinality(new.correct_option_ids) <> 1 then
    raise exception 'En un simulador cada pregunta tiene una sola respuesta correcta.'
      using errcode = 'CA021';
  end if;
  return new;
end;
$$;

revoke all on function app_private.validate_question_key() from public, authenticated;

create trigger question_keys_validate
before insert or update on public.question_keys
for each row
execute function app_private.validate_question_key();

-- ── Calificación y cierre de intentos ────────────────────────────────────────
-- Conserva solo el mejor y el último intento terminado, y marca el mejor.
create function app_private.keep_best_and_last(target_evaluation uuid, target_student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_best uuid;
  v_last uuid;
begin
  select a.id into v_best
  from public.attempts a
  where a.evaluation_id = target_evaluation
    and a.student_id = target_student
    and a.status <> 'in_progress'
  order by a.percent desc, a.finished_at desc, a.id
  limit 1;

  select a.id into v_last
  from public.attempts a
  where a.evaluation_id = target_evaluation
    and a.student_id = target_student
    and a.status <> 'in_progress'
  order by a.finished_at desc, a.id
  limit 1;

  delete from public.attempts a
  where a.evaluation_id = target_evaluation
    and a.student_id = target_student
    and a.status <> 'in_progress'
    and a.id not in (v_best, v_last);

  update public.attempts a
  set is_best = false
  where a.evaluation_id = target_evaluation
    and a.student_id = target_student
    and a.is_best
    and a.id <> v_best;

  update public.attempts a
  set is_best = true
  where a.id = v_best
    and not a.is_best;
end;
$$;

-- Califica un intento en curso. Una pregunta cuenta solo si se marcaron todas las
-- respuestas correctas y ninguna incorrecta. El resultado queda guardado con la
-- calificación de cada respuesta, para que no cambie si después se edita la pregunta.
create function app_private.finalize_attempt(target_attempt uuid, final_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_kind text;
  v_total integer;
  v_correct integer;
  v_finished timestamptz;
begin
  select * into v_attempt from public.attempts a where a.id = target_attempt for update;
  if not found or v_attempt.status <> 'in_progress' then
    return;
  end if;

  select e.kind into v_kind from public.evaluations e where e.id = v_attempt.evaluation_id;

  insert into public.attempt_answers (attempt_id, question_id)
  select v_attempt.id, q.id
  from public.questions q
  where q.evaluation_id = v_attempt.evaluation_id
  on conflict (attempt_id, question_id) do nothing;

  update public.attempt_answers aa
  set is_correct = cardinality(aa.selected_option_ids) > 0
    and aa.selected_option_ids = coalesce(
      (select k.correct_option_ids from public.question_keys k where k.question_id = aa.question_id),
      '{}'
    )
  where aa.attempt_id = v_attempt.id;

  select count(*), count(*) filter (where aa.is_correct)
  into v_total, v_correct
  from public.attempt_answers aa
  where aa.attempt_id = v_attempt.id;

  v_finished := case
    when final_status = 'expired' then least(clock_timestamp(), v_attempt.expires_at)
    else clock_timestamp()
  end;

  update public.attempts a
  set status = final_status,
      finished_at = v_finished,
      total_questions = v_total,
      correct_count = v_correct,
      percent = case when v_total = 0 then 0 else round(v_correct * 100.0 / v_total, 2) end,
      score = case
        when v_kind in ('simulador', 'cuestionario') then
          round(700 + (case when v_total = 0 then 0 else v_correct::numeric / v_total end) * 600)::integer
      end,
      duration_seconds = greatest(0, floor(extract(epoch from v_finished - v_attempt.started_at)))::integer
  where a.id = v_attempt.id;

  perform app_private.keep_best_and_last(v_attempt.evaluation_id, v_attempt.student_id);
end;
$$;

-- Cierra los intentos con el tiempo vencido. pg_cron la llama cada minuto; las
-- funciones del alumno también la usan para no depender de esa espera.
create function app_private.close_expired_attempts(
  target_evaluation uuid default null,
  target_student uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_closed integer := 0;
begin
  for v_id in
    select a.id
    from public.attempts a
    where a.status = 'in_progress'
      and a.expires_at <= clock_timestamp()
      and (target_evaluation is null or a.evaluation_id = target_evaluation)
      and (target_student is null or a.student_id = target_student)
    order by a.expires_at
    for update skip locked
  loop
    perform app_private.finalize_attempt(v_id, 'expired');
    v_closed := v_closed + 1;
  end loop;
  return v_closed;
end;
$$;

revoke all on function
  app_private.keep_best_and_last(uuid, uuid),
  app_private.finalize_attempt(uuid, text),
  app_private.close_expired_attempts(uuid, uuid)
from public, authenticated;

-- ── Operaciones del alumno ───────────────────────────────────────────────────
-- Inicia un intento o retoma el que sigue en curso; el vencimiento lo fija el servidor.
create function public.start_attempt(p_evaluation_id uuid)
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_evaluation public.evaluations;
  v_attempt public.attempts;
begin
  if app_private.current_app_role() is distinct from 'student' then
    raise exception 'Solo un alumno puede resolver una evaluación.' using errcode = '42501';
  end if;

  select * into v_evaluation from public.evaluations e where e.id = p_evaluation_id;
  if not found
    or v_evaluation.status <> 'published'
    or not app_private.can_see_evaluation(p_evaluation_id)
  then
    raise exception 'La evaluación no está disponible.' using errcode = '42501';
  end if;

  perform app_private.close_expired_attempts(p_evaluation_id, v_uid);

  insert into public.attempts (evaluation_id, student_id, expires_at)
  values (
    p_evaluation_id,
    v_uid,
    case
      when v_evaluation.time_limit_minutes is not null
        then clock_timestamp() + make_interval(mins => v_evaluation.time_limit_minutes)
    end
  )
  on conflict (evaluation_id, student_id) where status = 'in_progress' do nothing
  returning * into v_attempt;

  if v_attempt.id is null then
    select * into v_attempt
    from public.attempts a
    where a.evaluation_id = p_evaluation_id
      and a.student_id = v_uid
      and a.status = 'in_progress';
  end if;
  return v_attempt;
end;
$$;

-- Guarda la respuesta de una pregunta. Si el tiempo ya venció, cierra el intento
-- sin guardarla y lo devuelve con estado 'expired'.
create function public.save_answer(p_attempt_id uuid, p_question_id uuid, p_option_ids uuid[])
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_kind text;
  v_selected uuid[];
begin
  if app_private.current_app_role() is distinct from 'student' then
    raise exception 'Solo un alumno puede resolver una evaluación.' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.attempts a
  where a.id = p_attempt_id
    and a.student_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'El intento no existe.' using errcode = '42501';
  end if;

  if v_attempt.status = 'in_progress' and v_attempt.expires_at <= clock_timestamp() then
    perform app_private.finalize_attempt(v_attempt.id, 'expired');
    select * into v_attempt from public.attempts a where a.id = p_attempt_id;
    return v_attempt;
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'El intento ya terminó.' using errcode = 'CA023';
  end if;

  if not exists (
    select 1 from public.questions q
    where q.id = p_question_id and q.evaluation_id = v_attempt.evaluation_id
  ) then
    raise exception 'La pregunta no pertenece a esta evaluación.' using errcode = 'CA022';
  end if;

  v_selected := array(
    select distinct x from unnest(coalesce(p_option_ids, '{}')) as x order by x
  );
  if exists (
    select 1
    from unnest(v_selected) as x
    where not exists (
      select 1 from public.question_options o where o.id = x and o.question_id = p_question_id
    )
  ) then
    raise exception 'La opción no pertenece a esta pregunta.' using errcode = 'CA022';
  end if;

  select e.kind into v_kind from public.evaluations e where e.id = v_attempt.evaluation_id;
  if v_kind = 'simulador' and cardinality(v_selected) > 1 then
    raise exception 'En un simulador se elige una sola respuesta.' using errcode = 'CA022';
  end if;

  insert into public.attempt_answers (attempt_id, question_id, selected_option_ids, answered_at)
  values (v_attempt.id, p_question_id, v_selected, clock_timestamp())
  on conflict (attempt_id, question_id) do update
    set selected_option_ids = excluded.selected_option_ids,
        answered_at = excluded.answered_at;

  return v_attempt;
end;
$$;

-- Entrega el intento. Repetir la entrega devuelve el mismo resultado.
create function public.submit_attempt(p_attempt_id uuid)
returns public.attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
begin
  if app_private.current_app_role() is distinct from 'student' then
    raise exception 'Solo un alumno puede resolver una evaluación.' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.attempts a
  where a.id = p_attempt_id
    and a.student_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'El intento no existe.' using errcode = '42501';
  end if;

  if v_attempt.status = 'in_progress' then
    perform app_private.finalize_attempt(
      v_attempt.id,
      case when v_attempt.expires_at <= clock_timestamp() then 'expired' else 'submitted' end
    );
    select * into v_attempt from public.attempts a where a.id = p_attempt_id;
  end if;
  return v_attempt;
end;
$$;

-- Respuestas correctas y explicaciones de un intento terminado.
create function public.attempt_review(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  prompt text,
  selected_option_ids uuid[],
  correct_option_ids uuid[],
  is_correct boolean,
  explanation text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts a where a.id = p_attempt_id;
  if not found or not app_private.can_see_attempt(p_attempt_id) then
    raise exception 'El intento no existe.' using errcode = '42501';
  end if;

  if v_attempt.status = 'in_progress' and v_attempt.expires_at <= clock_timestamp() then
    perform app_private.finalize_attempt(v_attempt.id, 'expired');
    select * into v_attempt from public.attempts a where a.id = p_attempt_id;
  end if;
  if v_attempt.status = 'in_progress' then
    raise exception 'Las respuestas se muestran al terminar la evaluación.' using errcode = 'CA023';
  end if;

  return query
  select q.id, q.position, q.prompt, aa.selected_option_ids, k.correct_option_ids,
         aa.is_correct, k.explanation
  from public.attempt_answers aa
  join public.questions q on q.id = aa.question_id
  left join public.question_keys k on k.question_id = q.id
  where aa.attempt_id = p_attempt_id
  order by q.position;
end;
$$;

revoke all on function
  public.start_attempt(uuid),
  public.save_answer(uuid, uuid, uuid[]),
  public.submit_attempt(uuid),
  public.attempt_review(uuid)
from public, anon;
grant execute on function
  public.start_attempt(uuid),
  public.save_answer(uuid, uuid, uuid[]),
  public.submit_attempt(uuid),
  public.attempt_review(uuid)
to authenticated;

-- ── Cierre automático con pg_cron ────────────────────────────────────────────
-- Cierra cada minuto los simuladores vencidos aunque el alumno no vuelva a entrar.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cerrar-intentos-vencidos',
  '* * * * *',
  $$ select app_private.close_expired_attempts() $$
);

-- cron.job_run_details no se limpia solo; se conserva una semana de historial.
select cron.schedule(
  'limpiar-historial-cron',
  '17 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);
