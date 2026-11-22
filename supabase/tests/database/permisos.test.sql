-- Permisos de tabla además de la RLS. Ejecutar con `supabase test db`.
-- Supabase da por omisión todos los permisos a anon y authenticated en cada
-- tabla nueva; si una tabla olvidara su RLS, solo estos permisos la cerrarían.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(5);

-- ── Tablas existentes ────────────────────────────────────────────────────────
select is_empty(
  $$ select c.relname
     from pg_class c
     where c.relnamespace = 'public'::regnamespace
       and c.relkind in ('r', 'p', 'v', 'm')
       and (has_table_privilege('anon', c.oid, 'SELECT')
         or has_table_privilege('anon', c.oid, 'INSERT')
         or has_table_privilege('anon', c.oid, 'UPDATE')
         or has_table_privilege('anon', c.oid, 'DELETE')) $$,
  'anon no tiene permisos sobre ninguna tabla de public'
);

-- TRUNCATE se salta la RLS; REFERENCES y TRIGGER tampoco los usa la app.
select is_empty(
  $$ select c.relname
     from pg_class c
     where c.relnamespace = 'public'::regnamespace
       and c.relkind in ('r', 'p')
       and (has_table_privilege('authenticated', c.oid, 'TRUNCATE')
         or has_table_privilege('authenticated', c.oid, 'REFERENCES')
         or has_table_privilege('authenticated', c.oid, 'TRIGGER')) $$,
  'authenticated no puede vaciar tablas ni crear llaves o triggers sobre ellas'
);

-- Los permisos de authenticated en estas tablas son los que pide su migración.
select ok(
  not has_table_privilege('authenticated', 'public.group_modules', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.student_extra_modules', 'UPDATE'),
  'habilitar áreas se corrige borrando y agregando, no editando'
);

-- ── Tablas nuevas ────────────────────────────────────────────────────────────
-- Las migraciones corren como postgres: una tabla suya no da nada por omisión.
create table public.tabla_de_prueba_permisos (id integer primary key);

select ok(
  not has_table_privilege('anon', 'public.tabla_de_prueba_permisos', 'SELECT'),
  'una tabla nueva no da permisos a anon'
);
select ok(
  not has_table_privilege('authenticated', 'public.tabla_de_prueba_permisos', 'DELETE'),
  'una tabla nueva no da permisos a authenticated hasta que su migración los otorga'
);

select * from finish();
rollback;
