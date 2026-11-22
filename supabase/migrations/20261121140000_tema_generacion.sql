-- Tema y generación (#51). El cliente confirmó la jerarquía Curso, Grupo,
-- Módulo, Tema y Sesión, y que la organización es por generaciones; la
-- generación pertenece al grupo.

-- ── Temas ────────────────────────────────────────────────────────────────────
-- course_id va repetido para que la RLS no tenga que subir hasta el módulo; la
-- llave compuesta garantiza que coincide con el curso del módulo.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  module_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  position integer not null default 0 check (position >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_module_same_course foreign key (module_id, course_id)
    references public.modules (id, course_id) on delete cascade,
  -- Destino de sessions_topic_same_module.
  constraint topics_id_module_unique unique (id, module_id)
);

create index topics_module_id_course_id_idx on public.topics (module_id, course_id);

alter table public.topics enable row level security;

grant select, insert, update on public.topics to authenticated;
grant all on public.topics to service_role;

-- Mismas reglas que las sesiones: el alumno ve los temas activos de sus módulos.
create policy "topics_select"
  on public.topics for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(course_id)
    or (status = 'active' and app_private.studies_module(module_id))
  );

-- Sin borrado: archivar con status = 'archived' conserva las sesiones del tema.
create policy "topics_insert"
  on public.topics for insert
  to authenticated
  with check ((select app_private.is_admin()) or app_private.teaches_course(course_id));

create policy "topics_update"
  on public.topics for update
  to authenticated
  using ((select app_private.is_admin()) or app_private.teaches_course(course_id))
  with check ((select app_private.is_admin()) or app_private.teaches_course(course_id));

-- ── Tema de cada sesión ──────────────────────────────────────────────────────
-- sessions.module_id se conserva, así la RLS de sesiones y material no cambia;
-- la llave compuesta impide asignar un tema de otro módulo.
-- shortcut: topic_id es opcional mientras Material no permite elegir el tema;
-- se vuelve obligatorio cuando la pantalla lo pida.
alter table public.sessions
  add column topic_id uuid,
  -- no action (sin on delete): se revisa al final de la operación, así borrar
  -- el módulo con sus temas y sesiones no depende del orden de las cascadas.
  add constraint sessions_topic_same_module foreign key (topic_id, module_id)
    references public.topics (id, module_id);

create index sessions_topic_id_idx on public.sessions (topic_id);

-- ── Generación del grupo ─────────────────────────────────────────────────────
-- Texto editable como el horario (por ejemplo, "2027"); el administrador lo
-- escribe al crear o editar el grupo.
alter table public.groups
  add column generation text,
  add constraint groups_generation_not_blank
    check (generation is null or length(btrim(generation)) between 1 and 60);
