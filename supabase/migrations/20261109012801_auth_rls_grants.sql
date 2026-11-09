-- #27: ciclo de vida de cuentas, políticas RLS y grants mínimos.

-- ── Perfiles ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column email text,
  add column status text not null default 'active'
    check (status in ('active', 'suspended', 'deleted')),
  add column updated_at timestamptz not null default now();

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

alter table public.profiles alter column email set not null;

-- Regla del cliente: la cuenta no desaparece físicamente. Se marca como
-- suspendida o eliminada y el motivo queda en audit_logs (solo administradores).
alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey
    foreign key (id) references auth.users (id) on delete restrict;

-- ── Funciones de apoyo ───────────────────────────────────────────────────────
-- Esquema no expuesto por la Data API. SECURITY DEFINER evita la recursión de
-- RLS entre profiles y las tablas de grupos; todas se limitan a auth.uid().
create schema app_private;

create function app_private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  -- Una cuenta suspendida o eliminada pierde el acceso sin esperar a que
  -- caduque su access token.
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
$$;

create function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_app_role() = 'admin', false)
$$;

create function app_private.teaches_group(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'teacher'
    and exists (
      select 1
      from public.group_teachers gt
      where gt.group_id = target_group
        and gt.teacher_id = (select auth.uid())
    )
$$;

create function app_private.belongs_to_group(target_group uuid)
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
      where gs.group_id = target_group
        and gs.student_id = (select auth.uid())
    )
$$;

create function app_private.teaches_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'teacher'
    and exists (
      select 1
      from public.group_students gs
      join public.group_teachers gt on gt.group_id = gs.group_id
      where gs.student_id = target_student
        and gt.teacher_id = (select auth.uid())
    )
$$;

create function app_private.teaches_course(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'teacher'
    and exists (
      select 1
      from public.groups g
      join public.group_teachers gt on gt.group_id = g.id
      where g.course_id = target_course
        and gt.teacher_id = (select auth.uid())
    )
$$;

create function app_private.studies_course(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.current_app_role() = 'student'
    and exists (
      select 1
      from public.groups g
      join public.group_students gs on gs.group_id = g.id
      where g.course_id = target_course
        and gs.student_id = (select auth.uid())
    )
$$;

create function app_private.course_of_session(target_session uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.course_id
  from public.sessions s
  join public.modules m on m.id = s.module_id
  where s.id = target_session
$$;

revoke all on all functions in schema app_private from public;
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- ── Triggers de integridad ───────────────────────────────────────────────────
create function app_private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email, updated_at = now()
  where id = new.id;
  return null;
end;
$$;

revoke all on function app_private.sync_profile_email() from public, authenticated;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function app_private.sync_profile_email();

create function app_private.block_role_change_when_assigned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.group_teachers where teacher_id = new.id)
    or exists (select 1 from public.group_students where student_id = new.id)
  then
    raise exception 'profile % has group assignments', new.id using errcode = 'CA001';
  end if;
  return new;
end;
$$;

revoke all on function app_private.block_role_change_when_assigned() from public, authenticated;

create trigger profiles_role_change_guard
before update of role on public.profiles
for each row
when (old.role is distinct from new.role)
execute function app_private.block_role_change_when_assigned();

-- ── Grants mínimos ───────────────────────────────────────────────────────────
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles, public.audit_logs to authenticated;
grant select, insert, update, delete on
  public.courses,
  public.groups,
  public.group_teachers,
  public.group_students,
  public.modules,
  public.sessions,
  public.materials
to authenticated;

grant all on all tables in schema public to service_role;

-- ── Políticas de lectura ─────────────────────────────────────────────────────
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using ((select app_private.is_admin()));

create policy "profiles_select_teacher"
  on public.profiles for select
  to authenticated
  using (status <> 'deleted' and app_private.teaches_student(id));

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using ((select app_private.is_admin()));

create policy "courses_select"
  on public.courses for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(id)
    or app_private.studies_course(id)
  );

create policy "groups_select"
  on public.groups for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_group(id)
    or app_private.belongs_to_group(id)
  );

create policy "group_teachers_select"
  on public.group_teachers for select
  to authenticated
  using (
    (select app_private.is_admin())
    or (
      teacher_id = (select auth.uid())
      and (select app_private.current_app_role()) = 'teacher'
    )
  );

create policy "group_students_select"
  on public.group_students for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_group(group_id)
    or (
      student_id = (select auth.uid())
      and (select app_private.current_app_role()) = 'student'
    )
  );

create policy "modules_select"
  on public.modules for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(course_id)
    or (status = 'active' and app_private.studies_course(course_id))
  );

create policy "sessions_select"
  on public.sessions for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(app_private.course_of_session(id))
    or (status = 'active' and app_private.studies_course(app_private.course_of_session(id)))
  );

create policy "materials_select"
  on public.materials for select
  to authenticated
  using (
    (select app_private.is_admin())
    or app_private.teaches_course(app_private.course_of_session(session_id))
    or (status = 'published' and app_private.studies_course(app_private.course_of_session(session_id)))
  );

-- ── Políticas de escritura del administrador ─────────────────────────────────
do $$
declare
  target text;
begin
  foreach target in array array[
    'courses', 'groups', 'group_teachers', 'group_students', 'modules', 'sessions', 'materials'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select app_private.is_admin()))',
      target || '_insert_admin', target
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select app_private.is_admin())) with check ((select app_private.is_admin()))',
      target || '_update_admin', target
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select app_private.is_admin()))',
      target || '_delete_admin', target
    );
  end loop;
end;
$$;

-- ── Políticas de escritura del profesor ──────────────────────────────────────
-- Publicar queda reservado al administrador hasta que el cliente resuelva P-03:
-- el profesor crea y edita sus borradores.
create policy "sessions_insert_teacher"
  on public.sessions for insert
  to authenticated
  with check (
    app_private.teaches_course((select m.course_id from public.modules m where m.id = module_id))
  );

create policy "sessions_update_teacher"
  on public.sessions for update
  to authenticated
  using (app_private.teaches_course(app_private.course_of_session(id)))
  with check (
    app_private.teaches_course((select m.course_id from public.modules m where m.id = module_id))
  );

create policy "materials_insert_teacher"
  on public.materials for insert
  to authenticated
  with check (
    status = 'draft'
    and published_by is null
    and created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
  );

create policy "materials_update_teacher"
  on public.materials for update
  to authenticated
  using (
    status = 'draft'
    and created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
  )
  with check (
    status = 'draft'
    and published_by is null
    and created_by = (select auth.uid())
    and app_private.teaches_course(app_private.course_of_session(session_id))
  );
