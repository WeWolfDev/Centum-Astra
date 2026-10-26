# REQUISITOS NO FUNCIONALES — Usabilidad · Centum Astra
> Plataforma educativa de preparación EXANI-II
> Generado: 2026-10-25 | Fuentes: `metodologia.md`, `docs/REQUISITOS_FUNCIONALES.md`, `mockups/HANDOFF.md`, `docs/reporte-frontend.md`

---

## Cómo leer este documento

- Cada requisito tiene un ID `RNF-U-XX`, una **prioridad** y un **criterio de aceptación** que se puede comprobar.
- **Prioridad:** **Alta** = bloquea la salida a producción · **Media** = debe estar antes de abrir a todos los grupos · **Baja** = mejora deseable.
- **Estado actual** resume lo que dice `docs/reporte-frontend.md` sobre el código de hoy: ✅ cumple · ⚠️ parcial · ❌ no cumple · — aún no existe la pantalla.

### Usuarios

| Rol | Perfil | Dispositivo principal esperado |
|---|---|---|
| Alumno | Estudiante de tercero de preparatoria que presentará el EXANI-II para entrar a medicina. Estudia bajo presión del examen. | Computadora (mayormente) y teléfono |
| Profesor | Da clases, sube material, crea tareas, quizzes y simuladores y revisa resultados de sus grupos. | Computadora |
| Administración | Aprueba pagos, gestiona módulos y clases y ve estadísticas de todos los grupos. | Computadora |

---

## 1. Facilidad de aprendizaje

### RNF-U-01 · Uso sin capacitación (Alta)
- Un alumno nuevo, con su pago ya aprobado, inicia sesión y comienza un quiz o simulador **sin ayuda ni instructivo, en menos de 2 minutos**.
- Un profesor crea una tarea con fecha de entrega en el calendario **en menos de 3 minutos** la primera vez.
- **Verificación:** prueba con al menos 3 usuarios por rol; se mide el tiempo y si pidieron ayuda.

### RNF-U-02 · Vocabulario del usuario (Media)
- La interfaz usa los términos de la metodología y del HANDOFF, siempre iguales: "Mis alumnos", "Material", "Simuladores y quizzes", "Pagos", "Permisos", "Calendario", "meta".
- Sin jerga técnica en pantalla (ej. "ID", "null", "error 500", "TODO").
- **Estado actual:** ❌ `SimuladoresQuizzes.jsx` muestra un `alert('TODO…')` y Pagos muestra un texto `TODO(rediseno)`.

### RNF-U-03 · Menú según el rol (Alta)
- Cada rol ve **solo** las secciones que puede usar (alumno: Inicio, Módulos, Videoteca, Simuladores y quizzes; profesor: Mis alumnos, Material; admin: lo del profesor más Pagos, Permisos y Módulos).
- No se muestran enlaces a secciones que no existen ("Sección en desarrollo") ni acciones que el rol no puede hacer.
- **Estado actual:** ⚠️ hay combinaciones de rol y sección que caen en "Sección en desarrollo" con el enlace activo.

---

## 2. Eficiencia

### RNF-U-04 · Acciones frecuentes en pocos pasos (Media)

| Acción | Rol | Máximo de clics desde el inicio |
|---|---|---|
| Iniciar un simulador o quiz asignado | Alumno | 2 |
| Ver próxima entrega o simulador | Alumno | 0 (mini calendario siempre visible) |
| Aprobar un pago pendiente | Admin | 3 |
| Mandar aviso de pago a un alumno | Admin | 3 |
| Subir material a una clase | Profesor | 3 (sin contar el selector de archivos) |
| Asignar simulador/quiz con apertura, cierre y grupo | Profesor / Admin | 1 formulario |

### RNF-U-05 · Búsqueda y filtros en listas largas (Media)
- Las tablas de alumnos permiten buscar por nombre, correo o **número de alumno** y filtrar por estado de pago y por grupo/salón.
- La búsqueda responde mientras se escribe (sin botón "Buscar") en listas de hasta 500 alumnos.
- **Estado actual:** ⚠️ el dashboard del admin busca por nombre y correo y filtra por pago; falta número de alumno y grupo.

### RNF-U-06 · El sistema recuerda dónde estaba el usuario (Alta)
- Recargar la página mantiene la sesión y la sección abierta.
- Los botones atrás/adelante del navegador funcionan.
- **Estado actual:** ❌ no hay router; recargar regresa al dashboard y la sesión se pierde.

---

## 3. Prevención de errores y retroalimentación

### RNF-U-07 · Confirmación de acciones destructivas (Alta)
- Eliminar módulo, clase, material, video, quiz, simulador, aviso o evento del calendario y **rechazar un pago** piden confirmación en un diálogo que dice qué se va a borrar.
- El botón de confirmar dice la acción ("Eliminar módulo"), no "Aceptar".
- Cerrar sesión durante un simulador en curso avisa que se perderá el intento.
- **Estado actual:** ❌ eliminar PDF, video y quiz ocurre sin confirmación (ya existe `DialogoConfirmacion.jsx`, falta usarlo).

### RNF-U-08 · Toda acción tiene respuesta visible (Alta)
- Guardar, subir, aprobar, asignar y enviar aviso muestran un mensaje de éxito o error en **menos de 1 segundo** tras completarse, anunciado a lectores de pantalla (`aria-live`).
- Las operaciones de más de 1 segundo (subir archivo, cargar estadísticas) muestran indicador de progreso; la subida de archivos muestra porcentaje.
- **Estado actual:** ❌ no hay toasts ni `aria-live`; crear quiz y subir material cierran el formulario sin mensaje.

### RNF-U-09 · Validación de formularios por campo (Alta)
- Registro e inicio de sesión validan formato de correo y que el rol coincida, con mensajes junto al campo (ej. "Este correo no está registrado como profesor").
- Al asignar simulador/quiz: el cierre no puede ser anterior a la apertura y debe elegirse al menos un grupo.
- Imágenes en preguntas del simulador: se rechazan archivos de más de 5 MB o que no sean imagen, con mensaje claro.
- Los datos escritos **no se borran** cuando hay un error.
- **Estado actual:** ⚠️ solo `required` nativo; el único mensaje real es el de credenciales incorrectas en Login.

### RNF-U-10 · Estados de carga, vacío y error en cada pantalla (Alta)
- Cada lista o panel tiene tres estados diseñados: **cargando**, **vacío** (con explicación y, si aplica, botón para crear el primero) y **error** (con opción de reintentar).
- Ejemplos: "Aún no tienes simuladores asignados", "No hay pagos pendientes", "No hay eventos esta semana".
- **Estado actual:** ❌ 13 de 14 pantallas no tienen estado de carga ni de error (ya existe `EstadoVacio.jsx`).

---

## 4. Flujos específicos de la metodología

### RNF-U-11 · Alumno con pago pendiente (Alta)
- Al registrarse, el alumno ve una pantalla clara: su pago está pendiente, cómo subir su comprobante y que recibirá aviso cuando se apruebe.
- No ve menús ni secciones bloqueadas que no puede usar; no hay un "Acceso denegado" sin explicación.
- Cuando el admin aprueba, el alumno accede en su siguiente inicio de sesión sin pasos extra.

### RNF-U-12 · Revisión de pagos (Media)
- El admin ve el comprobante **en la misma pantalla** que los botones Aprobar / Rechazar, sin descargarlo.
- Los pagos pendientes se distinguen a simple vista en Dashboard y Mis alumnos (pastilla de estado más contador).
- Al rechazar se puede escribir el motivo, que le llega al alumno.

### RNF-U-13 · Calendario (Media)
- El mini calendario de la esquina inferior derecha **no tapa** contenido ni botones en ninguna pantalla; en teléfono se colapsa a un botón.
- Al pasar el cursor (o tocar, en pantallas táctiles) sobre un día se ven los eventos de ese día.
- Cada tipo de evento (simulador, quiz, tarea, material, aviso general) se distingue por **icono y texto**, no solo por color.
- Admin y profesor pueden **editar o eliminar** un aviso, evento, quiz o simulador publicado por error desde el mismo evento del calendario y desde su listado, en **máximo 2 clics**. Eliminar pide confirmación (U-07), y editar muestra el formulario con los datos actuales ya llenos.
- Tras editar o eliminar, el calendario de todos los afectados se actualiza solo y los alumnos reciben un aviso del cambio.
- Si un quiz o simulador ya tiene intentos de alumnos, la interfaz lo indica antes de editar o eliminar ("3 alumnos ya lo contestaron").
- Las fechas y horas se muestran en la zona horaria del usuario, en formato `dd/mm/aaaa` y 24 h o 12 h con a.m./p.m., igual en toda la app.

### RNF-U-14 · Simulador en curso (Alta)
- El tiempo restante siempre está visible y avisa (visual y para lector de pantalla) a los 10 y a los 2 minutos del cierre.
- El alumno ve cuántas preguntas lleva respondidas y puede saltar a cualquiera.
- Si se cae la conexión o se recarga la página, las respuestas no se pierden.
- Antes de entregar, se avisa cuántas preguntas quedan sin responder.
- Las imágenes de las preguntas se pueden ampliar y se ven completas en teléfono.

### RNF-U-15 · Presentación del progreso del alumno (Alta)
Reglas del HANDOFF que afectan la motivación del alumno:
- Lo primero que ve es **cuánto ha subido** desde su primer simulador.
- La **meta** está oculta por defecto; nunca aparece la frase "te faltan X puntos".
- Un resultado más bajo que el anterior se marca en **gris**, no en rojo.
- El puntaje siempre lleva la nota "Estimación. No es resultado oficial del Ceneval."
- Quizzes muestran solo aciertos/total; solo los simuladores muestran puntaje 700–1300.

### RNF-U-16 · Dashboards de admin y profesor legibles de un vistazo (Media)
- Las cifras clave (alumnos, pendientes de pago, promedio por materia, promedio por salón) están en la parte visible sin desplazarse en una pantalla de 1366×768.
- Las gráficas tienen títulos que dicen qué decisión ayudan a tomar, valores al pasar el cursor y una tabla o texto alternativo.
- "Actividad reciente" muestra quién, qué y cuándo en frases cortas (ej. "Ana López terminó Simulador 3 · hace 2 h"). *Pendiente rediseñar según `metodologia.md`.*

---

## 5. Accesibilidad (WCAG 2.2 nivel AA)

### RNF-U-17 · Contraste (Alta)
- Texto normal con contraste mínimo **4.5:1** y texto grande o iconos **3:1** sobre el fondo `#030a1a`.
- Texto secundario mínimo `#cbd5e1`; el más tenue permitido es `rgba(255,255,255,0.6)` (HANDOFF).
- **Estado actual:** ❌ docenas de textos con opacidad 0.18–0.45 que fallan AA.

### RNF-U-18 · Uso completo con teclado (Alta)
- Todas las funciones se pueden usar solo con teclado, en un orden lógico.
- El foco siempre es visible (`:focus-visible`) con contraste 3:1.
- Los modales atrapan el foco, cierran con `Esc` y devuelven el foco al botón que los abrió.
- **Estado actual:** ❌ varios botones-icono quitan el contorno de foco sin reemplazo.

### RNF-U-19 · Lectores de pantalla (Media)
- Botones de solo icono con `aria-label`; imágenes con `alt` (las de preguntas del simulador, con descripción que escribe quien la sube).
- Estructura con `<main>`, `<header>`, `<nav>` y un solo `<h1>` por pantalla.
- Errores de formulario asociados al campo (`aria-describedby`).
- **Estado actual:** ⚠️ los componentes de `rediseno/` cumplen; Admin, Profesor y FileManager no.

### RNF-U-20 · Información que no depende solo del color (Media)
- Estados de pago, estado de clase (Vista / En curso / Pendiente), urgencia del temporizador y tipos de evento usan texto o icono además del color.

### RNF-U-21 · Movimiento reducido (Baja)
- Con `prefers-reduced-motion` activo se quitan las animaciones no esenciales.
- **Estado actual:** ✅ respetado vía CSS.

---

## 6. Adaptabilidad a dispositivos

### RNF-U-22 · Diseño responsivo (Alta)
- Todas las pantallas funcionan **sin desplazamiento horizontal de la página** desde 360 px de ancho hasta escritorio.
- Todas las pantallas se diseñan primero para computadora (uso principal de los tres roles) y se verifican en teléfono; las del alumno (Inicio, Módulos, Videoteca, Simuladores y quizzes, simulador en curso, calendario) deben ser **completamente usables** en teléfono, no solo visibles.
- Las tablas largas se convierten en tarjetas en teléfono o tienen scroll horizontal propio con la primera columna fija.
- **Estado actual:** ⚠️ hay media queries manuales con `!important` y anchos fijos; 13 de 14 páginas no usan breakpoints de Tailwind.

### RNF-U-23 · Áreas táctiles (Alta)
- Todo elemento interactivo mide al menos **44×44 px** (HANDOFF) y hay al menos 8 px entre elementos táctiles vecinos.

### RNF-U-24 · Tiempo de respuesta percibido (Media)
- La primera pantalla útil (login o inicio del alumno) se muestra en **menos de 3 s** en una conexión 4G.
- Cambiar de sección responde en **menos de 1 s**; si tarda más, se muestra indicador de carga.
- **Estado actual:** ⚠️ el login descarga ~1.1 MB de fondo y el bundle JS supera los 800 kB.

---

## 7. Consistencia visual

### RNF-U-25 · Un solo sistema de componentes (Media)
- Botones, pastillas, modales, inputs, tarjetas de estadística y estados vacíos salen de `src/components/rediseno/`.
- Simulador = bloque azul sólido con acento dorado; quiz = bloque de contorno azul claro `#93c5fd`. La distinción se mantiene en listados, calendario y estadísticas.
- Iconos SVG de línea (`lucide-react` / `IconSubject`), sin emojis.
- **Estado actual:** ⚠️ Admin, Profesor y FileManager están fuera del sistema `rediseno/`.

### RNF-U-26 · Mensajes con el mismo tono (Baja)
- Español neutro, en segunda persona ("Tu pago fue aprobado"), sin mayúsculas sostenidas ni signos de exclamación en errores.
- Los mensajes de error dicen qué pasó y qué hacer ("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.").

---

## Resumen de prioridades

| Prioridad | Requisitos |
|---|---|
| **Alta** | U-01, U-03, U-06, U-07, U-08, U-09, U-10, U-11, U-14, U-15, U-17, U-18, U-22, U-23 |
| **Media** | U-02, U-04, U-05, U-12, U-13, U-16, U-19, U-20, U-24, U-25 |
| **Baja** | U-21, U-26 |

## Orden de trabajo por rol

Se termina primero **Administración**, luego **Profesor** y al final **Alumno**. Los requisitos transversales (accesibilidad, responsivo, consistencia) se cumplen desde la primera pantalla de cada rol, no se dejan para el final.

| Orden | Rol | Requisitos que aplican | Pantallas |
|---|---|---|---|
| 1 | Administración | U-03, U-04 (pagos y avisos), U-05, U-06, U-07, U-08, U-09 (registro, login y rol), U-10, U-11 (lado del admin: aprobar), U-12, U-13 (crear eventos y elegir audiencia), U-16 | Login, Dashboard, Mis alumnos, Pagos, Permisos, Módulos y clases, Simuladores, Estadísticas, Calendario |
| 2 | Profesor | U-01 (crear tarea), U-03, U-04 (material y asignación), U-07, U-08, U-09 (asignación de simulador/quiz), U-10, U-13 (eventos por grupo), U-16 | Mis alumnos, Material, tareas, Simuladores y quizzes, Calendario |
| 3 | Alumno | U-01 (iniciar quiz/simulador), U-04 (alumno), U-10, U-11 (lado del alumno: pago pendiente), U-13 (solo vista), U-14, U-15 | Inicio, Módulos, Videoteca, Simuladores y quizzes, simulador en curso, Calendario |
| Todos | Transversal | U-02, U-17 a U-26 | Todas |

## Valores por confirmar con el equipo

Estos números los propuse como punto de partida; ajustarlos si no reflejan la realidad del proyecto:

- Tiempos de aprendizaje de U-01 (2 y 3 minutos).
- Máximo de clics de U-04.
- Avisos del temporizador a los 10 y 2 minutos (U-14).
- Tamaño de lista para búsqueda en vivo (500 alumnos, U-05).
- Meta de carga de 3 s en 4G (U-24).
- Formato de hora (24 h o 12 h) en U-13.
