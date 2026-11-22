-- Permisos de tabla además de la RLS. Supabase da por omisión todos los
-- permisos a anon y authenticated en cada tabla nueva de public, así que el
-- revoke de 20261109012801_auth_rls_grants.sql solo cubrió las tablas de ese
-- momento. Sin esto, una tabla que olvide su RLS queda abierta a la clave
-- pública, y las pruebas dan resultados distintos según la versión del CLI.
--
-- Va antes de las migraciones de los PRs abiertos (#74, #83, #84, #86): sus
-- tablas ya nacen sin permisos y cada una otorga solo lo que usa.

-- ── Tablas nuevas ────────────────────────────────────────────────────────────
-- Las migraciones corren como postgres; service_role conserva su acceso.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

-- ── Tablas existentes ────────────────────────────────────────────────────────
-- anon no usa ninguna tabla: el registro y el inicio de sesión pasan por Auth.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Las dos tablas creadas después del 9 de noviembre heredaron todo; se dejan
-- con los permisos que pedía su migración.
revoke all on public.group_modules, public.student_extra_modules from authenticated;
grant select, insert, delete on public.group_modules, public.student_extra_modules to authenticated;
