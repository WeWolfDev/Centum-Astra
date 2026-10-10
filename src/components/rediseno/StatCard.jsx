import StatCifra from './StatCifra';

// Tarjeta de KPI con ícono, cifra, etiqueta y badge opcional de cambio.
// Compone StatCifra para cifra/etiqueta — no duplica sus estilos.
//
// props:
//   icono     — componente lucide-react (p.ej. Users). Opcional.
//   cifra     — valor numérico o string.
//   etiqueta  — texto bajo la cifra.
//   tono      — color del ícono y glow. Default 'dorado'.
//               'dorado' | 'exito' | 'info' | 'peligro' | 'advertencia' | 'violeta' | 'blanco' | 'suave'
//   cambio    — texto opcional ('+12%'). Si está presente, se muestra pastilla.
//   cambioUp  — bool. true → pastilla exito, false → pastilla peligro.
//   degradado — bool. Solo con tono='dorado'. Renderiza la cifra como gradiente dorado.
//   className — extra clases aplicadas al wrapper.
//
// El wrapper hereda el estilo "glass card" (bg-white/5 blur border-white/10 rounded-2xl)
// compartido por las tarjetas del rediseño.

const TONO_HEX = {
  dorado:      '#f5c842',
  exito:       '#34d399',
  info:        '#93c5fd',
  peligro:     '#f87171',
  advertencia: '#fbbf24',
  violeta:     '#c084fc',
  blanco:      '#ffffff',
  suave:       '#cbd5e1',
};

// Clases estáticas: Tailwind JIT las detecta por scan de fuente, no por composición dinámica.
const HOVER_BORDER_POR_TONO = {
  dorado:      'hover:border-gold-bright/30',
  exito:       'hover:border-exito/30',
  info:        'hover:border-info/30',
  peligro:     'hover:border-peligro/30',
  advertencia: 'hover:border-advertencia/30',
  violeta:     'hover:border-violeta/30',
  blanco:      'hover:border-white/25',
  suave:       'hover:border-white/25',
};

export default function StatCard({
  icono: Icono,
  cifra,
  etiqueta,
  tono = 'dorado',
  cambio,
  cambioUp = true,
  degradado = false,
  className = '',
}) {
  const color = TONO_HEX[tono] || TONO_HEX.dorado;
  const hoverBorder = HOVER_BORDER_POR_TONO[tono] || HOVER_BORDER_POR_TONO.blanco;
  // StatCifra ya soporta estos tonos como enum.
  const tonoCifra = tono;

  return (
    <div
      className={
        'group relative overflow-hidden rounded-2xl p-5 ' +
        'bg-white/5 backdrop-blur-xl border border-white/10 ' +
        `${hoverBorder} transition-colors duration-300 ` +
        className
      }
    >
      {/* Radial hover glow — color del tono */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}14 0%, transparent 65%)` }}
      />
      {/* Shimmer superior */}
      <div
        className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${color}45, transparent)` }}
      />

      <div className="relative flex items-start justify-between mb-3.5">
        {Icono && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}1a`, border: `1px solid ${color}26` }}
          >
            <Icono size={16} strokeWidth={1.7} style={{ color }} />
          </div>
        )}
        {cambio && (
          <span
            className={
              'text-xs font-semibold rounded-full px-2 py-0.5 border ' +
              (cambioUp
                ? 'bg-exito/10 text-exito border-exito/20'
                : 'bg-peligro/10 text-peligro border-peligro/20')
            }
          >
            {cambio}
          </span>
        )}
      </div>

      <div className="relative">
        <StatCifra cifra={cifra} etiqueta={etiqueta} tono={tonoCifra} degradado={degradado} />
      </div>
    </div>
  );
}
