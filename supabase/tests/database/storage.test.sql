-- Storage privado (#28). Ejecutar con `supabase test db`.
-- Las cargas se simulan insertando en storage.objects con el rol de cada
-- persona: son las mismas políticas que aplica la API de Storage.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
-- Storage bloquea los DELETE directos; en la prueba se permiten para
-- revisar la política de borrado.
set local storage.allow_delete_query = 'true';

select plan(37);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor del curso · 3 profesor de otro curso · 4 alumno · 5 alumno de otro curso
insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'admin@storage.mx'),
  ('e0000000-0000-0000-0000-000000000002', 'profe@storage.mx'),
  ('e0000000-0000-0000-0000-000000000003', 'otro@storage.mx'),
  ('e0000000-0000-0000-0000-000000000004', 'alumno@storage.mx'),
  ('e0000000-0000-0000-0000-000000000005', 'ajeno@storage.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('e0000000-0000-0000-0000-000000000001', 'admin@storage.mx', 'Admin', 'admin', 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'profe@storage.mx', 'Profe', 'teacher', 'active'),
  ('e0000000-0000-0000-0000-000000000003', 'otro@storage.mx', 'Otro', 'teacher', 'active'),
  ('e0000000-0000-0000-0000-000000000004', 'alumno@storage.mx', 'Alumno', 'student', 'active'),
  ('e0000000-0000-0000-0000-000000000005', 'ajeno@storage.mx', 'Ajeno', 'student', 'active');

insert into public.courses (id, name) values
  ('e1000000-0000-0000-0000-000000000001', 'Curso'),
  ('e1000000-0000-0000-0000-000000000002', 'Otro curso');
insert into public.groups (id, course_id, name, code) values
  ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Grupo', 'SG'),
  ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Otro', 'SO');
insert into public.group_teachers (group_id, teacher_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003');
insert into public.group_students (group_id, student_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004'),
  ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005');
insert into public.modules (id, course_id, title) values
  ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Matemático');
insert into public.group_modules (group_id, module_id, course_id) values
  ('e2000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
insert into public.sessions (id, module_id, title, position) values
  ('e4000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'Clase 1', 0);

-- Sube o reemplaza un objeto como lo haría la API (cada carga trae otra versión).
create function pg_temp.subir(bucket text, ruta text, mime text, tamano bigint)
returns void language sql as $$
  insert into storage.objects (bucket_id, name, owner, metadata, version)
  values (bucket, ruta, (select auth.uid()),
          jsonb_build_object('mimetype', mime, 'size', tamano), gen_random_uuid()::text)
  on conflict (bucket_id, name) where not is_versioned
  do update set metadata = excluded.metadata, version = excluded.version
$$;
grant execute on function pg_temp.subir(text, text, text, bigint) to authenticated;

create function pg_temp.como(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', usuario)::text, true)
$$;
grant execute on function pg_temp.como(text) to authenticated;

-- ── Buckets ──────────────────────────────────────────────────────────────────
select results_eq(
  $$ select id, public, file_size_limit from storage.buckets
     where id in ('materiales', 'reactivos', 'terminos') order by id $$,
  $$ values ('materiales'::text, false, 52428800::bigint),
            ('reactivos', false, 52428800::bigint),
            ('terminos', false, 52428800::bigint) $$,
  'los tres buckets son privados y aceptan hasta 50 MB'
);

-- ── Profesor del curso: borrador, carga y publicación ────────────────────────
select pg_temp.como('e0000000-0000-0000-0000-000000000002');
set local role authenticated;

select lives_ok(
  $$ insert into public.materials (id, session_id, title, kind, storage_path, status, created_by) values
     ('e5000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 'Guía',
      'document', 'e5000000-0000-0000-0000-000000000001/guia.pdf', 'draft',
      'e0000000-0000-0000-0000-000000000002') $$,
  'el profesor registra el borrador del documento'
);
select throws_ok(
  $$ insert into public.materials (session_id, title, kind, storage_path, status, created_by) values
     ('e4000000-0000-0000-0000-000000000001', 'Ruta ajena', 'document',
      'e5000000-0000-0000-0000-000000000009/x.pdf', 'draft', 'e0000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'la ruta debe empezar con el id del propio material'
);
select throws_ok(
  $$ update public.materials set status = 'published',
       published_by = 'e0000000-0000-0000-0000-000000000002', published_at = now()
     where id = 'e5000000-0000-0000-0000-000000000001' $$,
  'CA002', null, 'el material no se publica antes de confirmar el archivo'
);
select throws_ok(
  $$ select public.confirm_material_file('e5000000-0000-0000-0000-000000000001', true) $$,
  'CA002', null, 'no se confirma un archivo que no se ha subido'
);
select throws_ok(
  $$ update public.materials set file_version = 5 where id = 'e5000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'el profesor no escribe los metadatos del archivo a mano'
);
select lives_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000001/guia.pdf', 'application/pdf', 1024) $$,
  'el profesor sube el archivo de su material'
);
select throws_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000099/otro.pdf', 'application/pdf', 1) $$,
  '42501', null, 'no se sube un archivo sin material que lo respalde'
);
select results_eq(
  $$ select status, file_version, file_name, file_size, mime_type
     from public.confirm_material_file('e5000000-0000-0000-0000-000000000001', true) $$,
  $$ values ('published'::text, 1, 'guia.pdf'::text, 1024::bigint, 'application/pdf'::text) $$,
  'al confirmar se guardan los metadatos y se publica'
);
select is(
  (select file_version from public.confirm_material_file('e5000000-0000-0000-0000-000000000001')),
  1, 'confirmar de nuevo sin subir no cuenta como reemplazo'
);

-- Ejecutables: por extensión en la carga y por tipo al confirmar.
insert into public.materials (id, session_id, title, kind, storage_path, status, created_by) values
  ('e5000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000001', 'Comprimido',
   'document', 'e5000000-0000-0000-0000-000000000002/tareas.zip', 'draft',
   'e0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ insert into public.materials (id, session_id, title, kind, storage_path, status, created_by) values
     ('e5000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000001', 'Programa',
      'document', 'e5000000-0000-0000-0000-000000000003/setup.EXE', 'draft',
      'e0000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'un material con nombre de ejecutable se rechaza'
);
select lives_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000002/tareas.zip', 'application/zip', 2048) $$,
  'un archivo comprimido sí se acepta'
);
select is(
  app_private.is_executable_name('e5000000-0000-0000-0000-000000000002/instalador.msi'), true,
  'la extensión .msi cuenta como ejecutable'
);
reset role;
-- Un ejecutable disfrazado de .zip: el tipo real lo delata al confirmar.
update storage.objects set metadata = jsonb_build_object('mimetype', 'application/x-msdownload', 'size', 10)
where name = 'e5000000-0000-0000-0000-000000000002/tareas.zip';
set local role authenticated;
select throws_ok(
  $$ select public.confirm_material_file('e5000000-0000-0000-0000-000000000002', true) $$,
  'CA003', null, 'un archivo con tipo ejecutable no se confirma'
);
select throws_ok(
  $$ select pg_temp.subir('reactivos', 'e6000000-0000-0000-0000-000000000001/virus.exe', 'image/png', 1) $$,
  '42501', null, 'tampoco se suben ejecutables a reactivos'
);
reset role;

-- ── Profesor de otro curso ───────────────────────────────────────────────────
select pg_temp.como('e0000000-0000-0000-0000-000000000003');
set local role authenticated;
select is_empty(
  $$ select name from storage.objects where bucket_id = 'materiales' $$,
  'el profesor de otro curso no lee los archivos'
);
select throws_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000001/guia.pdf', 'application/pdf', 1) $$,
  '42501', null, 'el profesor de otro curso no reemplaza el archivo'
);
select throws_ok(
  $$ select public.confirm_material_file('e5000000-0000-0000-0000-000000000001', true) $$,
  '42501', null, 'el profesor de otro curso no confirma el archivo'
);
reset role;

-- ── Alumno: lectura y apertura ───────────────────────────────────────────────
select pg_temp.como('e0000000-0000-0000-0000-000000000004');
set local role authenticated;
select results_eq(
  $$ select name from storage.objects where bucket_id = 'materiales' $$,
  $$ values ('e5000000-0000-0000-0000-000000000001/guia.pdf'::text) $$,
  'el alumno solo lee el archivo publicado de su módulo'
);
select throws_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000001/guia.pdf', 'application/pdf', 1) $$,
  '42501', null, 'el alumno no sube ni reemplaza material'
);
select is(
  public.open_material_file('e5000000-0000-0000-0000-000000000001'),
  'e5000000-0000-0000-0000-000000000001/guia.pdf',
  'abrir el archivo devuelve su ruta y registra la apertura'
);
select is_empty($$ select * from public.my_material_notices() $$, 'sin cambios no hay aviso');
reset role;

select pg_temp.como('e0000000-0000-0000-0000-000000000005');
set local role authenticated;
select is_empty(
  $$ select name from storage.objects where bucket_id = 'materiales' $$,
  'el alumno de otro curso no lee los archivos'
);
select throws_ok(
  $$ select public.open_material_file('e5000000-0000-0000-0000-000000000001') $$,
  'CA004', null, 'el alumno de otro curso no abre el archivo'
);
reset role;

-- ── Reemplazo ────────────────────────────────────────────────────────────────
-- La apertura queda en el pasado para que el reemplazo sea posterior.
update public.material_views set last_opened_at = now() - interval '1 minute';

select pg_temp.como('e0000000-0000-0000-0000-000000000002');
set local role authenticated;
select lives_ok(
  $$ select pg_temp.subir('materiales', 'e5000000-0000-0000-0000-000000000001/guia.pdf', 'application/pdf', 4096) $$,
  'el profesor reemplaza el archivo en la misma ubicación'
);
select is(
  (select file_version from public.confirm_material_file('e5000000-0000-0000-0000-000000000001')),
  2, 'el reemplazo confirmado aumenta la versión'
);
select throws_ok(
  $$ update public.materials set storage_path = 'e5000000-0000-0000-0000-000000000001/nueva.pdf'
     where id = 'e5000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'el reemplazo conserva nombre y ubicación'
);
-- La RLS de DELETE no lanza error: filtra la fila y no borra nada.
delete from storage.objects where name = 'e5000000-0000-0000-0000-000000000001/guia.pdf';
select isnt_empty(
  $$ select name from storage.objects where name = 'e5000000-0000-0000-0000-000000000001/guia.pdf' $$,
  'el profesor no borra el archivo de material publicado'
);
reset role;

select is(
  (select count(*)::int from storage.objects where name = 'e5000000-0000-0000-0000-000000000001/guia.pdf'),
  1, 'después del reemplazo solo existe el archivo nuevo'
);

select pg_temp.como('e0000000-0000-0000-0000-000000000004');
set local role authenticated;
select results_eq(
  $$ select title, change from public.my_material_notices() $$,
  $$ values ('Guía'::text, 'replaced'::text) $$,
  'el alumno que abrió la versión anterior ve el aviso de reemplazo'
);
select public.dismiss_material_notice('e5000000-0000-0000-0000-000000000001');
select is_empty($$ select * from public.my_material_notices() $$, 'el aviso desaparece al cerrarlo');
reset role;

-- now() no avanza dentro de la transacción: el cierre del aviso queda en el pasado.
update public.material_views set notice_dismissed_at = now() - interval '30 seconds';

-- ── Administrador: retiro y borrado ──────────────────────────────────────────
select pg_temp.como('e0000000-0000-0000-0000-000000000001');
set local role authenticated;
update public.materials set status = 'archived' where id = 'e5000000-0000-0000-0000-000000000001';
select lives_ok(
  $$ delete from storage.objects where name = 'e5000000-0000-0000-0000-000000000001/guia.pdf' $$,
  'el administrador borra el archivo del material retirado'
);
reset role;

select pg_temp.como('e0000000-0000-0000-0000-000000000004');
set local role authenticated;
select results_eq(
  $$ select title, change from public.my_material_notices() $$,
  $$ values ('Guía'::text, 'deleted'::text) $$,
  'el alumno que lo había abierto ve el aviso de borrado'
);
reset role;

-- ── Términos firmados ────────────────────────────────────────────────────────
select pg_temp.como('e0000000-0000-0000-0000-000000000004');
set local role authenticated;
select lives_ok(
  $$ select pg_temp.subir('terminos', 'e0000000-0000-0000-0000-000000000004/firma.pdf', 'application/pdf', 500) $$,
  'el alumno sube sus términos firmados en su carpeta'
);
select throws_ok(
  $$ select pg_temp.subir('terminos', 'e0000000-0000-0000-0000-000000000005/firma.pdf', 'application/pdf', 500) $$,
  '42501', null, 'el alumno no sube en la carpeta de otro'
);
reset role;

select pg_temp.como('e0000000-0000-0000-0000-000000000002');
set local role authenticated;
select is_empty(
  $$ select name from storage.objects where bucket_id = 'terminos' $$,
  'el profesor no ve los términos firmados'
);
reset role;

select pg_temp.como('e0000000-0000-0000-0000-000000000001');
set local role authenticated;
select results_eq(
  $$ select name from storage.objects where bucket_id = 'terminos' $$,
  $$ values ('e0000000-0000-0000-0000-000000000004/firma.pdf'::text) $$,
  'el administrador ve los términos firmados'
);
reset role;

select * from finish();
rollback;
