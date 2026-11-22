-- Tema obligatorio en cada clase (#85). #51 dejó sessions.topic_id opcional
-- mientras Material no permitía elegir el tema; ahora sí lo pide.
--
-- Una clase que llega sin tema (pantallas o datos anteriores) queda en el tema
-- "General" de su módulo, que se crea si no existe. Así topic_id es
-- obligatorio sin romper a quien todavía no lo envía.

-- ── Tema "General" del módulo ────────────────────────────────────────────────
create function app_private.general_topic_of(target_module uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic uuid;
begin
  select t.id into v_topic
  from public.topics t
  where t.module_id = target_module and t.title = 'General' and t.status = 'active'
  order by t.created_at
  limit 1;

  if v_topic is null then
    insert into public.topics (course_id, module_id, title, position)
    select m.course_id, m.id, 'General', 0
    from public.modules m
    where m.id = target_module
    returning id into v_topic;
  end if;
  return v_topic;
end;
$$;

create function app_private.assign_general_topic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.topic_id is null then
    new.topic_id := app_private.general_topic_of(new.module_id);
  end if;
  return new;
end;
$$;

revoke all on function app_private.general_topic_of(uuid) from public, anon, authenticated;
revoke all on function app_private.assign_general_topic() from public, anon, authenticated;

create trigger sessions_assign_topic
before insert or update of topic_id on public.sessions
for each row
execute function app_private.assign_general_topic();

-- ── Clases existentes y columna obligatoria ──────────────────────────────────
update public.sessions s
set topic_id = app_private.general_topic_of(s.module_id)
where s.topic_id is null;

alter table public.sessions alter column topic_id set not null;

-- ── Archivar un tema ─────────────────────────────────────────────────────────
-- Un tema archivado con clases activas las dejaría visibles sin su tema; primero
-- se mueven o se retiran.
create function app_private.guard_topic_archive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'archived' and old.status <> 'archived' and exists (
    select 1 from public.sessions s where s.topic_id = new.id and s.status = 'active'
  ) then
    raise exception 'Mueve o retira sus clases antes de archivar el tema.' using errcode = 'CA031';
  end if;
  return new;
end;
$$;

revoke all on function app_private.guard_topic_archive() from public, anon, authenticated;

create trigger topics_guard_archive
before update of status on public.topics
for each row
execute function app_private.guard_topic_archive();
