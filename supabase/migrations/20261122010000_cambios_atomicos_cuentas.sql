-- Cambios de cuenta y de grupos en una sola transacción (#67). Antes, el perfil
-- y su auditoría se escribían por separado, y el estado se validaba con una
-- lectura previa que otro administrador podía dejar vieja.

-- ── Estado de la cuenta ──────────────────────────────────────────────────────
-- Solo cambia si el estado sigue siendo el que leyó la edge function: una
-- reactivación que pierde la carrera contra una eliminación no la deshace.
create function public.change_profile_status(
  target_profile uuid,
  expected_status text,
  new_status text,
  actor uuid,
  audit_action text,
  audit_metadata jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.profiles
  set status = new_status, updated_at = now()
  where id = target_profile and status = expected_status;
  if not found then
    raise exception 'La cuenta cambió mientras tanto.' using errcode = 'CA030';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (actor, audit_action, 'profile', target_profile, audit_metadata);
end;
$$;

-- ── Nombre y rol ─────────────────────────────────────────────────────────────
-- El bloqueo de la fila impide editar una cuenta que otro administrador está
-- eliminando, y el rol anterior queda auditado junto con el cambio.
create function public.update_profile(
  target_profile uuid,
  new_full_name text,
  new_role text,
  actor uuid
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_previous_role text;
begin
  select p.role into v_previous_role
  from public.profiles p
  where p.id = target_profile and p.status <> 'deleted'
  for update;
  if not found then
    raise exception 'La cuenta cambió mientras tanto.' using errcode = 'CA030';
  end if;

  update public.profiles
  set full_name = new_full_name, role = new_role, updated_at = now()
  where id = target_profile;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor, 'user.updated', 'profile', target_profile,
    jsonb_build_object('role', new_role, 'previous_role', v_previous_role)
  );
end;
$$;

-- ── Cuenta invitada ──────────────────────────────────────────────────────────
-- El perfil y quién lo invitó se guardan juntos; si falla, la edge function
-- borra el usuario de Auth para no dejar la cuenta sin perfil.
create function public.create_profile(
  target_profile uuid,
  new_email text,
  new_full_name text,
  new_role text,
  actor uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (target_profile, new_email, new_full_name, new_role);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (actor, 'user.invited', 'profile', target_profile, jsonb_build_object('role', new_role));
end;
$$;

-- Solo la edge function admin-users (service_role) cambia cuentas.
revoke all on function public.change_profile_status(uuid, text, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.update_profile(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.create_profile(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.change_profile_status(uuid, text, text, uuid, text, jsonb) to service_role;
grant execute on function public.update_profile(uuid, text, text, uuid) to service_role;
grant execute on function public.create_profile(uuid, text, text, text, uuid) to service_role;

-- ── Grupos del profesor ──────────────────────────────────────────────────────
-- Bajas y altas juntas: si una alta falla, el profesor conserva sus grupos.
-- SECURITY INVOKER: la RLS de group_teachers sigue decidiendo (solo el administrador).
create function public.set_teacher_groups(teacher uuid, group_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- Un null no debe parecer guardado; un arreglo vacío sí retira todos los grupos.
  if group_ids is null then
    raise exception 'Faltan los grupos del profesor.' using errcode = '22004';
  end if;
  -- Dos reasignaciones del mismo profesor a la vez se sumarían si el profesor
  -- no tiene filas que bloquear; el candado las hace esperar una a la otra.
  perform pg_advisory_xact_lock(hashtextextended(teacher::text, 0));

  delete from public.group_teachers gt
  where gt.teacher_id = teacher and gt.group_id <> all (group_ids);

  insert into public.group_teachers (group_id, teacher_id)
  select g, teacher from unnest(group_ids) as g
  on conflict (group_id, teacher_id) do nothing;
end;
$$;

revoke all on function public.set_teacher_groups(uuid, uuid[]) from public, anon;
grant execute on function public.set_teacher_groups(uuid, uuid[]) to authenticated;
