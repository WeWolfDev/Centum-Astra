# Ambientes de Supabase

Guía para crear y mantener los ambientes de Centum Astra (issue #38). Cada ambiente tiene su propia base de datos, Auth y Storage; nunca comparten datos.

| Ambiente | Dónde vive | Plan sugerido | Build |
|---|---|---|---|
| Local | Supabase CLI y Docker | No aplica | `npm run dev` |
| Desarrollo | Proyecto `centum-astra-dev` | Free | `npm run dev` con `.env.local` |
| Staging | Proyecto `centum-astra-staging` | Free | `npm run build:staging` |
| Producción | Proyecto `centum-astra-prod`, en una organización del cliente | Pro | `npm run build` |

El plan Free admite dos proyectos activos por organización, por lo que Producción debe ir en otra organización. Esto también cumple la decisión de que el cliente sea el propietario. Confirma precios y cuotas vigentes antes de contratar: el presupuesto aprobado es de 2,500 MXN al mes.

## Crear un ambiente

1. Crea el proyecto en el panel de Supabase y guarda la contraseña de la base en el gestor de secretos del equipo.
2. Enlaza el repositorio y publica el esquema, la configuración y la función:

   ```bash
   supabase link --project-ref <ref-del-proyecto>
   supabase db push
   supabase config push
   supabase functions deploy admin-users
   ```

3. En **Authentication > URL Configuration**, usa la URL pública del ambiente como Site URL.
4. Configura un proveedor SMTP propio en **Authentication > SMTP**. Sin él, Supabase solo envía a miembros del equipo, con un límite de 2 correos por hora, y los proyectos Free nuevos no pueden personalizar plantillas. Las invitaciones y la recuperación dependen de las plantillas con código de `supabase/templates/`.
5. Crea el primer administrador con los pasos de `supabase/README.md`.
6. Configura en Netlify, para cada contexto de despliegue, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores públicos de ese proyecto. Staging usa el comando `npm run build:staging`.

## Reglas de credenciales

- En variables `VITE_*` solo van la URL y la clave pública. Todo lo que lleva ese prefijo llega al navegador.
- La clave secreta o `service_role` existe únicamente dentro de Supabase: las Edge Functions la reciben automáticamente.
- El CI ejecuta `scripts/verificar-bundle.mjs` y falla si encuentra una clave privada en `dist`.
- Nunca ejecutes `supabase db reset` con un proyecto remoto enlazado.

## Exclusivo de Producción

- **Una sesión por usuario:** el cliente pidió impedir sesiones simultáneas. Supabase solo lo ofrece en plan Pro o superior, en **Authentication > Sessions**. Mientras no se active, una cuenta puede usarse en varios dispositivos.
- **Respaldos:** confirma la retención del plan contratado (issue #40).
