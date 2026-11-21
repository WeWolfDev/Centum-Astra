-- Administración de cursos, grupos y módulos desde el panel (#50): fechas en el
-- curso, horario del grupo y archivo en lugar de borrado.

-- ── Fechas en el curso ───────────────────────────────────────────────────────
-- Regla del cliente: todos los alumnos del curso tienen las mismas fechas.
alter table public.courses
  add column starts_on date,
  add column ends_on date,
  add constraint courses_dates_order
    check (ends_on is null or starts_on is null or ends_on >= starts_on);

-- Las fechas por grupo nunca se usaron y quedarían como segunda fuente de verdad.
alter table public.groups
  drop constraint groups_dates_order,
  drop column starts_on,
  drop column ends_on;

-- ── Horario del grupo ────────────────────────────────────────────────────────
-- Cada grupo tiene un solo horario. Es texto editable: hoy son "entre semana" y
-- "sabatino", pero el cliente puede abrir otros.
alter table public.groups
  add column schedule text,
  add constraint groups_schedule_not_blank
    check (schedule is null or length(btrim(schedule)) between 1 and 120);

-- ── Archivar en lugar de borrar ──────────────────────────────────────────────
-- El administrador ya crea y edita estas tablas (auth_rls_grants). Se retira el
-- borrado: archivar con status = 'archived' conserva alumnos, material y
-- evaluaciones que dependen de ellas.
drop policy "courses_delete_admin" on public.courses;
drop policy "groups_delete_admin" on public.groups;
drop policy "modules_delete_admin" on public.modules;
