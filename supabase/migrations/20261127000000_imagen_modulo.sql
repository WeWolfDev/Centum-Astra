-- Imagen propia de cada módulo. Sin imagen, la pantalla usa la del área
-- (src/config/areas.js). Solo el administrador sube, reemplaza y borra.
--
-- El bucket es público para lectura: una portada no es información sensible y
-- así la tarjeta no depende de URLs firmadas que vencen. Los archivos de
-- material, reactivos y términos siguen en buckets privados.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('modulos', 'modulos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

alter table public.modules
  add column image_path text,
  -- La imagen vive en la carpeta del propio módulo: modulos/{id}/{nombre}.
  add constraint modules_image_path_own_folder
    check (image_path is null or split_part(image_path, '/', 1) = id::text);

create policy "modulos_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'modulos' and (select app_private.is_admin()));

create policy "modulos_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'modulos' and (select app_private.is_admin()))
  with check (bucket_id = 'modulos' and (select app_private.is_admin()));

-- remove() de Storage también lee el objeto antes de borrarlo.
create policy "modulos_select_admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'modulos' and (select app_private.is_admin()));

create policy "modulos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'modulos' and (select app_private.is_admin()));
