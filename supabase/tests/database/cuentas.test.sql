-- Cambios atómicos de cuentas y grupos (#67). Ejecutar con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

-- ── Datos de prueba ──────────────────────────────────────────────────────────
-- 1 admin · 2 profesor · 3 alumno activo · 4 alumno eliminado · 5 y 6 por invitar
insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'cuentas-admin@test.mx'),
  ('c0000000-0000-0000-0000-000000000002', 'cuentas-profe@test.mx'),
  ('c0000000-0000-0000-0000-000000000003', 'cuentas-alumno@test.mx'),
  ('c0000000-0000-0000-0000-000000000004', 'cuentas-eliminado@test.mx'),
  ('c0000000-0000-0000-0000-000000000005', 'cuentas-invitada@test.mx'),
  ('c0000000-0000-0000-0000-000000000006', 'cuentas-sin-auditoria@test.mx');

insert into public.profiles (id, email, full_name, role, status) values
  ('c0000000-0000-0000-0000-000000000001', 'cuentas-admin@test.mx', 'Admin', 'admin', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'cuentas-profe@test.mx', 'Profe', 'teacher', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'cuentas-alumno@test.mx', 'Alumno', 'student', 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'cuentas-eliminado@test.mx', 'Eliminado', 'student', 'deleted');

insert into public.courses (id, name) values ('c1000000-0000-0000-0000-000000000001', 'Curso');
insert into public.groups (id, course_id, name, code) values
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Grupo 1', 'CG1'),
  ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Grupo 2', 'CG2');
insert into public.group_teachers (group_id, teacher_id) values
  ('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');

-- ── Estado de la cuenta (como la edge function) ──────────────────────────────
set local role service_role;

-- Una eliminación ganó la carrera: la reactivación esperaba "suspended".
select throws_ok(
  $$ select public.change_profile_status('c0000000-0000-0000-0000-000000000004', 'suspended', 'active',
       'c0000000-0000-0000-0000-000000000001', 'user.reactivated', '{}') $$,
  'CA030', null, 'una reactivación concurrente con una eliminación se rechaza'
);
select is(
  (select status from public.profiles where id = 'c0000000-0000-0000-0000-000000000004'),
  'deleted',
  'la cuenta eliminada no queda activa'
);

-- La auditoría falla (acción vacía): el estado tampoco cambia.
select throws_ok(
  $$ select public.change_profile_status('c0000000-0000-0000-0000-000000000003', 'active', 'suspended',
       'c0000000-0000-0000-0000-000000000001', '', '{}') $$,
  '23514', null, 'si falla la auditoría, la llamada falla'
);
select is(
  (select status from public.profiles where id = 'c0000000-0000-0000-0000-000000000003'),
  'active',
  'si falla la auditoría, el cambio de estado no queda aplicado'
);

select lives_ok(
  $$ select public.change_profile_status('c0000000-0000-0000-0000-000000000003', 'active', 'suspended',
       'c0000000-0000-0000-0000-000000000001', 'user.suspended', '{"reason": "Adeudo"}') $$,
  'el estado cambia si sigue siendo el esperado'
);
select ok(
  (select p.status = 'suspended'
      and exists (
        select 1 from public.audit_logs a
        where a.entity_id = p.id and a.action = 'user.suspended' and a.metadata ->> 'reason' = 'Adeudo'
      )
   from public.profiles p where p.id = 'c0000000-0000-0000-0000-000000000003'),
  'el estado y su auditoría se guardan juntos'
);

-- ── Cuenta invitada ──────────────────────────────────────────────────────────
select lives_ok(
  $$ select public.create_profile('c0000000-0000-0000-0000-000000000005', 'cuentas-invitada@test.mx', 'Invitada',
       'admin', 'c0000000-0000-0000-0000-000000000001') $$,
  'el administrador invita una cuenta'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where entity_id = 'c0000000-0000-0000-0000-000000000005' and action = 'user.invited'
      and actor_id = 'c0000000-0000-0000-0000-000000000001' and metadata = '{"role": "admin"}'::jsonb
  ),
  'la invitación queda auditada con quién la hizo y el rol'
);

-- La auditoría falla (actor inexistente): tampoco queda el perfil.
select throws_ok(
  $$ select public.create_profile('c0000000-0000-0000-0000-000000000006', 'cuentas-sin-auditoria@test.mx', 'Sin',
       'admin', 'c9999999-0000-0000-0000-000000000000') $$,
  '23503', null, 'si falla la auditoría, la invitación falla'
);
select is_empty(
  $$ select 1 from public.profiles where id = 'c0000000-0000-0000-0000-000000000006' $$,
  'si falla la auditoría, no se crea el perfil'
);

-- ── Nombre y rol ─────────────────────────────────────────────────────────────
select throws_ok(
  $$ select public.update_profile('c0000000-0000-0000-0000-000000000004', 'Otro', 'teacher',
       'c0000000-0000-0000-0000-000000000001') $$,
  'CA030', null, 'no se edita una cuenta eliminada'
);

-- La auditoría falla (actor inexistente): el nombre y el rol no cambian.
select throws_ok(
  $$ select public.update_profile('c0000000-0000-0000-0000-000000000003', 'Cambiado', 'teacher',
       'c9999999-0000-0000-0000-000000000000') $$,
  '23503', null, 'si falla la auditoría, la edición falla'
);
select is(
  (select full_name || '/' || role from public.profiles where id = 'c0000000-0000-0000-0000-000000000003'),
  'Alumno/student',
  'si falla la auditoría, el nombre y el rol no cambian'
);

select lives_ok(
  $$ select public.update_profile('c0000000-0000-0000-0000-000000000003', 'Alumna', 'teacher',
       'c0000000-0000-0000-0000-000000000001') $$,
  'el administrador cambia nombre y rol'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where entity_id = 'c0000000-0000-0000-0000-000000000003' and action = 'user.updated'
      and metadata = '{"role": "teacher", "previous_role": "student"}'::jsonb
  ),
  'el cambio de rol queda auditado con el rol anterior'
);
select throws_ok(
  $$ select public.update_profile('c0000000-0000-0000-0000-000000000002', 'Profe', 'student',
       'c0000000-0000-0000-0000-000000000001') $$,
  'CA001', null, 'no cambia el rol de un profesor con grupos'
);
reset role;

-- ── Solo la edge function cambia cuentas ─────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.change_profile_status('c0000000-0000-0000-0000-000000000002', 'active', 'deleted',
       'c0000000-0000-0000-0000-000000000001', 'user.deleted', '{}') $$,
  '42501', null, 'ni el administrador cambia el estado sin pasar por la edge function'
);
select throws_ok(
  $$ select public.update_profile('c0000000-0000-0000-0000-000000000002', 'X', 'admin',
       'c0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'ni el administrador cambia el rol sin pasar por la edge function'
);

-- ── Grupos del profesor ──────────────────────────────────────────────────────
select throws_ok(
  $$ select public.set_teacher_groups('c0000000-0000-0000-0000-000000000002',
       array['c2000000-0000-0000-0000-000000000002', 'c2999999-0000-0000-0000-000000000000']::uuid[]) $$,
  '23503', null, 'una alta con un grupo inexistente falla'
);
select results_eq(
  $$ select group_id from public.group_teachers where teacher_id = 'c0000000-0000-0000-0000-000000000002' $$,
  $$ values ('c2000000-0000-0000-0000-000000000001'::uuid) $$,
  'si falla una alta, el profesor conserva sus grupos anteriores'
);
select throws_ok(
  $$ select public.set_teacher_groups('c0000000-0000-0000-0000-000000000002', null) $$,
  '22004', null, 'sin lista de grupos la reasignación falla en lugar de parecer guardada'
);
select results_eq(
  $$ select group_id from public.group_teachers where teacher_id = 'c0000000-0000-0000-0000-000000000002' $$,
  $$ values ('c2000000-0000-0000-0000-000000000001'::uuid) $$,
  'sin lista de grupos el profesor conserva los suyos'
);
select lives_ok(
  $$ select public.set_teacher_groups('c0000000-0000-0000-0000-000000000002',
       array['c2000000-0000-0000-0000-000000000002']::uuid[]) $$,
  'el administrador reasigna los grupos del profesor'
);
select results_eq(
  $$ select group_id from public.group_teachers where teacher_id = 'c0000000-0000-0000-0000-000000000002' $$,
  $$ values ('c2000000-0000-0000-0000-000000000002'::uuid) $$,
  'la reasignación quita los grupos que ya no eligió y agrega los nuevos'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;
select throws_ok(
  $$ select public.set_teacher_groups('c0000000-0000-0000-0000-000000000002',
       array['c2000000-0000-0000-0000-000000000001']::uuid[]) $$,
  '42501', null, 'el profesor no se asigna grupos'
);
reset role;

select * from finish();
rollback;
