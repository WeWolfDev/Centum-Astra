# REQUISITOS FUNCIONALES — Centum Astra
> Plataforma educativa de preparación EXANI-II para carreras de salud
> Generado: 2026-09-09 | Stack: React 19 · Vite 8 · Tailwind 3

---

## FASE 1 — IMPLEMENTADO (Front-End Design)

Todo lo que existe hoy es UI/UX con datos simulados (`src/data/mockData.js`). No hay persistencia real ni backend.

---

### RF-01 · Autenticación por Rol (UI)

- **Pantalla de login** (`Login.jsx`) con selector de tres roles: Administrador, Profesor, Alumno.
- Credenciales de demostración autocompletadas al seleccionar un rol.
- Video de fondo espacial (`space.mp4`) que se carga diferido post-LCP para no bloquear el primer renderizado.
- Campo de contraseña con toggle show/hide y animación de borde al foco.
- Mensaje de error animado cuando las credenciales no coinciden.
- **Roles disponibles:** `admin`, `teacher`, `student`.

### RF-02 · Layout Principal y Navegación

- **Sidebar** de 232 px con logotipo, avatar de usuario y badge de rol.
  - Admin: Dashboard · Alumnos · Módulos · Videoteca · Simulador · Estadísticas.
  - Profesor: Mi Panel · Módulos · Videoteca · Simulador · Estadísticas.
  - Alumno: Mi progreso · Módulos · Videoteca · Simulador.
- En **móvil** (< 768 px): sidebar se oculta como drawer con overlay de cierre al tap.
- **Header** con título de sección (desktop) o logo + hamburger (móvil), chip de bienvenida con avatar inicial, fecha dinámica.
- Transición animada entre secciones con Framer Motion (`AnimatePresence`).
- Campo de estrellas animadas (`Stars.jsx`) y blobs de gradiente permanentes como fondo global.

### RF-03 · Dashboard Administrador

- **4 stat cards** con KPIs del sistema: total alumnos, activos, progreso promedio, calificación media.
- **Tabla de alumnos** con columnas: nombre/email, módulo, barra de progreso, quizzes, promedio, estado de pago.
- **Búsqueda en tiempo real** por nombre o email.
- **Filtro** por estado de pago: Todos · Aprobados · Pendientes.
- Botones de acción por fila: Ver / Aprobar (solo si pendiente).
- Fondo de textura dot-grid.

### RF-04 · Dashboard Profesor

- **3 stat cards** accionables: mis alumnos, promedio del grupo, sesiones esta semana.
- **Gráfica de evolución semanal** (LineChart): promedio del grupo vs. calificación máxima.
- **Ranking del grupo** con barra de progreso horizontal y badge de posición (oro/plata).
- Botón de acceso rápido a Estadísticas.

### RF-05 · Dashboard Alumno

- **Banner de bienvenida** con astronauta decorativo (oculto en móvil), nombre del alumno y subtítulo de puntos faltantes para completar preparación.
- **Anillo de progreso SVG** con gradiente dorado, marcas de cuartil y puntos de constelación para cada módulo.
- **3 stats inline** en píldora: Quizzes completados, Racha diaria, Promedio general.
- **Gráfica de resultados recientes** (BarChart) con últimos 5 quizzes.
- **Grid de módulos** con tarjetas diferenciadas: azul/dorado para Transversales, teal para Clínicas.
  - Cada tarjeta muestra: icono emoji, tipo (Transversal/Específico), nombre, contador de recursos/temas, barra de progreso animada.
  - Clic navega directamente a Módulos con el módulo seleccionado.

### RF-06 · Módulos y Gestión de Sesiones (`FileManager.jsx`)

- **Selector de módulo** con pestañas horizontales (5 módulos: 3 transversales + 2 clínicos) con indicador activo animado.
- **Vista basada en sesiones**: cada módulo tiene 2-3 sesiones predefinidas, cada sesión contiene recursos y videos.
- **Toggle de visibilidad por sesión** (Eye/EyeOff, solo staff): controla si la sesión es visible para alumnos.
- **Upload de recursos** por sesión: modal con selector de archivo PDF/Excel/PPT, auto-detección de tipo, nombre editable.
- **Videos integrados por sesión**: cada sesión muestra sus clases grabadas con miniatura de gradiente, duración y badge "REC".
- **Creación de sesiones adicionales** mediante modal "Nueva sección de clase" (solo staff).
- Alumnos ven únicamente sesiones marcadas como visibles; staff ven todas con indicador de estado.
- Descarga mock de recursos (UI completa, sin backend real).

### RF-07 · Videoteca Global (`VideoLibrary.jsx`)

- Grid responsivo de tarjetas de video (1/2/3 columnas según breakpoint).
- **Filtros por materia** con chips de color codificado.
- **Búsqueda** por título o instructor.
- Cada tarjeta muestra: thumbnail de gradiente temático, título, instructor, duración, vistas.
- **Modal de reproducción** con placeholder "[Vista previa · Conectar a Zoom/Drive]".
- Staff puede **subir nuevas sesiones** (modal con picker de video, título, materia, duración).
- Los videos nuevos se agregan al inicio de la lista en la sesión actual.

### RF-08 · Simulador EXANI-II (`ExamSimulator.jsx`)

- **Home**: listado de simuladores disponibles (1 oficial precargado + personalizados). Staff puede crear y eliminar simuladores.
- **QuizBuilder** (solo staff): creación de simuladores con título, materia, tiempo límite, preguntas ilimitadas.
  - Por pregunta: enunciado en textarea, 4 opciones, selector de respuesta correcta con radio button, campo de explicación.
  - **Adjunto de imagen por reactivo**: upload con FileReader, límite de 5 MB, preview con botón de quitar.
- **Toma de examen**: temporizador regresivo con barra de progreso de color (azul → amarillo → rojo urgente), navegador de preguntas con estados visual (activa/respondida/sin responder), opciones con retroalimentación visual post-respuesta, panel de explicación expandible.
- **Reporte CENEVAL** al finalizar:
  - Puntuación en escala 700–1300 con gradiente animado.
  - Zona de desempeño: Insuficiente (700–849) · Básico (850–999) · Satisfactorio (1000–1149) · Destacado (1150–1300).
  - Barra de escala nacional con punto indicador animado.
  - Desglose por área: Transversales (dorado) y Clínicas (teal) con barras de progreso.
  - Acciones: Repetir / Ver simuladores.

### RF-09 · Pizarra Colaborativa (`Whiteboard.jsx`) (no fundamental -yet)

- Lienzo de dibujo libre (solo Admin y Profesor; alumnos no tienen acceso).
- Herramientas: lápiz, borrador, paleta de colores, grosor de trazo.
- Exportar como PNG: descarga local al equipo del usuario.

### RF-10 · Estadísticas Admin/Profesor (`Statistics.jsx`)

- **2 KPI cards** accionables: Tasa de aprobación (78%), Alumnos evaluados (312).
- **BarChart "Rendimiento por Materia"** a ancho completo — con subtítulo accionable "Identifica qué área necesita refuerzo urgente".
- **LineChart "Evolución Semanal"** a ancho completo — con subtítulo "Detecta tendencias y ajusta el plan de estudio" — doble serie: promedio del grupo vs. calificación máxima.

### RF-11 · Responsividad

- Breakpoints cubiertos: móvil (< 480 px) · teléfono (480–767 px) · tablet (768–1023 px) · desktop (≥ 1024 px).
- Sidebar como drawer en móvil; grids de 4 cols → 2 cols → 1 col según viewport.
- Login: panel izquierdo oculto en móvil (solo formulario visible).
- Imágenes decorativas ocultas en móvil (`resp-hide-mobile`).
- Video de fondo: no bloquea interacción (`pointer-events: none`).
- Tablas con `overflow-x: auto` para scroll horizontal en móvil.

### RF-12 · Diseño y Accesibilidad

- Sistema de diseño glassmorphism: `bg-white/5`, `backdrop-blur`, bordes `rgba`.
- Paleta: dorado `#f5c842 / #b8880f`, teal `#2dd4bf`, navy `#030a1a`.
- Tipografía: Plus Jakarta Sans (cuerpo) · Syne (display/headings) · Orbitron (brand).
- Animaciones con Framer Motion; respeta `prefers-reduced-motion` vía CSS.
- Selección de texto con color dorado temático.
- Grain de película sobre body para profundidad visual (SVG feTurbulence, sin costo de GPU).

---

## FASE 2 — PENDIENTE A FUTURO (Back-End & Lógica de Producción)

Lo que falta para pasar del diseño funcional al sistema operativo real.

---

### BE-01 · Autenticación Real

- Reemplazar `mockUsers` con llamadas a API REST o GraphQL.
- Integrar JWT / OAuth 2.0 (Google, Microsoft) para SSO institucional.
- Persistencia de sesión en `localStorage` o cookie HttpOnly — actualmente se pierde al recargar la página.
- Roles y permisos validados en servidor, no solo en UI.
- Flujo de recuperación de contraseña.

### BE-02 · Base de Datos de Alumnos y Pagos

- Modelo de usuario: `User { id, name, email, passwordHash, role, createdAt }`.
- Modelo de pago: `Payment { userId, status, plan, expiresAt }`.
- CRUD real para la tabla de alumnos del admin (actualmente los botones "Ver" y "Aprobar" no persisten).
- Notificaciones de aprobación de pago por email.

### BE-03 · Módulos y Sesiones Persistentes

- Base de datos de módulos y sesiones (MongoDB o PostgreSQL).
- Upload real de recursos (PDF/PPT/Excel) a storage en la nube (S3, GCS, o Cloudflare R2).
- URLs firmadas con expiración para proteger el acceso a archivos.
- Control de visibilidad de sesiones por grupo o alumno individual (RF-08 grupos A1/A2/A3).
- Progreso de alumno por módulo guardado en DB.

### BE-04 · Videoteca con Streaming Real

- Integración con proveedor de video: Zoom (grabaciones automáticas), Vimeo Pro, Bunny.net, o YouTube privado.
- Metadatos en DB (título, instructor, materia, duración, thumbnail real).
- Control de acceso: un alumno solo ve los videos de los módulos de su plan.
- Contador de vistas real.
- Player con tracking de % visto (para marcar sesión como "vista").

### BE-05 · Simuladores y Resultados Persistentes

- Banco de preguntas en DB con soporte para imagen por reactivo (URLs a storage).
- Guardar resultado de cada intento: `ExamResult { userId, quizId, score, cenevalScore, answers, duration, completedAt }`.
- Historial de intentos por alumno para mostrar progreso real en los gráficos.
- Tiempo de examen manejado en servidor (anti-trampa) — actualmente es solo un countdown en cliente.
- Validación de respuestas en servidor antes de mostrar resultados.

### BE-06 · Grupos (A1/A2/A3)

- Modelo de grupo: `Group { id, name, teacherId, studentIds[], moduleVisibility{} }`.
- Admin asigna alumnos a grupos; profesor gestiona visibilidad de sesiones por grupo.
- Dashboard de profesor filtrado al grupo asignado (actualmente muestra todos los alumnos mock).
- Estadísticas segmentadas por grupo.

### BE-07 · Estadísticas en Tiempo Real

- Conectar `Statistics.jsx` a endpoints reales que agreguen datos de la DB.
- Métricas calculadas en servidor: tasa de aprobación, promedio de grupo, evolución semanal.
- Caché de métricas (Redis o similar) para no recalcular en cada petición.
- Posibilidad de exportar reporte en PDF (admin).

### BE-08 · Pizarra Colaborativa

- Sincronización en tiempo real via WebSockets (Socket.io o Supabase Realtime).
- Guardar canvas como imagen en storage para referencia posterior.
- Sesiones de pizarra vinculadas a una clase o módulo específico.

### BE-09 · Notificaciones y Comunicación

- Sistema de avisos in-app (nuevas sesiones publicadas, resultado de quiz, próximas clases).
- Integración con WhatsApp Business API o email transaccional (SendGrid/Resend) para recordatorios.
- Reemplazar el Foro eliminado (si se reintegra) con un sistema de mensajería real (Intercom, Crisp, o custom).

### BE-10 · Infraestructura de Despliegue

- Variables de entorno en `.env` para API keys, DB URL, storage buckets.
- CI/CD con GitHub Actions (ya existe `.github/workflows/deploy.yml`).
- Separar build de frontend (Vite → CDN) del backend (Node/Fastify o Python/FastAPI).
- CORS configurado correctamente entre dominio de frontend y API.
- HTTPS obligatorio; cabeceras de seguridad (CSP, HSTS, X-Frame-Options).

---

## Mapa de Archivos Críticos

```
src/
├── App.jsx                         # Router por estado, layout principal
├── context/AuthContext.jsx          # Proveedor de sesión (reemplazar con JWT)
├── data/mockData.js                 # Todos los datos simulados (reemplazar con API)
├── components/
│   ├── auth/Login.jsx               # Pantalla de acceso
│   ├── layout/Sidebar.jsx           # Navegación por rol
│   ├── layout/Header.jsx            # Barra superior
│   ├── admin/AdminDashboard.jsx     # Panel Admin
│   ├── admin/Statistics.jsx         # Gráficas Admin/Profesor
│   ├── teacher/TeacherDashboard.jsx # Panel Profesor
│   ├── student/StudentDashboard.jsx # Panel Alumno
│   ├── modules/FileManager.jsx      # Vista de sesiones y recursos
│   ├── video/VideoLibrary.jsx       # Catálogo de videos
│   ├── exam/ExamSimulator.jsx       # Simulador + Reporte CENEVAL
│   ├── whiteboard/Whiteboard.jsx    # Pizarra (solo staff)
│   └── ui/Stars.jsx                 # Componente decorativo global
├── hooks/useBreakpoint.js           # Detección de viewport
├── lib/utils.js                     # cn() helper (clsx + tailwind-merge)
└── index.css                        # Sistema de diseño completo (tokens, componentes, responsive)

public/
├── space.mp4                        # Video de fondo login
├── logo-astra.jpeg                  # Logo de la plataforma
├── timrael-space-4984262_1920.jpg   # Imagen estática de fondo login (poster del video)
├── math.jpg / spanish.jpg           # Texturas módulos transversales
├── fernandozhiminaicela-*.jpg       # Textura módulos clínicos
├── poldychromos-astronaut-*.jpg     # Imagen decorativa dashboard alumno
└── favicon.svg                      # Ícono de pestaña
```

---

## Notas Técnicas para el Equipo Backend

1. **Chunk size warning**: El bundle JS (895 kB minificado) supera el límite recomendado de Vite. Al integrar el backend, implementar **code splitting** con `React.lazy()` para cargar ExamSimulator, VideoLibrary y Whiteboard bajo demanda. Recharts y Framer Motion son las principales causas del tamaño.

2. **Sin react-router-dom**: La navegación actual es 100% por estado (`activeSection`). Si se requieren URLs directas (para compartir un módulo o simulador específico), se debe agregar `react-router-dom` de vuelta e implementar rutas reales.

3. **Datos mock en mockData.js**: La forma de los objetos (campos, tipos) es la referencia contractual para el equipo de back-end al diseñar el API. Respetar los nombres de campo minimiza refactoring en el front.

4. **Autenticación**: Actualmente `AuthContext.jsx` es 15 líneas. Al integrar JWT, reemplazarlo manteniendo la misma interfaz pública (`user`, `login`, `logout`, `error`, `setError`) para no tocar los demás componentes.
