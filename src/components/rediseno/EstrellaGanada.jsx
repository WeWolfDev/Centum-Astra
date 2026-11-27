import { motion, useReducedMotion } from 'framer-motion';
import Estrella from './Estrella';

// Animación al terminar un quiz o simulador: la estrella aparece, destella y
// se suma a la colección. Enseña causa y efecto (terminaste → ganaste una), no
// adorna. Con "reducir movimiento" se muestra quieta.
const DESTELLOS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

export default function EstrellaGanada({ gano, total, tipo = 'quiz' }) {
  const reducir = useReducedMotion();

  if (!gano) {
    return (
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgb(var(--c-ink) / 0.8)', fontSize: 14 }}>
        <Estrella size={28} />
        <span>Ya ganaste la estrella de este {tipo} hoy. Mañana puedes ganar otra. Llevas {total}.</span>
      </div>
    );
  }

  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, display: 'grid', placeItems: 'center' }}>
        {!reducir && DESTELLOS.map(angulo => (
          <motion.span
            key={angulo}
            aria-hidden="true"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(angulo) * 58, y: Math.sin(angulo) * 58, opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
            style={{ position: 'absolute', width: 8, height: 8, borderRadius: 999, background: 'rgb(var(--c-gold-fill))' }}
          />
        ))}
        <motion.div
          initial={reducir ? false : { scale: 0, rotate: -40 }}
          animate={{ scale: [0, 1.25, 1], rotate: 0 }}
          transition={{ duration: 0.7, times: [0, 0.6, 1], ease: 'easeOut' }}
        >
          <Estrella size={84} />
        </motion.div>
      </div>
      <p style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 24, color: 'rgb(var(--c-ink))' }}>
        ¡Ganaste una estrella!
      </p>
      <motion.p
        initial={reducir ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{ margin: 0, fontSize: 15, color: 'rgb(var(--c-ink) / 0.8)' }}
      >
        Llevas <strong className="tabular-nums" style={{ color: 'rgb(var(--c-ink))' }}>{total}</strong> estrellas.
      </motion.p>
    </div>
  );
}
