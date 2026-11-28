-- Guardar preguntas sin dejarlas a medias (#104). El editor guardaba enunciado,
-- opciones y clave en peticiones separadas: si algo fallaba a la mitad, o un
-- alumno empezaba en medio, la evaluación publicada quedaba con preguntas
-- incompletas. Ahora todo va en una transacción y se serializa con start_attempt.

-- CA024 con candado. FOR UPDATE choca con el FOR KEY SHARE que toma el insert
-- de attempts por su llave foránea, así que el primero en llegar gana:
-- - si el cambio llega primero, start_attempt espera y el intento ve la versión
--   nueva completa;
-- - si el intento llega primero, el cambio espera y luego ve el intento (cada
--   sentencia de plpgsql toma una foto nueva) y falla con CA024.
-- FOR NO KEY UPDATE no bastaría: no choca con FOR KEY SHARE.
create or replace function app_private.lock_questions_with_attempts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evaluations uuid[];
begin
  if tg_table_name = 'questions' then
    v_evaluations := array[old.evaluation_id, new.evaluation_id];
  else
    v_evaluations := array[
      app_private.evaluation_of_question(old.question_id),
      app_private.evaluation_of_question(new.question_id)
    ];
  end if;
  perform 1
  from public.evaluations e
  where e.id = any (v_evaluations)
  order by e.id
  for update;
  -- El join ignora la cascada de una evaluación borrada: ese caso lo frena el
  -- on delete restrict de attempts.
  if exists (
    select 1
    from public.attempts a
    join public.evaluations e on e.id = a.evaluation_id
    where a.evaluation_id = any (v_evaluations)
  ) then
    raise exception 'Esta evaluación ya tiene intentos; crea otra para corregirla.'
      using errcode = 'CA024';
  end if;
  return coalesce(new, old);
end;
$$;

-- Una evaluación publicada no se queda sin preguntas. El trigger se llama
-- questions_publicada_* para correr después de questions_lock_with_attempts
-- (orden alfabético): con el candado ya tomado, dos borrados al mismo tiempo
-- no pueden dejarla vacía. Al borrar una evaluación completa, su fila ya no
-- existe y la cascada pasa.
create function app_private.keep_published_questions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.evaluations e
    where e.id = old.evaluation_id and e.status = 'published'
  ) and not exists (
    select 1 from public.questions q
    where q.evaluation_id = old.evaluation_id and q.id <> old.id
  ) then
    raise exception 'Una evaluación publicada necesita al menos una pregunta.'
      using errcode = 'CA025';
  end if;
  return old;
end;
$$;

revoke all on function app_private.keep_published_questions() from public, authenticated;

create trigger questions_publicada_con_preguntas
before delete on public.questions
for each row
execute function app_private.keep_published_questions();

-- Agrega (p_question_id null) o reemplaza una pregunta completa: enunciado,
-- opciones en orden y clave. p_correct son los índices de p_options, desde 0.
-- SECURITY INVOKER: la RLS decide quién edita y los triggers de #30 validan
-- (CA021, CA024). Si algo falla, no queda nada a medias.
create function public.save_question(
  p_evaluation_id uuid,
  p_question_id uuid,
  p_prompt text,
  p_options text[],
  p_correct integer[],
  p_explanation text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_question uuid := p_question_id;
  v_option_ids uuid[];
begin
  if coalesce(cardinality(p_options), 0) < 2 then
    raise exception 'Cada pregunta necesita al menos dos opciones.' using errcode = 'CA020';
  end if;
  if coalesce(cardinality(p_correct), 0) = 0
    or exists (select 1 from unnest(p_correct) i where i is null or i < 0 or i >= cardinality(p_options))
  then
    raise exception 'Marca la respuesta correcta entre las opciones.' using errcode = 'CA021';
  end if;

  if v_question is null then
    -- Dos altas al mismo tiempo pueden tomar la misma posición: la segunda
    -- falla con 23505 y el editor pide recargar.
    insert into public.questions (evaluation_id, position, prompt)
    values (
      p_evaluation_id,
      (select coalesce(max(q.position) + 1, 0) from public.questions q where q.evaluation_id = p_evaluation_id),
      p_prompt
    )
    returning id into v_question;
  else
    update public.questions
    set prompt = p_prompt
    where id = v_question and evaluation_id = p_evaluation_id;
    if not found then
      raise exception 'No tienes permiso para cambiar esta pregunta.' using errcode = '42501';
    end if;
    delete from public.question_options where question_id = v_question;
  end if;

  with insertadas as (
    insert into public.question_options (question_id, position, body)
    select v_question, o.ord - 1, o.body
    from unnest(p_options) with ordinality as o(body, ord)
    returning id, position
  )
  select array_agg(id order by position) into v_option_ids from insertadas;

  insert into public.question_keys (question_id, correct_option_ids, explanation)
  values (
    v_question,
    array(select v_option_ids[i + 1] from unnest(p_correct) i),
    nullif(btrim(p_explanation), '')
  )
  on conflict (question_id) do update
    set correct_option_ids = excluded.correct_option_ids,
        explanation = excluded.explanation;

  return v_question;
end;
$$;

revoke all on function public.save_question(uuid, uuid, text, text[], integer[], text) from public, anon;
grant execute on function public.save_question(uuid, uuid, text, text[], integer[], text) to authenticated;
