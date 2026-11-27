import { useId, useState } from 'react';
import { ESCALA_PUNTAJE, puntajeEstimado } from '../../../config/rediseno';

// "¿Cuánto sacarías hoy?": el visitante mueve sus aciertos y ve su puntaje
// estimado en la escala de 700 a 1300, con la misma fórmula que la plataforma
// (decisión 1.10). Una afirmación con un gesto para comprobarla.
const TOTAL = 100;

export default function CalculadoraPuntaje() {
  const [aciertos, setAciertos] = useState(60);
  const id = useId();
  const puntaje = puntajeEstimado(aciertos, TOTAL);
  const { min, max } = ESCALA_PUNTAJE;
  const posicion = ((puntaje - min) / (max - min)) * 100;

  return (
    <div className="bloque rounded-2xl" style={{ background: 'rgb(var(--c-navy))', border: '1px solid rgb(255 255 255 / 0.1)', padding: 'clamp(20px, 4vw, 36px)' }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor={id} className="block text-white/75 text-[15px]">
            Si hoy contestaras bien
          </label>
          <p className="m-0 font-display font-bold text-white tabular-nums" style={{ fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.1 }}>
            {aciertos} <span className="text-white/60 text-[20px] font-semibold">de {TOTAL}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 text-white/75 text-[15px]">tu puntaje estimado sería</p>
          <p className="m-0 font-display font-extrabold tabular-nums" style={{ fontSize: 'clamp(44px, 7vw, 64px)', lineHeight: 1, color: '#f5c842' }} aria-live="polite">
            {puntaje.toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={TOTAL}
        value={aciertos}
        onChange={e => setAciertos(Number(e.target.value))}
        aria-label={`Aciertos de ${TOTAL}`}
        className="w-full mt-6"
        style={{ accentColor: '#f5c842', minHeight: 44 }}
      />

      {/* Escala 700–1300 con la posición del puntaje */}
      <div className="relative mt-5 h-3 rounded-full" style={{ background: 'rgb(255 255 255 / 0.1)' }} aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${posicion}%`, background: '#f5c842', transition: 'width 0.15s ease-out' }} />
      </div>
      <div className="flex justify-between mt-2 text-white/60 text-[13px] tabular-nums" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      <p className="mt-4 mb-0 text-white/60 text-[13px]">
        Estimación: 700 + aciertos ÷ total × 600. No es resultado oficial del EXANI-II.
      </p>
    </div>
  );
}
