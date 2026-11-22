-- Permisos de reactivos por pregunta (#95). Las políticas de #28 solo revisaban
-- el rol: cualquier profesor podía tocar los reactivos de cualquier curso y el
-- alumno no podía leer la imagen o el audio de una pregunta. Ahora cada objeto
-- vive en reactivos/{id_pregunta}/{nombre} y hereda los permisos de la
-- evaluación de su pregunta (#30).

-- Id de la pregunta dueña del objeto. Una ruta que no empieza con un uuid no
-- pertenece a ninguna pregunta: devuelve null en lugar de romper la consulta.
create function app_private.question_of_object(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
      then split_part(object_name, '/', 1)::uuid
  end
$$;

-- Quien administra la evaluación ve toda la carpeta de la pregunta (para
-- revisar un archivo antes de usarlo); los demás, solo el archivo que la
-- pregunta usa y solo si pueden ver la evaluación.
create function app_private.reads_question_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = app_private.question_of_object(object_name)
      and (
        app_private.manages_evaluation(q.evaluation_id)
        or (q.media_path = object_name and app_private.can_see_evaluation(q.evaluation_id))
      )
  )
$$;

-- Sube, reemplaza o borra quien puede editar la evaluación, mientras no tenga
-- intentos: igual que el resto de la pregunta (CA024).
create function app_private.writes_question_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = app_private.question_of_object(object_name)
      and app_private.can_edit_evaluation(q.evaluation_id)
      and not exists (select 1 from public.attempts a where a.evaluation_id = q.evaluation_id)
  )
$$;

revoke all on function app_private.question_of_object(text) from public;
revoke all on function app_private.reads_question_object(text) from public;
revoke all on function app_private.writes_question_object(text) from public;
grant execute on function app_private.question_of_object(text) to authenticated;
grant execute on function app_private.reads_question_object(text) to authenticated;
grant execute on function app_private.writes_question_object(text) to authenticated;

drop policy "reactivos_select" on storage.objects;
drop policy "reactivos_insert" on storage.objects;
drop policy "reactivos_update" on storage.objects;
drop policy "reactivos_delete" on storage.objects;

create policy "reactivos_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'reactivos' and app_private.reads_question_object(name));

create policy "reactivos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'reactivos'
    and not app_private.is_executable_name(name)
    and app_private.writes_question_object(name)
  );

create policy "reactivos_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'reactivos' and app_private.writes_question_object(name))
  with check (
    bucket_id = 'reactivos'
    and not app_private.is_executable_name(name)
    and app_private.writes_question_object(name)
  );

create policy "reactivos_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reactivos' and app_private.writes_question_object(name));

-- La pregunta solo usa archivos de su propia carpeta: apuntar al de otra
-- pregunta heredaría su permiso de lectura.
alter table public.questions
  add constraint questions_media_path_own_folder
    check (media_path is null or split_part(media_path, '/', 1) = id::text);
