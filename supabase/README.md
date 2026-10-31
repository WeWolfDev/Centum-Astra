# Desarrollo local con Supabase

## Requisitos

- Supabase CLI 2.x.
- Docker Desktop iniciado.

## Comandos

Desde la raíz del repositorio:

```bash
supabase start
supabase db reset
supabase status
```

`supabase db reset` elimina la base local y aplica nuevamente todas las
migraciones en `supabase/migrations/`, seguido de `supabase/seed.sql`.
Nunca se debe ejecutar contra producción.

Para detener los servicios locales:

```bash
supabase stop
```

Para crear una migración nueva:

```bash
supabase migration new nombre_del_cambio
```

Las migraciones deben probarse con `supabase db reset` antes de enlazar o
publicar un proyecto remoto. El esquema local no contiene datos reales.

## Usuarios de prueba

Los usuarios se crean desde Supabase Studio local o mediante Auth. Después de
crear un usuario, se debe insertar su fila correspondiente en `public.profiles`
con un rol válido (`admin`, `teacher` o `student`). Las credenciales nunca se
guardan en migraciones ni en `seed.sql`.
