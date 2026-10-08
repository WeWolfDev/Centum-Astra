# Centum Astra — Rediseño: guía de implementación

Este documento acompaña a los mockups de `rediseno/mockups/`. Está escrito para que Claude Code (o cualquier desarrollador) implemente el rediseño en el repo `centum-astra` sin tener que adivinar decisiones ya tomadas.

Lienzo con los mockups renderizados: https://claude.ai/artifact/M5TQAk9MULGMLSbhDGksnq

## Cómo leer los mockups

Los archivos `.dc.html` son HTML con estilos en línea. Son **referencia visual y de estructura**, no código para copiar tal cual.

- Tomar de ellos: jerarquía, tamaños, espaciados, colores, textos de interfaz y estados.
- No copiar: los estilos en línea (usar Tailwind y los tokens del proyecto), ni los **datos, que son todos de ejemplo** (nombres, puntajes, fechas, conteos). Cada pantalla debe conectarse a los datos reales que ya maneja la app.
- Las marcas `{{...}}` y el bloque `<script type="text/x-dc">` son la lógica de demostración del mockup (por ejemplo, mostrar u ocultar la meta). Sirven para entender el comportamiento esperado.

| Archivo | Pantalla | Reemplaza a |
|---|---|---|
| `Alumno-Inicio.dc.html` | Inicio del alumno | Dashboard / "Mi progreso" |
| `Alumno-Simuladores.dc.html` | Simuladores y quizzes | Entrada al simulador |
| `Alumno-Simulador.dc.html` | Simulador en curso (138 preguntas) | Simulador EXANI |
| `Alumno-Modulos.dc.html` | Módulos | Módulos |
| `Alumno-Videoteca.dc.html` | Videoteca | Videoteca |
| `Maestro-Alumnos.dc.html` | Mis alumnos (maestro) | Nueva o equivalente actual |
| `Maestro-Material.dc.html` | Material (maestro) | Gestión de archivos actual |

Pendientes de diseño: administrador (igual que maestro + **Pagos**), login y landing. No implementarlos hasta tener mockup.

## Cambios globales (hacer primero)

1. **Tipografía de títulos:** cambiar Syne por **Bricolage Grotesque** (pesos 600, 700, 800) en `tailwind.config.js` y `src/index.css`. El cuerpo sigue en Plus Jakarta Sans y el logotipo en Orbitron. De paso, corregir que Tailwind nombra Inter aunque el CSS usa Plus Jakarta Sans.
2. **Iconos:** quitar todos los emojis (Σ, 📖, ✍️, etc.) y usar iconos SVG de línea. Los trazos por materia están en los mockups (`<path d="...">`).
3. **Tarjetas:** dejar de envolver todo en tarjetas de vidrio idénticas. Solo tres superficies: fondo `#030a1a`, bloque sólido `#0c1d45` y relleno sutil `rgba(255,255,255,0.05)`.
4. **Dorado sólido:** `#f5c842` plano en botones y cifras. Sin degradado dorado en titulares ni botones.
5. **Contraste:** eliminar los textos `text-30`/`text-35`. Texto secundario mínimo `#cbd5e1`; el más tenue permitido es `rgba(255,255,255,0.6)`.
6. **Colores por materia:** solo en etiquetas de texto. Nada de miniaturas moradas, verdes o turquesa.
7. **Fondo:** una sola capa (el degradado radial azul del mockup). Quitar las estrellas decorativas.
8. **Limpieza:** quitar la insignia "Powered by Netlify" y reemplazar el favicon de Vite.
9. **Accesibilidad:** áreas táctiles de 44 px mínimo, `<button>` y `<a>` reales, `aria-label` en botones de solo icono.

## Reglas de negocio (no negociables)

### Quizzes y simuladores son cosas distintas
- **Quiz:** por tema de un módulo. Solo muestra **aciertos sobre total** (27 / 30). Sin porcentaje y sin puntaje Ceneval.
- **Simulador EXANI-II:** examen completo de **138 preguntas**. Es lo único que alimenta el **puntaje estimado** en índice Ceneval (escala **700 a 1300**) y las gráficas de evolución.
- Visualmente: simulador = bloque azul sólido con acentos dorados; quiz = bloque de contorno con acentos azul claro `#93c5fd`. Mantener esa distinción en toda la app.
- En el menú, la sección se llama "Simuladores y quizzes".

### El progreso va antes que la meta
La mayoría de los alumnos aspira a medicina, con cortes de 1240 o más. Mostrar "te faltan X puntos" cada vez que entran desmotiva.
- Lo primero que ve el alumno es **cuánto ha subido** desde su primer simulador ("Has subido 117 puntos").
- El punto de corte se llama **"meta"** y está **oculto por defecto**. Aparece solo si el alumno toca "Ver mi meta".
- Nunca mostrar la frase "te faltan X puntos".
- Cuando un simulador sale más bajo que el anterior, la flecha va en **gris**, no en rojo.
- El puntaje siempre lleva la nota: "Estimación. No es resultado oficial del Ceneval."

### Material de módulos
- Los PDFs los suben los maestros. El **alumno solo puede verlos**: sin botón ni enlace de descarga.
- Maestros y administradores sí pueden descargar, subir y eliminar.
- No hay barra ni porcentaje de avance por módulo. Sí hay estado por clase: Vista, En curso, Pendiente.

### Roles
- **Alumno:** Inicio, Módulos, Videoteca, Simuladores y quizzes.
- **Maestro:** Mis alumnos (resultados) y Material (subir PDFs).
- **Administrador:** todo lo del maestro, más Pagos.

## Supuestos sin confirmar con el cliente

No fijar estos valores en el código; dejarlos como configuración.

- Reparto de las 138 preguntas: se asumió 30 + 30 + 30 + 24 + 24.
- Conversión de aciertos a índice Ceneval: se asumió lineal (0 aciertos = 700, 138 = 1300). **No verificado.**
- Preguntas extra en algunos simuladores: se recomendó que no cuenten para el puntaje.
- De dónde sale la meta de cada alumno (la elige él o viene de una tabla de cortes por carrera).
- Si la meta debe mostrarse sola cuando el alumno ya está cerca.
- Si los quizzes van ligados a cada clase (así está en el mockup de Módulos).
- Si el maestro ve a todos sus alumnos en una lista o por grupos.
- Criterio de "requiere atención" en la vista del maestro.
- Tiempo límite del simulador.

## Orden sugerido

2. Cambios globales (sección anterior). Revisar que nada se rompa.
3. Componentes compartidos: menú lateral con iconos, bloque de simulador, bloque de quiz, botón primario, etiqueta tipo pastilla.
4. Una pantalla por commit, en este orden: Inicio, Simuladores y quizzes, Simulador en curso, Módulos, Videoteca, Mis alumnos, Material.
5. Al terminar cada pantalla, compararla contra el mockup y probarla a ancho de teléfono.

## Primer mensaje sugerido para Claude Code

> Lee `rediseno/HANDOFF.md` y los mockups de `rediseno/mockups/`. Después revisa cómo están hechas hoy las pantallas del alumno en `src/`. Antes de escribir código, dame un plan: qué componentes existentes se reutilizan, cuáles se crean, y de dónde sale cada dato real que los mockups muestran con datos de ejemplo. Señala cualquier dato que el mockup necesite y que hoy no exista en la app. No cambies nada hasta que apruebe el plan.
