# Centum Astra — Plan de implementación del rediseño

Rama de trabajo: `rediseno/ui` (creada desde `develop`). Nada se mergea, pushea ni abre PR sin que el usuario lo pida.

Las fuentes de verdad son `mockups/HANDOFF.md`, los `mockups/*.dc.html` y `mockups/tokens.json`. Si algo de este plan contradice al HANDOFF, gana el HANDOFF.

> Nota de ubicación: el HANDOFF se refiere a `rediseno/mockups/`, pero los archivos viven en `mockups/`. Dejar así por ahora; mover si el usuario lo prefiere (ver pregunta 1 abajo).

---

## 1. Mockup → archivos del repo

| Mockup | Pantalla | Archivos actuales | Archivos destino tras Fase 3 |
|---|---|---|---|
| `Alumno-Inicio.dc.html` | Inicio del alumno | `src/pages/student/StudentDashboard.jsx` | mismo (reescritura de contenido) |
| `Alumno-Simuladores.dc.html` | Simuladores y quizzes (listado) | `src/pages/exam/ExamSimulator.jsx` (mezcla listado + en-curso) | **nuevo** `src/pages/exam/SimuladoresQuizzes.jsx` |
| `Alumno-Simulador.dc.html` | Simulador en curso (138 preguntas) | `src/pages/exam/ExamSimulator.jsx` | mismo (queda solo con el modo en curso) |
| `Alumno-Modulos.dc.html` | Módulos | `src/pages/modules/FileManager.jsx` (compartido con maestro) | **nuevo** `src/pages/modules/Modulos.jsx` para el alumno |
| `Alumno-Videoteca.dc.html` | Videoteca | `src/pages/video/VideoLibrary.jsx` | mismo |
| `Maestro-Alumnos.dc.html` | Mis alumnos | `src/pages/teacher/TeacherDashboard.jsx` | mismo (renombrar sección a "Mis alumnos" en Sidebar) |
| `Maestro-Material.dc.html` | Material (maestro/admin) | `src/pages/modules/FileManager.jsx` | **nuevo** `src/pages/modules/Material.jsx` para maestro |

Ruteo en `src/App.jsx`: la Fase 3 debe apuntar `modules` del alumno a `Modulos.jsx`, `modules` del maestro/admin a `Material.jsx`, y partir `exam` en listado + en-curso (listado por defecto, en-curso al "Iniciar"). `FileManager.jsx` se puede dejar temporalmente hasta mover todo lo que vive adentro, pero no se referencia después de Fase 3.

Fuera de alcance (sin mockup todavía): Login (`src/pages/auth/Login.jsx`), Landing (`src/pages/landing/LandingPage.jsx`), AdminDashboard (`src/pages/admin/AdminDashboard.jsx`), Statistics, Pagos (no existe).

---

## 2. Fase 3 — cimientos (un solo subagente, sin paralelismo)

### 2.1 Cambios globales de estilo
- `src/index.css`: añadir `@import` de Bricolage Grotesque (600/700/800). Dejar Plus Jakarta Sans (body) y Orbitron (wordmark). Eliminar la discrepancia con Tailwind (ver siguiente). Simplificar superficies: quitar `.glass`, `.glass-gold`, `.glass-clinical`, `.star-field`, `.blob*` y cualquier `backdrop-filter` global. Reemplazar por tres superficies sólidas: fondo `#030a1a` (body), bloque sólido `#0c1d45`, relleno sutil `rgba(255,255,255,0.05)`. Reemplazar el degradado dorado de botones por `#f5c842` plano. Fondo = degradado radial azul (una sola capa). Borrar las estrellas decorativas.
- `tailwind.config.js`: cambiar `fontFamily.body` de `Inter` a `"Plus Jakarta Sans"`. Añadir `fontFamily.display: ["Bricolage Grotesque", ...]` y `fontFamily.wordmark: ["Orbitron", ...]`. Revisar keyframes/animaciones ligadas a estrellas y degradado dorado.
- `index.html`: reemplazar el favicon de Vite por el de la marca. Buscar y quitar insignia "Powered by Netlify" si aparece.
- Barrido global de `text-white/30` y `text-white/35`: reemplazar por `text-white/60` o `text-body`. Archivos afectados (según exploración): `src/pages/landing/LandingPage.jsx`, `src/pages/auth/Login.jsx`, `src/pages/admin/Statistics.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/video/VideoLibrary.jsx`, `src/pages/teacher/TeacherDashboard.jsx`.
- Barrido global de emojis como icono. `lucide-react` ya es dependencia y se usa en 13+ componentes. Reemplazos sugeridos: `📖` → `Book`, `✍️` → `PenTool`, `📐` → `Ruler`, `🩺` → `Stethoscope`. Archivos: `src/components/layout/PublicNav.jsx`, `src/data/mockData.js`.
- Eliminar `src/components/ui/Stars.jsx` y todas sus importaciones.
- No tocar `space.mp4` (103 MB en `public/`) ni los JPG grandes en esta fase. Ver pregunta 3.

### 2.2 Componentes compartidos a crear
Todos bajo `src/components/ui/` o `src/components/rediseno/` (preferido para aislarlos y poder borrarlos si se corrige el rumbo):
- `IconSubject.jsx`: set de iconos SVG de línea por materia (matemáticas, lectura, redacción, pre-medicina, ciencias de la salud). Los paths están en los mockups.
- `SimuladorBlock.jsx`: bloque azul sólido (`#0c1d45`) con acento dorado plano, cifra grande en Bricolage.
- `QuizBlock.jsx`: bloque de contorno con acento `#93c5fd` (azul claro info), para quizzes por tema.
- `BotonPrimario.jsx` y `BotonSecundario.jsx` (o utilidades Tailwind compuestas si no vale la pena un componente): dorado plano, altura 44 px mínimo.
- `Pastilla.jsx`: etiqueta tipo pill (status, rol, materia, cambio).
- `PdfCard.jsx`: con prop `canDownload` (alumno = false, maestro/admin = true). Nunca mostrar botón de descarga para alumno.
- `StatCifra.jsx`: cifra grande en Bricolage 800 + etiqueta pequeña.

### 2.3 Adaptación de componentes existentes
- `src/components/layout/Sidebar.jsx`: nuevo set de items por rol (alumno: Inicio, Módulos, Videoteca, Simuladores y quizzes; maestro: Mis alumnos, Material; admin: lo del maestro + Pagos pendiente). Iconos Lucide, no emojis. Label "Simuladores y quizzes" (hoy dice "Simulador EXANI").
- `src/components/layout/Header.jsx`: ajustar tokens de color y fuente display; quitar bajo contraste.
- `src/components/layout/PublicNav.jsx`: aplicar barrido de emojis, bajo contraste y glass.

### 2.4 Scaffolding de pantallas (sin contenido final)
Crear los archivos vacíos (o con placeholder) para que las Tandas A y B puedan trabajar en paralelo sin colisionar:
- `src/pages/exam/SimuladoresQuizzes.jsx` (nuevo)
- `src/pages/modules/Modulos.jsx` (nuevo)
- `src/pages/modules/Material.jsx` (nuevo)
- Actualizar `src/App.jsx` para apuntar a los nuevos y dejar a `ExamSimulator.jsx` solo como "simulador en curso".

Al terminar la Fase 3: build y lint verdes. Commit único: `rediseno: cimientos`.

---

## 3. Datos faltantes por pantalla

Cada vez que un mockup pida un dato que la app no tiene, va **TODO(rediseno):** en el código. Los supuestos del HANDOFF (reparto 30+30+30+24+24, conversión lineal 700–1300) van como **constantes de configuración** en un archivo nuevo (sugerencia: `src/config/rediseno.js`), nunca fijos en componentes.

| Pantalla | Datos faltantes clave | Plan |
|---|---|---|
| Alumno-Inicio | Primer puntaje del alumno; histórico de simuladores en escala 700–1300; meta por alumno; "ha subido N puntos" | `TODO(rediseno):` + leer del mock existente (`mockStudents.avgScore`) y transformar con la conversión supuesta de `src/config/rediseno.js`. Meta oculta por defecto. |
| Alumno-Simuladores | Lista de simuladores completados con fecha + puntaje Ceneval; lista de quizzes por tema con aciertos/total | `TODO(rediseno):` sobre tablas `StudentSimulatorScore` y `StudentQuizResult`. Mientras tanto, derivar del mock. |
| Alumno-Simulador en curso | Reparto por área (configurable), tiempo límite (configurable), banco de preguntas | Reusar `mockExamQuestions`. Reparto y tiempo límite en `src/config/rediseno.js`. |
| Alumno-Módulos | Estado por clase (Vista / En curso / Pendiente) | `TODO(rediseno):` sobre `ClassStatus`. Mientras tanto, derivar de `progress` del módulo (todas Vista si 100 %, última En curso, resto Pendiente). |
| Alumno-Videoteca | Datos de video (`mockVideos`) ya cubren el mockup. | Sin TODO. |
| Maestro-Alumnos | Lista filtrada por maestro; criterio "requiere atención" | `TODO(rediseno):` sobre `TeacherStudent` y `AttentionFlag`. Mientras tanto, mostrar todos los `mockStudents` y marcar atención si `avgScore` baja respecto al anterior. Criterio documentar en `src/config/rediseno.js`. |
| Maestro-Material | Permisos por rol para PDFs | Usar `PdfCard` con `canDownload={role !== 'student'}`. Lista actual de recursos sirve. |

Regla de negocio dura (del HANDOFF): el alumno **no** tiene ninguna vía para descargar PDFs. Esto se verifica en `PdfCard` y en cualquier handler de descarga.

---

## 4. Reparto Fase 4 (sin traslapes)

Tras la Fase 3, cada subagente trabaja un conjunto de archivos propio.

### Tanda A — Alumno (5 subagentes en paralelo)

| Subagente | Archivos que puede modificar |
|---|---|
| alumno-inicio | `src/pages/student/StudentDashboard.jsx` |
| alumno-simuladores | `src/pages/exam/SimuladoresQuizzes.jsx` (nuevo tras Fase 3) |
| alumno-simulador-en-curso | `src/pages/exam/ExamSimulator.jsx` (ya reducido a "en curso") |
| alumno-modulos | `src/pages/modules/Modulos.jsx` (nuevo tras Fase 3) |
| alumno-videoteca | `src/pages/video/VideoLibrary.jsx` |

Ninguno modifica Sidebar, Header, componentes compartidos de `rediseno/`, `tailwind.config.js` ni `src/index.css`. Si lo necesitan, lo reportan.

### Tanda B — Maestro (2 subagentes en paralelo)

| Subagente | Archivos que puede modificar |
|---|---|
| maestro-alumnos | `src/pages/teacher/TeacherDashboard.jsx` |
| maestro-material | `src/pages/modules/Material.jsx` (nuevo tras Fase 3) |

Después de cada subagente: integrar, correr build + lint, commit por pantalla (`rediseno: alumno inicio`, etc.).

---

## 5. Riesgos y preguntas para el usuario

### Riesgos
- **R1. ExamSimulator.jsx mezcla listado y en-curso.** La Fase 3 debe partirlo. Si no, Tanda A tendrá traslape.
- **R2. FileManager.jsx es compartido alumno/maestro.** La Fase 3 lo parte en `Modulos.jsx` (alumno) y `Material.jsx` (maestro). Si queda sin partir, Tandas A y B pisarían el mismo archivo.
- **R3. Mocks tratados como fuente real.** `src/data/mockData.js` se importa directo en pantallas. El rediseño va a derivar valores adicionales (puntajes Ceneval, estado por clase) de este mock mediante un helper (`src/config/rediseno.js`). Al conectar con backend real, hay un punto único donde reemplazar.
- **R4. `space.mp4` pesa 103 MB en `public/`.** No lo toco por default; si no se usa en el rediseño, es candidato a borrar.
- **R5. `design-misa` tiene trabajo de diseño ya commiteado que no está en `develop`.** Al ramificar `rediseno/ui` desde `develop`, ese trabajo queda fuera. Si hay partes útiles, hay que decidir si cherry-pickear.
- **R6. Fuentes vía @import de Google Fonts.** Si falla la red o la política CSP cambia, los titulares caen a fallback. Riesgo bajo pero vale saberlo.

### Preguntas (hace falta tu respuesta antes de la Fase 3)

1. **Ubicación de los mockups.** El HANDOFF los referencia como `rediseno/mockups/` pero están en `mockups/`. ¿Los muevo a `rediseno/mockups/` o los dejo en `mockups/`?
2. **Imágenes de alto peso en `public/`.** `space.mp4` (103 MB), `timrael-space-...jpg` (1.1 MB), `math.jpg` (770 KB), `spanish.jpg` (560 KB), etc. ¿Las elimino si el rediseño ya no las usa, o las dejo?
3. **Imágenes nuevas sin trackear.** `public/doctor.jpg`, `public/group.jpg`, `public/medicine.jpg` llegaron en el entorno. ¿Son del rediseño? Si sí, ¿las uso en el landing/login (que no tienen mockup) o en alguna pantalla del alcance?
4. **Alcance confirmado.** Confirmas que fuera de alcance quedan Admin (incluyendo Pagos), Login y Landing hasta que haya mockup, correcto?
5. **Datos faltantes.** Para los TODOs (puntajes Ceneval, meta, estado por clase, lista maestro↔alumno, "requiere atención"), ¿dejamos todo como `TODO(rediseno):` y derivamos del mock existente con helpers, o pego valores derivados mejor cerca del punto de uso? Preferencia por el helper centralizado.
6. **`design-misa`.** ¿Reviso si hay commits útiles que valga la pena rescatar antes de dejarla morir?
7. **Supuestos del HANDOFF (reparto 138 preguntas, conversión 700–1300 lineal, tiempo límite).** ¿Los dejo como constantes en `src/config/rediseno.js` con los valores actuales del HANDOFF y los dejo visibles para que el cliente los confirme después?

---

## 6. Comandos y flujo

- Build: `npm run build` (vite build)
- Lint: `npm run lint` (oxlint)
- Dev: `npm run dev`
- Al final de cada fase/pantalla: build + lint verdes antes de commit.

Alto obligatorio tras este documento: no empiezo la Fase 3 hasta que apruebes el plan.
