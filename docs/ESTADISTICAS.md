# Estadísticas

Indicadores de los paneles (#31). Los calculan funciones de PostgreSQL de solo lectura (`supabase/migrations/20261122040000_estadisticas.sql`) y el frontend los pide con `src/lib/statsService.js`.

## Reglas comunes

- **Mejor intento.** De cada alumno en cada evaluación cuenta solo su mejor intento terminado: el de mayor porcentaje y, si empatan, el más reciente. Es la misma regla que marca `is_best`. Un intento en curso no cuenta.
- **Dos promedios que nunca se mezclan** (decisión 1.10):
  - **Quizzes:** promedio de porcentajes, de 0 a 100.
  - **Simuladores y cuestionarios:** promedio de puntaje estimado, de 700 a 1300. No es un resultado oficial de Ceneval.
- **Sin datos no es cero.** Si no hay intentos, el promedio llega vacío (`null`) y el conteo en 0. La pantalla debe decir "sin resultados", no "0 %".
- **Periodo.** Todas las funciones aceptan un periodo `[desde, hasta)`: incluye `desde` y excluye `hasta`, según la fecha de entrega del intento. Sin periodo se usan todos los intentos guardados. Dentro de un periodo cuenta el mejor de los intentos guardados en ese periodo. En `statsService.js`, una fecha sin hora (`'2026-12-01'`) es la medianoche de Ciudad de México. El administrador elige el periodo; el maestro y el alumno ven todo el curso.
- **El periodo no recupera intentos borrados.** Por decisión del cliente (1.9) solo se guardan el mejor y el último intento de cada alumno en cada evaluación. Si un alumno sacó 60 % el 1 de noviembre y 90 % el 10, el de 60 % ya no existe: un periodo que solo abarca la primera semana de noviembre no lo muestra. Los periodos sirven para ver lo que se entregó en esas fechas entre lo que se conserva, no como historial completo.
- **Permisos.** Cada función lee los intentos con los permisos de quien la llama: el alumno solo los suyos, el maestro los de los alumnos de sus grupos y el administrador todos. Un alumno que no le corresponde da resultados vacíos, no un error.
- **Grupo actual.** Un alumno pertenece a un solo grupo. Sus resultados cuentan en el grupo al que pertenece hoy, aunque los haya obtenido antes de un cambio de grupo.

## Indicadores

| Función (`statsService.js`) | Quién la usa | Qué devuelve |
|---|---|---|
| `getStudentStats` (`student_stats`) | Alumno, y maestro o administrador para un alumno | Promedio de quizzes en %, promedio de simuladores y cuestionarios en puntos, y cuántas evaluaciones cuenta cada uno. |
| `listStudentResults` (`student_results`) | Alumno, maestro, administrador | Calificaciones: el mejor intento de cada evaluación, con aciertos, total, porcentaje y puntaje estimado. |
| `listStudentModuleQuizStats` (`student_module_quiz_stats`) | Alumno, maestro, administrador | Promedio de quizzes por módulo, para mostrar las áreas a mejorar. |
| `listGroupStats` (`group_stats`) | Maestro (sus grupos) y administrador (todos) | Por grupo: alumnos inscritos, generación y los dos promedios de los mejores intentos de sus alumnos. El alumno no recibe estadísticas de grupo. |
| `listGroupStudentStats` (`group_student_stats`) | Maestro (sus grupos) y administrador | Por alumno del grupo: los dos promedios y la fecha de su última entrega. |
| `listWeeklyStats` (`weekly_stats`) | Todos, cada uno con los alumnos que ve | Los dos promedios por semana, de lunes a domingo en hora de Ciudad de México. Se puede filtrar por grupo. |
| `getStatsOverview` (`stats_overview`) | Solo el administrador | Alumnos con resultados y los dos promedios de todo el sistema. Para otros roles devuelve `null`. |

Las rachas semanales del alumno son de #57 y no están aquí. Los conteos de cuentas y grupos del panel del administrador vienen de `getDirectorySummary` (`usersService.js`).

## Dónde se ven

- **Alumno:** Inicio, con sus dos promedios, las áreas a repasar y sus últimas calificaciones (#37).
- **Maestro:** Mis alumnos > Estadísticas de tus grupos. Promedios de cada grupo suyo y, al desplegarlo, de cada alumno. Siempre todo el curso.
- **Administrador:** Cuentas > Estadísticas. Resumen de todos los alumnos y promedios por grupo y por alumno. Elige el periodo con **Desde** y **Hasta**; la fecha final se incluye.
