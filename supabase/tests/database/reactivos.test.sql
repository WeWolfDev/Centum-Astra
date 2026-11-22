-- Permisos de reactivos por pregunta (#95). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
-- Storage bloquea los DELETE directos; en la prueba se permiten para
-- revisar la política de borrado.
set local storage.allow_delete_query = 'true';

select plan(18);

-- Mismo helper que storage.test.sql: sube o reemplaza como la API.
create function pg_temp.subir(bucket text, ruta text, mime text, tamano bigint)
returns void language plpgsql as $$
begin
  update storage.objects
  set metadata = jsonb_build_object('mimetype', mime, 'size', tamano),
      version = gen_random_uuid()::text
  where bucket_id = bucket and name = ruta;
  if not found then
    insert into storage.objects (bucket_id, name, owner, metadata, version)
    values (bucket, ruta, (select auth.uid()),
            jsonb_build_object('mimetype', mime, 'size', tamano), gen_random_uuid()::text);
  end if;
end;
$$;
grant execute on function pg_temp.subir(text, text, text, bigint) to authenticated;

create function pg_temp.como(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', usuario)::text, true)
$$;
grant execute on function pg_temp.como(text) to authenticated;

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso 1 · 3 profesor del curso 2
-- 4 alumno con el módulo habilitado · 5 alumno sin el módulo
insert into auth.users (id, email) values
  ('a7000000-0000-0000-0000-000000000001', 'admin@reactivos.mx'),
  ('a7000000-0000-0000-0000-000000000002', 'profe1@reactivos.mx'),
  ('a7000000-0000-0000-0000-000000000003', 'profe2@reactivos.mx'),
  ('a7000000-0000-0000-0000-000000000004', 'alumno1@reactivos.mx'),
  ('a7000000-0000-0000-0000-000000000005', 'alumno2@reactivos.mx');
insert into public.profiles (id, email, full_name, role, status) values
  ('a7000000-0000-0000-0000-000000000001', 'admin@reactivos.mx', 'Admin', 'admin', 'active'),
  ('a7000000-0000-0000-0000-000000000002', 'profe1@reactivos.mx', 'Profe 1', 'teacher', 'active'),
  ('a7000000-0000-0000-0000-000000000003', 'profe2@reactivos.mx', 'Profe 2', 'teacher', 'active'),
  ('a7000000-0000-0000-0000-000000000004', 'alumno1@reactivos.mx', 'Alumno 1', 'student', 'active'),
  ('a7000000-0000-0000-0000-000000000005', 'alumno2@reactivos.mx', 'Alumno 2', 'student', 'active');

insert into public.courses (id, name) values
  ('a7100000-0000-0000-0000-000000000001', 'Curso 1'),
  ('a7100000-0000-0000-0000-000000000002', 'Curso 2');
insert into public.groups (id, course_id, name, code) values
  ('a7200000-0000-0000-0000-000000000001', 'a7100000-0000-0000-0000-000000000001', 'Con módulo', 'RG1'),
  ('a7200000-0000-0000-0000-000000000002', 'a7100000-0000-0000-0000-000000000001', 'Sin módulo', 'RG2'),
  ('a7200000-0000-0000-0000-000000000003', 'a7100000-0000-0000-0000-000000000002', 'Otro curso', 'RG3');
insert into public.group_teachers (group_id, teacher_id) values
  ('a7200000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000002'),
  ('a7200000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000003');
insert into public.group_students (group_id, student_id) values
  ('a7200000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000004'),
  ('a7200000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000005');
insert into public.modules (id, course_id, title) values
  ('a7300000-0000-0000-0000-000000000001', 'a7100000-0000-0000-0000-000000000001', 'Matemático');
insert into public.group_modules (group_id, module_id, course_id) values
  ('a7200000-0000-0000-0000-000000000001', 'a7300000-0000-0000-0000-000000000001', 'a7100000-0000-0000-0000-000000000001');

-- Quiz 1 sin intentos (preguntas 11 y 12) y quiz 2 con un intento (pregunta 21),
-- los dos del profesor 1 y publicados.
insert into public.evaluations (id, course_id, module_id, kind, title, created_by) values
  ('a7500000-0000-0000-0000-000000000001', 'a7100000-0000-0000-0000-000000000001', 'a7300000-0000-0000-0000-000000000001', 'quiz', 'Quiz 1', 'a7000000-0000-0000-0000-000000000002'),
  ('a7500000-0000-0000-0000-000000000002', 'a7100000-0000-0000-0000-000000000001', 'a7300000-0000-0000-0000-000000000001', 'quiz', 'Quiz 2', 'a7000000-0000-0000-0000-000000000002');
insert into public.questions (id, evaluation_id, position, prompt, media_kind, media_path) values
  ('a7600000-0000-0000-0000-000000000011', 'a7500000-0000-0000-0000-000000000001', 0, 'Con imagen', 'image', 'a7600000-0000-0000-0000-000000000011/figura.png'),
  ('a7600000-0000-0000-0000-000000000012', 'a7500000-0000-0000-0000-000000000001', 1, 'Sin imagen', null, null),
  ('a7600000-0000-0000-0000-000000000021', 'a7500000-0000-0000-0000-000000000002', 0, 'Con audio', 'audio', 'a7600000-0000-0000-0000-000000000021/audio.mp3');
insert into public.question_options (id, question_id, position, body) values
  ('a7700000-0000-0000-0000-000000000111', 'a7600000-0000-0000-0000-000000000011', 0, 'A'),
  ('a7700000-0000-0000-0000-000000000112', 'a7600000-0000-0000-0000-000000000011', 1, 'B'),
  ('a7700000-0000-0000-0000-000000000121', 'a7600000-0000-0000-0000-000000000012', 0, 'A'),
  ('a7700000-0000-0000-0000-000000000122', 'a7600000-0000-0000-0000-000000000012', 1, 'B'),
  ('a7700000-0000-0000-0000-000000000211', 'a7600000-0000-0000-0000-000000000021', 0, 'A'),
  ('a7700000-0000-0000-0000-000000000212', 'a7600000-0000-0000-0000-000000000021', 1, 'B');
insert into public.question_keys (question_id, correct_option_ids) values
  ('a7600000-0000-0000-0000-000000000011', array['a7700000-0000-0000-0000-000000000111']::uuid[]),
  ('a7600000-0000-0000-0000-000000000012', array['a7700000-0000-0000-0000-000000000121']::uuid[]),
  ('a7600000-0000-0000-0000-000000000021', array['a7700000-0000-0000-0000-000000000211']::uuid[]);
update public.evaluations set status = 'published'
where id in ('a7500000-0000-0000-0000-000000000001', 'a7500000-0000-0000-0000-000000000002');

-- Objetos: la imagen y el audio que usan las preguntas, y un borrador sin usar.
select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000011/figura.png', 'image/png', 100);
select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000011/borrador.png', 'image/png', 100);
select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000021/audio.mp3', 'audio/mpeg', 100);

insert into public.attempts (evaluation_id, student_id, status, finished_at, total_questions, correct_count, percent, duration_seconds)
values ('a7500000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000004', 'submitted', now(), 1, 1, 100, 60);

-- ── Integridad ───────────────────────────────────────────────────────────────
select throws_ok(
  $$ update public.questions set media_kind = 'image', media_path = 'a7600000-0000-0000-0000-000000000011/figura.png'
     where id = 'a7600000-0000-0000-0000-000000000012' $$,
  '23514', null, 'una pregunta no apunta al archivo de otra pregunta'
);

-- ── Profesor del curso ───────────────────────────────────────────────────────
select pg_temp.como('a7000000-0000-0000-0000-000000000002');
set local role authenticated;
select lives_ok(
  $$ select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000012/nueva.png', 'image/png', 1) $$,
  'el profesor sube una imagen a una pregunta de su evaluación'
);
select lives_ok(
  $$ select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000011/figura.png', 'image/png', 2) $$,
  'el profesor reemplaza la imagen de su pregunta'
);
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'reactivos' and name = 'a7600000-0000-0000-0000-000000000011/borrador.png' $$,
  'el profesor ve en la carpeta de su pregunta un archivo que todavía no usa'
);
select throws_ok(
  $$ select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000021/audio.mp3', 'audio/mpeg', 2) $$,
  '42501', null, 'con intentos, el profesor no reemplaza el audio de la pregunta'
);
select throws_ok(
  $$ select pg_temp.subir('reactivos', 'sin-pregunta/x.png', 'image/png', 1) $$,
  '42501', null, 'una ruta que no es de ninguna pregunta se rechaza'
);
reset role;

-- ── Profesor de otro curso ───────────────────────────────────────────────────
select pg_temp.como('a7000000-0000-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$ select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000012/ajena.png', 'image/png', 1) $$,
  '42501', null, 'el profesor de otro curso no sube reactivos'
);
select is_empty(
  $$ delete from storage.objects where bucket_id = 'reactivos'
     and name = 'a7600000-0000-0000-0000-000000000011/figura.png' returning name $$,
  'el profesor de otro curso no borra reactivos'
);
select is_empty(
  $$ update storage.objects set metadata = '{"mimetype": "image/png", "size": 9}'
     where bucket_id = 'reactivos' and name = 'a7600000-0000-0000-0000-000000000011/figura.png' returning name $$,
  'el profesor de otro curso no reemplaza un reactivo existente'
);
select is_empty(
  $$ select name from storage.objects where bucket_id = 'reactivos' $$,
  'el profesor de otro curso no ve los reactivos'
);
reset role;

-- ── Alumno con el módulo habilitado ──────────────────────────────────────────
select pg_temp.como('a7000000-0000-0000-0000-000000000004');
set local role authenticated;
select results_eq(
  $$ select name from storage.objects where bucket_id = 'reactivos' order by name $$,
  $$ values ('a7600000-0000-0000-0000-000000000011/figura.png'::text), ('a7600000-0000-0000-0000-000000000021/audio.mp3') $$,
  'el alumno ve solo la imagen y el audio que usan las preguntas que puede ver'
);
select throws_ok(
  $$ select pg_temp.subir('reactivos', 'a7600000-0000-0000-0000-000000000012/mia.png', 'image/png', 1) $$,
  '42501', null, 'el alumno no sube reactivos'
);
select is_empty(
  $$ delete from storage.objects where bucket_id = 'reactivos'
     and name = 'a7600000-0000-0000-0000-000000000011/figura.png' returning name $$,
  'el alumno no borra reactivos'
);
select is_empty(
  $$ update storage.objects set metadata = '{"mimetype": "image/png", "size": 9}'
     where bucket_id = 'reactivos' and name = 'a7600000-0000-0000-0000-000000000011/figura.png' returning name $$,
  'el alumno no reemplaza un reactivo que sí puede ver'
);
reset role;

-- ── Alumno sin el módulo ─────────────────────────────────────────────────────
select pg_temp.como('a7000000-0000-0000-0000-000000000005');
set local role authenticated;
select is_empty(
  $$ select name from storage.objects where bucket_id = 'reactivos' $$,
  'el alumno sin el módulo no ve los reactivos'
);
reset role;

select is(
  (select (metadata ->> 'size')::integer from storage.objects
   where bucket_id = 'reactivos' and name = 'a7600000-0000-0000-0000-000000000011/figura.png'),
  2,
  'los reemplazos rechazados no cambiaron el archivo'
);

-- ── Administrador ────────────────────────────────────────────────────────────
select pg_temp.como('a7000000-0000-0000-0000-000000000001');
set local role authenticated;
select is_empty(
  $$ delete from storage.objects where bucket_id = 'reactivos'
     and name = 'a7600000-0000-0000-0000-000000000021/audio.mp3' returning name $$,
  'con intentos, ni el administrador borra el audio de la pregunta'
);
select isnt_empty(
  $$ delete from storage.objects where bucket_id = 'reactivos'
     and name = 'a7600000-0000-0000-0000-000000000011/borrador.png' returning name $$,
  'el administrador borra un reactivo de una evaluación sin intentos'
);
reset role;

select * from finish();
rollback;
