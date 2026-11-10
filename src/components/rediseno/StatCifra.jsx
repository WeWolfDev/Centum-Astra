// Cifra grande en Bricolage 800 + etiqueta pequeña.
// tono: 'blanco' (default) | 'dorado' | 'suave' | tokens semánticos
//       ('exito' | 'info' | 'peligro' | 'advertencia' | 'violeta').
// Los tokens coinciden con tailwind.config.js y con src/config/graficas.js.
const COLORES = {
  blanco:      'rgb(var(--c-ink))',
  dorado:      'rgb(var(--c-gold-bright))',
  suave:       'rgb(var(--c-ink) / 0.8)',
  exito:       'rgb(var(--c-exito))',
  info:        'rgb(var(--c-info))',
  peligro:     'rgb(var(--c-peligro))',
  advertencia: 'rgb(var(--c-advertencia))',
  violeta:     'rgb(var(--c-violeta))',
};

// degradado: aplica el gradiente dorado (yellow-200 → gold-bright → amber-500/80)
// como fill del texto. Solo tiene efecto cuando tono === 'dorado'. Pensado para
// las KPIs destacadas del admin dashboard. Default false (color sólido del tono).
export default function StatCifra({
  cifra,
  etiqueta,
  tono = 'blanco',
  size = 'md',
  degradado = false,
}) {
  const color = COLORES[tono] || COLORES.blanco;
  const fontSize = size === 'lg' ? 48 : size === 'sm' ? 24 : 34;
  const esGradienteDorado = degradado && tono === 'dorado';
  return (
    <div>
      <p
        className={
          esGradienteDorado
            ? 'text-gold-bright'
            : undefined
        }
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: esGradienteDorado ? undefined : color,
          margin: 0,
        }}
      >
        {cifra}
      </p>
      {etiqueta && (
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: 'rgb(var(--c-ink) / 0.6)',
            textTransform: 'uppercase',
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          {etiqueta}
        </p>
      )}
    </div>
  );
}
