---
version: 1
name: Centum Astra
description: Plataforma de preparación para el EXANI-II. Marca de navy profundo y dorado plano, con modo oscuro ("Espacio") y modo claro ("Marfil y oro"). Títulos en Bricolage Grotesque, cuerpo en Plus Jakarta Sans y logotipo en Orbitron. Superficies sólidas, sin vidrio ni degradados dorados en texto.

modes:
  dark: Espacio (predeterminado). Landing y páginas públicas siempre usan este modo.
  light: Marfil y oro. Solo dentro de la plataforma y en el inicio de sesión.

colors:
  dark:
    canvas: "#030a1a"
    canvas-raised: "#04091f"
    surface: "#0c1d45"
    surface-subtle: "rgba(255,255,255,0.05)"
    hairline: "rgba(255,255,255,0.10)"
    border-input: "rgba(255,255,255,0.20)"
    ink: "#ffffff"
    ink-secondary: "#cbd5e1"
    ink-mute: "rgba(255,255,255,0.60)"
    gold: "#f5c842"
    gold-soft: "rgba(245,200,66,0.10)"
    danger: "#f87171"
    success: "#34d399"
    warning: "#fbbf24"
    info: "#93c5fd"
  light:
    canvas: "#faf8f3"
    canvas-raised: "#f4f1e8"
    surface: "#ffffff"
    surface-subtle: "rgba(12,29,69,0.04)"
    hairline: "#e5dfcf"
    border-input: "#8c8470"
    ink: "#0c1d45"
    ink-secondary: "#3b4766"
    ink-mute: "#5c6680"
    gold: "#8a6508"
    gold-soft: "#fbefc4"
    danger: "#b91c1c"
    success: "#047857"
    warning: "#b45309"
    info: "#1d4ed8"
  both:
    gold-fill: "#f5c842"
    on-gold: "#030a1a"
    block: "#0c1d45"
    on-block: "#ffffff"
    on-block-secondary: "#cbd5e1"

typography:
  display-xl: { fontFamily: "Bricolage Grotesque", fontSize: 40px, fontWeight: 800, lineHeight: 1.05, letterSpacing: -0.02em }
  display-lg: { fontFamily: "Bricolage Grotesque", fontSize: 28px, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.01em }
  heading:    { fontFamily: "Bricolage Grotesque", fontSize: 18px, fontWeight: 700, lineHeight: 1.3 }
  stat:       { fontFamily: "Bricolage Grotesque", fontSize: 56px, fontWeight: 800, lineHeight: 1, letterSpacing: -0.03em, fontFeature: tnum }
  body:       { fontFamily: "Plus Jakarta Sans", fontSize: 15px, fontWeight: 400, lineHeight: 1.6 }
  body-sm:    { fontFamily: "Plus Jakarta Sans", fontSize: 13px, fontWeight: 500, lineHeight: 1.5 }
  label:      { fontFamily: "Plus Jakarta Sans", fontSize: 12px, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0.06em, textTransform: uppercase }
  wordmark:   { fontFamily: "Orbitron", fontSize: 12px, fontWeight: 700, letterSpacing: 0.12em }

rounded: { sm: 8px, md: 10px, lg: 12px, xl: 16px, pill: 999px }
spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, 6: 24px, 8: 32px, 10: 40px, 12: 48px }
---

## Overview

Centum Astra prepara a aspirantes a carreras de salud para el EXANI-II. La interfaz tiene que transmitir **método y confianza**, no entretenimiento: superficies sólidas, jerarquía clara y un solo acento de marca, el **dorado**.

La marca vive en dos modos:

- **Espacio (oscuro):** fondo navy casi negro, texto blanco y dorado `#f5c842`. Es el modo original y el único de la landing y las páginas públicas.
- **Marfil y oro (claro):** fondo blanco cálido, texto navy y un dorado oscurecido para que se lea sobre blanco. Lo pidió el cliente el 2026-11-08 (#58) y aplica solo dentro de la plataforma y en el inicio de sesión.

En ambos modos se conserva el **bloque navy** (`{colors.both.block}`) como superficie de firma: el simulador EXANI-II y las cifras principales viven ahí, con texto blanco y dorado brillante. En modo claro ese bloque es el único elemento oscuro de la pantalla y concentra la atención.

**Rasgos clave:**
- Un solo acento: dorado. Relleno `#f5c842` en botones; como texto, `{colors.<modo>.gold}`.
- Tres superficies por modo: `canvas`, `surface` y `surface-subtle`, más el bloque navy.
- Cifras grandes en Bricolage Grotesque con números tabulares.
- Sin vidrio (`backdrop-filter`), sin estrellas y sin degradados dorados en texto ni en botones (ver `mockups/HANDOFF.md`).

## Colors

### Acento
- **Dorado de relleno** (`{colors.both.gold-fill}` — `#f5c842`): botón primario, indicador de navegación activa, punto final de gráficas. Siempre con texto `{colors.both.on-gold}` (12.5:1).
- **Dorado de texto** (`{colors.<modo>.gold}`): `#f5c842` en oscuro (12:1 sobre `#030a1a`) y `#8a6508` en claro (5.0:1 sobre `#faf8f3`). Para cifras, enlaces destacados, iconos de marca y bordes activos.
- **Dorado suave** (`{colors.<modo>.gold-soft}`): fondo de insignias y del ítem de navegación activo. En claro va con texto `#6e5208` (6.4:1).

### Superficies
| Rol | Oscuro | Claro | Uso |
|---|---|---|---|
| `canvas` | `#030a1a` | `#faf8f3` | Fondo de página |
| `canvas-raised` | `#04091f` | `#f4f1e8` | Sidebar y header |
| `surface` | `#0c1d45` | `#ffffff` | Tarjetas, modales, inputs |
| `surface-subtle` | blanco 5 % | navy 4 % | Filas, chips, botón secundario |
| `block` | `#0c1d45` | `#0c1d45` | Bloque de firma (simulador, cifra principal) |

### Texto
| Rol | Oscuro | Claro | Contraste mínimo |
|---|---|---|---|
| `ink` | `#ffffff` | `#0c1d45` | 15.5:1 |
| `ink-secondary` | `#cbd5e1` | `#3b4766` | 8.7:1 |
| `ink-mute` | blanco 60 % | `#5c6680` | 5.4:1 |

`ink-mute` es el texto más tenue permitido. Nada por debajo de eso, ni siquiera en pies de página.

### Estados
| Estado | Oscuro | Claro |
|---|---|---|
| Error | `#f87171` | `#b91c1c` (6.1:1) |
| Éxito | `#34d399` | `#047857` (5.2:1) |
| Aviso | `#fbbf24` | `#b45309` (4.7:1) |
| Información | `#93c5fd` | `#1d4ed8` (6.3:1) |

Los estados siempre llevan icono o texto además del color (RNF-U-20).

### Implementación
Los colores viven como variables CSS en `src/index.css` (`--c-*`, canales RGB) y Tailwind las lee. `white` en Tailwind es la tinta del tema, así que `text-white/70` se adapta solo. **Nunca escribas colores hex o `rgba()` en `style={{}}`**: usa clases de Tailwind o `rgb(var(--c-…))`. En gráficas SVG o Recharts, lee los colores del tema con el hook de colores, no con hex.

## Typography

- **Bricolage Grotesque** (600, 700, 800): títulos y cifras.
- **Plus Jakarta Sans** (400–700): todo el cuerpo y los controles.
- **Orbitron**: solo el logotipo "CENTUM ASTRA".

Reglas:
- Las cifras (puntajes, aciertos, porcentajes) usan `font-variant-numeric: tabular-nums`.
- Mínimo 13 px para texto de interfaz y 12 px solo para etiquetas en mayúsculas.
- Títulos con tracking negativo; etiquetas en mayúsculas con tracking positivo.

## Layout

- Contenedor de página: 40 px × 48 px en escritorio, 20 px × 16 px en móvil (`.rediseno-page`).
- Espaciado en múltiplos de 4 px; separación entre secciones de 32 a 48 px.
- Sidebar de 240 px en escritorio, cajón en móvil.

## Elevation & Depth

- **Oscuro:** la profundidad sale del contraste entre `canvas` y `surface`. Sombras negras suaves solo en modales y menús.
- **Claro:** tarjetas blancas sobre marfil con borde `hairline` y sombra `0 1px 2px rgba(12,29,69,0.06), 0 4px 16px rgba(12,29,69,0.06)`. Nunca sombras negras intensas.
- El halo de fondo es una sola capa radial arriba: navy en oscuro y dorado al 14 % en claro.

## Shapes

`rounded.md` (10 px) para botones e inputs, `rounded.xl` (16 px) para tarjetas y bloques, `rounded.pill` para insignias y chips. Las fotos de materia usan 16 px.

## Components

### Botones
- **Primario:** relleno `gold-fill`, texto `on-gold`, 44 px de alto, radio 10 px. Un primario por zona.
- **Secundario:** `surface-subtle` con borde `hairline`, texto `ink`.
- **Fantasma:** sin fondo; texto `ink-secondary` y `ink` al pasar el cursor.
- **Peligro:** relleno `danger` con texto `on-peligro` (oscuro en modo oscuro, blanco en claro).
- Foco: anillo de 2 px en `gold` con separación de 2 px (≥ 3:1 en ambos modos).

### Tarjetas
- `surface` con borde `hairline` y radio 16 px. En claro, con la sombra suave.
- El **bloque navy** (`block`) no cambia con el modo: texto `on-block`, cifras en `#f5c842`.

### Inputs
- Fondo `surface`, borde `border-input` (≥ 3:1 sobre el fondo), placeholder `ink-mute`, etiqueta `ink-secondary`.
- Al enfocar, el borde pasa a `gold`.

### Navegación
- Sidebar en `canvas-raised`. Ítem activo con fondo `gold-soft`, texto `ink` y una barra dorada de 2 px a la izquierda.
- Header en `canvas-raised` al 72 % con borde inferior `hairline`. Ahí vive el botón de modo claro u oscuro.

### Gráficas
- Línea y puntos en `gold`. Área bajo la línea en `gold` del 28 % al 2 %.
- Ejes y etiquetas en `ink-mute`. Dentro del bloque navy usan los valores del modo oscuro.

## Do's and Don'ts

### Do
- Usa los roles (`ink`, `surface`, `gold`…) y deja que el tema decida el valor.
- Revisa cada pantalla en ambos modos antes de abrir el PR.
- Usa el bloque navy para lo más importante de la pantalla: una cifra o una acción.
- Acompaña el color con icono o texto en cualquier estado.

### Don't
- No uses `#f5c842` como texto sobre fondos claros: da 1.6:1.
- No pongas degradados dorados en titulares ni cifras (`text-gradient-gold`, `bg-clip-text`).
- No escribas `#ffffff`, `#030a1a` ni `rgba(255,255,255,…)` en estilos inline: en modo claro quedan blanco sobre blanco o navy sobre navy.
- No uses texto con menos de 60 % de opacidad en oscuro, ni más claro que `ink-mute` en claro.
- No agregues colores de acento nuevos. Los colores por materia van solo en etiquetas de texto.
- No apliques el modo claro a la landing ni a las páginas públicas.

## Responsive Behavior

| Nombre | Ancho | Cambios |
|---|---|---|
| Escritorio | ≥ 1024 px | Sidebar fija, cuadrículas de 3 a 5 columnas |
| Tableta | 768–1023 px | Sidebar en cajón, cuadrículas de 2 columnas |
| Móvil | < 768 px | Una columna, header con logo y menú, `stat` baja de 56 a 40 px |

Áreas táctiles de 44 × 44 px como mínimo y botones `<button>` o enlaces `<a>` reales.

## Iteration Guide

1. Lee este archivo y `mockups/HANDOFF.md` antes de tocar una pantalla.
2. Migra una pantalla a la vez: quita los colores inline y usa roles.
3. Verifica el contraste con los valores de las tablas; si agregas un color, calcula su contraste y anótalo aquí.
4. Revisa la pantalla en ambos modos y en 375 px y 1440 px.
5. Si una decisión de este archivo cambia, actualízalo en el mismo PR.
