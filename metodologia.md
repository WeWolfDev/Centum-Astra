# Metodología (Flujos)

Roles: **Administración**, **Profesor**, **Alumno** (incluye nuevo alumno / registro).

## 1. Registro (nuevo usuario)

| Rol | Datos requeridos |
|---|---|
| Administración | Nombre del usuario · Correo verificado con rol de administrador · Contraseña definida por el administrador |
| Profesor | Nombre del usuario · Correo verificado con rol de profesor · Contraseña verificada con rol de profesor |
| Alumno | Nombre del usuario · Correo verificado con rol de alumno · Contraseña verificada con rol de alumno |

- Al registrarse un alumno, su cuenta queda con **pago pendiente**. Solo puede acceder a la plataforma cuando el administrador revisa el comprobante de pago y lo aprueba.
- En Dashboard y Alumnos debe aparecer su número de alumno (se asigna al registrarlo).

## 2. Inicio de sesión

| Rol | Datos requeridos |
|---|---|
| Administración | Correo verificado con rol de administrador · Contraseña definida por el administrador |
| Profesor | Correo verificado con rol de profesor · Contraseña verificada con rol de profesor |
| Alumno | Correo verificado con rol de alumno · Contraseña verificada con rol de alumno |

Al iniciar sesión se verifica que el usuario exista y que el rol con el que entra sea el suyo.

## 3. Administración

Flujo general:

1. Iniciar sesión (correo y contraseña, con validación de rol).
2. Seleccionar uno de los módulos disponibles: **Mis alumnos**, **Material**, **Simuladores & quizzes**, **Pagos** y **Permisos**.
3. Según el módulo elegido ocurre lo siguiente:

### A. Módulo Mis alumnos

Entra → Panel del dashboard → ver a sus alumnos:

- Sus promedios y calificaciones promedio.
- Su actividad y actividad reciente.
- En qué módulos están y en cuáles pasan más tiempo.
- Si tienen sus quizzes/simuladores completos.
- Si ya pagaron la colegiatura, con botones de **aprobar / no aprobar** (revisión del comprobante de pago) y la opción de mandar un **mensaje de aviso** para que paguen.

> Pendiente: la parte de **Actividad reciente** hay que cambiarla.

### Módulos y clases

- El administrador entra a la sección de módulos y puede **crear módulos** y **clases extras**.
- Puede ver los módulos existentes y **verlos o eliminarlos**.

### Simuladores

- El administrador puede crear simuladores; al asignarlos se agregan solos al calendario (ver sección 5).
- En los simuladores se pueden subir imágenes en las preguntas, ya que el examen del CENEVAL muestra algunas imágenes.

### Estadísticas

- La parte de **promedio por materia** se sube al dashboard, y también se debe poder ver **por salón**.
- Todo queda en el dashboard, incluidas las **estadísticas semanales**.

## 4. Profesor

- Panel para **crear tareas** y **mandar material**, dividido por clases.
- Poner en el calendario las **fechas de entrega** de cada tarea o material.

## 5. Calendario

### Mini calendario (siempre visible)

- Calendario pequeño en la esquina inferior derecha, sin tapar las demás interfaces.
- Los días con eventos llevan un punto; al pasar el cursor se ve qué viene (quiz, simulador, tarea o entrega de material).
- Cada rol ve:
  - **Administración:** todos los eventos.
  - **Profesor:** los eventos de sus grupos y los que el admin publique para profesores o para todos.
  - **Alumno:** los eventos de su grupo (de su profesor o del admin) y los que el admin publique para todos.

### Calendario completo

- Botón en la barra superior, para todos los roles, que abre el calendario en grande.
- **Administración:** puede crear eventos y elegir a quién se muestran: solo profesores, un grupo específico o todos (profesores y alumnos).
- **Profesor:** puede crear eventos para el grupo que seleccione (solo sus grupos).
- **Alumno:** solo puede ver, no crea eventos.
- Cada quien puede editar o eliminar los eventos y avisos que creó; el admin puede editar o eliminar cualquiera.

### Asignación de simuladores, quizzes y tareas

- Al asignar un simulador, quiz o tarea, el profesor o admin indica:
  - Día y hora de apertura.
  - Día y hora de cierre.
  - A quién se asigna (grupo o grupos).
- El evento se agrega automáticamente al calendario de quienes lo reciben.
- Al llegar la hora de cierre ya no se puede iniciar; si alguien lo tenía abierto, se entrega lo que lleve.

### Corrección de errores (editar o eliminar)

Si el profesor o el admin se equivoca al publicar un aviso, evento, quiz o simulador, puede corregirlo:

- **Editar:** cambiar título, descripción, fechas de apertura y cierre o grupos asignados. El calendario se actualiza solo con los cambios.
- **Eliminar:** pide confirmación antes de borrar y lo quita del calendario de todos los que lo tenían.
- A los alumnos afectados se les avisa del cambio o la cancelación (ej. "El quiz de Álgebra cambió su cierre al 30/10, 20:00").
- Permisos: cada quien edita o elimina lo que publicó; el admin puede hacerlo con cualquier publicación.
- Si algún alumno ya empezó o entregó un quiz o simulador, ya no se pueden cambiar sus preguntas, y eliminarlo advierte que se perderán esos resultados; las fechas sí se pueden cambiar.

## Alumnos (work in progress...) 
