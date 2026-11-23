# Videos de Google Drive

Cómo funcionan los videos de Centum Astra (issue #29). Las reglas salen de
`docs/RESPUESTAS_Y_PREGUNTAS_PENDIENTES_CLIENTE.md`, secciones 1.5 y 1.9. La
base está en `supabase/migrations/20261123000000_videos_drive.sql` y sus
pruebas en `supabase/tests/database/videos.test.sql`.

## Dónde viven

Un video es un material de una clase con `kind = 'video_link'`. Lo agrega el
profesor del curso o el administrador desde **Material** con "Agregar enlace" y
tipo "Video". El alumno los ve en dos lugares: en la clase, dentro de
**Módulos**, y todos juntos en la **Videoteca**, con búsqueda y filtro por materia.

- Solo se aceptan enlaces `https://drive.google.com/…`. La pantalla y la base
  rechazan otros dominios, aunque se parezcan (`drive.google.com.otro.mx`).
- Los enlaces de tipo "Página o documento en línea" aceptan cualquier `https`.

## Quién recibe el enlace

- El catálogo de la Videoteca no trae la URL. La URL se pide al abrir, con
  `open_material_link`, que solo la entrega si la persona puede ver el video:
  el alumno, solo videos publicados de las áreas habilitadas para su grupo.
- Cada apertura queda registrada en `material_views` (quién y cuándo), como
  pidió el cliente.
- El video se abre en Drive, en una pestaña nueva.

## Lo que la plataforma no controla

- **Drive tiene sus propios permisos.** La organización decide en Drive qué
  correos pueden ver cada video. La plataforma no puede consultarlo: un alumno
  autorizado en Centum Astra puede recibir "Necesitas permiso" de Drive si su
  correo no está compartido. Por eso el alumno debe entrar a Drive con el
  correo registrado en su curso.
- **Un enlace compartible puede reenviarse.** La plataforma no entrega el
  enlace a quien no debe verlo, pero quien sí lo recibe puede copiarlo y
  mandarlo. Si el video está compartido como "Cualquier persona con el enlace",
  quien lo reciba podrá verlo. Para videos restringidos, compartirlos en Drive
  solo con los correos del curso.
- **No hay seguimiento de reproducción.** Drive no informa si el video se vio
  completo, cuántas veces ni cuánto dura. La plataforma solo sabe quién abrió
  el enlace; no muestra vistas ni duración.

## Reportes de enlaces que no cargan

En la Videoteca, cada video tiene **Reportar problema**: "El video no carga",
"Drive me pide permiso" u "Otro problema", con un comentario opcional.

- Cada persona tiene a lo más un reporte abierto por video.
- El administrador ve la etiqueta **Reportado (n)** junto al video en Material.
  Revisa el enlace y los permisos en Drive, corrige o reemplaza el enlace, y
  pulsa **Marcar resuelto**.
- El profesor no ve los reportes; el cliente decidió que el administrador
  mantiene los enlaces y resuelve los problemas de disponibilidad.
