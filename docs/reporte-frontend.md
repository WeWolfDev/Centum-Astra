# Reporte del frontend — Centum Astra

> Análisis de solo lectura. Fecha: 2026-10-08. Rama: `feature/login-unico`.

---

## 1. Cómo está construido

### 1.1 Stack

- **React 19** + **Vite 8** + **Tailwind 3.4** (sin plugins) + **framer-motion 13** + **lucide-react** + **recharts**.
- **Sin router**: `App.jsx` controla la pantalla activa con dos estados: `user?.role` y `activeSection` (string). No hay URLs, deep links ni back/forward del navegador.
- `oxlint` como linter, `vitest` para pruebas (dos tests existentes: `examScoring.test.js`, `rediseno.test.js`).

### 1.2 Estructura de `src/`

| Carpeta | Qué contiene | Observación |
|---|---|---|
| `src/pages/` | 14 páginas repartidas por rol: `admin/`, `teacher/`, `student/`, `auth/`, `landing/`, `modules/`, `exam/`, `video/`, `whiteboard/` | Las páginas son archivos muy grandes (hasta 858 líneas). Varias superan el techo blando de 800 líneas que marcan las reglas del repo. |
| `src/components/layout/` | 3 archivos: `Header`, `Sidebar`, `PublicNav` | `PublicNav.jsx` tiene 865 líneas — es un "mini-site" (CTA, menú, bloques de hero) más que una barra de navegación. |
| `src/components/rediseno/` | 10 micro-componentes nacidos del rediseño: `BotonPrimario`, `BotonSecundario`, `Pastilla`, `StatCifra`, `PdfCard`, `VideoCard`, `QuizBlock`, `SimuladorBlock`, `IconSubject`, `ModalRecurso`, `ModalClase` | **Es el único intento de sistema de UI.** Convive con muchas versiones manuales del mismo botón/tarjeta en las páginas no-rediseño. |
| `src/context/` | `AuthContext` (user + login mock), `MaterialContext` (archivos subidos por el maestro) | Estado global simple con `useState` — sin reducer, sin persistencia. |
| `src/config/rediseno.js` | Constantes del rediseño (`SIMULADOR_TOTAL_PREGUNTAS`, `ATENCION_POR_BAJA`, `aciertosACeneval`) | 38 líneas. Único archivo "de dominio" fuera de `data/`. |
| `src/data/mockData.js` | Usuarios, alumnos, módulos, quizzes, videos — todo el estado inicial | 198 líneas, hardcoded. Fuente única de la demo. |
| `src/hooks/` | `useBreakpoint.js` (15 líneas) — detecta móvil por `window.innerWidth < 768` | Único hook propio. |
| `src/lib/` | `utils.js` (`cn` con `clsx`+`tailwind-merge`), `examScoring.js` | Mínimo. |
| `src/index.css` | 550 líneas — tokens, componentes CSS (`.btn-gold`, `.btn-ghost`, `.btn-fill`, `.glass`, `.field`, `.nav-link`, `.rediseno-page`), y **todo el responsive** por media queries con `!important` | Es donde vive la verdad del diseño; Tailwind es casi decorativo encima. |

### 1.3 Navegación y estado compartido

- **Navegación**: `App.jsx` guarda `activeSection` (string: `dashboard`, `modules`, `videos`, `exam`, `payments`, etc.) y renderiza condicionalmente la página según el `user.role` (`App.jsx:67–110`). Sin React Router. Sin historial. **Recargar pierde la pantalla.**
- **Login/landing**: `App.jsx:60–65` usa un `showLogin` local para alternar entre `LandingPage` y `Login` cuando no hay usuario.
- **Estado compartido**:
  - `AuthContext` → `user`, `login`, `logout`, `error`.
  - `MaterialContext` → recursos subidos por maestro (consumido por `Modulos`, `Material`, `VideoLibrary`, `SimuladoresQuizzes`, `MaestroQuizzes`).
  - `customQuizzes` vive como estado local en `App.jsx:28` y se pasa por props a dos páginas — pierde el estado al cerrar sesión.

### 1.4 Páginas por tamaño y componentes reutilizados

| Página | Líneas | Componentes de `rediseno/` que usa | Otros |
|---|---:|---|---|
| `landing/LandingPage.jsx` | **858** | — | `PublicNav`, framer-motion |
| `student/StudentDashboard.jsx` | **783** | `BotonPrimario`, `BotonSecundario`, `IconSubject` | mockData, recharts |
| `exam/ExamSimulator.jsx` | **778** | `BotonPrimario`, `BotonSecundario`, `Pastilla` | `examScoring`, `useBreakpoint` |
| `modules/FileManager.jsx` | **691** | — (todo a mano) | framer-motion, `useBreakpoint` |
| `exam/SimuladoresQuizzes.jsx` | **578** | `SimuladorBlock`, `QuizBlock`, `BotonPrimario`, `IconSubject` | — |
| `video/VideoLibrary.jsx` | **525** | `Pastilla`, `IconSubject` | — |
| `modules/Modulos.jsx` | **514** | `IconSubject`, `Pastilla`, `PdfCard`, `VideoCard`, `QuizBlock` | — |
| `exam/MaestroQuizzes.jsx` | **500** | `IconSubject`, `Pastilla`, `BotonPrimario`, `BotonSecundario` | — |
| `modules/Material.jsx` | **497** | `IconSubject`, `PdfCard`, `VideoCard`, `BotonPrimario`, `BotonSecundario`, `ModalRecurso`, `ModalClase` | — |
| `teacher/TeacherDashboard.jsx` | **494** | — (todo a mano) | SVG sparkline inline |
| `auth/Login.jsx` | 412 | — | `PublicNav` |
| `admin/AdminDashboard.jsx` | 383 | — (todo a mano) | `useBreakpoint`, `cn` |
| `whiteboard/Whiteboard.jsx` | 299 | — | — |
| `admin/Statistics.jsx` | 114 | — | recharts |

- **Islas**: las páginas del alumno y la `Material.jsx` del maestro aprovechan `rediseno/`. **Admin, Teacher-Students, FileManager, Login y Landing son archivos auto-contenidos** que no comparten casi nada.
- **Capa de layout**: todas las páginas autenticadas se renderizan dentro de `App.jsx` que les añade `Sidebar` + `Header`. La pantalla "sección en desarrollo" (`App.jsx:105-109`) es el único fallback cuando una ruta no está implementada.

---

## 2. Uso de Tailwind

### 2.1 Qué define `tailwind.config.js` y cuánto se usa

| Token | Definidos | Veces usados en `src/` | Veredicto |
|---|---|---:|---|
| **Colores** `space.{void,deep,navy,mid,light}` | 5 | 2 totales (`space-void` 1, `space-navy` 1, resto 0) | **Casi muertos**. El dominio azul-oscuro se mete por hex (`#030a1a`, `#0c1d45`, `#162850`) en inline-styles. |
| **Colores** `gold.{dim,muted,bright,glow}` | 4 | 6 (`gold-bright` 4, `gold-dim` 2) | `muted` y `glow` sin uso. El dorado se repite por hex (`#f5c842`, `#b8880f`, `#fde68a`) en todos lados. |
| **Colores** `clinical.{void,deep,teal,light}` | 4 | 1 | **Prácticamente sin uso.** |
| **Fuentes** `font-display`, `font-body`, `font-wordmark` | 3 | 0 | **Ninguna.** Todo se escribe como `fontFamily: '"Bricolage Grotesque", sans-serif'` inline. |
| **Fuente ad-hoc** `font-syne` (en `@layer utilities`) | 1 | 10 | Única utilidad tipográfica realmente adoptada. |
| **backgroundImage** (`nebula`, `space-radial`, `gold-beam`, `clinical-beam`, `card-surface`, `medical-surface`, `dot-grid`, `line-grid`, `hero-glow`, `stat-glow`) | 10 | `bg-dot-grid` sí se usa (Login:199, PublicNav), el resto 0 | **8 de 10 sin uso.** |
| **backgroundSize** (`dot-32`, `dot-40`, `line-48`, `line-64`) | 4 | solo `dot-32` | 3 sin uso. |
| **boxShadow** (9 tokens `glow-*`, `glass*`, `card-*`) | 9 | 0 | **Ninguno.** Los glows se replican con `box-shadow: 0 0 24px rgba(245,200,66,0.25)` inline. |
| **animation / keyframes** `ring-glow`, `slide-in-left`, `shimmer` | 3 | 0 | **Ninguno.** Toda la animación se delega a framer-motion. |

**Resumen numérico**: de ~40 tokens definidos en el config, **menos de 10 se usan**. El resto no influye en el build porque Tailwind los purga, pero sí refleja un sistema de diseño que nadie adoptó.

### 2.2 Valores arbitrarios e inline-styles

| Métrica | Total | Top-5 archivos |
|---|---:|---|
| **Clases arbitrarias** `text-[], bg-[], w-[], h-[], ...` | 110 | Login (31), LandingPage (25), PublicNav (22), AdminDashboard (8), Statistics (6) |
| **`style={{...}}`** inline | ~666 ocurrencias | FileManager (89), PublicNav (74), LandingPage (70), AdminDashboard (57), ExamSimulator (55) |
| **Hex colors en JSX** (`#rrggbb` dentro de `.jsx`) | **473** | repartidos en todos lados |
| **`rgba(...)` en JSX** | **586** | — |
| **className > 100 caracteres** | 18 strings | AdminDashboard (6), Statistics (6), Login (2), Whiteboard (1), ... |

El inline-style es la forma dominante de estilizar. Tailwind queda reducido a utilidades estructurales (`flex`, `grid`, `absolute`, `w-full`, `max-w-[372px]`). Toda decisión de color, radio, sombra y tipografía se escribe literal en `style={{...}}`.

### 2.3 Mismo elemento escrito de forma distinta en cada página

**Botón primario dorado**: existen **cuatro implementaciones** del mismo botón.

| Forma | Dónde | Evidencia |
|---|---|---|
| `.btn-gold` (CSS en `index.css:156`, con gradiente + glow) | `PublicNav.jsx`, `LandingPage.jsx`, `VideoLibrary.jsx`, `Whiteboard.jsx`, `FileManager.jsx` | 22 usos |
| `.btn-gold-flat` (plano, 44px alto; `index.css:129`) | Vía `BotonPrimario` → `Modulos`, `Material`, `MaestroQuizzes`, `StudentDashboard`, `SimuladoresQuizzes`, `ExamSimulator` | Correcto, es el "canónico" del rediseño |
| `.btn-fill` (gradiente que se desliza; `index.css:419`) | `Login.jsx:376` (el botón "Ingresar") | 5 usos — distinto look al resto |
| Botón ad-hoc con `style={{ background: linear-gradient..., box-shadow: ..., color: '#030a1a' }}` | `LandingPage.jsx:618+`, `FileManager.jsx` modales, `Statistics.jsx` | Reinventado |

**Tarjeta "glass"**: tres formas de pintarla.

- `.glass` (CSS, `index.css:58`) — 3 usos literales.
- `.glass-gold` / `.glass-clinical` (CSS) — 5 y 4 usos.
- `className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"` — p. ej. `AdminDashboard.jsx:21` (StatCard), `FileManager.jsx:58` (modal). La misma receta repetida sin usar `.glass`.
- Variante inline: `background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12` — se repite en `PdfCard.jsx:22-25`, `TeacherDashboard.jsx:96-104`, `Login.jsx` chip, `Header.jsx:60-67` botón de menú, `Sidebar.jsx:91-96`, etc.

**Input**: dos convenciones conviven.
- `.field` + `.field-label` CSS en `index.css:242-288` — usado en `Login.jsx`.
- `<input>` suelto con estilos inline — `MaestroQuizzes.jsx:108+`, `FileManager.jsx:76`, `ModalRecurso.jsx:114`, `ModalClase.jsx:63`. Cada formulario reinventa borde, padding, placeholder color.

**Modal**: tres implementaciones diferentes.
- `ModalRecurso.jsx` (357 líneas) y `ModalClase.jsx` (159) — modales "del rediseño" con backdrop + motion + glass.
- `FileManager.jsx:49-54` — modal construido inline con `position: fixed; backdrop-filter: blur(8px)`.
- No existe un `<Modal>` reutilizable.

**Pastilla / badge**: dos.
- `rediseno/Pastilla.jsx` — con 10 variantes de tono.
- `.badge` CSS en `index.css:340-350` — sin consumo claro.
- Y además, `AdminDashboard.jsx:56-68` define **su propio `StatusBadge`** inline con `aprobado/pendiente/rechazado`.

**Avatar circular con iniciales**: se construye a mano al menos en 4 lugares con exactamente las mismas 10 líneas de style — `Sidebar.jsx:106-114`, `Header.jsx:115-123`, `TeacherDashboard.jsx:108-116`, `AdminDashboard.jsx:108+`.

### 2.4 Cadenas de clases muy largas o repetidas

18 strings > 100 caracteres. Las más graves (candidatas a convertirse en componente CSS o React):

- `AdminDashboard.jsx:21` (StatCard): `"group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/30 transition-colors duration-300 p-[20px_22px]"` — la "glass card con hover amarillo" se repite verbatim en otras tarjetas sin extraer.
- `AdminDashboard.jsx:44` (número con gradiente dorado): `"relative font-syne text-[28px] font-bold leading-none tracking-tight mb-1 bg-gradient-to-br from-yellow-200 via-gold-bright to-amber-500/80 bg-clip-text text-transparent"` — misma receta en `Login.jsx:261`, `landing hero`, `StudentDashboard.jsx`.
- `Statistics.jsx:41, 44, 48, 70, 72, 93, 95` — cards de estadística con la receta glass+hover repetida 7 veces en un archivo de 114 líneas.

### 2.5 Componentes reutilizables vs. "a mano"

- **Reutilizables existentes** (`src/components/rediseno/`): 10. Resuelven botón primario/secundario, pastilla, cifras, PDF card, Video card, modales, bloques de simulador y quiz.
- **No cubiertos por componente** y rehechos cada vez: **Input, StatCard, StatusBadge, Modal genérico, Avatar, Table row, Empty state, Form field con label+error**.
- Las tres páginas donde no se consumen los componentes de `rediseno/` (**Admin**, **Teacher** y **FileManager**) son también donde se concentran los `style={{}}` (57+39+89 = 185, 28% del total).

---

## 3. Experiencia de usuario

### 3.1 Estados de carga, vacío y error

| Pantalla | Loading | Vacío | Error |
|---|---|---|---|
| Login | ✅ spinner inline en botón | — | ✅ `role="alert"` (añadido en este branch) |
| Student / Teacher / Admin dashboards | ❌ no hay | **Parcial** — Teacher muestra "No hay alumnos..." en tabla; Admin muestra `◎ Sin resultados` | ❌ nada |
| Modules / Material / FileManager | ❌ no hay (data mock es síncrona) | ❌ listas vacías no se avisan | ❌ nada |
| Simuladores / Quizzes / ExamSimulator | ❌ no hay | ❌ sin empty state | ❌ nada |
| VideoLibrary | ❌ no hay | ❌ sin empty state | ❌ nada |

- **0 "Spinner" / "Cargando"** en el repo entero.
- **0 toasts**, **0 `aria-live`**, **0 `aria-live="polite"`**.
- `console.log` / `alert()` de debug: 1 uso de `alert()` en `SimuladoresQuizzes.jsx:105` ("TODO: conectar flujo Iniciar") — queda visible al usuario final hoy.

### 3.2 Acciones sin retroalimentación

- **Eliminar PDF / Video / Quiz**: `PdfCard.onEliminar`, `VideoCard.onEliminar`, `QuizCreadoCard.onEliminar` (`MaestroQuizzes.jsx:362`) ejecutan la acción **sin diálogo de confirmación** y **sin undo**. No hay `confirm()` ni modal. En desktop con mouse resbaladizo, un click accidental borra material subido por el maestro sin posibilidad de recuperarlo.
- **Guardar / crear quiz** (`MaestroQuizzes.jsx`): tras `handleSubmit` no hay toast ni confirmación visual — solo cierra el formulario.
- **Subir material** (`FileManager.UploadModal`): `handleSubmit` llama `onUpload` + `onClose` sin mensaje.
- **Logout** (`Sidebar.jsx:147`): sin confirmación. Un click borra la sesión en seco.

### 3.3 Formularios y validación

- Hay **5 `<form>`** en el proyecto: `Login`, `MaestroQuizzes` (crear quiz), `LandingPage` (contacto), `ModalClase`, `ModalRecurso`.
- Validación: **solo `required`** nativo del HTML (8 ocurrencias). Ningún `pattern=`, `minLength`, Zod ni validación custom con mensajes de campo.
- Único mensaje de error con `role="alert"` es el de Login.
- `LandingPage.jsx:618` tiene `<form onSubmit={handleSubmit}` sin manejo de error, sin estado de envío, sin confirmación — es un formulario de contacto demo.

### 3.4 Responsive

- **Breakpoints Tailwind usados en páginas**: `0` en 13 de 14 páginas. Solo `LandingPage` usa `sm:/md:/lg:` (8 veces).
- Todo lo demás se adapta por media queries en `index.css:507-549` con **`!important`**. Clases ad-hoc: `.resp-grid-4`, `.resp-hero-h1`, `.resp-grid-2`, `.resp-grid-ring`, `.resp-hide-mobile`, `.resp-padding`.
- Anchos fijos problemáticos: `Login.jsx:247` `max-w-[400px]`, `Login.jsx:295,372` `max-w-[372px]`, `LandingPage.jsx:265` `w-[300px] / w-[340px]`.
- Decisión mobile en JS (`useBreakpoint`, `isMobile`): el `Header`, `Sidebar`, `AdminDashboard` deciden layout por JS en vez de CSS. Esto añade un flash de contenido en el primer render (SSR imposible).

### 3.5 Accesibilidad básica

- **56 `aria-label`** en el repo. Casi todos vienen de `BotonPrimario/Secundario/PdfCard/VideoCard` (los componentes `rediseno/`). Las páginas que no los usan (Admin, Teacher, FileManager, Login antes de este branch) tienen botones-icono sin etiqueta — p. ej. `Header.jsx:57` (menú hamburguesa) y `Sidebar.jsx:89` (botón cerrar).
- **Contraste**: estilos como `color: 'rgba(255,255,255,0.18)'` (`Login.jsx:390`), `0.22`, `0.3`, `0.35`, `0.38`, `0.45` sobre `#030a1a` **fallan WCAG AA**. Hay docenas de ocurrencias.
- **Foco de teclado**: todos los `<button>` nativos reciben foco por defecto, pero muchos sobreescriben estilos con `background: none; border: none;` sin añadir `:focus-visible`. El outline del navegador queda roto en varios botones.
- **No hay `<main>` ni `<header>` ni landmarks** más allá de los implícitos. `Sidebar` usa `<aside>` + `<nav>` ✅, pero `Header.jsx:34` usa `<motion.header>` sin role explícito.
- Película de ruido (`body::after` con SVG + grain, `index.css:33-42`) tiene `z-index: 9999` y `pointer-events: none` — correcto, pero `opacity: 0.028` es imperceptible y añade peso.

### 3.6 Flujos incompletos o botones muertos

- `SimuladoresQuizzes.jsx:102-106`: `handleIniciar()` → `alert('TODO: conectar flujo Iniciar con ExamSimulator')`. **El botón "Iniciar nuevo simulador" no funciona.**
- `TeacherDashboard.jsx:92` y `SimuladoresQuizzes.jsx:295,445`: tres `<a href="#" onClick={e => e.preventDefault()}>` — filas de alumno y quiz no abren detalle, solo intercept.
- `App.jsx:93-98`: Admin → Pagos muestra `"TODO(rediseno): Pagos — sin mockup todavía."` como contenido.
- `App.jsx:105-109`: cualquier combinación de rol × sección no mapeada cae en `"Sección en desarrollo."` sin indicación visual previa (el link está activo en Sidebar).
- `Login.jsx:101-118`: el `useEffect` del video de fondo está vacío porque "video eliminado del repo" (comentario en línea 108). El código del `<video>` y el estado `videoReady` siguen vivos sin propósito.

---

## 4. Imágenes y archivos en `public/`

### 4.1 Inventario

| Archivo | Peso | Dimensiones | Formato | Uso |
|---|---:|---:|---|---|
| `timrael-space-4984262_1920.jpg` | **1 119 991 B (1.07 MB)** | 1920×1280 | JPEG | `Login.jsx:156` fondo (background-image inline) |
| `math.jpg` | 774 215 B (756 KB) | 1920×1280 | JPEG | **sin referencias** |
| `spanish.jpg` | 559 680 B (546 KB) | 1920×1280 | JPEG | **sin referencias** |
| `fernandozhiminaicela-face-mask-5042631_1920.jpg` | 445 070 B (435 KB) | 1920×1282 | JPEG | **sin referencias** |
| `poldychromos-astronaut-6947813_1920.jpg` | 401 889 B (392 KB) | 1920×1281 | JPEG | **sin referencias** |
| `doctor.jpg` | 265 825 B (260 KB) | 1280×853 | JPEG | **sin referencias** |
| `group.jpg` | 235 774 B (230 KB) | 1280×853 | JPEG | **sin referencias** |
| `medicine.jpg` | 149 769 B (146 KB) | 1280×853 | JPEG | **sin referencias** |
| `logo-astra.jpeg` | 83 640 B (82 KB) | 1080×1080 | JPEG | `Header.jsx:76`, `Sidebar.jsx:70`, `PublicNav.jsx:801` (34×34 px máximo), favicon en `index.html:5` |
| `favicon.svg` | 9 522 B | 48×46 | SVG | **sin referencias** (el favicon del HTML apunta al JPEG) |
| `_redirects` | 24 B | — | Netlify SPA fallback (`/* /index.html 200`) | config |

**Peso total**: ~**4.0 MB** · **Peso sin usar**: ~**2.8 MB (70% del total)**.

### 4.2 Problemas detectados

1. **8 imágenes sin uso** (todas las de `math/spanish/doctor/group/medicine/fernando.../poldy.../favicon.svg`). Se envían al build de Vite público aunque no se referencien — ninguna optimización las descarta porque `public/` sirve archivos tal cual.
2. **`timrael-space-4984262_1920.jpg` pesa 1.07 MB** para servir como fondo de una sola pantalla. Se referencia con `backgroundImage: url(...)` inline en vez de `<img srcSet>`, por lo que el navegador no puede elegir una variante más pequeña en móvil (y la pantalla de Login en móvil no muestra el panel izquierdo, pero igual descarga el JPG completo).
3. **`logo-astra.jpeg` es un JPEG de 1080×1080** usado a 26-34 px máximo. El tamaño ideal sería 68×68 PNG o SVG — se gastan 82 KB por un recurso de ~2 KB.
4. **Favicon mal configurado**: `index.html:5` declara `<link rel="icon" type="image/jpeg" href="/logo-astra.jpeg" />`. El `favicon.svg` que existe en el repo es inútil (no se referencia) y el navegador recibe un JPEG grande para el icon.
5. **Formatos**: todo es JPEG. No hay WebP ni AVIF. Para un sitio con fondos oscuros, AVIF típicamente ahorra 40-60% sobre JPEG.
6. **Naming inconsistente**: conviven tres convenciones — descriptivo (`doctor.jpg`, `math.jpg`), autor+hash+dimensión (`timrael-space-4984262_1920.jpg`), categoría (`group.jpg`). No hay subcarpetas (`public/backgrounds/`, `public/branding/`, etc.).
7. **Referencias inconsistentes**:
   - 3 lugares (`Header`, `Sidebar`, `PublicNav`) usan `${import.meta.env.BASE_URL}logo-astra.jpeg` como string template. ✅ Correcto para asset del `public/`.
   - `Login.jsx:156` usa el mismo patrón para el background. ✅
   - `index.html:5` usa ruta absoluta `/logo-astra.jpeg` sin `BASE_URL`. ❌ Falla si el proyecto se despliega en un sub-path.
   - Ningún asset se `import` como módulo (no se aprovechan los hashes de Vite). Todo pasa por `public/`, lo que **impide cache busting**.

---

## 5. Conclusión

### 5.1 Los 10 problemas más importantes (ordenados por impacto)

1. **Acciones destructivas sin confirmación.** Eliminar PDF, Video, Quiz y Cerrar sesión disparan sin diálogo ni undo. Un click accidental borra material del maestro o cierra la sesión. _(UX crítica, bajo esfuerzo de arreglo.)_
2. **Botón "Iniciar nuevo simulador" muestra un `alert('TODO…')`** (`SimuladoresQuizzes.jsx:105`). Es el CTA principal de la pantalla y hoy expone un debug alert al usuario final.
3. **Ningún estado de carga ni error** en 13 de 14 pantallas. Hoy no se nota porque todo es `useState` sincrónico desde `mockData.js`, pero cuando entren datos reales las pantallas quedarán en blanco silenciosamente.
4. **Sin router**: recargar la página devuelve siempre al dashboard. No hay URLs compartibles ni back/forward. Para una app con 4 roles × ~6 secciones es un bloqueador operativo.
5. **~1.1 MB de fondo descargado en Login** y 2.8 MB de assets no referenciados en `public/`. El primer paint envía ~3 MB innecesarios.
6. **Contraste insuficiente**: texto `rgba(255,255,255,0.18)`, `0.22`, `0.3`, `0.35` en docenas de lugares — falla WCAG AA en el fondo navy. Afecta sobre todo a usuarios con astigmatismo o pantallas con brillo medio.
7. **Falta de componentes para `Input`, `Modal` genérico y `StatCard`.** Cada formulario y modal reinventa 50-80 líneas de style. Es el motor de la deuda inline-style (666 ocurrencias totales).
8. **Foco de teclado invisible** en botones-icono (menú hamburguesa, cerrar modal, pastillas) y en links tipo `nav-link`. Imposible navegar la app con teclado.
9. **Formularios sin validación ni mensajes por campo.** Sólo `required` nativo. "Correo o contraseña incorrectos" es el único mensaje real; los demás formularios aceptan basura silenciosamente.
10. **Admin / Teacher / FileManager fuera del sistema `rediseno/`.** Son 3 archivos (383 + 494 + 691 = 1 568 líneas) que replican tarjetas, badges y avatares a mano. Cualquier retoque de marca obliga a tocar los tres por separado.

### 5.2 ¿Es culpa de Tailwind o de cómo se usa?

**Es la forma de usarlo**, con evidencia:

- **El config define 40 tokens; se usan menos de 10.** Si el problema fuera Tailwind, los tokens aparecerían saturados y las clases serían ilegibles por combinación. Lo que ocurre es lo contrario: el equipo definió el sistema (`space.*`, `gold.*`, `clinical.*`, `glass`, `shadow glow-*`) y después **no lo adoptó**. Un `shadow-glow-gold` escrito en el config aparece 0 veces en el código; el mismo efecto se repite 20+ veces como `box-shadow: '0 0 24px rgba(245,200,66,0.25)...'` inline.
- **Los colores dorados y navy se escriben como hex en JSX casi 500 veces.** No es un problema del motor; es que no se usan las utilidades que ya existen (`bg-gold-bright`, `text-space-navy`). Tailwind no te empuja a inline-styles — JSX sí lo permite, y las decisiones de PR previas tomaron el camino corto.
- **Responsive**: 0 breakpoints Tailwind en 13 páginas, 44 líneas de media queries con `!important` en `index.css`. Esto es un anti-patrón manual, no una limitación: `md:grid-cols-2` existe y hace exactamente lo mismo que `.resp-grid-4 { grid-template-columns: repeat(2,1fr) !important }`.
- **Los sitios que sí adoptaron el estilo del rediseño** (`BotonPrimario`, `PdfCard`, `Pastilla`, etc.) usan Tailwind + CSS components de forma coherente y son de los pocos lugares sin inline-style. **Donde el patrón se siguió, el código quedó limpio.**
- **El único archivo con `sm:/md:/lg:` real** (`LandingPage.jsx`) demuestra que cuando se usa Tailwind idiomáticamente, el resultado funciona.

**Conclusión**: Tailwind es apto para este proyecto. El trabajo pendiente es **adoptar el sistema que ya se definió**: migrar los colores hardcoded a `space-*`/`gold-*`, convertir las recetas inline-glass y botones a los componentes `.btn-*` / `.glass-*` que ya existen (o convertir `.glass`/`.btn-gold` a componentes React), y usar los breakpoints de Tailwind en vez del parche con `!important`. Antes de rediseñar nada visualmente, hay una capa entera de **saneamiento** que daría coherencia y ~30-40% menos líneas.
