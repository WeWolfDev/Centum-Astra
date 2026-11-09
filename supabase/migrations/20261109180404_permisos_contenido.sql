-- Permisos de contenido decididos por el cliente (#49): el grupo define los
-- módulos del alumno, el maestro publica y corrige lo suyo, y solo el
-- administrador retira material publicado.

-- ── Módulos habilitados por grupo ────────────────────────────────────────────
alter table public.groups add constraint groups_id_course_unique unique (id, course_id);
alter table public.modules add constraint modules_id_course_unique unique (id, course_id);

-- course_id garantiza que el grupo y el módulo pertenezcan al mismo curso.
create table public.group_modules (
  group_id uuid not null,
  module_id uuid not null,
  course_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (group_id, module_id),
  constraint group_modules_group_fkey foreign key (group_id, course_id)
    references public.groups (id, course_id) on delete cascade,
  constraint group_modules_module_fkey foreign key (module_id, course_id)
    references public.modules (id, course_id) on delete cascade
);

create index group_modules_module_id_idx on public.group_modules (module_id);

alter table public.group_modules enable row level security;

grant select, insert, delete on public.group_modules to authenticated;
grant all on public.group_modules to service_role;

create function app_private.studies_module(target_module uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'student'
    and exists (
      select 1
      from public.group_students gs
      join public.group_modules gm on gm.group_id = gs.group_id
      where gs.student_id = (select auth.uid())
        and gm.module_id = target_module
    )
$$;

create function app_private.module_of_session(target_session uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.module_id
  from public.sessions s
  where s.id = target_session
$$;

revoke all on function app_private.studies_module(uuid) from public;
revoke all on function app_private.module_of_session(uuid) from public;
grant execute on function app_private.studies_module(uuid) to authenticated;
grant execute on function app_private.module_of_session(uuid) to authenticated;

create policy "group_modules_select"
  on public.group_modules for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_group(group_id)
    or app_private.belongs_to_group(group_id)
  );

create policy "group_modules_insert_admin"
  on public.group_modules for insert
  to authenticated
  with check ((select app_private.is_admin()));

create policy "group_modules_delete_admin"
  on public.group_modules for delete
  to authenticated
  using ((select app_private.is_admin()));

-- ── Lectura del alumno: solo módulos habilitados para su grupo ───────────────
drop policy "modules_select" on public.modules;
create policy "modules_select"
  on public.modules for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(course_id)
    or (status = 'active' and app_private.studies_module(id))
  );

drop policy "sessions_select" on public.sessions;
create policy "sessions_select"
  on public.sessions for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(app_private.course_of_session(id))
    or (status = 'active' and app_private.studies_module(module_id))
  );

drop policy "materials_select" on public.materials;
create policy "materials_select"
  on public.materials for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(app_private.course_of_session(session_id))
    or (status = 'published' and app_private.studies_module(app_private.module_of_session(session_id)))
  );

-- ── El maestro publica y corrige su propio material ──────────────────────────
drop policy "materials_insert_teacher" on public.materials;
create policy "materials_insert_teacher"
  on public.materials for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
    and (
      (status = 'draft' and published_by is null)
      or (status = 'published' and published_by = (select auth.uid()))
    )
  );

drop policy "materials_update_teacher" on public.materials;
create policy "materials_update_teacher"
  on public.materials for update
  to authenticated
  using (
    status in ('draft', 'published')
    and created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
  )
  with check (
    created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
    and (
      (status = 'draft' and published_by is null)
      or (status = 'published' and published_by is not null)
    )
  );

-- RLS no compara la fila anterior con la nueva, así que el retiro se valida aquí.
create function app_private.guard_teacher_material_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if app_private.current_app_role() = 'teacher' then
    if old.status = 'published'
      and (new.status <> 'published' or new.published_by is distinct from old.published_by)
    then
      raise exception 'Solo un administrador puede retirar material publicado.'
        using errcode = '42501';
    end if;
    if old.status = 'draft'
      and new.status = 'published'
      and new.published_by is distinct from (select auth.uid())
    then
      raise exception 'El material debe publicarse a nombre de quien lo publica.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function app_private.guard_teacher_material_update() from public, authenticated;

create trigger materials_guard_teacher_update
before update on public.materials
for each row
execute function app_private.guard_teacher_material_update();
