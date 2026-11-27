import { motion, useReducedMotion } from 'framer-motion';
import Estrella from './Estrella';

// Al terminar un quiz o simulador, la estrella sale de abajo, salta, gira y cae
// en su lugar, como un premio de videojuego, con destellos cuadrados. Enseña
// causa y efecto: terminaste → ganaste una. Con "reducir movimiento" se queda
// quieta.
const DESTELLOS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

export default function EstrellaGanada({ gano, total, tipo = 'quiz' }) {
  const reducir = useReducedMotion();

  if (!gano) {
    return (
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgb(var(--c-ink) / 0.85)', fontSize: 16, maxWidth: 360 }}>
        <Estrella size={40} />
        <span>Ya ganaste la estrella de este {tipo} hoy. Mañana puedes ganar otra. Llevas {total}.</span>
      </div>
    );
  }

  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 140, height: 140, display: 'grid', placeItems: 'center' }}>
        {!reducir && DESTELLOS.map(angulo => (
          <motion.span
            key={angulo}
            aria-hidden="true"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(angulo) * 64, y: Math.sin(angulo) * 64, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.75, ease: 'easeOut' }}
            style={{ position: 'absolute', width: 8, height: 8, background: 'rgb(var(--c-gold-fill))' }}
          />
        ))}
        <motion.div
          initial={reducir ? false : { y: 70, scale: 0.3, rotate: 0, opacity: 0 }}
          animate={{ y: [70, -46, 0, -14, 0], scale: [0.3, 1.2, 1, 1.06, 1], rotate: [0, 360, 360, 360, 360], opacity: 1 }}
          transition={{ duration: 1.3, times: [0, 0.45, 0.7, 0.85, 1], ease: 'easeOut' }}
        >
          <Estrella size={96} />
        </motion.div>
        {!reducir && (
          <motion.span
            aria-hidden="true"
            className="font-display tabular-nums"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -70, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.6 }}
            style={{ position: 'absolute', top: 10, right: 0, fontWeight: 800, fontSize: 22, color: 'rgb(var(--c-gold-fill))' }}
          >
            +1
          </motion.span>
        )}
      </div>
      <p style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 26, color: 'rgb(var(--c-ink))' }}>
        ¡Ganaste una estrella!
      </p>
      <p style={{ margin: 0, fontSize: 16, color: 'rgb(var(--c-ink) / 0.85)' }}>
        Llevas <strong className="tabular-nums" style={{ color: 'rgb(var(--c-ink))' }}>{total}</strong> estrellas.
      </p>
    </div>
  );
}
