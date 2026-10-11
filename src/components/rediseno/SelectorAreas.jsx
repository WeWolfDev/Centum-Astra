import Pestanas from './Pestanas';
import IconSubject from './IconSubject';
import { AREA_POR_ID } from '../../config/areas';

// Las clases van explícitas (string literal) para que el scanner JIT de Tailwind
// las encuentre en el source y genere su CSS.
const TINTE_INACTIVO = 'bg-space-navy/75';
const TINTE_ACTIVO   = 'group-data-[activa=true]:bg-space-navy/35';

// Selector de áreas con foto de fondo. Compound sobre Pestanas:
//   - El selector es Pestanas.Lista + Pestanas.Tab en apariencia personalizada.
//   - El contenido de cada área es Pestanas.Panel (lo arma el consumidor).
//
// Estado visual por tab:
//   Inactivo → foto grayscale + tinte 'fuerte' + ring blanco sutil.
//   Activo   → foto a color + tinte 'suave' + ring dorado.
// Ambos estados mantienen una capa de legibilidad fija (space-void/40) para
// garantizar contraste ≥ 4.5:1 con la etiqueta blanca.

export default function SelectorAreas({ modulos }) {
  return (
    <Pestanas.Lista
      apariencia="personalizada"
      className={
        'flex items-stretch gap-2 w-full ' +
        'overflow-x-auto scrollbar-hide snap-x snap-mandatory ' +
        '-mx-4 px-4'
      }
    >
      {modulos.map((mod) => {
        const area = AREA_POR_ID[mod.id];
        return (
          <Pestanas.Tab
            key={mod.id}
            valor={mod.id}
            apariencia="personalizada"
            className={
              'relative isolate group flex-1 min-w-[132px] min-h-[76px] ' +
              'flex-shrink-0 snap-start overflow-hidden rounded-xl ' +
              'ring-1 ring-inset ring-white/10 ' +
              'data-[activa=true]:ring-2 data-[activa=true]:ring-gold-bright ' +
              'transition-[box-shadow] duration-200'
            }
          >
            {area?.imagen ? (
              <img
                src={area.imagen}
                alt=""
                loading="lazy"
                decoding="async"
                width={800}
                height={533}
                className={
                  'absolute inset-0 h-full w-full object-cover ' +
                  'grayscale group-data-[activa=true]:grayscale-0 ' +
                  'transition-[filter] duration-300 ease-out ' +
                  'motion-reduce:transition-none'
                }
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-space-navy via-space-mid to-space-light"
              />
            )}

            {/* Tinte navy: fuerte inactivo, suave activo */}
            <span
              aria-hidden="true"
              className={
                `absolute inset-0 ${TINTE_INACTIVO} ${TINTE_ACTIVO} ` +
                'mix-blend-multiply transition-colors duration-300 ' +
                'motion-reduce:transition-none'
              }
            />

            {/* Capa de legibilidad fija para contraste ≥ 4.5:1 */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-space-void/40"
            />

            {/* Icono + etiqueta centrados */}
            <span className="relative z-10 flex h-full flex-col items-center justify-center gap-1.5 px-2 py-2 text-white">
              <IconSubject name={area?.icono ?? 'math'} size={26} />
              <span className="font-display font-semibold text-xs leading-tight text-center line-clamp-2">
                {mod.title}
              </span>
            </span>
          </Pestanas.Tab>
        );
      })}
    </Pestanas.Lista>
  );
}
