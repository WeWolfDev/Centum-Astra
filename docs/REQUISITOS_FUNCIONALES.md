# REQUISITOS FUNCIONALES Y NO FUNCIONALES — Centum Astra
> Plataforma educativa de preparación EXANI-II para carreras de salud
> Actualizado: 2026-10-17 | Fuente: README y pantallas actuales del frontend

---

## FASE 1 — IMPLEMENTADO (Front-End Design)

Este documento distingue entre los flujos visibles en el frontend y su estado real. El frontend sirve como prototipo navegable, pero los datos provienen de mocks o estado en memoria: no hay autenticación real, persistencia, pagos, carga de archivos al servidor ni integración con servicios externos. Por ello, una pantalla o confirmación visual no implica que la operación se haya completado en producción.

Los requisitos de esta fase se extrajeron del README y de las pantallas existentes. La Fase 2 recoge capacidades necesarias para convertir esos flujos en un producto operativo. Los objetivos no funcionales con métricas son una propuesta inicial que debe validarse con negocio antes de usarse como compromiso de servicio.

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

- **4 stat cards** con KPIs de demostración: total alumnos, activos, progreso promedio, calificación media.
- **Tabla de alumnos** con columnas: nombre/email, módulo, barra de progreso, quizzes, promedio, estado de pago.
- **Búsqueda en tiempo real** por nombre o email.
- **Filtro** por estado de pago: Todos · Aprobados · Pendientes.
- La interfaz presenta botones de acción por fila: Ver / Aprobar (solo si pendiente); su efecto no está conectado a datos persistentes.
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

### RF-09 · Estadísticas Admin/Profesor (`Statistics.jsx`)

- **2 KPI cards** accionables: Tasa de aprobación (78%), Alumnos evaluados (312).
- **BarChart "Rendimiento por Materia"** a ancho completo — con subtítulo accionable "Identifica qué área necesita refuerzo urgente".
- **LineChart "Evolución Semanal"** a ancho completo — con subtítulo "Detecta tendencias y ajusta el plan de estudio" — doble serie: promedio del grupo vs. calificación máxima.
- Las cifras y gráficas se alimentan de `mockStats`; no son métricas calculadas en tiempo real.

### RF-10 · Responsividad

- Breakpoints cubiertos: móvil (< 480 px) · teléfono (480–767 px) · tablet (768–1023 px) · desktop (≥ 1024 px).
- Sidebar como drawer en móvil; grids de 4 cols → 2 cols → 1 col según viewport.
- Login: panel izquierdo oculto en móvil (solo formulario visible).
- Imágenes decorativas ocultas en móvil (`resp-hide-mobile`).
- Video de fondo: no bloquea interacción (`pointer-events: none`).
- Tablas con `overflow-x: auto` para scroll horizontal en móvil.

### RF-11 · Diseño y Accesibilidad

- Sistema de diseño glassmorphism: `bg-white/5`, `backdrop-blur`, bordes `rgba`.
- Paleta: dorado `#f5c842 / #b8880f`, teal `#2dd4bf`, navy `#030a1a`.
- Tipografía: Plus Jakarta Sans (cuerpo) · Syne (display/headings) · Orbitron (brand).
- Animaciones con Framer Motion; CSS reduce las animaciones cuando el sistema solicita `prefers-reduced-motion`. Esto no representa por sí solo una conformidad de accesibilidad.
- Selección de texto con color dorado temático.
- Grain de película sobre body para profundidad visual (SVG feTurbulence, sin costo de GPU).

### RF-12 · Sitio público, cursos y prueba de muestra

- La página pública presenta la propuesta de preparación EXANI-II, testimonios, indicadores promocionales y el plan de acceso completo.
- La navegación pública permite abrir un selector de cursos y probar una muestra de preguntas para Pensamiento Matemático, Redacción Indirecta, Comprensión Lectora o Pre-medicina.
- Cada prueba de muestra permite responder reactivos, muestra retroalimentación y explicación, controla un tiempo y presenta un resultado al terminar o agotarse el tiempo.
- El botón principal de la página desplaza a la sección de registro; los accesos de inicio de sesión abren la pantalla de login.
- Los testimonios, cifras promocionales, contenidos, precio y resultados de muestra son contenido fijo de demostración y no deben presentarse como datos verificados o personalizados.

### RF-13 · Registro y solicitud de acceso

- El formulario solicita nombres, apellidos, celular, estado de residencia y correo electrónico; todos los campos se marcan como obligatorios y el correo usa validación básica del navegador.
- Al enviar el formulario, la interfaz muestra una confirmación con el correo ingresado.
- **Límite actual:** el envío solo espera y cambia el estado visual; no crea una cuenta, registra una solicitud, cobra el precio mostrado ni envía un correo. La activación y el pago reales quedan pendientes de la Fase 2.

---

## REQUISITOS NO FUNCIONALES (objetivos propuestos)

Las siguientes metas no pueden inferirse completamente de las pantallas. Se proponen para orientar el paso a producción y requieren validación de negocio y técnica.

### RNF-01 · Diseño adaptable

- La experiencia debe permitir completar los flujos principales en móvil, tablet y escritorio, desde 360 px de ancho; no debe aparecer desbordamiento horizontal salvo en tablas con desplazamiento intencional.
- **Verificación:** probar al menos 360, 768, 1024 y 1440 px de ancho en landing, login, paneles, módulos, videoteca y simulador.

### RNF-02 · Accesibilidad

- Meta propuesta: conformidad WCAG 2.2 nivel AA en los flujos principales.
- Todas las acciones deben poder operarse con teclado, tener foco visible y nombre accesible; los errores, estados y respuestas no deben comunicarse únicamente mediante color.
- Los formularios deben asociar etiquetas con controles y anunciar errores y confirmaciones; las animaciones deben respetar la preferencia de movimiento reducido.
- **Nota:** el frontend actual no ha sido auditado contra WCAG; esta meta requiere validación y correcciones antes de declarar conformidad.

### RNF-03 · Rendimiento percibido

- Meta propuesta en producción: LCP de hasta 2.5 s e INP de hasta 200 ms en el percentil 75, medidos en móvil bajo condiciones de red acordadas.
- La carga de contenido decorativo pesado, como el video de fondo, no debe bloquear el acceso o la interacción con el contenido principal.

### RNF-04 · Seguridad de cuentas y permisos

- La autenticación y autorización deben verificarse en el servidor para cada operación protegida; ocultar controles en la interfaz no es suficiente.
- Las contraseñas deben almacenarse con hash seguro; las sesiones deben protegerse contra robo y fijación, y el tráfico debe usar HTTPS.
- Los datos sensibles y secretos no deben incorporarse al bundle público del frontend.

### RNF-05 · Privacidad de datos

- La plataforma debe limitar la recopilación y el acceso a los datos personales al propósito educativo y administrativo autorizado.
- El registro y cualquier pago real deben informar al usuario qué datos se recaban y cómo se usan antes de enviarlos; los datos de pago deben procesarse mediante un proveedor adecuado, no almacenarse directamente en el frontend.

### RNF-06 · Persistencia e integridad

- Una vez confirmadas, las cuentas, pagos, publicaciones de materiales, cambios de visibilidad y resultados de simulador deben conservarse al cerrar sesión, recargar o cambiar de dispositivo.
- Las operaciones que cambien pagos, permisos o resultados deben ser verificables y no deben mostrar éxito si la operación no fue confirmada por el servicio correspondiente.

### RNF-07 · Disponibilidad

- Objetivo inicial propuesto: disponibilidad mensual de 99.5% para login y acceso a los recursos principales, excluyendo mantenimientos anunciados.
- **Pendiente de validar:** horario de operación, ventana de mantenimiento y consecuencias de indisponibilidad para las sesiones o exámenes en curso.

### RNF-08 · Compatibilidad

- La interfaz debe funcionar en las versiones estables actuales y las dos anteriores de Chrome, Edge, Firefox y Safari, así como en Safari de iOS y Chrome de Android.
- Los flujos críticos no deben depender exclusivamente de hover, cursor o reproducción automática de audio/video.

### RNF-09 · Idioma y consistencia

- La interfaz de usuarios debe presentarse en español de México, con formatos comprensibles para fechas, teléfonos y puntuaciones.
- Las cifras promocionales, los datos de ejemplo y las calificaciones simuladas deben identificarse claramente como demostración cuando se presenten como tales.

### RNF-10 · Mantenibilidad y observabilidad

- La integración futura con servicios debe conservar responsabilidades claras entre interfaz, autenticación, persistencia y proveedores externos.
- Los errores operativos deben registrarse sin exponer contraseñas, tokens, datos personales innecesarios ni información de pago; las operaciones críticas deben poder monitorearse.

---

## FASE 2 — PENDIENTE A FUTURO (Back-End & Lógica de Producción)

Lo que falta para pasar del diseño funcional al sistema operativo real.

---

### BE-01 · Autenticación Real

- Reemplazar `mockUsers` con llamadas a API REST o GraphQL.
- Integrar JWT / OAuth 2.0 (Google, Microsoft) para SSO institucional.
- Persistencia de sesión segura (preferentemente cookie `HttpOnly`, `Secure` y `SameSite`) — actualmente se pierde al recargar la página.
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
- Control de visibilidad de sesiones por grupo o alumno individual; la estructura y asignación de grupos (por ejemplo A1/A2/A3) está pendiente de definición.
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

### BE-08 · Notificaciones y Comunicación

- Sistema de avisos in-app (nuevas sesiones publicadas, resultado de quiz, próximas clases).
- Integración con WhatsApp Business API o email transaccional (SendGrid/Resend) para recordatorios.
- Reemplazar el Foro eliminado (si se reintegra) con un sistema de mensajería real (Intercom, Crisp, o custom).

### BE-09 · Infraestructura de Despliegue

- Variables de entorno en `.env` para API keys, DB URL, storage buckets.
- Revisar y definir CI/CD. En el repositorio inspeccionado existe `.github/workflows/pr.yml`; no se encontró un workflow de despliegue llamado `deploy.yml`.
- Separar build de frontend (Vite → CDN) del backend (Node/Fastify o Python/FastAPI).
- CORS configurado correctamente entre dominio de frontend y API.
- HTTPS obligatorio; cabeceras de seguridad (CSP, HSTS, X-Frame-Options).

---

## Mapa de Archivos Críticos

```
src/
├── App.jsx                          # Navegación por estado y composición de vistas
├── context/AuthContext.jsx           # Autenticación local de demostración
├── data/mockData.js                  # Usuarios, alumnos, módulos, videos y reactivos simulados
├── components/layout/                # Navegación pública, header y sidebar por rol
├── pages/
│   ├── landing/LandingPage.jsx       # Página pública, prueba de muestra y formulario
│   ├── auth/Login.jsx                # Acceso de demostración
│   ├── admin/                        # Panel administrativo y estadísticas
│   ├── teacher/TeacherDashboard.jsx  # Panel del profesor
│   ├── student/StudentDashboard.jsx  # Panel del alumno
│   ├── modules/FileManager.jsx       # Módulos, sesiones y recursos
│   ├── video/VideoLibrary.jsx        # Videoteca
│   ├── exam/ExamSimulator.jsx        # Simuladores y reporte
├── hooks/useBreakpoint.js            # Detección de viewport
└── index.css                         # Estilos y reglas responsive

public/
├── space.mp4                         # Video decorativo de fondo
├── logo-astra.jpeg                   # Logotipo
└── imágenes de fondo y materias     # Recursos visuales del prototipo
```

## Supuestos y decisiones pendientes

- Los roles, grupos, permisos y tipos de usuario descritos son los que muestra el prototipo; los permisos definitivos requieren validación de negocio.
- La página promociona un pago único de $1,499 MXN con seis meses de vigencia, pero no implementa procesamiento de pago. El precio, la vigencia, la garantía y las afirmaciones promocionales deben confirmarse antes de producción.
- Los módulos visibles incluyen Pre-medicina y Ciencias de la Salud en el panel, mientras que el selector público de cursos muestra Pre-medicina como curso específico. Se debe confirmar el catálogo definitivo y qué cursos corresponden a cada plan.
- La escala 700–1300 se presenta como reporte visual de práctica; no hay evidencia en el frontend de que la fórmula replique el método oficial de conversión CENEVAL.
- No se definieron requisitos de carga, retención legal, recuperación ante desastres ni volumen concurrente; deben acordarse antes de dimensionar la arquitectura.

---

## Notas Técnicas para el Equipo Backend

1. **Chunk size warning**: El bundle JS (895 kB minificado) supera el límite recomendado de Vite. Al integrar el backend, implementar **code splitting** con `React.lazy()` para cargar ExamSimulator y VideoLibrary bajo demanda. Recharts y Framer Motion son las principales causas del tamaño.

2. **Sin react-router-dom**: La navegación actual es 100% por estado (`activeSection`). Si se requieren URLs directas (para compartir un módulo o simulador específico), se debe agregar `react-router-dom` de vuelta e implementar rutas reales.

3. **Datos mock en mockData.js**: La forma de los objetos (campos, tipos) es la referencia contractual para el equipo de back-end al diseñar el API. Respetar los nombres de campo minimiza refactoring en el front.

4. **Autenticación**: Actualmente `AuthContext.jsx` es 15 líneas. Al integrar JWT, reemplazarlo manteniendo la misma interfaz pública (`user`, `login`, `logout`, `error`, `setError`) para no tocar los demás componentes.
