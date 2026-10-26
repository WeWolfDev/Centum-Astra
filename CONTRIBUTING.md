# Guía de contribución — Centum Astra

Esta guía define **cómo trabajamos issues, ramas y Pull Requests** durante los 3 meses de desarrollo. Aplica a todo el equipo (César, Omar y Misael) sin excepciones.

- **Metodología:** Trunk-Based Development (no Git Flow).
- **Tablero:** [Centum-Astra-Projects](https://github.com/orgs/WeWolfDev/projects/4).
- **Sprints:** cada sprint es un [milestone](https://github.com/WeWolfDev/Centum-Astra/milestones) (`Sprint 1`, `Sprint 2`, …).

---

## 1. ¿Por qué Trunk-Based y no Git Flow?

Somos 3 personas con un proyecto de 3 meses. Git Flow (`develop`, `release/*`, merges dobles) agrega ceremonia y conflictos que no necesitamos.

| | Git Flow | Trunk-Based (lo que usamos) |
|---|---|---|
| Ramas permanentes | `main` + `develop` | Solo `main` |
| Vida de una rama | Días o semanas | **Máximo 2 días** |
| Integración | Al final (release) | Continua, varias veces por semana |
| Conflictos | Grandes y tardíos | Pequeños y tempranos |
| Trabajo incompleto | Se queda en la rama | Entra a `main` detrás de un *feature flag* |

**`main` es el tronco:** siempre compila, siempre pasa CI y siempre se puede mostrar al cliente.

---

## 2. Flujo de un issue

### 2.1 Estados del tablero

```
Backlog ──► To Do ──► In Progress ──► In Review ──► Done
                          │   ▲
                          ▼   │
                        Blocked
```

| Estado | Significado | ¿Quién lo mueve? |
|---|---|---|
| **Backlog** | Identificado, todavía no está en un sprint. | Automático al crearse / líder |
| **To Do** | Comprometido en el sprint actual (tiene milestone). | Líder en la planeación |
| **In Progress** | Alguien ya está trabajando en él y tiene rama. | El asignado |
| **In Review** | Hay un PR abierto que lo cierra. | Automático / el asignado |
| **Blocked** | Depende de otro issue, del cliente o de un acceso. | El asignado |
| **Done** | El PR se mergeó a `main` y el issue está cerrado. | Automático |

### 2.2 Reglas de los issues

- **Todo trabajo tiene issue.** Si no hay issue, se crea antes de abrir la rama.
- **Un issue = un responsable principal** (el primer asignado). Los demás asignados apoyan.
- Cada issue lleva:
  - **Etiquetas:** un `type:*`, al menos un `area:*` y un `priority:*`.
  - **Milestone** si entra al sprint.
  - **Campos del tablero:** `Priority`, `Size` (XS–XL), `Start date` y `Target date`.
  - **Descripción** con *Tareas* y *Criterios de aceptación* (ver `docs/ISSUES_PRUEBA.md` como plantilla).
  - **Dependencias** como `Depende de: #24, #25`.
- Si un issue no cabe en ~2 días de trabajo, **se divide en sub-issues**.
- Si te bloqueas: muévelo a **Blocked**, agrega la etiqueta `status:blocked` y comenta **qué** te bloquea y **a quién** necesitas.

---

## 3. Ramas

### 3.1 Nomenclatura

```
<tipo>/<area>-<descripcion-corta>
```

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat/auth-login-supabase` |
| `fix` | Corrección de error | `fix/exam-timer-reset` |
| `chore` | Configuración, dependencias, tooling | `chore/db-supabase-cli` |
| `refactor` | Reorganización sin cambio de comportamiento | `refactor/ui-admin-tabla` |
| `docs` | Documentación | `docs/contributing-trunk-based` |
| `test` | Pruebas | `test/auth-rls-negativas` |
| `hotfix` | Fix urgente sobre lo que ve el cliente | `hotfix/login-crash` |

### 3.2 Ciclo de vida

```bash
# 1. Partir SIEMPRE de main actualizado
git switch main
git pull --rebase

# 2. Crear la rama del issue
git switch -c feat/ui-admin-usuarios

# 3. Commits pequeños (ver sección 5)
git commit -m "feat: listar usuarios desde Supabase"

# 4. Antes de abrir el PR, traer lo último de main
git fetch origin
git rebase origin/main

# 5. Subir y abrir el PR
git push -u origin feat/ui-admin-usuarios
gh pr create --base main --fill
```

**Reglas:**

- **Nada vive más de 2 días en una rama.** Si el trabajo es más grande, se mergea por partes.
- **Nadie hace push directo a `main`.** Todo entra por PR.
- **No existe `develop`.** Las ramas `release/*` tampoco se usan.
- Usa `git pull --rebase` en `main`. Así evitas commits de merge innecesarios.
- La rama se borra después del merge.

### 3.3 Feature flags (trabajo incompleto)

Si una funcionalidad no está terminada pero el código ya es estable, **se mergea apagada**:

```js
// .env.local
VITE_FEATURE_SIMULADOR=false

// en el componente
if (import.meta.env.VITE_FEATURE_SIMULADOR === 'true') { /* ... */ }
```

- Agrega la etiqueta `behind-flag` al PR.
- El flag se elimina cuando la feature queda estable (es parte de la *Definition of Done*).
- Los flags **nunca** sirven para ocultar claves ni datos sensibles.

---

## 4. Pull Requests

### 4.1 Antes de abrir el PR

- [ ] La rama está rebaseada sobre `origin/main`.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan en local.
- [ ] No hay claves, tokens ni `service_role` en el código ni en variables `VITE_*`.

### 4.2 Contenido del PR

- **Título** con formato de commit: `feat: conectar login con Supabase Auth`.
- **Descripción:**
  - Qué cambia y por qué.
  - `Closes #N` (una línea por cada issue que cierra). **Esto es lo que mueve el issue a Done al mergear.**
  - Cambios de UI: **captura o video**.
  - Cambios de esquema: **migración + plan de rollback**.
- **Tamaño:** idealmente **menos de 400 líneas**. Si es más grande, divídelo.
- Abre el PR como **Draft** si quieres feedback temprano.

### 4.3 Revisión y merge

| Regla | Detalle |
|---|---|
| Aprobaciones | **1 aprobación** como mínimo (y la del *code owner* si toca sus archivos). |
| CI | El check **PR Check** (lint, test, build) debe estar en verde. |
| Tiempo de respuesta | Revisar PRs ajenos **el mismo día** o al día siguiente. |
| Tipo de merge | **Squash and merge.** Un PR = un commit en `main`. |
| Quién mergea | El autor, cuando ya tiene la aprobación y CI en verde. |
| Después del merge | Borrar la rama y confirmar que el issue quedó en **Done**. |

**Revisores sugeridos por área:**

| Área | Revisor principal |
|---|---|
| Supabase, Auth, RLS, backend (`area:db`, `area:auth`, `area:api`, `area:infra`) | César |
| Modelo de datos y consultas (`area:db`, `area:stats`) | Omar |
| Frontend y experiencia de usuario (`area:ui-*`) | Misael |

### 4.4 Hotfix

1. Rama `hotfix/<slug>` desde `main`.
2. PR con la etiqueta `hotfix`. Se revisa con prioridad.
3. Si el merge rompe algo, **se revierte de inmediato** con el botón *Revert* del PR y se arregla con calma.

---

## 5. Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/es/):

```
<tipo>: <descripción breve en minúsculas>
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

```bash
feat: agregar tabla de usuarios en panel admin
fix: corregir redirección después de logout
chore: inicializar supabase cli
```

---

## 6. Automatizaciones

Las automatizaciones mantienen el tablero al día sin trabajo manual. **Cada quien es responsable de verificar que su issue quedó en el estado correcto.**

### 6.1 Qué debe estar automatizado

| # | Evento | Resultado esperado | Dónde se configura |
|---|---|---|---|
| A1 | Se crea un issue o PR en el repo | Se agrega al tablero | Project → Workflows → *Auto-add to project* |
| A2 | Se agrega un item al tablero | Estado **Backlog** | Project → Workflows → *Item added to project* |
| A3 | Se abre un PR con `Closes #N` | El issue pasa a **In Review** | Project → Workflows → *Pull request linked to issue* |
| A4 | Se mergea el PR | El PR y el issue pasan a **Done** y el issue se cierra | `Closes #N` + *Pull request merged* |
| A5 | Se cierra un issue | Estado **Done** | Project → Workflows → *Item closed* |
| A6 | Un item llega a **Done** | Se cierra el issue | Project → Workflows → *Auto-close issue* |
| A7 | Se abre o actualiza un PR hacia `main` | Corre **PR Check** (lint → test → build) | `.github/workflows/pr.yml` |
| A8 | Se mergea un PR | Se borra la rama | Settings → General → *Automatically delete head branches* |
| A9 | Un PR toca archivos con dueño | Se pide revisión al dueño | `.github/CODEOWNERS` |

> **Mover a In Progress no está automatizado.** El asignado lo hace a mano al crear su rama.

### 6.2 Protección de `main`

- PR obligatorio, con 1 aprobación y la del *code owner*.
- Las aprobaciones se descartan si hay nuevos commits.
- La rama debe estar al día con `main` antes de mergear.
- **PR Check** debe ser un *status check* requerido.

---

## 7. Si una automatización falla: hacerlo a mano

Si un issue no cambió de estado, **no esperes a que se arregle solo.** Muévelo a mano y avisa en el chat del equipo qué automatización falló.

### 7.1 Tabla de corrección

| Situación | Estado correcto | Acción manual |
|---|---|---|
| El issue no aparece en el tablero | Backlog / To Do | En el issue: panel derecho → **Projects** → *Centum-Astra-Projects* |
| Empezaste a trabajar | **In Progress** | Cámbialo en el tablero (arrastrar la tarjeta o el campo *Status*) |
| Abriste el PR y el issue sigue en In Progress | **In Review** | Revisa que el PR diga `Closes #N`. Si no, edítalo y mueve el issue a mano |
| Se mergeó el PR y el issue sigue abierto | **Done** | Cierra el issue con un comentario `Cerrado por #PR` y muévelo a Done |
| El issue se cerró pero no está en Done | **Done** | Cámbiale el *Status* a Done |
| Te bloqueaste | **Blocked** | Status *Blocked* + etiqueta `status:blocked` + comentario |
| Se desbloqueó | **In Progress** / **To Do** | Quita `status:blocked` y regresa el estado |
| Se cerró por error | Estado anterior | *Reopen issue* y regresa el estado |
| Se cayó el PR Check por un problema de GitHub y no del código | — | *Re-run jobs* en la pestaña Checks. **Nunca** se mergea con CI en rojo |
| La rama no se borró | — | Botón *Delete branch* en el PR o `git push origin --delete <rama>` |

### 7.2 Desde la terminal (`gh`)

```bash
# Ver los items del tablero
gh project item-list 4 --owner WeWolfDev

# Agregar un issue al tablero
gh project item-add 4 --owner WeWolfDev --url https://github.com/WeWolfDev/Centum-Astra/issues/<N>

# Cerrar un issue indicando el PR
gh issue close <N> -c "Cerrado por #<PR>"

# Reabrir un issue
gh issue reopen <N>

# Marcar como bloqueado
gh issue edit <N> --add-label status:blocked
gh issue comment <N> -b "Bloqueado por #<M>: <motivo>"
```

Para cambiar el **Status** desde la terminal:

```bash
# Obtén el ID del item (PVTI_...) con item-list y luego:
gh project item-edit \
  --project-id PVT_kwDOD2sHy84BnjIZ \
  --field-id PVTSSF_lADOD2sHy84BnjIZzhmHOwg \
  --id <PVTI_...> \
  --single-select-option-id <OPCION>
```

| Estado | `<OPCION>` |
|---|---|
| Backlog | `1914ef5a` |
| To Do | `8c6ae027` |
| In Progress | `c46d9346` |
| In Review | `26558ed3` |
| Blocked | `f7e25e85` |
| Done | `3c60119c` |

---

## 8. Definition of Done

Un issue está **Done** solo si:

- [ ] Se cumplen todos sus criterios de aceptación.
- [ ] CI en verde (lint, test, build).
- [ ] Code review aprobada por al menos 1 miembro.
- [ ] Los cambios de UI incluyen captura o video en el PR.
- [ ] Los cambios de esquema incluyen migración + plan de rollback.
- [ ] El issue se cerró con `Closes #N` desde el PR (o a mano, si falló la automatización).
- [ ] El feature flag se retiró si la feature quedó estable en el sprint.

---

## 9. Ritmo del sprint

| Momento | Qué se hace |
|---|---|
| **Lunes (planeación)** | Se eligen los issues del sprint: milestone, **To Do**, fechas y tamaño. |
| **Diario (async, 5 min)** | Cada quien escribe en el chat: qué hice, qué haré y si estoy bloqueado. |
| **Durante la semana** | Ramas cortas y PRs pequeños; revisar PRs ajenos el mismo día. |
| **Viernes (cierre)** | Demo de lo que está en `main`. Lo no terminado vuelve a **To Do** del siguiente sprint o a **Backlog**. |
