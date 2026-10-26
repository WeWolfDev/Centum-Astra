# Issues de prueba para terminar el proyecto

**Sistema:** Centum Astra
**Objetivo:** desglosar el trabajo para llevar el prototipo a un producto operativo con cuentas, materiales y resultados reales.
**Plataforma principal:** Supabase para PostgreSQL, Auth, Storage y lógica de servidor mediante Edge Functions/funciones SQL cuando corresponda. **Supabase CLI** será la herramienta para desarrollo local y migraciones.
**Alcance excluido:** pagos, hasta que el cliente confirme los requisitos. La videoteca almacenará metadatos y enlaces a Google Drive; no alojará videos.

## Suposición de asignación

Como todavía no se proporcionaron nombres ni especialidades del equipo, se usan estas etiquetas provisionales:

- **Integrante A:** Supabase, esquema y lógica backend.
- **Integrante B:** frontend y flujos de usuario.
- **Integrante C:** ambientes, calidad y publicación.

Supabase es la plataforma principal para la persistencia y los servicios de backend relacionados. No se agrega por ahora una API independiente, un proveedor de archivos u otra herramienta de pruebas/monitoreo; el equipo puede evaluar alternativas posteriormente si surge una necesidad concreta.

## Issue 0 — Aprobar reglas del producto con el cliente

**Asignación:** equipo completo coordina con cliente
**Prioridad:** P0 · **Bloquea:** esquema de datos, permisos y flujos reales

### Descripción

Resolver las decisiones funcionales necesarias para que cada integrante implemente el mismo comportamiento y no asuma reglas comerciales o educativas.

### Tareas

- Confirmar cómo se crean y activan las cuentas: invitación, alta administrativa o registro abierto.
- Aprobar roles y permisos de administrador, profesor y alumno.
- Definir grupos, cursos y asignación de alumnos a profesores.
- Definir quién puede subir, publicar, editar y retirar materiales.
- Acordar si los enlaces de Drive se compartirán por cuentas/grupos o mediante enlace.
- Definir duración, intentos, reanudación, entrega, retroalimentación y publicación de resultados de evaluaciones.
- Validar el significado de progreso y puntajes; no tratar la estimación actual como resultado oficial CENEVAL sin metodología aprobada.
- Definir retención y eliminación de cuentas, intentos, resultados y archivos.
- Mantener pagos explícitamente fuera del alcance de esta entrega.

### Criterios de aceptación

- Las decisiones se documentan y reciben aprobación del cliente.
- No quedan reglas ambiguas que afecten permisos, resultados o el ciclo de vida de las cuentas.
- El alcance excluye los pagos hasta una aprobación posterior.

## Integrante A — Supabase: datos, autenticación y lógica de servidor

### Issue 1 — Inicializar Supabase CLI y flujo local

**Prioridad:** P0 · **Depende de:** Issue 0

### Tareas

- Inicializar la estructura Supabase del repositorio con Supabase CLI.
- Configurar el entorno local reproducible y los datos semilla no productivos.
- Añadir instrucciones para iniciar, reiniciar y probar el esquema localmente.
- Mantener migraciones SQL y configuración de funciones en control de versiones.

### Criterios de aceptación

- Un integrante puede levantar la base local siguiendo las instrucciones.
- Esquema, políticas y funciones se pueden recrear desde cero mediante migraciones.
- No se requiere modificar manualmente producción para reconstruir el esquema.

### Issue 2 — Diseñar e implementar el modelo de datos

**Prioridad:** P0 · **Depende de:** Issues 0 y 1

### Tareas

- Modelar perfiles de aplicación vinculados al UUID de `auth.users`.
- Modelar roles, grupos, asignaciones, cursos, módulos y sesiones.
- Modelar metadatos, relaciones y estado de publicación de materiales y enlaces de Drive.
- Modelar evaluaciones versionadas, preguntas, opciones, intentos, respuestas y resultados.
- Mantener el esquema en PostgreSQL de Supabase y las modificaciones en migraciones SQL versionadas.
- Añadir restricciones, relaciones, índices iniciales y marcas de tiempo mediante migraciones.
- No implementar modelos de pagos en este alcance.

### Criterios de aceptación

- El esquema cubre los flujos aprobados y no depende de los datos mock del frontend.
- Las claves foráneas y restricciones evitan relaciones inválidas.
- Las migraciones se aplican localmente en orden y el esquema se puede recrear.

### Issue 3 — Configurar Supabase Auth, grants y políticas RLS

**Prioridad:** P0 · **Depende de:** Issues 0, 1 y 2

### Tareas

- Configurar el flujo aprobado de invitación/alta, inicio de sesión y recuperación.
- Mantener roles educativos y asignaciones en tablas propias, no en datos editables por el usuario.
- Habilitar RLS en todas las tablas expuestas a APIs.
- Configurar grants mínimos junto con las políticas RLS.
- Escribir políticas diferenciadas para alumno, profesor, administrador y usuario anónimo.
- Probar tanto accesos autorizados como denegados.
- Mantener la clave `service_role` exclusivamente en contexto confiable de servidor.

### Criterios de aceptación

- Un alumno solo puede leer/modificar los datos propios permitidos.
- Un profesor solo accede a los alumnos y grupos asignados.
- Las acciones administrativas requieren privilegios definidos.
- Las pruebas negativas demuestran que no se accede a datos ajenos cambiando IDs.
- `service_role` no aparece en frontend, variables `VITE_*` ni Git.

### Issue 4 — Configurar Supabase Storage para documentos e imágenes

**Prioridad:** P0 · **Depende de:** Issues 0, 1 y 3

### Tareas

- Crear buckets privados para documentos e imágenes de reactivos.
- Definir políticas para cargar, consultar, reemplazar y borrar por rol y relación con curso/sesión.
- Guardar metadatos del objeto en tablas de la aplicación.
- Definir límites de tamaño y formatos permitidos.
- Documentar cómo respaldar y recuperar los objetos independientemente de PostgreSQL.

### Criterios de aceptación

- Los archivos privados no se pueden leer sin autorización.
- Cada operación de Storage está probada con los roles definidos.
- El material no se marca publicado hasta confirmar la carga y persistencia de metadatos.
- Existe un procedimiento de recuperación para objetos.

### Issue 5 — Implementar el catálogo de enlaces de Google Drive

**Prioridad:** P0 · **Depende de:** Issues 0, 1, 2 y 3

### Tareas

- Persistir título, materia, módulo/sesión, URL o ID de Drive, autor y estado de publicación.
- Verificar el permiso del usuario en Centum Astra antes de mostrar o abrir el enlace.
- Restringir destinos de enlace a los dominios aprobados para reducir redirecciones incorrectas.
- Manejar enlaces rotos, retirados o que ya no tengan permiso en Drive.
- Documentar que un enlace compartible puede reenviarse y que la autorización de la plataforma no sustituye la de Drive.

### Criterios de aceptación

- La videoteca obtiene su catálogo de Supabase, no únicamente de `mockVideos`.
- Un usuario no autorizado no recibe un enlace restringido.
- El sistema comunica los errores de acceso o disponibilidad de Drive.
- No se promete seguimiento de reproducción que Drive no proporcione.

### Issue 6 — Implementar evaluaciones, intentos y resultados con Supabase

**Prioridad:** P0 · **Depende de:** Issues 0, 1, 2 y 3

### Tareas

- Persistir evaluaciones y versiones de preguntas.
- Implementar operaciones aprobadas para iniciar, guardar y entregar intentos.
- Ejecutar lógica de negocio sensible en Supabase Edge Functions y/o funciones SQL controladas; no confiar el cálculo ni la autorización al cliente.
- Aplicar vencimiento, duración e intentos según reglas del producto en servidor.
- Calcular y guardar resultados con fórmula aprobada.
- No exponer respuestas correctas antes del momento autorizado.
- Hacer idempotente la entrega para evitar intentos duplicados por reenvíos.
- Validar el JWT y los permisos en cada operación; no exponer credenciales privilegiadas.

### Criterios de aceptación

- Cambiar el reloj del navegador no altera el vencimiento del servidor.
- La entrega genera un resultado persistente y reproducible.
- Repetir la misma solicitud no duplica intentos ni resultados.
- La clave de respuestas solo se expone de acuerdo con las reglas definidas.
- El puntaje no se etiqueta como oficial CENEVAL sin validación.

### Issue 7 — Proveer consultas seguras para dashboards y estadísticas

**Prioridad:** P1 · **Depende de:** Issues 2, 3 y 6

### Tareas

- Definir consultas sobre alumnos, grupos, módulos e intentos.
- Aplicar permisos por rol y asignación a grupos.
- Sustituir cifras hardcodeadas por métricas derivadas de datos persistidos.
- Documentar periodos y significado de cada indicador.

### Criterios de aceptación

- Cada rol solo recibe métricas autorizadas.
- Las métricas usan resultados reales, no `mockStats` o series sintéticas.
- Los resultados de consultas son verificables con datos de prueba.

## Integrante B — Frontend

### Issue 8 — Conectar autenticación real al frontend

**Prioridad:** P0 · **Depende de:** Issues 0 y 3

### Tareas

- Sustituir `mockUsers` y la comparación local por el flujo de Supabase Auth.
- Implementar inicio y cierre de sesión y recuperación según el alcance aprobado.
- Eliminar los accesos rápidos y credenciales mock de producción.
- Manejar errores y expiración de sesión sin confirmar operaciones no realizadas.

### Criterios de aceptación

- El acceso funciona con cuentas reales de Supabase Auth.
- La sesión se comporta según la política acordada y puede cerrarse.
- Los errores no filtran información sensible.
- Las cuentas mock no autentican usuarios en producción.

### Issue 9 — Conectar administración de usuarios y vista de profesor a Supabase

**Prioridad:** P0 · **Depende de:** Issues 2 y 3

### Tareas

- Cargar listados y búsquedas desde PostgreSQL mediante las APIs/funciones de Supabase, respetando RLS.
- Implementar acciones administrativas aprobadas y retirar botones sin comportamiento.
- Filtrar la lista del profesor por grupos asignados.
- Mostrar estados de carga, error, vacío y confirmación.

### Criterios de aceptación

- Los cambios reales persisten al recargar.
- Los profesores no ven alumnos fuera de sus grupos.
- Cada acción visible tiene comportamiento funcional y confirmado por el backend.

### Issue 10 — Conectar módulos, sesiones y documentos

**Prioridad:** P0 · **Depende de:** Issues 2, 3 y 4

### Tareas

- Reemplazar mocks de módulos y sesiones por consultas a PostgreSQL de Supabase.
- Conectar creación/edición de sesiones a operaciones autorizadas.
- Conectar carga, consulta y eliminación de documentos a Storage y sus metadatos.
- Aplicar reglas aprobadas de visibilidad por grupo/alumno.

### Criterios de aceptación

- Clases y materiales persisten tras cerrar sesión y volver a entrar.
- Los alumnos ven solo los recursos autorizados.
- Cargas fallidas no aparecen como publicaciones exitosas.

### Issue 11 — Conectar videoteca con los enlaces de Drive

**Prioridad:** P0 · **Depende de:** Issues 3 y 5

### Tareas

- Cargar videos y filtros desde PostgreSQL de Supabase.
- Permitir al personal autorizado crear, editar y retirar enlaces.
- Redirigir a Drive después de confirmar que el usuario está autorizado.
- Mostrar errores por enlaces rotos o permisos insuficientes.

### Criterios de aceptación

- El catálogo ya no depende solo de `mockVideos`.
- Los cambios persisten al recargar.
- Se respeta la política de acceso definida y se informa de las limitaciones de compartir enlaces.

### Issue 12 — Completar el flujo de simuladores del alumno

**Prioridad:** P0 · **Depende de:** Issues 0, 3 y 6

### Tareas

- Habilitar inicio de evaluación desde la vista accesible al alumno.
- Conectar inicio, preguntas, entrega e historial con el backend.
- Mostrar el temporizador como representación del estado del servidor.
- Presentar resultados según la fórmula y reglas aprobadas.
- Definir y conectar el comportamiento tras recarga o pérdida de conexión.

### Criterios de aceptación

- Un alumno inicia y termina un intento persistido.
- El resultado mostrado coincide con el almacenado en servidor.
- La política de desconexión/reanudación se cumple.
- “Próximamente” solo se elimina después de validar el flujo completo.

### Issue 13 — Quitar mocks y alinear la navegación por rol

**Prioridad:** P1 · **Depende de:** Issues 7 y 9–12

### Tareas

- Reemplazar historiales y cifras sintéticas en pantallas operativas.
- Revisar acceso por rol a Estadísticas, Videoteca, Material y Simuladores.
- Retirar o identificar testimonios, resultados y cifras promocionales no verificados.
- Revisar formularios, navegación móvil, accesibilidad y mensajes de error.

### Criterios de aceptación

- Ningún dato mock se presenta como dato real de producción.
- La navegación corresponde a la matriz de permisos aprobada.
- Los flujos principales se pueden operar por teclado y comunican estado sin depender solo del color.

## Integrante C — Ambientes, calidad y publicación

### Issue 14 — Separar ambientes de Supabase

**Prioridad:** P0 · **Depende de:** acceso a Supabase y decisión de ambiente

### Tareas

- Crear proyectos independientes para desarrollo, staging y producción.
- Configurar URL y claves públicas correctas por ambiente.
- Aislar datos, Auth y Storage de pruebas respecto a producción.
- Mantener credenciales privilegiadas en configuración privada del servidor/CI.
- Confirmar plan, región, cuotas, costo y funciones de respaldo disponibles para el proyecto de producción.

### Criterios de aceptación

- Staging no comparte base de datos, Auth ni Storage con producción.
- Cada build apunta al proyecto Supabase correspondiente.
- No hay claves privadas en el repositorio ni en el bundle del navegador.

### Issue 15 — Validar migraciones y cambios de Supabase con la CLI

**Prioridad:** P0 · **Depende de:** Issues 1–3

### Tareas

- Extender la validación existente para ejecutar las comprobaciones acordadas con Supabase CLI.
- Probar migraciones y funciones antes de aplicarlas a staging/producción.
- Definir aprobación y secuencia para cambios de esquema.
- Evitar despliegues de producción desde pull requests.

### Criterios de aceptación

- Las migraciones se validan antes de desplegar.
- Un fallo de validación bloquea la promoción.
- Las migraciones de producción se aplican mediante un proceso documentado y aprobado.

### Issue 16 — Definir respaldos, recuperación y monitoreo

**Prioridad:** P0 · **Depende de:** Issues 4 y 14

### Tareas

- Confirmar plan, retención de respaldos y opciones de recuperación de Supabase.
- Definir respaldos para PostgreSQL y Storage por separado.
- Probar restauración en un ambiente aislado.
- Definir responsables y pasos ante errores de autenticación, permisos, carga y evaluaciones.
- Usar las capacidades existentes de Supabase/hosting hasta que el equipo seleccione otras herramientas.

### Criterios de aceptación

- Se documentan frecuencia, retención y responsables de respaldo.
- Se restaura una copia de prueba de la base y de los archivos.
- Los backups de PostgreSQL y la recuperación de objetos de Storage están cubiertos por procedimientos separados.
- El equipo tiene un procedimiento de respuesta a incidentes y recuperación.

### Issue 17 — Ejecutar aceptación en staging y aprobar lanzamiento

**Prioridad:** P0 · **Depende de:** Issues 8–16

### Tareas

- Probar manualmente los flujos de autenticación, permisos, grupos, materiales, Drive y evaluaciones.
- Revisar pantallas en los navegadores y tamaños acordados.
- Validar acceso positivo y negativo con cuentas de cada rol.
- Ensayar restauración y rollback.
- Registrar la decisión formal de salida a producción.

### Criterios de aceptación

- Los flujos críticos pasan en staging con datos de prueba.
- Se verifica que cada rol no pueda acceder a información ajena.
- La restauración y el rollback se ensayaron.
- No se abre a usuarios reales con fallas P0.

## Orden de trabajo sugerido

1. **Aprobación funcional:** cerrar Issue 0 con el cliente.
2. **Preparación en paralelo:** Integrante A inicia Issues 1–2; Integrante C prepara Issue 14; Integrante B inventaría los cambios de interfaz dependientes del alcance.
3. **Fundación de datos y permisos:** A completa Issues 2–4; B conecta Issue 8; C prepara validación de migraciones.
4. **Flujos de producto:** A implementa Issues 5–7; B integra Issues 9–13.
5. **Salida:** C coordina Issues 15–17, con apoyo del equipo.

Los pagos permanecen fuera de este plan hasta que el cliente apruebe sus requisitos. Supabase es la plataforma principal para base de datos y servicios asociados; Supabase CLI se usa para desarrollo local y migraciones. No se consideran seleccionadas herramientas adicionales para pruebas, monitoreo u hosting, que pueden definirse posteriormente.
