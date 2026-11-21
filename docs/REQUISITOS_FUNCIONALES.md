# REQUISITOS FUNCIONALES Y NO FUNCIONALES — Centum Astra
> Plataforma educativa de preparación EXANI-II para carreras de salud
> Revisado: 2026-10-25 | Fuente: implementación actual de `src/` y configuración del repositorio

---

## FASE 1 — PROTOTIPO FRONTEND DISPONIBLE

Este documento distingue entre los flujos visibles en el frontend y su estado real. El frontend sirve como prototipo navegable, pero los datos provienen de mocks o estado en memoria: no hay autenticación real, persistencia, pagos, carga de archivos al servidor ni integración con servicios externos. Por ello, una pantalla o confirmación visual no implica que la operación se haya completado en producción.

Los requisitos de esta fase se contrastaron con los componentes montados en `App.jsx`, no solo con páginas o mockups que siguen en el repositorio. La Fase 2 recoge capacidades necesarias para convertir esos flujos en un producto operativo. Los objetivos no funcionales con métricas son una propuesta inicial que debe validarse con negocio antes de usarse como compromiso de servicio.

### Resultado de la revisión del frontend

- La aplicación es un prototipo navegable: autenticación, alumnos, métricas, publicaciones y progreso usan datos mock o estado en memoria; no hay API ni persistencia.
- Las rutas que se muestran dependen del rol y del estado de navegación en `App.jsx`. La existencia de un componente no significa que el usuario pueda llegar a él desde la interfaz.
- El menú de cada rol sigue la matriz de permisos aprobada (#37): el profesor solo arma quizzes, el administrador además simuladores, y Pagos muestra "disponible pronto" hasta #53. Videoteca aparece solo en el menú de alumno.
- Las pantallas que todavía leen `mockData.js` (dashboard del alumno, Módulos, Material, Videoteca y evaluaciones) muestran el aviso "Datos de ejemplo".
- `Statistics.jsx`, `ExamSimulator.jsx`, `FileManager.jsx` y `Whiteboard.jsx` se retiraron en #37 porque no se podían abrir desde ningún menú; siguen en el historial de git.
- Los controles de “Ver”, “Aprobar”, subida, creación y reproducción no deben interpretarse como operaciones completadas: varios solo modifican estado local o muestran una interfaz sin persistir/enviar el archivo.

---

### RF-01 · Autenticación por Rol (UI)

- **Pantalla de login** (`Login.jsx`) con correo y contraseña. En desarrollo ofrece acceso rápido para tres cuentas mock: Administrador, Profesor y Alumno.
- La validación compara contra `mockUsers` en el cliente; no es autenticación real. La opción de acceso rápido está condicionada a `import.meta.env.DEV`.
- El formulario incluye validación HTML básica, estado visual de carga y anuncio accesible del error.
- **Roles disponibles:** `admin`, `teacher`, `student`.

### RF-02 · Layout Principal y Navegación

- **Sidebar** de 232 px con logotipo, avatar de usuario y badge de rol.
  - Admin: “Mis alumnos” (resumen; el listado completo se abre desde “Ver todos”), Material, Simuladores y quizzes, Pagos (marcado como pendiente/sin pantalla funcional).
  - Profesor: Mis alumnos, Material, Simuladores y quizzes.
  - Alumno: Inicio, Módulos, Videoteca, Simuladores y quizzes.
- Estadísticas está conectada como sección en `App.jsx`, pero no tiene acceso visible desde los menús actuales ni un enlace desde los dashboards.
- En **móvil** (< 768 px): sidebar se oculta como drawer con overlay de cierre al tap.
- **Header** con título de sección, navegación móvil y fecha dinámica.
- Transición animada entre secciones con Framer Motion (`AnimatePresence`). Los elementos decorativos descritos en mockups no deben contarse como capacidades funcionales.

### RF-03 · Dashboard Administrador

- **Vista resumen** con 4 tarjetas KPI de demostración y una vista previa de alumnos recientes.
- **Listado de alumnos** con columnas: nombre/email, módulo, progreso, quizzes, promedio y estado de pago.
- **Búsqueda en tiempo real** por nombre o email.
- **Filtro** por estado de pago: Todos · Aprobados · Pendientes.
- Los botones por fila “Ver” y “Aprobar” no ejecutan una acción persistente; el filtro actual no incluye la opción “Rechazados”.
- Fondo de textura dot-grid.

### RF-04 · Dashboard Profesor

- Vista “Mis alumnos” con búsqueda por nombre y filtro “Todos / Requieren atención”.
- Resumen mock del grupo: cantidad de alumnos, promedio del último simulador y variación; lista con serie histórica sintética, avance de quizzes y señal de atención.
- Los datos se derivan de `mockStudents`; actualmente no se filtran por profesor o grupo y la serie no es historial real.
- No hay enlace visible a Estadísticas desde el menú del profesor.

### RF-05 · Dashboard Alumno

- Saludo personalizado, acceso visual a “Continuar clase” (el destino/contenido mostrado es fijo) y sección de puntaje/progreso estimado.
- La gráfica/historial y puntaje CENEVAL son derivados de datos mock; no equivalen a intentos reales ni a una conversión oficial.
- Presenta material/módulos y permite navegar a Módulos o Simuladores y quizzes.
- La meta mostrada es fija/configurada en el frontend, no una meta guardada por alumno.

### RF-06 · Módulos y material

- La vista de alumno (`Modulos.jsx`) y la de admin/profesor (`Material.jsx`) muestran áreas y clases con recursos PDF y videos de ejemplo.
- El alumno puede expandir las clases y ver el estado de avance derivado de mocks; el personal puede crear clases y agregar recursos desde modales.
- El selector de archivo solo recoge metadatos/nombre y tamaño; el archivo no se carga ni se almacena. La gestión añadida mediante `MaterialContext` se pierde al recargar.
- El visor/descarga real de archivos y reproducción de video no están conectados a un proveedor.
- La visibilidad de sesiones predefinidas depende de `visible` en los datos mock; en la pantalla actual no hay control para cambiar esa propiedad. La administración de visibilidad descrita en el antiguo `FileManager.jsx` no está conectada.

### RF-07 · Videoteca Global (`VideoLibrary.jsx`)

- Está disponible en el menú del alumno; admin y profesor no tienen acceso visible desde su navegación actual.
- Muestra videos mock con filtros por materia, búsqueda y metadatos.
- La acción de reproducción no inicia un reproductor. El modal de carga lee nombre/título/datos, pero no envía el archivo; los cambios son locales.
- El modal de carga no es accesible desde la navegación actual de admin/profesor.

### RF-08 · Simuladores y quizzes

- Para el administrador, `MaestroQuizzes.jsx` permite crear/eliminar simuladores y quizzes por materia; el profesor solo quizzes; se agregan preguntas con enunciado, cuatro opciones, respuesta correcta y explicación. El estado se conserva solo durante la sesión.
- Para alumno, `SimuladoresQuizzes.jsx` muestra historial/gráficas y quizzes generados a partir de mocks. El CTA para iniciar simulador está deshabilitado (“Próximamente”).
- No hay pantalla de examen montada: temporizador, evaluación cronometrada y reporte de examen llegan con #36.
- No hay persistencia de preguntas/resultados ni cálculo oficial de puntaje CENEVAL.

### RF-09 · Estadísticas Admin/Profesor

- No hay página de estadísticas: la anterior (`Statistics.jsx`) usaba cifras mock y no se podía abrir; se retiró en #37. Las métricas reales dependen de #31.

### RF-10 · Responsividad

- La interfaz incluye estilos adaptables, drawer móvil y ajustes de layout en componentes seleccionados.
- Los anchos de 360, 480, 768, 1024 y 1440 px son objetivos de verificación propuestos; no se encontró evidencia de pruebas automatizadas de viewport para todas las pantallas.
- La tabla administrativa permite desplazamiento horizontal en su vista de escritorio y la pantalla del profesor presenta una lista adaptable.

### RF-11 · Diseño y Accesibilidad

- Sistema de diseño glassmorphism: `bg-white/5`, `backdrop-blur`, bordes `rgba`.
- Paleta: dorado `#f5c842 / #b8880f`, teal `#2dd4bf`, navy `#030a1a`.
- Tipografía: Plus Jakarta Sans (cuerpo) · Syne (display/headings) · Orbitron (brand).
- Animaciones con Framer Motion; CSS reduce las animaciones cuando el sistema solicita `prefers-reduced-motion`. Esto no representa por sí solo una conformidad de accesibilidad.
- Selección de texto con color dorado temático.
- Grain de película sobre body para profundidad visual (SVG feTurbulence, sin costo de GPU).

### RF-12 · Sitio público, cursos y prueba de muestra

- La página pública presenta la propuesta de preparación EXANI-II y el plan de acceso completo. Los testimonios y las cifras promocionales se retiraron en #37 hasta tener datos verificados y autorizados por el cliente.
- La navegación pública permite abrir un selector de cursos y probar una muestra de preguntas para Pensamiento Matemático, Redacción Indirecta, Comprensión Lectora o Pre-medicina.
- Cada prueba de muestra permite responder reactivos, muestra retroalimentación y explicación, controla un tiempo y presenta un resultado al terminar o agotarse el tiempo.
- El botón principal de la página desplaza a la sección de registro; los accesos de inicio de sesión abren la pantalla de login.
- El contenido, el precio y los resultados de muestra son contenido fijo de demostración y no deben presentarse como datos verificados o personalizados.

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
- El contenido principal y los controles críticos deben seguir utilizables mientras cargan recursos no esenciales. Medir el bundle y los Core Web Vitals en el hosting y dispositivos objetivo antes de fijar presupuestos de rendimiento.

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

- Construir la página de estadísticas sobre consultas reales que agreguen datos de la DB (#31).
- Métricas calculadas en servidor: tasa de aprobación, promedio de grupo, evolución semanal.
- Caché de métricas (Redis o similar) para no recalcular en cada petición.
- Posibilidad de exportar reporte en PDF (admin).

### BE-08 · Notificaciones y Comunicación

- Sistema de avisos in-app (nuevas sesiones publicadas, resultado de quiz, próximas clases).
- Integración con WhatsApp Business API o email transaccional (SendGrid/Resend) para recordatorios.
- Reemplazar el Foro eliminado (si se reintegra) con un sistema de mensajería real (Intercom, Crisp, o custom).

### BE-09 · Infraestructura de Despliegue

- Mantener secretos (credenciales de DB, claves privadas de API y storage) únicamente en el backend/gestor de secretos. Las variables `VITE_*` son configuración pública que termina en el navegador.
- El repositorio tiene `.github/workflows/pr.yml` para validar pull requests; no se encontró workflow de despliegue. Añadir pipelines separados para staging y producción, con gates de calidad, aprobación y rollback.
- Publicar frontend Vite como artefacto estático/CDN y desplegar el backend por separado cuando exista. Resolver API URL por entorno; limitar CORS a orígenes autorizados en el servidor.
- Habilitar HTTPS y cabeceras CSP, HSTS (cuando corresponda), `X-Content-Type-Options`, `Referrer-Policy` y protección contra framing. Definir configuración de caché y revisar que las rutas de assets funcionen en el dominio/base path final.
- Antes de abrir a usuarios reales: disponer de autenticación, persistencia, almacenamiento seguro de archivos, respaldos/recuperación y monitoreo; el frontend actual no cubre estas funciones.

---

## Mapa de Archivos Críticos

```
src/
├── App.jsx                          # Navegación por estado y pantallas disponibles por rol
├── context/AuthContext.jsx           # Login local de demostración
├── context/MaterialContext.jsx       # Recursos/evaluaciones en memoria
├── data/mockData.js                  # Usuarios, alumnos, módulos, videos y estadísticas mock
├── components/layout/                # Navegación pública, header y sidebar por rol
├── pages/
│   ├── landing/LandingPage.jsx       # Página pública, muestras y solicitud visual de acceso
│   ├── auth/Login.jsx                # Acceso de demostración (mock)
│   ├── admin/                        # Panel administrativo: cuentas, cursos y pagos (próximamente)
│   ├── teacher/TeacherDashboard.jsx  # Lista/resumen de alumnos con datos mock
│   ├── student/StudentDashboard.jsx  # Progreso estimado y material del alumno
│   ├── modules/Material.jsx          # Gestión local de material para staff
│   ├── modules/Modulos.jsx           # Vista de módulos del alumno
│   ├── video/VideoLibrary.jsx        # Videoteca, accesible desde el menú de alumno
│   ├── exam/MaestroQuizzes.jsx       # Creación local de evaluaciones para staff
│   └── exam/SimuladoresQuizzes.jsx   # Vista mock del alumno; inicio de simulador deshabilitado
├── hooks/useBreakpoint.js            # Detección de viewport
└── index.css                         # Estilos y reglas responsive

public/
└── Recursos estáticos del prototipo (ver nombres reales en el repositorio)
```

## Supuestos y decisiones pendientes

- Los roles, grupos, permisos y tipos de usuario descritos son los que muestra el prototipo; los permisos definitivos requieren validación de negocio.
- La página promociona un pago único de $1,499 MXN con seis meses de vigencia, pero no implementa procesamiento de pago. El precio, la vigencia, la garantía y las afirmaciones promocionales deben confirmarse antes de producción.
- Los módulos visibles incluyen Pre-medicina y Ciencias de la Salud en el panel, mientras que el selector público de cursos muestra Pre-medicina como curso específico. Se debe confirmar el catálogo definitivo y qué cursos corresponden a cada plan.
- La escala 700–1300 se presenta como reporte visual de práctica; no hay evidencia en el frontend de que la fórmula replique el método oficial de conversión CENEVAL.
- No se definieron requisitos de carga, retención legal, recuperación ante desastres ni volumen concurrente; deben acordarse antes de dimensionar la arquitectura.

---

## Notas Técnicas para el Equipo Backend

1. **Tamaño y carga inicial**: Las páginas se importan estáticamente desde `App.jsx`; generar y revisar el reporte de `npm run build` en CI y aplicar carga diferida (`React.lazy`/`Suspense`) a las páginas pesadas si el bundle medido lo justifica. No asumir un tamaño sin medirlo en la configuración de despliegue final.

2. **Sin react-router-dom**: La navegación actual es por estado (`activeSection`), no hay rutas compartibles ni deep links. Si se requieren URLs directas, adoptar enrutamiento y configurar fallback del hosting para rutas SPA.

3. **Datos mock en mockData.js**: Úselos como ejemplos para prototipado, no como contrato del API. Definir y versionar el contrato backend (por ejemplo, OpenAPI y esquemas de validación) con el equipo antes de integrar.

4. **Autenticación**: `AuthContext.jsx` valida usuarios en memoria. Diseñar primero el contrato de sesión/autorización y sustituir el mock sin exponer secretos en variables `VITE_*`; estas variables se incluyen en el bundle del navegador.

5. **CI/CD de despliegue**: `.github/workflows/pr.yml` ejecuta lint, pruebas y build en pull requests a `main`/`develop`; no se encontró workflow de publicación. A partir del build validado, añadir despliegue separado para staging y producción, con aprobación para producción, secretos en el gestor de environments del proveedor y procedimiento probado de rollback.

6. **Entrega del frontend**: Publicar `dist/` como sitio estático detrás de CDN/HTTPS. Definir `base` de Vite y rutas de assets coherentes con el dominio/base path, configurar fallback a `index.html` si se implementan rutas SPA, y probar el sitio desde el mismo path/subpath que tendrá en producción.

7. **Configuración por entorno**: Usar variables públicas solo para configuración no sensible (por ejemplo, URL base de API); nunca incluir credenciales, tokens privados ni claves de storage en el frontend. Mantener `.env.local` fuera de Git, documentar `.env.example` sin valores secretos y validar configuración requerida al iniciar/build.

8. **Seguridad HTTP y operación**: Configurar HTTPS, CSP compatible con los recursos externos reales, `frame-ancestors`/protección contra framing, `X-Content-Type-Options`, `Referrer-Policy` y HSTS solo cuando HTTPS esté habilitado de forma permanente. Definir límites y CORS en el backend cuando exista API, además de monitoreo de disponibilidad, errores de frontend, alertas y rollback.

9. **Calidad de publicación**: Alinear `.nvmrc`, `engines.node` y la versión usada por CI; automatizar smoke tests de los flujos públicos y de cada rol, pruebas de accesibilidad/responsive y revisión de bundle. Aplicar caché larga a assets con hash y revalidación/no-cache al HTML para que los despliegues no sirvan referencias obsoletas.

10. **Límite de producción actual**: No habilitar registro real, pagos, credenciales reales ni carga de datos personales mientras sigan mockeados autenticación, persistencia y consentimiento. El hosting estático por sí solo no convierte estas operaciones en seguras ni persistentes.
