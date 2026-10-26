# Entidad ADMINISTRADOR

## 1. Descripción

La entidad `ADMINISTRADOR` representa a los usuarios responsables de gestionar, supervisar y modificar la información administrativa y académica de la plataforma educativa.

## 2. Atributos

| Atributo | Tipo de dato | Descripción |
|---|---|---|
| id_administrador | BIGINT (PK, FK) | Identificador único relacionado con `USUARIO`. |
| fecha_asignacion | TIMESTAMP | Fecha de asignación del rol administrativo. |
| nivel_permiso | VARCHAR(30) | Nivel de privilegios del administrador. |

Los datos personales y de autenticación se almacenarán en la entidad `USUARIO`.

## 3. Acciones y permisos del administrador

### 3.1. Gestión de alumnos

- Consultar la información de los alumnos registrados.
- Modificar datos de inscripción y corregir información administrativa.
- Habilitar o suspender el acceso a cursos.
- Autorizar el acceso después de verificar el pago.
- Consultar el historial académico y las calificaciones.

**Entidad relacionada:** `ALUMNO`, `INSCRIPCION`.

### 3.2. Gestión de calificaciones

- Consultar las calificaciones obtenidas en exámenes y quizzes.
- Aprobar o rechazar calificaciones pendientes.
- Cambiar el estado de aprobación de una calificación.
- Registrar observaciones sobre los resultados.
- Corregir calificaciones cuando exista una justificación, conservando el valor original y el historial del cambio.

**Entidad relacionada:** `RESULTADO_EXAMEN`.

### 3.3. Gestión de módulos educativos

- Crear nuevos módulos.
- Editar el nombre y la descripción de un módulo.
- Modificar el orden de los módulos dentro de un curso.
- Asignar o cambiar maestros responsables.
- Activar, desactivar o archivar módulos.

**Entidad relacionada:** `MODULO`.

### 3.4. Gestión de maestros

- Registrar nuevos maestros.
- Consultar la información de los maestros existentes.
- Editar datos administrativos y especialidades.
- Asignar o cambiar los módulos que imparte cada maestro.
- Activar o desactivar cuentas de maestros.

**Entidad relacionada:** `MAESTRO`, `USUARIO`.

### 3.5. Gestión de simuladores

- Crear nuevos simuladores de examen.
- Editar el título, descripción y duración.
- Añadir, modificar o retirar preguntas.
- Configurar las opciones de respuesta y las respuestas correctas.
- Modificar el orden de las preguntas.
- Establecer la disponibilidad y fechas de aplicación.
- Publicar, desactivar o archivar simuladores.
- Consultar simuladores existentes.

**Entidad relacionada:** `SIMULADOR`, `PREGUNTA`, `OPCION_RESPUESTA`.

**Restricción:** Si un simulador ya fue presentado por alumnos, las modificaciones de preguntas o respuestas correctas deberán gestionarse mediante versiones para no alterar los resultados históricos.

### 3.6. Revisión de respuestas de simuladores

- Consultar los intentos realizados por cada alumno.
- Visualizar las respuestas seleccionadas.
- Comparar las respuestas del alumno con las respuestas correctas.
- Consultar el tiempo empleado y la calificación obtenida.
- Registrar observaciones de revisión.
- Aprobar o rechazar resultados.
- Autorizar una recalificación justificada sin modificar las respuestas originales.

**Entidad relacionada:** `INTENTO_SIMULADOR`, `RESPUESTA_ALUMNO`, `REVISION_SIMULADOR`.

## 4. Atributos propuestos para otras entidades

Las acciones administrativas se reflejarán mediante los siguientes atributos:

| Entidad | Atributos propuestos | Función |
|---|---|---|
| `RESULTADO_EXAMEN` | aprobado_por, estado_aprobacion, fecha_aprobacion | Controlar la aprobación de calificaciones. |
| `INSCRIPCION` | autorizado_por, estado_acceso, fecha_autorizacion | Controlar el acceso de alumnos. |
| `MODULO` | creado_por, actualizado_por, estado | Registrar creación y modificaciones. |
| `MAESTRO` | registrado_por, actualizado_por | Identificar responsables del registro y cambios. |
| `SIMULADOR` | creado_por, actualizado_por, estado, fecha_actualizacion | Gestionar creación, edición y publicación. |
| `REVISION_SIMULADOR` | revisado_por, fecha_revision, observaciones | Registrar las revisiones realizadas. |

Los atributos terminados en `_por` serán claves foráneas relacionadas con `ADMINISTRADOR(id_administrador)`.

## 5. Restricciones generales

- Únicamente los usuarios con permisos administrativos podrán ejecutar estas operaciones.
- Las modificaciones importantes deberán registrarse en una bitácora.
- No se deberán eliminar definitivamente calificaciones, respuestas o intentos que formen parte del historial académico.
- Las modificaciones de resultados deberán conservar la información original.
- La autorización de acceso deberá estar respaldada por la verificación del pago correspondiente.
- Los administradores podrán consultar las respuestas de los alumnos, pero no modificarlas directamente.

## 6. Conclusión

La entidad `ADMINISTRADOR` permitirá gestionar alumnos, maestros, módulos, simuladores, calificaciones y accesos.

Sus permisos de creación, consulta, modificación y desactivación se implementarán mediante operaciones del sistema, mientras que las entidades relacionadas almacenarán los atributos necesarios para identificar quién realizó cada acción y mantener la integridad de la información.




