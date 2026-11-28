-- Imagen propia de cada módulo. Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
-- Storage bloquea los DELETE directos; en la prueba se permiten para
-- revisar la política de borrado.
set local storage.allow_delete_query = 'true';

select plan(11);

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

-- 1 admin · 2 profesor · 3 alumno
insert into auth.users (id, email) values
  ('d1000000-0000-0000-0000-000000000001', 'admin@modimg.mx'),
  ('d1000000-0000-0000-0000-000000000002', 'profe@modimg.mx'),
  ('d1000000-0000-0000-0000-000000000003', 'alumno@modimg.mx');
insert into public.profiles (id, email, full_name, role, status) values
  ('d1000000-0000-0000-0000-000000000001', 'admin@modimg.mx', 'Admin', 'admin', 'active'),
  ('d1000000-0000-0000-0000-000000000002', 'profe@modimg.mx', 'Profe', 'teacher', 'active'),
  ('d1000000-0000-0000-0000-000000000003', 'alumno@modimg.mx', 'Alumno', 'student', 'active');
insert into public.courses (id, name) values ('d1100000-0000-0000-0000-000000000001', 'Curso imágenes');
insert into public.modules (id, course_id, title, position) values
  ('d1300000-0000-0000-0000-000000000001', 'd1100000-0000-0000-0000-000000000001', 'Química', 0);

select ok(
  (select public from storage.buckets where id = 'modulos'),
  'el bucket de imágenes de módulos es de lectura pública'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'modulos'),
  array['image/jpeg', 'image/png', 'image/webp'],
  'solo acepta JPG, PNG y WebP'
);

-- ── Administrador ────────────────────────────────────────────────────────────
select pg_temp.como('d1000000-0000-0000-0000-000000000001');
set local role authenticated;
select lives_ok(
  $$ select pg_temp.subir('modulos', 'd1300000-0000-0000-0000-000000000001/1.png', 'image/png', 100) $$,
  'el administrador sube la imagen'
);
select lives_ok(
  $$ update public.modules set image_path = 'd1300000-0000-0000-0000-000000000001/1.png'
     where id = 'd1300000-0000-0000-0000-000000000001' $$,
  'el administrador guarda la ruta en el módulo'
);
select throws_ok(
  $$ update public.modules set image_path = 'otro-modulo/1.png'
     where id = 'd1300000-0000-0000-0000-000000000001' $$,
  '23514', null,
  'la ruta debe estar en la carpeta del propio módulo'
);
reset role;

-- ── Profesor y alumno ────────────────────────────────────────────────────────
select pg_temp.como('d1000000-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok(
  $$ select pg_temp.subir('modulos', 'd1300000-0000-0000-0000-000000000001/2.png', 'image/png', 100) $$,
  '42501', null,
  'el profesor no sube imágenes de módulos'
);
select throws_ok(
  $$ select pg_temp.subir('modulos', 'd1300000-0000-0000-0000-000000000001/1.png', 'image/png', 200) $$,
  '42501', null,
  'el profesor no reemplaza la imagen'
);
delete from storage.objects where bucket_id = 'modulos';
reset role;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'modulos'), 1,
  'el profesor no borra la imagen'
);

select pg_temp.como('d1000000-0000-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$ select pg_temp.subir('modulos', 'd1300000-0000-0000-0000-000000000001/3.png', 'image/png', 100) $$,
  '42501', null,
  'el alumno no sube imágenes de módulos'
);
reset role;

select pg_temp.como('d1000000-0000-0000-0000-000000000001');
set local role authenticated;
delete from storage.objects where bucket_id = 'modulos' and name = 'd1300000-0000-0000-0000-000000000001/1.png';
reset role;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'modulos'), 0,
  'el administrador borra la imagen'
);

set local role anon;
select throws_ok(
  $$ select pg_temp.subir('modulos', 'd1300000-0000-0000-0000-000000000001/4.png', 'image/png', 100) $$,
  '42501', null,
  'sin sesión no se sube nada'
);
reset role;

select * from finish();
rollback;
