-- Áreas extra por alumno (#61): el administrador le da a un alumno acceso a otra
-- área completa, además de los módulos de su grupo. Un área es un módulo con
-- todas sus sesiones y materiales; las cinco áreas del cliente ya son módulos.
-- El alumno sigue perteneciendo a un solo grupo (group_students_one_group).

create table public.student_extra_modules (
  student_id uuid not null references public.profiles (id) on delete restrict,
  module_id uuid not null references public.modules (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (student_id, module_id)
);

create index student_extra_modules_module_id_idx on public.student_extra_modules (module_id);

create trigger student_extra_modules_role_check
before insert or update on public.student_extra_modules
for each row execute function public.require_student_profile_role();

alter table public.student_extra_modules enable row level security;

grant select, insert, delete on public.student_extra_modules to authenticated;
grant all on public.student_extra_modules to service_role;

create policy "student_extra_modules_select"
  on public.student_extra_modules for select
  to authenticated
  using (
    (select app_private.is_admin())
    or (
      student_id = (select auth.uid())
      and (select app_private.current_app_role()) = 'student'
    )
  );

create policy "student_extra_modules_insert_admin"
  on public.student_extra_modules for insert
  to authenticated
  with check ((select app_private.is_admin()));

create policy "student_extra_modules_delete_admin"
  on public.student_extra_modules for delete
  to authenticated
  using ((select app_private.is_admin()));

-- ── Lectura del alumno: módulos de su grupo y áreas extra ────────────────────
-- Las políticas de modules, sessions y materials ya pasan por esta función.
create or replace function app_private.studies_module(target_module uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'student'
    and (
      exists (
        select 1
        from public.group_students gs
        join public.group_modules gm on gm.group_id = gs.group_id
        where gs.student_id = (select auth.uid())
          and gm.module_id = target_module
      )
      or exists (
        select 1
        from public.student_extra_modules sem
        where sem.student_id = (select auth.uid())
          and sem.module_id = target_module
      )
    )
$$;

-- ── El rol no cambia mientras haya áreas extra ───────────────────────────────
create or replace function app_private.block_role_change_when_assigned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.group_teachers where teacher_id = new.id)
    or exists (select 1 from public.group_students where student_id = new.id)
    or exists (select 1 from public.student_extra_modules where student_id = new.id)
  then
    raise exception 'profile % has group assignments', new.id using errcode = 'CA001';
  end if;
  return new;
end;
$$;
