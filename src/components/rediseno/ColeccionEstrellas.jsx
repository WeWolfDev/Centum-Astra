import { motion, useReducedMotion } from 'framer-motion';
import Estrella from './Estrella';

// Colección del alumno: todas sus estrellas en un renglón, brincando una tras
// otra. Si son muchas, se ven las últimas y un "+N" con las demás.
const MAXIMO_VISIBLES = 14;

export default function ColeccionEstrellas({ registros }) {
  const reducir = useReducedMotion();
  const total = registros.length;
  const visibles = Math.min(total, MAXIMO_VISIBLES);
  const ocultas = total - visibles;

  return (
    <section
      aria-labelledby="coleccion-estrellas"
      className="bloque"
      style={{ background: 'rgb(var(--c-navy))', borderRadius: 16, padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px 28px' }}
    >
      <div>
        <h2 id="coleccion-estrellas" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'rgb(var(--c-ink) / 0.85)' }}>
          Tus estrellas
        </h2>
        <p className="tabular-nums" style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'rgb(var(--c-ink))' }}>
          {total}
        </p>
      </div>

      {total === 0 ? (
        <p style={{ margin: 0, fontSize: 16, color: 'rgb(var(--c-ink) / 0.8)' }}>Termina un quiz para ganar tu primera estrella.</p>
      ) : (
        <ol aria-label={`${total} estrellas`} style={{ listStyle: 'none', margin: 0, padding: '10px 0 0', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, flex: '1 1 280px' }}>
          {Array.from({ length: visibles }, (_, i) => (
            <motion.li
              key={i}
              animate={reducir ? undefined : { y: [0, -10, 0] }}
              transition={reducir ? undefined : { duration: 0.5, delay: i * 0.12, repeat: Infinity, repeatDelay: 2.2, ease: 'easeOut' }}
            >
              <Estrella size={30} />
            </motion.li>
          ))}
          {ocultas > 0 && (
            <li className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: 'rgb(var(--c-ink) / 0.85)', paddingBottom: 4 }}>+{ocultas}</li>
          )}
        </ol>
      )}
    </section>
  );
}
