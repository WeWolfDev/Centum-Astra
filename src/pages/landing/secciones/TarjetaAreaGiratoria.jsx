import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

// Tarjeta de área de la landing: al frente la foto y el nombre; al tocarla se
// voltea y dice qué se ve en esa área. Con "reducir movimiento" cambia de cara
// sin girar.
export default function TarjetaAreaGiratoria({ titulo, imagen, descripcion }) {
  const [volteada, setVolteada] = useState(false);
  const reducir = useReducedMotion();

  const cara = {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <button
      type="button"
      aria-pressed={volteada}
      onClick={() => setVolteada(v => !v)}
      className="tarjeta-giratoria relative block w-full text-left"
      style={{ perspective: 1200, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transition: reducir ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: volteada && !reducir ? 'rotateY(180deg)' : 'none',
        }}
      >
        {/* Frente */}
        <span style={{ ...cara, visibility: reducir && volteada ? 'hidden' : 'visible' }} aria-hidden={volteada}>
          <img src={imagen} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(3 10 26 / 0.92) 22%, rgb(3 10 26 / 0.05) 70%)' }} />
          <span className="absolute left-5 right-5 bottom-5 font-display font-bold text-white text-[22px] leading-tight">{titulo}</span>
        </span>

        {/* Reverso */}
        <span
          style={{
            ...cara,
            transform: reducir ? 'none' : 'rotateY(180deg)',
            visibility: !volteada ? 'hidden' : 'visible',
            background: 'rgb(12 29 69)',
            border: '1px solid rgb(245 200 66 / 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 20,
          }}
        >
          <span className="font-display font-bold text-white text-[19px] leading-tight">{titulo}</span>
          <span className="text-white/85 text-[15px] leading-snug">{descripcion}</span>
          <span className="mt-auto inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: '#f5c842' }}>
            <RotateCcw size={16} aria-hidden="true" /> Toca para volver
          </span>
        </span>
      </span>
    </button>
  );
}
