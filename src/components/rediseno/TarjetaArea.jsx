import { ArrowRight } from 'lucide-react';
import IconSubject from './IconSubject';

// Tarjeta clicable con foto de fondo por área. Capas (de atrás hacia adelante):
//   1. Imagen o fallback de degradado si no se pasa `imagen`.
//   2. Tinte azul marino uniforme (configurable con `intensidadTinte`).
//   3. Degradado inferior fijo que garantiza contraste ≥ 4.5:1 para la etiqueta.
//   4. Insignia de icono (arriba-izq) y flecha (arriba-der).
//   5. Etiqueta (abajo-izq).
//
// La única variable visual expuesta al consumidor es `intensidadTinte` para que
// Diseño compare opciones en el sandbox. El degradado inferior NO cambia.

const TINTE_CLASSES = {
  suave:  'bg-space-navy/35',
  media:  'bg-space-navy/55',
  fuerte: 'bg-space-navy/75',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-space-void';

export default function TarjetaArea({
  titulo,
  icono,
  imagen,
  onClick,
  ariaLabel,
  intensidadTinte = 'media',
}) {
  const tinte = TINTE_CLASSES[intensidadTinte] ?? TINTE_CLASSES.media;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? `Abrir área ${titulo}`}
      className={
        'group relative isolate flex aspect-[4/3] w-full overflow-hidden ' +
        'rounded-2xl text-left ' +
        FOCUS_RING
      }
    >
      {imagen ? (
        <img
          src={imagen}
          alt=""
          loading="lazy"
          decoding="async"
          width={800}
          height={533}
          className={
            'absolute inset-0 h-full w-full object-cover ' +
            'transition-transform duration-500 ease-out ' +
            'group-hover:scale-105 ' +
            'motion-reduce:transform-none motion-reduce:transition-none'
          }
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-space-navy via-space-mid to-space-light"
        />
      )}

      {/* Tinte azul marino uniforme — configurable */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 ${tinte} mix-blend-multiply`}
      />

      {/* Degradado inferior fijo para contraste de la etiqueta */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-space-void/95 via-space-void/70 to-transparent"
      />

      {/* Insignia de icono */}
      <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm text-white">
        <IconSubject name={icono} size={20} />
      </span>

      {/* Flecha */}
      <ArrowRight
        size={20}
        aria-hidden="true"
        className={
          'absolute right-3 top-3 text-white/85 ' +
          'transition-transform duration-200 group-hover:translate-x-0.5 ' +
          'motion-reduce:transform-none motion-reduce:transition-none'
        }
      />

      {/* Etiqueta — permite hasta 2 líneas */}
      <span className="absolute inset-x-4 bottom-3 font-display font-semibold text-base leading-tight text-white line-clamp-2">
        {titulo}
      </span>
    </button>
  );
}
