import { ArrowUp, ArrowDown } from 'lucide-react';
import BotonPrimario from './BotonPrimario';

// Bloque azul sólido con acento dorado plano para resultados de simulador EXANI-II.
// delta: número positivo = subida (dorado), negativo = baja (gris, HANDOFF), undefined = no mostrar.
export default function SimuladorBlock({
  titulo = 'Simulador EXANI-II',
  subtitulo,
  fecha,
  puntajeCeneval,
  delta,
  onIniciar,
  children,
}) {
  const hasDelta = typeof delta === 'number' && !Number.isNaN(delta);
  const positivo = hasDelta && delta > 0;

  return (
    <section
      aria-label={titulo}
      style={{
        background: '#0c1d45',
        borderRadius: 18,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: '#e2e8f0',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cbd5e1' }}>{subtitulo}</p>
          )}
          {fecha && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{fecha}</p>
          )}
        </div>

        {typeof puntajeCeneval === 'number' && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: 40,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: '#f5c842',
              }}
            >
              {puntajeCeneval.toLocaleString('es-MX')}
            </span>
            {hasDelta && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  color: positivo ? '#f5c842' : '#cbd5e1',
                }}
              >
                {positivo ? <ArrowUp size={13} strokeWidth={2.6} /> : <ArrowDown size={13} strokeWidth={2.6} />}
                {Math.abs(delta)}
              </span>
            )}
          </div>
        )}
      </div>

      {children}

      {onIniciar && (
        <div>
          <BotonPrimario onClick={onIniciar}>Iniciar simulador</BotonPrimario>
        </div>
      )}
    </section>
  );
}
