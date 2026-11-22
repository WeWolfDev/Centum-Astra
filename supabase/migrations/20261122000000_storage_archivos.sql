-- Storage privado (#28): documentos e imágenes del material, imágenes y audio
-- de reactivos y términos firmados. Decisiones del cliente (1.9 y 1.10):
-- 50 MB por archivo, cualquier formato salvo ejecutables, el reemplazo
-- conserva nombre y ubicación y se avisa a quien abrió la versión anterior.
--
-- Rutas de los objetos:
--   materiales/{material_id}/{nombre}   ligado a public.materials.storage_path
--   reactivos/{pregunta_id}/{nombre}    la tabla de preguntas llega con #30
--   terminos/{alumno_id}/{nombre}       la tabla de términos llega con #62

-- ── Buckets ──────────────────────────────────────────────────────────────────
-- versioning_status queda en DISABLED (valor por omisión): al reemplazar un
-- objeto el anterior desaparece, como pidió el cliente.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('materiales', 'materiales', false, 52428800, null),
  ('reactivos', 'reactivos', false, 52428800, array['image/*', 'audio/*']),
  ('terminos', 'terminos', false, 52428800, array['image/*', 'application/pdf']);

-- ── Ejecutables ──────────────────────────────────────────────────────────────
-- La extensión se revisa en la política de carga; el tipo declarado, al
-- confirmar el archivo. Un .zip se acepta aunque no se pueda revisar su interior.
-- Windows quita los puntos y espacios finales al guardar: `virus.exe.` termina
-- como `virus.exe`, así que se ignoran antes de leer la extensión.
create function app_private.is_executable_name(object_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    lower(substring(rtrim(object_name, '. ') from '\.([^./]+)$')) = any (array[
      'exe', 'msi', 'msp', 'msix', 'msixbundle', 'appx', 'appxbundle', 'bat', 'cmd',
      'com', 'scr', 'pif', 'cpl', 'gadget', 'hta', 'lnk', 'scf', 'reg', 'ps1', 'psm1',
      'vbs', 'vbe', 'js', 'jse', 'ws', 'wsf', 'wsh', 'sh', 'bash', 'command', 'app',
      'dmg', 'pkg', 'deb', 'rpm', 'apk', 'jar', 'dll', 'so', 'elf', 'run', 'bin'
    ]),
    false
  )
$$;

create function app_private.is_executable_mime(mime text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(lower(mime) = any (array[
    'application/x-msdownload', 'application/x-msdos-program', 'application/x-msi',
    'application/vnd.microsoft.portable-executable', 'application/x-dosexec',
    'application/x-executable', 'application/x-elf', 'application/x-sharedlib',
    'application/x-sh', 'application/x-csh', 'application/x-bat',
    'application/java-archive', 'application/x-java-archive',
    'application/vnd.android.package-archive', 'application/x-apple-diskimage',
    'application/x-newton-compatible-pkg', 'application/vnd.debian.binary-package',
    'application/x-rpm', 'application/hta', 'application/x-ms-shortcut',
    'application/x-ms-installer', 'application/msix', 'application/appx'
  ]), false)
$$;

-- ── Metadatos del archivo en la tabla de material ───────────────────────────
-- file_version cuenta las cargas confirmadas: 0 significa que el archivo aún
-- no se confirma y el material no puede publicarse.
alter table public.materials
  add column file_name text,
  add column file_size bigint check (file_size is null or file_size between 0 and 52428800),
  add column mime_type text,
  add column file_version integer not null default 0 check (file_version >= 0),
  add column file_object_version text,
  add column file_uploaded_at timestamptz,
  add column file_changed_at timestamptz,
  -- La ruta empieza con el id del material: una fila no puede apuntar al
  -- archivo de otra y heredar su permiso de lectura.
  add constraint materials_storage_path_own_folder check (
    storage_path is null or split_part(storage_path, '/', 1) = id::text
  ),
  add constraint materials_storage_path_not_executable check (
    storage_path is null or not app_private.is_executable_name(storage_path)
  );

-- Los metadatos solo los escribe confirm_material_file; desde la Data API el
-- rol es authenticated y dentro de la función SECURITY DEFINER es su dueño.
create function app_private.guard_material_file()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.file_version <> 0 or new.file_name is not null or new.file_size is not null
        or new.mime_type is not null or new.file_object_version is not null
        or new.file_uploaded_at is not null or new.file_changed_at is not null
      then
        raise exception 'Los datos del archivo se registran al confirmar la carga.'
          using errcode = '42501';
      end if;
    elsif (new.file_version, new.file_name, new.file_size, new.mime_type,
           new.file_object_version, new.file_uploaded_at, new.file_changed_at)
        is distinct from
          (old.file_version, old.file_name, old.file_size, old.mime_type,
           old.file_object_version, old.file_uploaded_at, old.file_changed_at)
    then
      raise exception 'Los datos del archivo se registran al confirmar la carga.'
        using errcode = '42501';
    end if;
  end if;

  -- El reemplazo conserva nombre y ubicación.
  if tg_op = 'UPDATE' and new.storage_path is distinct from old.storage_path then
    raise exception 'La ubicación del archivo no cambia; reemplázalo en su lugar.'
      using errcode = '42501';
  end if;

  if new.kind in ('document', 'image') and new.status = 'published' and new.file_version = 0 then
    raise exception 'El material se publica después de confirmar la carga del archivo.'
      using errcode = 'CA002';
  end if;

  -- Retirar material con archivo genera el aviso para quien ya lo abrió.
  if tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived'
    and new.kind in ('document', 'image')
  then
    new.file_changed_at := now();
  end if;

  return new;
end;
$$;

revoke all on function app_private.guard_material_file() from public, authenticated;

create trigger materials_guard_file
before insert or update on public.materials
for each row
execute function app_private.guard_material_file();

-- ── Permisos sobre el archivo de un material ─────────────────────────────────
-- Igual que en la tabla: el administrador todo; el profesor del curso sube y
-- reemplaza el archivo del material que creó.
create function app_private.manages_material_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.storage_path = object_name
      and m.kind in ('document', 'image')
      and m.status <> 'archived'
      and (
        app_private.is_admin()
        or (
          m.created_by = (select auth.uid())
          and app_private.teaches_course(app_private.course_of_session(m.session_id))
        )
      )
  )
$$;

-- El profesor solo borra el archivo de su borrador; lo publicado lo retira el
-- administrador (#49).
create function app_private.deletes_material_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_admin()
    or exists (
      select 1
      from public.materials m
      where m.storage_path = object_name
        and m.status = 'draft'
        and m.created_by = (select auth.uid())
        and app_private.teaches_course(app_private.course_of_session(m.session_id))
    )
$$;

revoke all on function app_private.is_executable_name(text) from public;
revoke all on function app_private.is_executable_mime(text) from public;
revoke all on function app_private.manages_material_object(text) from public;
revoke all on function app_private.deletes_material_object(text) from public;
grant execute on function app_private.is_executable_name(text) to authenticated;
grant execute on function app_private.is_executable_mime(text) to authenticated;
grant execute on function app_private.manages_material_object(text) to authenticated;
grant execute on function app_private.deletes_material_object(text) to authenticated;

-- ── Políticas de storage.objects: materiales ─────────────────────────────────
-- La lectura reutiliza la RLS de materials: quien ve la fila ve su archivo.
-- Así el alumno solo descarga material publicado de sus módulos.
create policy "materiales_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'materiales'
    and exists (select 1 from public.materials m where m.storage_path = name)
  );

create policy "materiales_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materiales'
    and not app_private.is_executable_name(name)
    and app_private.manages_material_object(name)
  );

create policy "materiales_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materiales' and app_private.manages_material_object(name))
  with check (
    bucket_id = 'materiales'
    and not app_private.is_executable_name(name)
    and app_private.manages_material_object(name)
  );

create policy "materiales_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materiales' and app_private.deletes_material_object(name));

-- ── Políticas de storage.objects: reactivos ──────────────────────────────────
-- Administrador y profesores preparan las preguntas. La lectura del alumno
-- durante su intento se agrega con las tablas de evaluaciones (#30).
create policy "reactivos_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'reactivos'
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  );

create policy "reactivos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'reactivos'
    and not app_private.is_executable_name(name)
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  );

create policy "reactivos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'reactivos'
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  )
  with check (
    bucket_id = 'reactivos'
    and not app_private.is_executable_name(name)
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  );

create policy "reactivos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'reactivos'
    and (select app_private.current_app_role()) in ('admin', 'teacher')
  );

-- ── Políticas de storage.objects: términos firmados ──────────────────────────
-- #62: solo el administrador sube, consulta, reemplaza o borra el escaneo
-- firmado por el adulto responsable. El alumno no puede dar por firmada su
-- propia autorización.
create policy "terminos_select_admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'terminos' and (select app_private.is_admin()));

create policy "terminos_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'terminos'
    and not app_private.is_executable_name(name)
    and (select app_private.is_admin())
  );

create policy "terminos_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'terminos' and (select app_private.is_admin()))
  with check (
    bucket_id = 'terminos'
    and not app_private.is_executable_name(name)
    and (select app_private.is_admin())
  );

create policy "terminos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'terminos' and (select app_private.is_admin()));

-- ── Confirmar la carga ───────────────────────────────────────────────────────
-- Se llama después de subir o reemplazar el objeto. Copia sus metadatos a
-- materials y, si se pide, publica: así nada se publica sin archivo.
create function public.confirm_material_file(target_material uuid, publish boolean default false)
returns public.materials
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.materials;
  obj storage.objects;
  uid uuid := (select auth.uid());
begin
  select * into m from public.materials where id = target_material for update;
  if not found or not app_private.manages_material_object(m.storage_path) then
    raise exception 'No tienes permiso para cambiar este material.' using errcode = '42501';
  end if;

  select * into obj
  from storage.objects o
  where o.bucket_id = 'materiales' and o.name = m.storage_path;
  if not found then
    raise exception 'El archivo todavía no se ha subido.' using errcode = 'CA002';
  end if;

  if app_private.is_executable_mime(obj.metadata ->> 'mimetype') then
    raise exception 'No se permiten archivos ejecutables.' using errcode = 'CA003';
  end if;

  -- Repetir la confirmación sin subir otra vez no cuenta como reemplazo.
  if obj.version is distinct from m.file_object_version then
    update public.materials set
      file_name = substring(m.storage_path from position('/' in m.storage_path) + 1),
      file_size = (obj.metadata ->> 'size')::bigint,
      mime_type = obj.metadata ->> 'mimetype',
      file_object_version = obj.version,
      file_uploaded_at = now(),
      file_changed_at = case when m.file_version > 0 then now() else m.file_changed_at end,
      file_version = m.file_version + 1,
      updated_at = now()
    where id = m.id
    returning * into m;
  end if;

  if publish and m.status = 'draft' then
    update public.materials set
      status = 'published',
      published_by = uid,
      published_at = now(),
      updated_at = now()
    where id = m.id
    returning * into m;
  end if;

  return m;
end;
$$;

revoke all on function public.confirm_material_file(uuid, boolean) from public, anon;
grant execute on function public.confirm_material_file(uuid, boolean) to authenticated;

-- ── Aperturas y avisos de reemplazo o borrado ────────────────────────────────
create table public.material_views (
  material_id uuid not null references public.materials (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  file_version integer not null,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  notice_dismissed_at timestamptz,
  primary key (material_id, profile_id)
);

create index material_views_profile_id_idx on public.material_views (profile_id);

alter table public.material_views enable row level security;

grant select on public.material_views to authenticated;
grant all on public.material_views to service_role;

create policy "material_views_select"
  on public.material_views for select
  to authenticated
  using ((select app_private.is_admin()) or profile_id = (select auth.uid()));

-- Registra que la persona abre el archivo y devuelve su ruta para pedir la URL
-- firmada. SECURITY INVOKER: la RLS de materials decide si puede verlo.
create function public.open_material_file(target_material uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  path text;
  version integer;
begin
  select m.storage_path, m.file_version into path, version
  from public.materials m
  where m.id = target_material and m.file_version > 0;
  if path is null then
    raise exception 'El archivo no está disponible.' using errcode = 'CA004';
  end if;

  perform app_private.record_material_view(target_material, version);
  return path;
end;
$$;

-- La tabla no tiene grants de escritura para authenticated; esta función
-- solo escribe la fila de quien llama.
create function app_private.record_material_view(target_material uuid, version integer)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.material_views (material_id, profile_id, file_version)
  values (target_material, (select auth.uid()), version)
  on conflict (material_id, profile_id) do update
    set file_version = excluded.file_version,
        last_opened_at = now()
$$;

-- Avisos pendientes de quien llama: material que abrió y después se reemplazó
-- o se retiró. Es SECURITY DEFINER porque el alumno ya no ve el material retirado.
create function public.my_material_notices()
returns table (material_id uuid, title text, change text, changed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id,
         m.title,
         case when m.status = 'archived' then 'deleted' else 'replaced' end,
         m.file_changed_at
  from public.material_views v
  join public.materials m on m.id = v.material_id
  where v.profile_id = (select auth.uid())
    and m.file_changed_at > v.last_opened_at
    and (v.notice_dismissed_at is null or v.notice_dismissed_at < m.file_changed_at)
  order by m.file_changed_at desc
$$;

create function public.dismiss_material_notice(target_material uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.material_views
  set notice_dismissed_at = now()
  where material_id = target_material
    and profile_id = (select auth.uid())
$$;

revoke all on function public.open_material_file(uuid) from public, anon;
revoke all on function app_private.record_material_view(uuid, integer) from public;
revoke all on function public.my_material_notices() from public, anon;
revoke all on function public.dismiss_material_notice(uuid) from public, anon;
grant execute on function public.open_material_file(uuid) to authenticated;
grant execute on function app_private.record_material_view(uuid, integer) to authenticated;
grant execute on function public.my_material_notices() to authenticated;
grant execute on function public.dismiss_material_notice(uuid) to authenticated;
