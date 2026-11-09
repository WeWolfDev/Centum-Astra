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

Las credenciales nunca se guardan en migraciones ni en `seed.sql`.

El primer administrador se crea a mano. En Studio, agrega el usuario en
**Authentication > Users** y después ejecuta:

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Nombre del administrador', 'admin'
from auth.users
where email = 'correo@ejemplo.mx';
```

Las demás cuentas se crean desde la aplicación con “Nueva cuenta”. En local, el
correo con el código de activación se consulta en Mailpit; `supabase status`
muestra su URL.

## Pruebas y funciones

```bash
supabase test db                 # Accesos permitidos y denegados por rol
supabase functions serve         # Sirve admin-users en local
```

Un cambio de esquema o de políticas debe acompañarse de su prueba en
`supabase/tests/database/`. Los ambientes remotos se describen en
`docs/AMBIENTES.md`.
