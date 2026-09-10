import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ChevronLeft, X, Clock, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ── Mock data ──────────────────────────────────────────── */
const COURSES = [
  {
    id: 'mat',
    label: 'Pensamiento Matemático',
    icon: '📐',
    type: 'transversal',
    desc: 'Álgebra, geometría y razonamiento numérico',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(96,165,250,0.22)',
  },
  {
    id: 'red',
    label: 'Redacción Indirecta',
    icon: '✍️',
    type: 'transversal',
    desc: 'Coherencia textual y sintaxis avanzada',
    color: '#c084fc',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(192,132,252,0.22)',
  },
  {
    id: 'lec',
    label: 'Comprensión Lectora',
    icon: '📖',
    type: 'transversal',
    desc: 'Inferencia, análisis y síntesis de textos',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.22)',
  },
  {
    id: 'med',
    label: 'Pre-medicina',
    icon: '🩺',
    type: 'specific',
    desc: 'Biología, química y ciencias de la salud',
    color: '#1de9b6',
    bg: 'rgba(29,233,182,0.08)',
    border: 'rgba(29,233,182,0.28)',
    clinical: true,
  },
];

const SAMPLE_QUESTIONS = {
  mat: [
    {
      id: 1, subject: 'Pensamiento Matemático',
      question: 'Si f(x) = 2x² − 3x + 1, ¿cuál es el valor de f(3)?',
      options: ['10', '18', '−2', '8'],
      correct: 0,
      explanation: 'f(3) = 2(9) − 3(3) + 1 = 18 − 9 + 1 = 10.',
    },
    {
      id: 2, subject: 'Pensamiento Matemático',
      question: 'Un triángulo tiene ángulos en razón 2:3:5. ¿Cuánto mide el ángulo mayor?',
      options: ['36°', '54°', '90°', '72°'],
      correct: 2,
      explanation: 'Los ángulos suman 180°. La parte mayor = 5/(2+3+5) × 180° = 90°.',
    },
    {
      id: 3, subject: 'Pensamiento Matemático',
      question: '¿Cuántos números enteros satisfacen −3 < x ≤ 2?',
      options: ['4', '5', '6', '3'],
      correct: 1,
      explanation: 'Los enteros son −2, −1, 0, 1, 2 → cinco valores.',
    },
  ],
  red: [
    {
      id: 1, subject: 'Redacción Indirecta',
      question: 'Elige el conector que mejor completa: "Estudió mucho; _______, reprobó el examen."',
      options: ['por lo tanto', 'sin embargo', 'además', 'es decir'],
      correct: 1,
      explanation: '"Sin embargo" introduce una idea contraria a lo esperado — contraste adversativo.',
    },
    {
      id: 2, subject: 'Redacción Indirecta',
      question: '¿Cuál oración presenta un error de concordancia?',
      options: [
        'Los alumnos entregaron sus tareas.',
        'La maestra y el director llegaron tarde.',
        'Habían muchas personas en el evento.',
        'Cada uno de los estudiantes aprobó.',
      ],
      correct: 2,
      explanation: '"Haber" impersonal no tiene plural: lo correcto es "Había muchas personas".',
    },
    {
      id: 3, subject: 'Redacción Indirecta',
      question: '"El gobierno implementó políticas _____ reducir la pobreza." ¿Qué preposición es correcta?',
      options: ['en', 'para', 'por', 'de'],
      correct: 1,
      explanation: '"Para" indica finalidad o propósito en este contexto.',
    },
  ],
  lec: [
    {
      id: 1, subject: 'Comprensión Lectora',
      question: 'Texto: "La ciencia avanza a tientas, con errores que resultan fecundos." La expresión "a tientas" sugiere que la ciencia avanza…',
      options: [
        'de forma rápida y certera',
        'sin dirección clara pero productiva',
        'gracias a grandes genios',
        'siguiendo un método estricto',
      ],
      correct: 1,
      explanation: '"A tientas" implica avanzar sin ver claramente el camino; el texto añade que los errores son "fecundos" (productivos).',
    },
    {
      id: 2, subject: 'Comprensión Lectora',
      question: '¿Cuál es la función del primer párrafo en un texto argumentativo?',
      options: [
        'Refutar las ideas del autor',
        'Presentar la tesis o postura central',
        'Enumerar ejemplos concretos',
        'Resumir las conclusiones',
      ],
      correct: 1,
      explanation: 'El párrafo de introducción en un texto argumentativo plantea la tesis que se defenderá.',
    },
    {
      id: 3, subject: 'Comprensión Lectora',
      question: '"El lector activo no solo decodifica palabras: construye significado." Esto implica que leer requiere…',
      options: [
        'velocidad lectora alta',
        'memorización literal del texto',
        'participación interpretativa del lector',
        'conocer el vocabulario exacto',
      ],
      correct: 2,
      explanation: '"Construir significado" apunta a una labor interpretativa activa, no pasiva.',
    },
  ],
  med: [
    {
      id: 1, subject: 'Pre-medicina',
      question: '¿Qué organelo celular es responsable de la síntesis de proteínas?',
      options: ['Mitocondria', 'Ribosoma', 'Aparato de Golgi', 'Lisosoma'],
      correct: 1,
      explanation: 'Los ribosomas traducen el ARNm en cadenas polipeptídicas (proteínas).',
    },
    {
      id: 2, subject: 'Pre-medicina',
      question: 'La presión arterial se mide en mmHg. Un valor de 120/80 indica:',
      options: [
        'Presión diastólica 120 / sistólica 80',
        'Presión sistólica 120 / diastólica 80',
        'Frecuencia cardíaca normal',
        'Volumen sistólico óptimo',
      ],
      correct: 1,
      explanation: 'El primer número (120) es la presión sistólica (contracción); el segundo (80) es la diastólica (relajación).',
    },
    {
      id: 3, subject: 'Pre-medicina',
      question: '¿Cuál es la función principal de la hemoglobina?',
      options: [
        'Coagular la sangre',
        'Producir anticuerpos',
        'Transportar oxígeno',
        'Regular la glucosa',
      ],
      correct: 2,
      explanation: 'La hemoglobina es la proteína de los eritrocitos que se une al O₂ en los pulmones y lo libera en los tejidos.',
    },
  ],
};

/* ── Shared option button (mini-simulator) ──────────────── */
function MiniOption({ letter, text, state, onClick, disabled, clinical }) {
  const gold = {
    default:   { bg: 'rgba(22,40,80,0.5)',       border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.82)', lb: 'rgba(255,255,255,0.07)' },
    selected:  { bg: 'rgba(245,200,66,0.09)',     border: 'rgba(245,200,66,0.42)', color: '#f5c842',               lb: 'rgba(245,200,66,0.16)' },
    correct:   { bg: 'rgba(52,211,153,0.09)',     border: 'rgba(52,211,153,0.42)', color: '#34d399',               lb: 'rgba(52,211,153,0.16)' },
    incorrect: { bg: 'rgba(248,113,113,0.09)',    border: 'rgba(248,113,113,0.42)', color: '#f87171',              lb: 'rgba(248,113,113,0.16)' },
  };
  const teal = {
    default:   { bg: 'rgba(4,30,27,0.55)',        border: 'rgba(29,233,182,0.1)',  color: 'rgba(224,250,246,0.82)', lb: 'rgba(29,233,182,0.08)' },
    selected:  { bg: 'rgba(29,233,182,0.1)',      border: 'rgba(29,233,182,0.45)', color: '#1de9b6',               lb: 'rgba(29,233,182,0.18)' },
    correct:   { bg: 'rgba(52,211,153,0.09)',     border: 'rgba(52,211,153,0.42)', color: '#34d399',               lb: 'rgba(52,211,153,0.16)' },
    incorrect: { bg: 'rgba(248,113,113,0.09)',    border: 'rgba(248,113,113,0.42)', color: '#f87171',              lb: 'rgba(248,113,113,0.16)' },
  };
  const palette = clinical ? teal : gold;
  const s = palette[state] || palette.default;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { x: 3 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
        fontSize: 13.5, lineHeight: 1.5,
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: s.lb, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11.5, fontWeight: 700,
      }}>
        {letter}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      {state === 'correct'   && <CheckCircle size={15} style={{ flexShrink: 0 }} />}
      {state === 'incorrect' && <XCircle     size={15} style={{ flexShrink: 0 }} />}
    </motion.button>
  );
}

/* ── Mini Simulator ─────────────────────────────────────── */
function MiniSimulator({ courseId, onBack }) {
  const course    = COURSES.find(c => c.id === courseId);
  const questions = SAMPLE_QUESTIONS[courseId] || [];
  const clinical  = course?.clinical;

  const TOTAL_TIME = questions.length * 90;
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [timeLeft,    setTimeLeft]    = useState(TOTAL_TIME);
  const [showExp,     setShowExp]     = useState(false);
  const [done,        setDone]        = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTimeLeft(t => { if (t <= 1) { setDone(true); return 0; } return t - 1; }), 1000);
    return () => clearInterval(id);
  }, [done]);

  const q          = questions[current];
  const userAnswer = answers[q?.id];
  const isAnswered = userAnswer !== undefined;
  const mins       = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs       = (timeLeft % 60).toString().padStart(2, '0');
  const pct        = (timeLeft / TOTAL_TIME) * 100;
  const urgent     = timeLeft < 60;

  const barColor = urgent
    ? 'linear-gradient(90deg,#dc2626,#f87171)'
    : clinical
      ? 'linear-gradient(90deg,#0d9488,#1de9b6)'
      : 'linear-gradient(90deg,#b8880f,#f5c842)';

  function handleAnswer(i) {
    if (isAnswered || done) return;
    setAnswers(prev => ({ ...prev, [q.id]: i }));
    setShowExp(false);
  }

  function getState(i) {
    if (!isAnswered) return 'default';
    if (i === q.correct) return 'correct';
    if (i === userAnswer) return 'incorrect';
    return 'default';
  }

  if (done) {
    const correct = Object.entries(answers).filter(([id, ans]) => {
      const found = questions.find(x => x.id === parseInt(id));
      return found && found.correct === ans;
    }).length;
    const score = Math.round((correct / questions.length) * 100);

    return (
      <motion.div
        key="results"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '32px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: clinical ? 'rgba(29,233,182,0.12)' : 'rgba(245,200,66,0.12)',
          border: `2px solid ${clinical ? 'rgba(29,233,182,0.35)' : 'rgba(245,200,66,0.35)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {score >= 60 ? '🎉' : '📚'}
        </div>

        <div>
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 14 }}
            style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: 56, fontWeight: 900, lineHeight: 1,
              background: clinical
                ? 'linear-gradient(135deg,#1de9b6,#b2f5e8)'
                : 'linear-gradient(135deg,#f5c842,#fde68a)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            {score}
          </motion.p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>de 100 pts</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, width: '100%' }}>
          {[
            { val: correct,                          label: 'Correctas',  color: '#34d399' },
            { val: questions.length - correct,       label: 'Errores',    color: '#f87171' },
            { val: questions.length - Object.keys(answers).length, label: 'Omitidas', color: '#f5c842' },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px 6px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</p>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: clinical ? 'rgba(29,233,182,0.06)' : 'rgba(245,200,66,0.06)', border: `1px solid ${clinical ? 'rgba(29,233,182,0.18)' : 'rgba(245,200,66,0.18)'}`, borderRadius: 12, padding: '16px 20px', width: '100%' }}>
          <p style={{ color: clinical ? '#1de9b6' : '#f5c842', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {score >= 80 ? '¡Excelente nivel!' : score >= 60 ? 'Buen inicio, sigue practicando.' : 'Hay área de mejora. ¡Nosotros te ayudamos!'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6 }}>
            Con Centum Astra accedes a +500 preguntas por materia, retroalimentación detallada y seguimiento de progreso.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={() => { setAnswers({}); setCurrent(0); setTimeLeft(TOTAL_TIME); setDone(false); setShowExp(false); }}
            className={clinical ? 'btn-clinical' : 'btn-gold'}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Repetir muestra
          </button>
          <button onClick={onBack} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            ← Elegir otra materia
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Timer bar */}
      <div>
        <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.05)' }}>
          <motion.div style={{ height: '100%', background: barColor }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'linear' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>MUESTRA GRATUITA</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: clinical ? '#1de9b6' : '#f5c842', fontWeight: 600 }}>{course?.label}</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
            background: urgent ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${urgent ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <Clock size={11} style={{ color: urgent ? '#f87171' : 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: urgent ? '#f87171' : 'white', letterSpacing: '0.05em' }}>
              {mins}:{secs}
            </span>
          </div>
        </div>
      </div>

      {/* Question nav dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {questions.map((_, i) => {
          const answered = answers[questions[i].id] !== undefined;
          const active   = i === current;
          return (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
              style={{
                width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease',
                background: active ? (clinical ? '#1de9b6' : '#f5c842') : answered ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                color:      active ? '#030a1a' : answered ? '#34d399' : 'rgba(255,255,255,0.4)',
                borderColor:active ? (clinical ? '#1de9b6' : '#f5c842') : answered ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
                boxShadow:  active ? `0 0 14px ${clinical ? 'rgba(29,233,182,0.4)' : 'rgba(245,200,66,0.35)'}` : 'none',
              }}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>

      {/* Question body */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }} className="scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{current + 1} / {questions.length}</span>
              <span style={{
                fontSize: 10.5, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
                background: clinical ? 'rgba(29,233,182,0.1)' : 'rgba(96,165,250,0.1)',
                color: clinical ? '#1de9b6' : '#93c5fd',
                border: `1px solid ${clinical ? 'rgba(29,233,182,0.22)' : 'rgba(96,165,250,0.22)'}`,
              }}>
                {q?.subject}
              </span>
            </div>

            <div
              className={clinical ? 'glass-clinical' : 'glass'}
              style={{ padding: '18px 20px', marginBottom: 14 }}
            >
              <p style={{ color: clinical ? '#e0faf6' : 'white', fontSize: 14.5, lineHeight: 1.75 }}>{q?.question}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {q?.options.map((opt, i) => (
                <MiniOption
                  key={i}
                  letter={['A','B','C','D'][i]}
                  text={opt}
                  state={getState(i)}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  clinical={clinical}
                />
              ))}
            </div>

            <AnimatePresence>
              {isAnswered && showExp && q?.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={clinical ? 'glass-clinical' : 'glass-gold'}
                  style={{ padding: '14px 18px', marginBottom: 14, overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Lightbulb size={13} style={{ color: clinical ? '#1de9b6' : '#f5c842' }} />
                    <span style={{ color: clinical ? '#1de9b6' : '#f5c842', fontSize: 11.5, fontWeight: 600 }}>Explicación</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.65 }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <button
                onClick={() => { setShowExp(false); if (current > 0) setCurrent(c => c - 1); }}
                disabled={current === 0}
                className="btn-ghost"
                style={{ opacity: current === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', fontSize: 13 }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {isAnswered && q?.explanation && (
                  <button
                    onClick={() => setShowExp(e => !e)}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', fontSize: 13 }}
                  >
                    <Lightbulb size={13} /> {showExp ? 'Ocultar' : 'Explicación'}
                  </button>
                )}

                {current < questions.length - 1 ? (
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowExp(false); setCurrent(c => c + 1); }}
                    className={clinical ? 'btn-clinical' : 'btn-gold'}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', fontSize: 13 }}
                  >
                    Siguiente <ChevronRight size={14} />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setDone(true)}
                    className={clinical ? 'btn-clinical' : 'btn-gold'}
                    style={{ padding: '9px 16px', fontSize: 13 }}
                  >
                    Ver resultado
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Course Selector panel ──────────────────────────────── */
function CourseSelector({ onClose }) {
  const [selected, setSelected] = useState(null);
  const transversal = COURSES.filter(c => c.type === 'transversal');
  const specific    = COURSES.filter(c => c.type === 'specific');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — fade independiente, sin blur para no revelar el fondo azul */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(3,10,26,0.82)' }}
        onClick={onClose}
      />

      {/* Centering shell — flexbox, no transform, así Framer Motion no rompe el centrado */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        pointerEvents: 'none',
      }}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: selected ? 600 : 700,
          maxHeight: '88vh',
          background: '#060c20',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selected && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '4px 0' }}
              >
                <ChevronLeft size={15} /> Materias
              </motion.button>
            )}
            {selected && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />}
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>
              {selected ? COURSES.find(c => c.id === selected)?.label : 'Elige tu área de práctica'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ padding: '20px 24px 24px' }}
              >
                {/* Transversal */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-[14px]">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[10px] font-bold tracking-[0.12em] text-white/28 uppercase">
                      Módulos Transversales
                    </span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                    {transversal.map((c, i) => (
                      <CourseCard key={c.id} course={c} index={i} onSelect={() => setSelected(c.id)} />
                    ))}
                  </div>
                </div>

                {/* Specific */}
                <div>
                  <div className="flex items-center gap-2 mb-[14px]">
                    <div className="h-px flex-1 bg-teal-400/[0.12]" />
                    <span className="text-[10px] font-bold tracking-[0.12em] text-teal-400/45 uppercase">
                      Módulos Específicos
                    </span>
                    <div className="h-px flex-1 bg-teal-400/[0.12]" />
                  </div>
                  <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                    {specific.map((c, i) => (
                      <CourseCard key={c.id} course={c} index={transversal.length + i} onSelect={() => setSelected(c.id)} />
                    ))}
                  </div>
                </div>

                <p className="text-center text-white/20 text-[11.5px] mt-5 tracking-[0.01em]">
                  3 preguntas · sin registro · experiencia real del simulador EXANI-II
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`sim-${selected}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ minHeight: 0 }}
              >
                <MiniSimulator courseId={selected} onBack={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA footer (only on grid) */}
        {!selected && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 shrink-0
            border-t border-white/[0.07]
            bg-[radial-gradient(ellipse_at_left,rgba(245,200,66,0.04)_0%,transparent_70%)]">
            <div>
              <p className="text-white text-[13px] font-semibold mb-[2px] tracking-[-0.01em]">
                ¿Listo para el EXANI-II?
              </p>
              <p className="text-white/38 text-[12px]">
                Accede a todos los módulos y seguimiento personalizado.
              </p>
            </div>
            <button onClick={onClose} className="btn-gold shrink-0" style={{ padding: '10px 20px', fontSize: 13 }}>
              Crear cuenta gratis
            </button>
          </div>
        )}
      </motion.div>
      </div>
    </>
  );
}

/* ── Course card — Deep Space Premium ──────────────────── */
function CourseCard({ course, index, onSelect }) {
  const isMed = course.clinical;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={cn(
        /* base */
        'group relative flex flex-col items-start gap-3 p-[18px_16px_16px] rounded-2xl cursor-pointer text-left w-full overflow-hidden',
        /* glassmorphism */
        'bg-white/5 backdrop-blur-xl',
        /* border — Tailwind hover handles color, FM handles transform */
        'border transition-colors duration-300 ease-out',
        isMed
          ? 'border-teal-400/20 hover:border-teal-400/50'
          : 'border-white/10 hover:border-yellow-500/50',
      )}
    >
      {/* ── Radial glow that appears on hover ── */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        isMed
          ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(29,233,182,0.11)_0%,transparent_62%)]'
          : 'bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.09)_0%,transparent_62%)]',
      )} />

      {/* ── Top-edge shimmer line ── */}
      <div className={cn(
        'absolute top-0 left-5 right-5 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        isMed
          ? 'bg-gradient-to-r from-transparent via-teal-400/55 to-transparent'
          : 'bg-gradient-to-r from-transparent via-yellow-500/45 to-transparent',
      )} />

      {/* ── Icon badge ── */}
      <div className={cn(
        'text-[20px] p-[9px] rounded-xl shrink-0',
        isMed ? 'bg-teal-400/10' : 'bg-white/[0.06]',
      )}>
        {course.icon}
      </div>

      {/* ── Label + description ── */}
      <div className="flex-1 space-y-[5px]">
        <p className={cn(
          'text-[13.5px] font-semibold leading-snug tracking-[-0.01em]',
          isMed ? 'text-teal-50/90' : 'text-white/88',
        )}>
          {course.label}
        </p>
        <p className={cn(
          'text-[12px] leading-relaxed',
          isMed ? 'text-teal-300/45' : 'text-white/36',
        )}>
          {course.desc}
        </p>
      </div>

      {/* ── Probar ahora CTA ── */}
      <div className="flex items-center gap-[5px]">
        <span className={cn(
          'text-[11.5px] font-medium transition-colors duration-200',
          isMed
            ? 'text-teal-400/55 group-hover:text-teal-400/80'
            : 'text-yellow-500/60 group-hover:text-yellow-400/85',
        )}>
          Probar ahora
        </span>
        <ChevronRight
          size={11}
          className={cn(
            'transition-all duration-200 group-hover:translate-x-0.5',
            isMed ? 'text-teal-400/45' : 'text-yellow-500/50',
          )}
        />
      </div>
    </motion.button>
  );
}

/* ── Public NavBar ──────────────────────────────────────── */
export default function PublicNav() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 24px',
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled
            ? 'rgba(3,10,26,0.88)'
            : 'rgba(3,10,26,0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-astra.jpeg`}
            alt="Centum Astra"
            style={{
              width: 32, height: 32, borderRadius: 8,
              objectFit: 'cover', flexShrink: 0,
              boxShadow: '0 0 16px rgba(245,200,66,0.3)',
            }}
          />
          <div>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.12em', lineHeight: 1.1 }}>CENTUM</p>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, fontWeight: 500, color: '#f5c842', letterSpacing: '0.14em', lineHeight: 1.1 }}>ASTRA</p>
          </div>
        </div>

        {/* Cursos — abre el selector directamente */}
        <button
          onClick={() => setSelectorOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          Cursos
          <ChevronDown size={13} style={{ opacity: 0.6 }} />
        </button>
      </motion.nav>

      {/* Course selector modal */}
      <AnimatePresence>
        {selectorOpen && (
          <CourseSelector onClose={() => setSelectorOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
