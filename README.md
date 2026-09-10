<p align="center">
  <img src="public/logo-astra.jpeg" alt="Centum Astra" width="88" style="border-radius: 12px;" />
</p>

<h1 align="center">Centum Astra</h1>

<p align="center">
  <strong>Plataforma educativa para la preparación del EXANI-II</strong><br/>
  Diseñada para llevar a cada aspirante al siguiente nivel.
</p>

---

## 📖 Sobre Centum Astra

**Centum Astra** es una plataforma de asesorías académicas enfocada en la preparación integral del **Examen Nacional de Ingreso a la Educación Superior (EXANI-II)** del CENEVAL.

No es un banco de preguntas genérico. Es una experiencia de aprendizaje estructurada, moderna y adaptada a los estándares reales del examen — construida para que los alumnos lleguen seguros, preparados y con ventaja el día del examen.

### ✨ Módulos y funcionalidades

| Módulo | Descripción |
|--------|-------------|
|  **Autenticación por rol** | Login con selector de perfil: Administrador, Profesor y Alumno. Cada rol accede a una experiencia diferente. |
| **Dark Space Theme** | Interfaz oscura con acentos dorados y clínicos. Fondo de video espacial, estrellas animadas y glassmorphism. |
|  **Dashboard Admin** | Tabla de alumnos con búsqueda, filtro por estatus de pago y tarjetas de métricas en tiempo real. |
|  **Dashboard Profesor** | Vista de progreso del grupo, ranking de alumnos y gráfica de evolución semanal. |
|  **Dashboard Alumno** | Anillo de progreso tipo constelación, resultados recientes y acceso directo a módulos. |
|  **Módulos transversales** | Pensamiento Matemático, Comprensión Lectora y Redacción Indirecta — núcleo del EXANI-II. |
|  **Módulo Pre-medicina** | Área específica con diseño clínico (teal) para aspirantes al área de la salud. |
|  **Gestor de materiales** | Organización de recursos por módulo y sesión. Profesores pueden subir PDFs, Excel y PPT, y revelar/ocultar clases progresivamente. |
|  **Videoteca** | Biblioteca de sesiones grabadas con filtros por materia y buscador. Profesores pueden subir nuevas sesiones. |
|  **Simulador EXANI-II** | Simulacro con formato CENEVAL: temporizador, navegación por reactivos, retroalimentación y reporte de puntuación en escala 700–1300. Profesores pueden crear simuladores personalizados. |

| 📈 **Estadísticas** | Gráficas de rendimiento por materia y evolución semanal del grupo (Recharts). |

---

## 👨‍💻 El Equipo

**Centum Astra** es desarrollado por un equipo compacto y comprometido. Cada persona es responsable de áreas críticas del producto.

| Rol | Persona |
|-----|---------|
| 🛠️ **Core Developer** | César |
| 🛠️ **Core Developer** | Omar |
| 🛠️ **Core Developer** | Misael |



---

## 🗂️ Estructura del proyecto

```
src/
├── components/              # Solo componentes verdaderamente reutilizables
│   ├── layout/
│   │   ├── Header.jsx       # Barra superior con título de sección y chip de usuario
│   │   ├── Sidebar.jsx      # Navegación lateral por rol (admin / profesor / alumno)
│   │   └── PublicNav.jsx    # Navbar pública con selector de cursos (landing / login)
│   └── ui/
│       └── Stars.jsx        # Campo de estrellas animadas (fondo decorativo)
│
├── pages/                   # Una carpeta por ruta/vista
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   └── Statistics.jsx
│   ├── auth/
│   │   └── Login.jsx
│   ├── exam/
│   │   └── ExamSimulator.jsx
│   ├── modules/
│   │   └── FileManager.jsx
│   ├── student/
│   │   └── StudentDashboard.jsx
│   ├── teacher/
│   │   └── TeacherDashboard.jsx
│   ├── video/
│   │   └── VideoLibrary.jsx
│   └── whiteboard/
│       └── Whiteboard.jsx
│
├── context/
│   └── AuthContext.jsx      # Estado global de autenticación
├── data/
│   └── mockData.js          # Mock de usuarios, módulos, videos y preguntas EXANI
├── hooks/
│   └── useBreakpoint.js     # Hook para breakpoints responsivos
├── lib/
│   └── utils.js             # Utilidad cn() (clsx + tailwind-merge)
├── App.jsx                  # Enrutamiento por estado y rol de usuario
├── index.css                # Estilos globales, tokens del Dark Space Theme
└── main.jsx                 # Entry point de React
```

---

## Flujo de Trabajo — Git Flow

Esta sección es la **regla de oro** del repositorio. Seguir este flujo evita conflictos, pérdida de trabajo y dolores de cabeza colectivos. **Léela, memorízala, síguela.**

### Vista general de las ramas

```
main ──────────────────────────────────────────────────► [PRODUCCIÓN]
  │
  └── hotfix/* ──────────────────────────────────────► (merge → main + develop)
  
develop ───────────────────────────────────────────────► [INTEGRACIÓN]
  │
  ├── feature/login-backend ──────────────────────────► (merge → develop)
  ├── feature/simulador-ui ───────────────────────────► (merge → develop)
  └── release/v1.2.0 ──────────────────────────────────► (merge → main + develop)
```

---

### 🔴 `main` — Producción

**Lo que ven los alumnos. Siempre estable, siempre limpio.**

- Contiene únicamente código **verificado, revisado y aprobado**.
- **Nadie hace push directo a `main`.** Sin excepciones.
- Solo recibe merges desde `release/*` (lanzamiento planeado) o `hotfix/*` (emergencia).
- Cada merge a `main` debe ir acompañado de un **tag de versión** (ej. `v1.0.0`).

```bash
# ❌ PROHIBIDO
git push origin main

# ✅ CORRECTO — solo mediante Pull Request desde release/* o hotfix/*
```

---

### 🟡 `develop` — Integración del equipo

**Aquí converge el trabajo de César, Omar y Misael.**

- Es la rama base desde la que se crea cada `feature/*`.
- Es la rama a la que regresa cada `feature/*` una vez terminada.
- Debe compilar y funcionar en todo momento — no se sube código roto aquí.
- Antes de hacer merge de una `feature/*` a `develop`, sincroniza primero:

```bash
git checkout develop
git pull origin develop
git checkout feature/mi-tarea
git merge develop          # Resuelve conflictos aquí, no en develop
```

---

### 🟢 `feature/*` — Desarrollo de nuevas funciones

**Aquí es donde vive tu trabajo diario.**

- **Formato obligatorio:** `feature/<descripcion-corta-en-kebab-case>`
- Siempre se crea a partir de `develop`, nunca de `main`.
- Una tarea = una rama. No mezcles funcionalidades distintas en la misma rama.
- Cuando termines, abre un **Pull Request hacia `develop`** y pide revisión.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/videoteca-filtros

# ... trabajas, haces commits descriptivos ...
git push origin feature/videoteca-filtros

# Luego abres un Pull Request en GitHub → base: develop
```

**Ejemplos de nombres válidos:**
- `feature/login-backend`
- `feature/simulador-temporizador`
- `feature/premedicina-modulo-base`
- `feature/navbar-responsive`

---

### 🔵 `release/*` — QA antes de producción

**La antesala de `main`. Aquí se hacen las pruebas finales.**

- Se crea desde `develop` cuando el conjunto de features para una versión está listo.
- **Formato:** `release/vX.X.X` (ej. `release/v1.2.0`)
- Solo se permiten **bug fixes menores** en esta rama, no nuevas features.
- Una vez aprobada, se mergea a `main` **y** de regreso a `develop`.

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Después de QA exitoso:
# PR → main  (con tag v1.2.0)
# PR → develop (para sincronizar fixes)
```

---

### 🚨 `hotfix/*` — Emergencias en producción

**Para apagar incendios. Uso exclusivo de situaciones críticas.**

- Se crea **directamente desde `main`**, no desde `develop`.
- **Formato:** `hotfix/<descripcion-del-problema>`
- Después del fix, se mergea a `main` **y** a `develop`.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/simulador-crash-ios

# Fix, commit, push...
# PR → main  (deploy inmediato)
# PR → develop (para no perder el fix)
```

---

### 📋 Resumen de reglas

| Rama | Sale de | Mergea a | ¿Push directo? |
|------|---------|----------|----------------|
| `main` | — | — | ❌ Nunca |
| `develop` | `main` (inicial) | — | ❌ Solo via PR |
| `feature/*` | `develop` | `develop` | ✅ Tu propia rama |
| `release/*` | `develop` | `main` + `develop` | ✅ Tu propia rama |
| `hotfix/*` | `main` | `main` + `develop` | ✅ Tu propia rama |

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| ⚛️ **React** | 19 | Librería principal de UI |
| ⚡ **Vite** | 8 | Build tool y dev server |
| 🎨 **Tailwind CSS** | 3 | Utility-first CSS |
| 🎞️ **Framer Motion** | 13 | Animaciones y transiciones |
| 📊 **Recharts** | 3 | Gráficas de estadísticas |
| 🔷 **Lucide React** | — | Sistema de íconos |
| 🔗 **clsx + tailwind-merge** | — | Utilidad `cn()` para clases condicionales |
| 🔍 **oxlint** | — | Linter ultrarrápido |

---

## 🚀 Arrancar el proyecto en local

```bash
# 1. Clonar el repositorio
git clone https://github.com/<org>/centum-astra.git
cd centum-astra

# 2. Instalar dependencias
npm install

# 3. Arrancar el servidor de desarrollo
npm run dev
```

El proyecto correrá en `http://localhost:5173` por defecto (Vite).

```bash
# Otros comandos útiles
npm run build    # Build de producción
npm run preview  # Previsualizar el build
npm run lint     # Ejecutar oxlint
```

---

<p align="center">
  <img src="public/logo-astra.jpeg" alt="Centum Astra" width="32" style="border-radius: 6px; vertical-align: middle;" />
  &nbsp; Construido por el equipo Centum Astra · César · Omar · Misael
</p>
