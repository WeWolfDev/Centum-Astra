# Storage de archivos

Guía del almacenamiento de archivos de Centum Astra (issue #28). Las reglas
salen de `docs/RESPUESTAS_Y_PREGUNTAS_PENDIENTES_CLIENTE.md`, secciones 1.9 y 1.10.
La migración es `supabase/migrations/20261121100000_storage_archivos.sql` y sus
pruebas por rol están en `supabase/tests/database/storage.test.sql`.

## Buckets

Los tres son privados: ningún archivo se lee sin sesión y sin permiso.

| Bucket | Ruta del objeto | Formatos | Quién sube y reemplaza | Quién lee | Quién borra |
| --- | --- | --- | --- | --- | --- |
| `materiales` | `{material_id}/{nombre}` | Todos salvo ejecutables | Administrador; profesor del curso, sobre el material que creó | Quien ve la fila en `materials` (el alumno, solo lo publicado de sus módulos) | Administrador; el profesor solo en sus borradores |
| `reactivos` | `{pregunta_id}/{nombre}` | Imágenes y audio | Administrador y profesores | Administrador y profesores (la lectura del alumno llega con #30) | Administrador y profesores |
| `terminos` | `{alumno_id}/{nombre}` | Imágenes y PDF | El alumno en su carpeta; administrador | El alumno su carpeta; administrador | Administrador |

- **Tamaño:** 50 MB por archivo, sin límite total por curso.
- **Ejecutables:** se rechazan por extensión al subir (`.exe`, `.msi`, `.bat`,
  `.sh`, `.apk`, `.jar`, `.dmg`, etc.) y por tipo al confirmar. Un `.zip` se
  acepta: su contenido no se revisa.
- **Videos:** no se suben; son enlaces de Google Drive (`kind = 'video_link'`).
- Las tablas de preguntas (#30) y de términos (#62) deben ligar sus filas a estas
  rutas y, en el caso de reactivos, abrir la lectura al alumno durante su intento.

## Flujo de un archivo de material

1. Se inserta la fila en `materials` como borrador, con `storage_path`
   `{id}/{nombre}`. La ruta debe empezar con el id del propio material.
2. Se sube el objeto a `materiales` con esa ruta.
3. Se llama `confirm_material_file(id, publish)`. La función copia tamaño, tipo
   y versión del objeto a `materials` y, si se pide, publica.

Un material con archivo no puede quedar publicado sin confirmar (`file_version = 0`).
Los metadatos del archivo solo los escribe esa función.

**Reemplazar:** se sube a la misma ruta con `upsert` y se vuelve a confirmar.
El bucket no guarda versiones, así que el archivo anterior desaparece. La ruta
no se puede cambiar.

**Abrir:** `open_material_file(id)` registra la apertura en `material_views` y
devuelve la ruta. Con ella se pide una URL firmada de 5 minutos.

**Avisos:** `my_material_notices()` lista los archivos que la persona abrió y que
después se reemplazaron (`replaced`) o se retiraron (`deleted`).
`dismiss_material_notice(id)` cierra el aviso.

**Retirar:** el administrador archiva el material y después borra el objeto con
la API de Storage. Storage no permite borrar objetos con SQL directo.

En el frontend todo esto está en `src/lib/materialService.js`: `addFile`,
`replaceFile`, `openFile`, `listFileNotices`, `dismissFileNotice` y `retireMaterial`.

## Respaldo y recuperación

Las copias de PostgreSQL guardan las filas de `storage.objects`, pero no el
contenido de los archivos. Los archivos se respaldan aparte con
`scripts/respaldo-storage.mjs`, que usa la clave secreta (`service_role`).
Esa clave nunca va en `VITE_*`, en Git ni en el navegador.

```bash
export SUPABASE_URL=https://<proyecto>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<clave secreta>
npm run respaldo:storage -- /ruta/de/respaldos      # crea storage-<fecha>/
```

Cada respaldo es una carpeta `storage-<fecha>/` con un subdirectorio por bucket
y un `manifiesto.json` con ruta, tipo, tamaño y sha256 de cada archivo. Al
terminar se borran los respaldos más antiguos y se conservan los últimos
`RESPALDO_RETENER` (por omisión 14).

### Copia periódica

El respaldo se programa en un equipo o servidor de confianza que guarde la clave
secreta y la carpeta de respaldos cifradas. No se usa GitHub Actions: los
artefactos quedarían en GitHub e incluyen términos firmados por adultos
responsables de menores.

Ejemplo de cron para correrlo diario a las 03:00 (`crontab -e`):

```cron
0 3 * * * cd /opt/centum-astra && . ./.respaldo.env && /usr/bin/node scripts/respaldo-storage.mjs respaldar /respaldos/centum-astra >> /var/log/centum-respaldo-storage.log 2>&1
```

`.respaldo.env` exporta `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, con
permisos `600` y fuera de Git. Conviene copiar la carpeta de respaldos a un
segundo lugar (otro disco o un bucket de otro proveedor) y revisar el log cada semana.

### Recuperar

```bash
node scripts/respaldo-storage.mjs restaurar /respaldos/centum-astra/storage-<fecha>
```

1. Restaurar primero la base de datos, si también se perdió, para que existan las
   filas de `materials` que dan permiso a cada archivo.
2. Correr `restaurar` con el respaldo elegido. Antes de subir cada archivo se
   compara su sha256 con el manifiesto. Un archivo dañado se omite y el comando
   termina con error.
3. Revisar que el número de archivos restaurados coincida con el manifiesto.

La restauración no vuelve a llamar `confirm_material_file`: los avisos de
reemplazo no se disparan y los alumnos siguen viendo el material como estaba.

Simulacro probado en local (2026-11-21): respaldo de los tres buckets, borrado
de un archivo, restauración 5 de 5 y contenido verificado.
