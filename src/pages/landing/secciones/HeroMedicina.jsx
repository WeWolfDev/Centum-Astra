import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

// Hero de la landing: foto de estudio de medicina y un latido dorado que se
// convierte en una línea que sube, como el avance del alumno.
const FOTO = '/fernandozhiminaicela-face-mask-5042631_1920.jpg';

// Tres latidos y, al final, la subida del puntaje.
const LATIDO =
  'M0 150 L170 150 L185 128 L200 172 L220 60 L238 172 L255 150 L400 150 L415 128 L430 172 L450 60 L468 172 L485 150 ' +
  'L630 150 L645 128 L660 172 L680 60 L698 172 L715 150 L820 150 C880 150 920 128 960 108 C1010 84 1070 62 1170 34';

export default function HeroMedicina({ onRegisterClick }) {
  const reducir = useReducedMotion();

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 'min(100svh, 900px)', background: '#030a1a' }}>
      <img
        src={FOTO}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: '70% 40%', opacity: 0.55 }}
        fetchpriority="high"
      />
      {/* Velo navy: oscuro a la izquierda, donde va el texto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(100deg, #030a1a 22%, rgb(3 10 26 / 0.82) 48%, rgb(3 10 26 / 0.35) 100%)' }}
      />

      <div className="relative mx-auto flex flex-col justify-center px-6 md:px-12" style={{ maxWidth: 1200, minHeight: 'inherit', paddingTop: 120, paddingBottom: 200 }}>
        <motion.div
          initial={reducir ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 640 }}
        >
          <h1 className="m-0 font-display font-extrabold text-white" style={{ fontSize: 'clamp(42px, 7vw, 76px)', lineHeight: 1.02, letterSpacing: '-0.03em', textWrap: 'balance' }}>
            ¿Quieres entrar a <span style={{ color: '#f5c842' }}>Medicina</span>?
          </h1>
          <p className="mt-6 mb-0 text-white/80" style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', lineHeight: 1.65, maxWidth: 540 }}>
            Prepárate para el examen de admisión con simuladores, quizzes por tema y clases de cada área. Después de cada intento ves en qué mejoraste.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onRegisterClick} className="btn-gold" style={{ minHeight: 52, padding: '0 28px', fontSize: 16, borderRadius: 12 }}>
              Quiero empezar
            </button>
            <a href="#estudias" className="inline-flex items-center gap-2 text-white font-semibold text-[16px] hover:underline" style={{ minHeight: 44 }}>
              ¿Qué vas a estudiar? <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Latido → puntaje */}
      <svg
        viewBox="0 0 1200 190"
        aria-hidden="true"
        className="absolute left-0 right-0 bottom-6 w-full"
        style={{ height: 'auto', overflow: 'visible' }}
      >
        <motion.path
          d={LATIDO}
          fill="none"
          stroke="#f5c842"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducir ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.3 }}
          style={{ filter: 'drop-shadow(0 0 6px rgb(245 200 66 / 0.55))' }}
        />
        <motion.circle
          cx={1170}
          cy={34}
          r={7}
          fill="#f5c842"
          initial={reducir ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.4 }}
        />
      </svg>
    </section>
  );
}
