-- Catálogo de videos de Google Drive (#29). Los videos ya son filas de
-- materials con kind = 'video_link' (#34) y la RLS decide quién los ve. Aquí:
-- solo se aceptan enlaces de Drive, se registra quién abre cada enlace
-- (decisión 1.5 del cliente) y el alumno puede reportar un enlace que no carga.
--
-- La plataforma no puede saber si Drive le da permiso a un correo: eso lo
-- administra la organización en Drive. Un enlace compartible puede reenviarse;
-- la RLS evita que la plataforma lo entregue, no que alguien lo comparta.

-- ── Solo enlaces de Drive en los videos ──────────────────────────────────────
-- Antes de aplicar en un ambiente con datos, revisar que no haya videos de
-- otro dominio (la migración fallaría):
--   select id, external_url from public.materials
--   where kind = 'video_link' and external_url !~* '^https://drive\.google\.com/';
alter table public.materials
  add constraint materials_video_link_drive check (
    kind <> 'video_link' or external_url ~* '^https://drive\.google\.com/'
  );

-- ── Abrir un enlace ──────────────────────────────────────────────────────────
-- SECURITY INVOKER: la RLS de materials decide si la persona puede verlo. Solo
-- entrega el enlace a quien lo ve y deja registrada la apertura.
create function public.open_material_link(target_material uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  url text;
begin
  select m.external_url into url
  from public.materials m
  where m.id = target_material
    and m.kind in ('video_link', 'external_link')
    and m.status <> 'archived';
  if url is null then
    raise exception 'El enlace no está disponible.' using errcode = 'CA004';
  end if;

  -- Los enlaces no tienen versión de archivo: se registran con 0.
  perform app_private.record_material_view(target_material, 0);
  return url;
end;
$$;

revoke all on function public.open_material_link(uuid) from public, anon;
grant execute on function public.open_material_link(uuid) to authenticated;

-- ── Reportes de enlaces que no cargan ────────────────────────────────────────
create table public.material_reports (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('no_carga', 'sin_permiso', 'otro')),
  note text check (note is null or length(note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  constraint material_reports_resolved_together check ((resolved_at is null) = (resolved_by is null))
);

-- Un reporte abierto por persona y material: repetir el clic no lo duplica.
create unique index material_reports_open_once
  on public.material_reports (material_id, reporter_id)
  where resolved_at is null;
create index material_reports_open_idx on public.material_reports (material_id) where resolved_at is null;

alter table public.material_reports enable row level security;

grant select, insert, update on public.material_reports to authenticated;
grant all on public.material_reports to service_role;

-- El administrador ve y resuelve todos; cada quien ve los suyos.
create policy "material_reports_select"
  on public.material_reports for select
  to authenticated
  using ((select app_private.is_admin()) or reporter_id = (select auth.uid()));

-- Solo se reporta material que la persona puede ver (la subconsulta pasa por
-- la RLS de materials) y a su propio nombre, sin marcarlo como resuelto.
create policy "material_reports_insert"
  on public.material_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and resolved_at is null
    and resolved_by is null
    and exists (select 1 from public.materials m where m.id = material_id)
  );

create policy "material_reports_update_admin"
  on public.material_reports for update
  to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));
