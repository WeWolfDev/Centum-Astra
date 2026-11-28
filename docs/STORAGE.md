# Storage de archivos

Guía del almacenamiento de archivos de Centum Astra (issue #28). Las reglas
salen de `docs/RESPUESTAS_Y_PREGUNTAS_PENDIENTES_CLIENTE.md`, secciones 1.9 y 1.10.
La migración es `supabase/migrations/20261122000000_storage_archivos.sql` y sus
pruebas por rol están en `supabase/tests/database/storage.test.sql`.

## Buckets

`materiales`, `reactivos` y `terminos` son privados: ningún archivo se lee sin sesión y sin permiso. `modulos` es de lectura pública porque solo guarda portadas.

| Bucket | Ruta del objeto | Formatos | Quién sube y reemplaza | Quién lee | Quién borra |
| --- | --- | --- | --- | --- | --- |
| `materiales` | `{material_id}/{nombre}` | Todos salvo ejecutables | Administrador; profesor del curso, sobre el material que creó | Quien ve la fila en `materials` (el alumno, solo lo publicado de sus módulos) | Administrador; el profesor solo en sus borradores |
| `reactivos` | `{pregunta_id}/{nombre}` | Imágenes y audio | Quien puede editar la evaluación de la pregunta (administrador; profesor del curso en sus quizzes y cuestionarios), mientras no tenga intentos | Quien administra la evaluación ve toda la carpeta; los demás, solo el archivo que usa la pregunta (`media_path`) si pueden ver la evaluación | Como al subir; los huérfanos (su pregunta ya no existe), solo el administrador |
| `terminos` | `{alumno_id}/{nombre}` | Imágenes y PDF | Administrador | Administrador | Administrador |
| `modulos` | `{modulo_id}/{fecha}.{ext}` | JPG, PNG y WebP, hasta 5 MB | Administrador | Cualquiera, con la URL pública | Administrador |

- **Tamaño:** 50 MB por archivo, sin límite total por curso.
- **Ejecutables:** se rechazan por extensión al subir (`.exe`, `.msi`, `.bat`,
  `.js`, `.hta`, `.lnk`, `.reg`, `.sh`, `.apk`, `.jar`, `.dmg`, etc.; la lista
  está en `app_private.is_executable_name` y en `EXTENSIONES_EJECUTABLES` de
  `materialService.js`, y cambian juntas) y por tipo al confirmar. Los puntos y
  espacios finales se ignoran (`virus.exe.` cuenta como `.exe`). Un `.zip` se
  acepta: su contenido no se revisa.
- **Términos firmados (#62):** solo el administrador los sube, consulta,
  reemplaza o borra. El alumno no puede dar por firmada su propia autorización.
- **Videos:** no se suben; son enlaces de Google Drive (`kind = 'video_link'`).
- **Reactivos (#95):** cada archivo hereda los permisos de la evaluación de su
  pregunta. `questions.media_path` debe estar en la carpeta de su propia
  pregunta, para que una pregunta no herede la lectura del archivo de otra. Con
  intentos, el archivo queda fijo, igual que el resto de la pregunta (`CA024`).
  Al borrar una pregunta, su archivo queda huérfano: solo el administrador lo ve
  y lo borra.
- La tabla de términos (#62) debe ligar sus filas a las rutas de `terminos`.
- **Imagen del módulo:** `modules.image_path` apunta a la imagen en `modulos`. Sin imagen, las tarjetas usan la del área (`src/config/areas.js`). Cada imagen nueva lleva otro nombre para que el navegador no muestre la anterior desde su caché; la anterior se borra al guardar.

## Flujo de un archivo de material

1. Se inserta la fila en `materials` como borrador, con `storage_path`
   `{id}/{nombre}`. La ruta debe empezar con el id del propio material.
2. Se sube el objeto a `materiales` con esa ruta.
3. Se llama `confirm_material_file(id, publish)`. La función copia tamaño, tipo
   y versión del objeto a `materials` y, si se pide, publica.

Un material con archivo no puede quedar publicado sin confirmar (`file_version = 0`).
Los metadatos del archivo solo los escribe esa función.

**Reemplazar:** se sube a la misma ruta con `upsert` y se vuelve a confirmar.
El archivo nuevo debe tener la misma extensión que el anterior: como conserva el
nombre, un Word guardado como `guia.pdf` no abriría.
El bucket no guarda versiones, así que el archivo anterior desaparece. La ruta
no se puede cambiar.

**Abrir:** `open_material_file(id)` registra la apertura en `material_views` y
devuelve la ruta. Con ella se pide una URL firmada de 5 minutos.

**Avisos:** `my_material_notices()` lista los archivos que la persona abrió y que
después se reemplazaron (`replaced`) o se retiraron (`deleted`).
`dismiss_material_notice(id)` cierra el aviso.

**Retirar:** el administrador archiva el material y después borra el objeto con
la API de Storage. Storage no permite borrar objetos con SQL directo.

**Pendiente: archivos huérfanos.** Pueden quedar dos casos:

- Si la subida falla en `addFile`, queda un borrador con `storage_path` y sin
  archivo. El alumno no lo ve. #81 debe mostrarlo al profesor para reintentar
  con `replaceFile`.
- Si `remove()` falla en `retireMaterial`, el material ya quedó archivado y el
  objeto sigue en el bucket. Como nadie puede leerlo (la fila está archivada),
  no es un riesgo de acceso, pero ocupa espacio. Para encontrarlos:

  ```sql
  select o.name from storage.objects o
  where o.bucket_id = 'materiales'
    and not exists (
      select 1 from public.materials m
      where m.storage_path = o.name and m.status <> 'archived'
    );
  ```

  El administrador o un proceso con la clave secreta los borra con la API de Storage.

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
`RESPALDO_RETENER` (por omisión 14). El manifiesto se escribe al final: una
carpeta sin `manifiesto.json` es un respaldo que falló, no cuenta para la poda y
se puede borrar a mano después de revisar el log.

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
