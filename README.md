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
|  **Dashboard Admin** | Tabla de alumnos con búsqueda, filtro por estatus de pago y tarjetas de métricas de demostración. |
|  **Dashboard Profesor** | Vista de progreso del grupo, ranking de alumnos y gráfica de evolución semanal. |
|  **Dashboard Alumno** | Anillo de progreso tipo constelación, resultados recientes y acceso directo a módulos. |
|  **Módulos transversales** | Pensamiento Matemático, Comprensión Lectora y Redacción Indirecta — núcleo del EXANI-II. |
|  **Módulo Pre-medicina** | Área específica con diseño clínico (teal) para aspirantes al área de la salud. |
|  **Gestor de materiales** | Organización de recursos por módulo y sesión. Profesores pueden subir PDFs, Excel y PPT, y revelar/ocultar clases progresivamente. |
|  **Videoteca** | Biblioteca de sesiones grabadas con filtros por materia y buscador. Profesores pueden subir nuevas sesiones. |
|  **Simulador EXANI-II** | Simulacro con formato CENEVAL: temporizador, navegación por reactivos, retroalimentación y reporte de puntuación en escala 700–1300. Profesores pueden crear simuladores personalizados. |

| 📈 **Estadísticas** | Gráficas de rendimiento por materia y evolución semanal del grupo (Recharts). |

> El frontend actual es un prototipo navegable con datos simulados; sus formularios y acciones no equivalen a operaciones persistidas o pagos reales. Consulta los [requisitos funcionales y no funcionales](docs/REQUISITOS_FUNCIONALES.md) para conocer el alcance y los pendientes de producción.

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

## 🌳 Flujo de Trabajo — Trunk-Based Development

Trabajamos con **Trunk-Based Development** (no Git Flow): `main` es la única rama permanente, siempre compila y siempre se puede mostrar al cliente.

```
main ──●────●────●────●────●────●──────────► [TRONCO · siempre estable]
        \  /      \  /      \  /
         feat/…    fix/…     chore/…        (ramas cortas · máx. 2 días · PR + squash)
```

| Regla | Detalle |
|-------|---------|
| Rama base | Siempre `main` actualizado (`git pull --rebase`) |
| Nombre de rama | `<tipo>/<area>-<descripcion>` · ej. `feat/auth-login-supabase` |
| Vida de la rama | **Máximo 2 días**; lo incompleto entra detrás de un *feature flag* |
| Integración | PR a `main` con `Closes #N`, 1 aprobación y **PR Check** en verde |
| Merge | **Squash and merge** y se borra la rama |
| Push directo a `main` | ❌ Nunca |

👉 **Lee la [Guía de contribución](CONTRIBUTING.md)** para el flujo completo de issues y PRs, los estados del [tablero](https://github.com/orgs/WeWolfDev/projects/4), las automatizaciones y qué hacer a mano si alguna falla.

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
