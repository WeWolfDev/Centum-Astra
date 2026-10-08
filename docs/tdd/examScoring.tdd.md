# TDD Evidence — Extracción del cálculo de puntuación del simulador

- Fecha: 2026-10-08
- Rama: `feature/tests-simulador`
- Plan: conversacional (no `*.plan.md`). Aprobado por el usuario con 5 ajustes antes de implementar.

## User journeys

1. Como alumno que termina el simulador, veo mi número de aciertos y mi puntaje Ceneval en pantalla, con el mismo comportamiento visible que antes del refactor.
2. Como desarrollador, puedo testear la fórmula de puntuación de forma aislada, sin montar React.

## Tareas y resultados

| # | Tarea | Evidencia |
|---|-------|-----------|
| 1 | Setup de Vitest 5 compat Vite 8 | `npm view vitest peerDependencies` → `vite: '^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0'`. Instalado `vitest@^5.0.3` y `@vitest/coverage-v8@^5.0.3`. |
| 2 | Threshold 80% solo en scope | `vite.config.js` `test.coverage.thresholds` con dos entradas por archivo. Verificado por fallo esperado en primera corrida (functions 50% < 80% en `rediseno.js`). |
| 3 | `npm test` en CI tras lint | `.github/workflows/pr.yml`: step `Test` entre `Lint` y `Build`. |
| 4 | RED: tests sin impl | `npm test` falló con `Cannot find module './examScoring'` (RED runtime válido). |
| 5 | GREEN: `contarAciertos` + `calcularResultadoSimulador` | `npm test`: 24 passed, 1 expected fail. |
| 6 | Refactor: un solo camino | `grep -n aciertosACeneval src/pages/exam/ExamSimulator.jsx` → vacío. `ResultadoSimulador` recibe `puntaje` como prop; nadie en el archivo llama `aciertosACeneval`. |
| 7 | Cobertura final | `npm run test:coverage` → 100% statements/branches/functions/lines en los dos archivos del scope. |
| 8 | Build no se rompe | `npm run build` → `✓ built in 488ms`, sin errores. |

## Especificación de tests

| # | Guarantía | Archivo / caso | Tipo | Resultado |
|---|-----------|----------------|------|-----------|
| 1 | `aciertosACeneval(0)` devuelve MIN (700) | `rediseno.test.js` → "devuelve MIN con 0 aciertos..." | unit | PASS |
| 2 | `aciertosACeneval(total)` devuelve MAX (1300) | `rediseno.test.js` → "devuelve MAX..." | unit | PASS |
| 3 | Interpolación lineal exacta en tercios y mitad | 3 casos (`5/10`, `1/3`, `2/3`) | unit | PASS |
| 4 | Redondeo al entero más cercano con fracciones no exactas | `aciertosACeneval(1, 7) === 786` | unit | PASS |
| 5 | Clamp a MAX cuando `aciertos > total` | `aciertosACeneval(200, 138) === 1300` | unit | PASS |
| 6 | Clamp a MIN cuando `aciertos < 0` | `aciertosACeneval(-5, 138) === 700` | unit | PASS |
| 7 | **BUG documentado**: `total=0` devuelve NaN en vez de un valor finito del rango | `it.fails("devuelve un valor finito...")` + `it("comportamiento actual produce NaN...")` | unit | expected fail + PASS |
| 8 | `puedeDescargarPdf` permite teacher/admin, niega el resto | 5 casos | unit | PASS |
| 9 | `contarAciertos` con answers vacío → 0 | `examScoring.test.js` | unit | PASS |
| 10 | `contarAciertos` todos incorrectos → 0 | unit | PASS |
| 11 | `contarAciertos` todos correctos → `questions.length` | unit | PASS |
| 12 | `contarAciertos` ignora índices fuera de rango | unit | PASS |
| 13 | `contarAciertos` requiere `===` estricto (null/undefined no cuentan como 0) | 2 casos | unit | PASS |
| 14 | `contarAciertos` con questions vacío → 0 | unit | PASS |
| 15 | `calcularResultadoSimulador` devuelve `{aciertos, puntaje}` consistentes en 0, total y proporción 5/10 | 4 casos | unit | PASS |

## Bug encontrado y NO corregido (por instrucción del usuario)

**`aciertosACeneval(0, 0)` devuelve `NaN`.**

- Causa raíz (`src/config/rediseno.js:23`): `aciertos / total` = `0/0` = `NaN`. El clamping con `Math.max/Math.min` deja pasar `NaN` porque `Math.min(1, NaN) === NaN` y `Math.max(0, NaN) === NaN`. `Math.round(min + NaN * ...)` = `NaN`.
- Riesgo real hoy: bajo. El llamador siempre pasa `SIMULADOR_TOTAL_PREGUNTAS = 138` o `questions.length > 0`.
- Riesgo futuro: medio. Si un simulador vacío llega a este cálculo (banco mal armado, feature flag), la UI pintaría "NaN" como puntaje. El `Pastilla` y el aciertos sí renderizarían.
- Documentado en la suite con `it.fails` (bug conocido, no corregido) + un test afirmativo del comportamiento observado para marcar el regress point.
- Arreglo sugerido (cuando se decida corregir): devolver `MIN` cuando `total <= 0` como guard clause.

## Comandos verificados

```bash
npm test                 # 29 passed | 1 expected fail (30)
npm run test:coverage    # 100% en los dos archivos del scope
npm run lint             # pasa (warnings pre-existentes, ninguno nuevo)
npm run build            # ✓ built in 488ms
```

## Checkpoints en `feature/tests-simulador`

```
ed8fe2f refactor(exam): compute puntaje via calcularResultadoSimulador
1942537 feat(lib): add pure contarAciertos y calcularResultadoSimulador
eac2dca test: add vitest + failing specs for exam scoring extraction
```

## Nota pendiente

- El directorio `coverage/` queda untracked. El `.gitignore` del proyecto tenía ya un cambio pre-existente al iniciar la sesión, así que no se tocó; agregarlo queda a criterio del dueño del repo.
