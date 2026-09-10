import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lightbulb, CheckCircle, XCircle, Plus, Trash2, ArrowLeft, ImagePlus, X, RotateCcw, List } from 'lucide-react';
import { mockExamQuestions } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { cn } from '../../lib/utils';

const DEFAULT_TIME = 60 * 40;
const SUBJECTS = ['Pensamiento Matemático', 'Comprensión Lectora', 'Redacción Indirecta', 'Pre-medicina', 'Ciencias de la Salud'];

/* ── Timer bar ─────────────────────────────────────── */
function TimerBar({ seconds, total }) {
  const pct     = (seconds / total) * 100;
  const mins    = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs    = (seconds % 60).toString().padStart(2, '0');
  const urgent  = seconds < 300;
  const warning = seconds < 600 && !urgent;

  const barColor = urgent
    ? 'linear-gradient(90deg, #dc2626, #f87171)'
    : warning
      ? 'linear-gradient(90deg, #b8880f, #f5c842)'
      : 'linear-gradient(90deg, #1e3a6e, #3b82f6, #60a5fa)';

  return (
    <div>
      <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.05)' }}>
        <motion.div style={{ height: '100%', background: barColor }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'linear' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 28px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999,
          background: urgent ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${urgent ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: urgent ? '#f87171' : warning ? '#f5c842' : 'white', letterSpacing: '0.05em' }}>
            {mins}:{secs}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Question nav ──────────────────────────────────── */
function QuestionNav({ questions, current, answers, setCurrent }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {questions.map((q, i) => {
        const answered = answers[q.id] !== undefined;
        const active   = i === current;
        return (
          <motion.button
            key={q.id}
            onClick={() => setCurrent(i)}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.94 }}
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: '1px solid', transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease',
              background: active ? '#f5c842' : answered ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
              color:      active ? '#030a1a' : answered ? '#34d399' : 'rgba(255,255,255,0.4)',
              borderColor:active ? '#f5c842' : answered ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
              boxShadow:  active ? '0 0 16px rgba(245,200,66,0.35)' : 'none',
            }}
          >
            {i + 1}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Option button ─────────────────────────────────── */
function OptionButton({ letter, text, state, onClick, disabled }) {
  const styles = {
    default:   { bg: 'rgba(22,40,80,0.4)',        border: 'rgba(255,255,255,0.08)',   color: 'rgba(255,255,255,0.8)',  letterBg: 'rgba(255,255,255,0.07)' },
    selected:  { bg: 'rgba(245,200,66,0.08)',      border: 'rgba(245,200,66,0.4)',     color: '#f5c842',               letterBg: 'rgba(245,200,66,0.15)' },
    correct:   { bg: 'rgba(52,211,153,0.08)',      border: 'rgba(52,211,153,0.4)',     color: '#34d399',               letterBg: 'rgba(52,211,153,0.15)' },
    incorrect: { bg: 'rgba(248,113,113,0.08)',     border: 'rgba(248,113,113,0.4)',    color: '#f87171',               letterBg: 'rgba(248,113,113,0.15)' },
  };
  const s = styles[state] || styles.default;

  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileHover={!disabled ? { x: 4 } : {}} whileTap={!disabled ? { scale: 0.99 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '14px 16px', borderRadius: 12,
        background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease', fontSize: 14, lineHeight: 1.5,
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: s.letterBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
        {letter}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      {state === 'correct'   && <CheckCircle size={16} style={{ flexShrink: 0 }} />}
      {state === 'incorrect' && <XCircle     size={16} style={{ flexShrink: 0 }} />}
    </motion.button>
  );
}

/* ── Quiz card (home screen) ───────────────────────── */
function QuizCard({ quiz, isBuiltin, isStaff, onStart, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/30 transition-colors duration-300"
      style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]" />
      <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
      <div className="relative" style={{
        width: 50, height: 50, borderRadius: 13, flexShrink: 0,
        background: isBuiltin ? 'linear-gradient(135deg, #b8880f, #f5c842)' : 'rgba(255,255,255,0.06)',
        border: isBuiltin ? 'none' : '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isBuiltin ? '0 0 24px rgba(245,200,66,0.25)' : 'none',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={isBuiltin ? '#030a1a' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>

      <div className="relative" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ color: 'white', fontSize: 14.5, fontWeight: 700 }}>{quiz.title}</h3>
          {isBuiltin && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,200,66,0.1)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.22)' }}>
              Oficial
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12.5 }}>
          {quiz.questions.length} preguntas · {quiz.timeLimit} min · {quiz.subject}
        </p>
      </div>

      <div className="relative" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {isStaff && !isBuiltin && onDelete && (
          <button onClick={() => onDelete(quiz.id)} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)',
            background: 'rgba(248,113,113,0.06)', color: '#f87171',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Trash2 size={14} />
          </button>
        )}
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={onStart} className="btn-fill" style={{ padding: '8px 18px', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>
          Iniciar
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Quiz builder ──────────────────────────────────── */
const emptyQuestion = () => ({ id: Date.now() + Math.random(), question: '', options: ['', '', '', ''], correct: 0, explanation: '', image: null });

function QuizBuilder({ onSave, onCancel }) {
  const [title,     setTitle]     = useState('');
  const [subject,   setSubject]   = useState(SUBJECTS[0]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const { isMobile } = useBreakpoint();

  function updateQ(idx, field, val) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  }

  function updateOpt(qIdx, oIdx, val) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options]; opts[oIdx] = val;
      return { ...q, options: opts };
    }));
  }

  function removeQ(idx) {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  const isValid = title.trim().length > 0 && questions.length > 0 &&
    questions.every(q => q.question.trim() && q.options.every(o => o.trim()));

  function handleSave() {
    if (!isValid) return;
    onSave({
      id: Date.now(),
      title,
      subject,
      timeLimit,
      questions: questions.map((q, i) => ({ ...q, id: i + 1, subject })),
    });
  }

  return (
    <div style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto', padding: isMobile ? '16px' : '28px 32px' }} className="scrollbar-hide">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
          <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Nuevo Simulador</h2>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!isValid} className="btn-gold" style={{ opacity: isValid ? 1 : 0.4, fontSize: 13 }}>
          Guardar y publicar
        </motion.button>
      </div>

      {/* Metadata */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl" style={{ padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap: 12, alignItems: 'end' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 6 }}>Título del simulador *</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Simulacro Pre-medicina Sem. 4"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 6 }}>Materia</p>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none', width: isMobile ? '100%' : 'auto' }}
            >
              {SUBJECTS.map(s => <option key={s} value={s} style={{ background: '#0c1d45' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 6 }}>Tiempo (min)</p>
            <input type="number" value={timeLimit} onChange={e => setTimeLimit(Math.max(5, parseInt(e.target.value) || 5))} min="5" max="180"
              style={{ width: isMobile ? '100%' : 80, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q, qIdx) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl group relative overflow-hidden" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(245,200,66,0.08)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.2)' }}>
                Pregunta {qIdx + 1}
              </span>
              {questions.length > 1 && (
                <button onClick={() => removeQ(qIdx)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,113,113,0.5)'}
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              )}
            </div>

            <textarea
              value={q.question}
              onChange={e => updateQ(qIdx, 'question', e.target.value)}
              placeholder="Escribe la pregunta aquí..."
              rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', resize: 'vertical', marginBottom: 12, lineHeight: 1.5 }}
            />

            {/* Image attachment per question */}
            <div style={{ marginBottom: 14 }}>
              {q.image ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={q.image}
                    alt="Imagen del reactivo"
                    style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', objectFit: 'contain' }}
                  />
                  <button
                    onClick={() => updateQ(qIdx, 'image', null)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(3,10,26,0.75)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
                  border: '1px dashed rgba(245,200,66,0.25)', background: 'rgba(245,200,66,0.04)',
                  color: 'rgba(245,200,66,0.6)', fontSize: 12, fontWeight: 500,
                  transition: 'border-color 0.12s ease, color 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,200,66,0.5)'; e.currentTarget.style.color = '#f5c842'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)'; e.currentTarget.style.color = 'rgba(245,200,66,0.6)'; }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert('La imagen no puede superar 5 MB.');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = ev => updateQ(qIdx, 'image', ev.target.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <ImagePlus size={14} />
                  Adjuntar imagen al reactivo
                </label>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => updateQ(qIdx, 'correct', oIdx)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                      border: `2px solid ${q.correct === oIdx ? '#f5c842' : 'rgba(255,255,255,0.15)'}`,
                      background: q.correct === oIdx ? 'rgba(245,200,66,0.15)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {q.correct === oIdx && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5c842' }} />}
                  </button>
                  <span style={{ color: '#f5c842', fontSize: 11, fontWeight: 700, width: 13, flexShrink: 0 }}>{['A','B','C','D'][oIdx]}</span>
                  <input
                    type="text" value={opt}
                    onChange={e => updateOpt(qIdx, oIdx, e.target.value)}
                    placeholder={`Opción ${['A','B','C','D'][oIdx]}`}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${q.correct === oIdx ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, padding: '7px 11px', color: 'white', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginBottom: 10 }}>
              Respuesta correcta: <span style={{ color: '#f5c842', fontWeight: 600 }}>{['A','B','C','D'][q.correct]}</span> — haz clic en el círculo para cambiarla
            </p>

            <div>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginBottom: 5 }}>Explicación (opcional)</p>
              <input type="text" value={q.explanation} onChange={e => updateQ(qIdx, 'explanation', e.target.value)}
                placeholder="Explica por qué esa es la respuesta correcta..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none' }}
              />
            </div>
          </motion.div>
        ))}

        <button
          onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
            border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent',
            color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500, transition: 'color 0.12s ease, border-color 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)'; e.currentTarget.style.color = '#f5c842'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          <Plus size={16} /> Agregar pregunta
        </button>
      </div>
      <div style={{ height: 48 }} />
    </div>
  );
}

/* ── CENEVAL Results Report ──────────────────────────── */
const CLINICAL_SUBJECTS = ['Pre-medicina', 'Ciencias de la Salud'];

function CenevalReport({ questions, answers, onRepeat, onHome }) {
  const correct   = Object.entries(answers).filter(([id, ans]) => {
    const q = questions.find(q => q.id === parseInt(id));
    return q && q.correct === ans;
  }).length;
  const total      = questions.length;
  const unanswered = total - Object.keys(answers).length;
  const incorrect  = total - correct - unanswered;
  const ceneval    = Math.round(700 + (correct / total) * 600);
  const barPct     = ((ceneval - 700) / 600) * 100;

  const zones = [
    { label: 'Insuficiente',  min: 700,  max: 849,  color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
    { label: 'Básico',        min: 850,  max: 999,  color: '#f5c842', bg: 'rgba(245,200,66,0.12)',  border: 'rgba(245,200,66,0.25)'  },
    { label: 'Satisfactorio', min: 1000, max: 1149, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
    { label: 'Destacado',     min: 1150, max: 1300, color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  ];
  const zone = zones.find(z => ceneval >= z.min && ceneval <= z.max) || zones[0];

  const subjectData = SUBJECTS.map(subj => {
    const qs = questions.filter(q => q.subject === subj);
    if (!qs.length) return null;
    const sc = qs.filter(q => answers[q.id] === q.correct).length;
    return {
      subj,
      total: qs.length,
      correct: sc,
      ceneval: Math.round(700 + (sc / qs.length) * 600),
      isClinical: CLINICAL_SUBJECTS.includes(subj),
      barPct: ((Math.round(700 + (sc / qs.length) * 600) - 700) / 600) * 100,
    };
  }).filter(Boolean);

  return (
    <div style={{ overflowY: 'auto', minHeight: 'calc(100vh - 4rem)', padding: '36px 24px', display: 'flex', justifyContent: 'center' }} className="scrollbar-hide">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {/* Score hero */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Reporte CENEVAL · EXANI-II
          </p>
          <motion.p
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 140, damping: 14 }}
            style={{
              fontFamily: 'Syne, sans-serif', fontSize: 80, fontWeight: 900,
              lineHeight: 1, letterSpacing: '-0.04em',
              background: `linear-gradient(135deg, white 0%, ${zone.color} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            {ceneval}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 16px', borderRadius: 999, background: zone.bg, border: `1px solid ${zone.border}` }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: zone.color, display: 'inline-block' }} />
            <span style={{ color: zone.color, fontSize: 13, fontWeight: 600 }}>{zone.label}</span>
          </motion.div>
        </div>

        {/* Scale bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl" style={{ padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Posición en la escala nacional
          </p>
          <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
            {/* Ghost gradient — full range */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999,
              background: 'linear-gradient(90deg, #f87171 0%, #f5c842 25%, #60a5fa 66%, #34d399 100%)',
              opacity: 0.18 }} />
            {/* Filled bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999,
                background: 'linear-gradient(90deg, #f87171 0%, #f5c842 33%, #60a5fa 66%, #34d399 100%)' }}
            />
            {/* Pointer dot */}
            <motion.div
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: `${barPct}%`, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                width: 20, height: 20, borderRadius: '50%', background: zone.color,
                border: '3px solid rgba(3,10,26,0.95)', boxShadow: `0 0 14px ${zone.color}90`, zIndex: 1 }}
            />
          </div>
          {/* Zone labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {zones.map(z => {
              const active = z === zone;
              return (
                <div key={z.label} style={{ textAlign: 'center' }}>
                  <div style={{ height: 2, borderRadius: 1, marginBottom: 7,
                    background: active ? z.color : 'rgba(255,255,255,0.07)' }} />
                  <p style={{ fontSize: 10.5, fontWeight: active ? 700 : 400, color: active ? z.color : 'rgba(255,255,255,0.25)', lineHeight: 1.3 }}>
                    {z.label}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 3 }}>{z.min}–{z.max}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { val: correct,   label: 'Correctas',     color: '#34d399' },
            { val: incorrect, label: 'Incorrectas',   color: '#f87171' },
            { val: unanswered, label: 'Sin responder', color: 'rgba(255,255,255,0.28)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 8px', borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Per-subject breakdown */}
        {subjectData.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl" style={{ padding: '20px 24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
              Desglose por área
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subjectData.map((s, i) => {
                const accent = s.isClinical ? '#2dd4bf' : '#f5c842';
                return (
                  <motion.div
                    key={s.subj}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{s.subj}</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: accent }}>{s.ceneval}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.barPct}%` }}
                        transition={{ delay: 0.65 + i * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${accent}44, ${accent})` }}
                      />
                    </div>
                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>
                      {s.correct}/{s.total} correctas · {s.isClinical ? 'Área Clínica' : 'Área Transversal'}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', paddingBottom: 32 }}>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onRepeat} className="btn-gold" style={{ padding: '13px 28px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <RotateCcw size={14} /> Repetir
          </motion.button>
          <button onClick={onHome} className="btn-ghost" style={{ padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <List size={14} /> Ver simuladores
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main component ────────────────────────────────── */
export default function ExamSimulator({ customQuizzes = [], onAddQuiz, onDeleteQuiz }) {
  const { user } = useAuth();
  const isStaff  = user.role === 'admin' || user.role === 'teacher';

  const [mode,            setMode]           = useState('home');
  const [activeQuiz,      setActiveQuiz]     = useState(null);
  const [quizTimeLimit,   setQuizTimeLimit]  = useState(DEFAULT_TIME);
  const [currentQ,        setCurrentQ]       = useState(0);
  const [answers,         setAnswers]        = useState({});
  const [timeLeft,        setTimeLeft]       = useState(DEFAULT_TIME);
  const [showExplanation, setShowExplanation]= useState(false);

  const questions = activeQuiz ? activeQuiz.questions : mockExamQuestions;

  const handleFinish = useCallback(() => setMode('results'), []);

  useEffect(() => {
    if (mode !== 'take') return;
    const id = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { handleFinish(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [mode, handleFinish]);

  function startQuiz(quiz) {
    const tl = quiz ? quiz.timeLimit * 60 : DEFAULT_TIME;
    setActiveQuiz(quiz);
    setQuizTimeLimit(tl);
    setTimeLeft(tl);
    setCurrentQ(0);
    setAnswers({});
    setShowExplanation(false);
    setMode('take');
  }

  function resetToHome() {
    setMode('home');
    setActiveQuiz(null);
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(DEFAULT_TIME);
    setShowExplanation(false);
  }

  /* ── HOME ──────────────────────────────────────── */
  if (mode === 'home') {
    const builtinQuiz = { id: 'builtin', title: 'Simulador EXANI-II Oficial', subject: 'Múltiples materias', timeLimit: 40, questions: mockExamQuestions };

    return (
      <div style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto', padding: '32px' }} className="scrollbar-hide">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="section-divider" style={{ marginBottom: 6 }}>
                <h3>Simuladores EXANI-II</h3>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{1 + customQuizzes.length} simulador{customQuizzes.length !== 0 ? 'es' : ''} disponible{customQuizzes.length !== 0 ? 's' : ''}</p>
            </div>
            {isStaff && (
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setMode('build')} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                <Plus size={14} /> Crear simulador
              </motion.button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QuizCard quiz={builtinQuiz} isBuiltin isStaff={isStaff} onStart={() => startQuiz(null)} />
            {customQuizzes.map((quiz, i) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <QuizCard quiz={quiz} isBuiltin={false} isStaff={isStaff} onStart={() => startQuiz(quiz)} onDelete={onDeleteQuiz} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── BUILD ─────────────────────────────────────── */
  if (mode === 'build') {
    return (
      <QuizBuilder
        onSave={quiz => { onAddQuiz?.(quiz); setMode('home'); }}
        onCancel={() => setMode('home')}
      />
    );
  }

  /* ── RESULTS ───────────────────────────────────── */
  if (mode === 'results') {
    return (
      <CenevalReport
        questions={questions}
        answers={answers}
        onRepeat={() => startQuiz(activeQuiz)}
        onHome={resetToHome}
      />
    );
  }

  /* ── TAKE ──────────────────────────────────────── */
  const q          = questions[currentQ];
  const userAnswer = answers[q.id];
  const isAnswered = userAnswer !== undefined;

  function handleAnswer(i) {
    if (isAnswered) return;
    setAnswers(prev => ({ ...prev, [q.id]: i }));
    setShowExplanation(false);
  }

  function getOptionState(i) {
    if (!isAnswered) return userAnswer === i ? 'selected' : 'default';
    if (i === q.correct) return 'correct';
    if (i === userAnswer) return 'incorrect';
    return 'default';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 4rem)' }}>
      <TimerBar seconds={timeLeft} total={quizTimeLimit} />

      <div style={{ padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <QuestionNav questions={questions} current={currentQ} answers={answers} setCurrent={setCurrentQ} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>{currentQ + 1} / {questions.length}</span>
                <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 9px', background: 'rgba(96,165,250,0.1)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.2)' }}>
                  {q.subject}
                </span>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl" style={{ padding: '22px 24px', marginBottom: 20 }}>
                <p style={{ color: 'white', fontSize: 16, lineHeight: 1.7, marginBottom: q.image ? 16 : 0 }}>{q.question}</p>
                {q.image && (
                  <img
                    src={q.image}
                    alt="Imagen del reactivo"
                    style={{
                      maxWidth: '100%', maxHeight: 260, objectFit: 'contain',
                      borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                      display: 'block',
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {q.options.map((opt, i) => (
                  <OptionButton key={i} letter={['A','B','C','D'][i]} text={opt} state={getOptionState(i)} onClick={() => handleAnswer(i)} disabled={isAnswered} />
                ))}
              </div>

              <AnimatePresence>
                {isAnswered && showExplanation && q.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-yellow-500/[0.04] backdrop-blur-xl border border-yellow-500/20 rounded-2xl" style={{ padding: '16px 20px', marginBottom: 20, overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <Lightbulb size={14} style={{ color: '#f5c842' }} />
                      <span style={{ color: '#f5c842', fontSize: 12, fontWeight: 600 }}>Explicación</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, lineHeight: 1.65 }}>{q.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => { setShowExplanation(false); if (currentQ > 0) setCurrentQ(c => c - 1); }} disabled={currentQ === 0} className="btn-ghost" style={{ opacity: currentQ === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChevronLeft size={15} /> Anterior
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {isAnswered && q.explanation && (
                    <button onClick={() => setShowExplanation(e => !e)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={14} /> {showExplanation ? 'Ocultar' : 'Explicación'}
                    </button>
                  )}
                  {currentQ < questions.length - 1 ? (
                    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => { setShowExplanation(false); setCurrentQ(c => c + 1); }} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Siguiente <ChevronRight size={15} />
                    </motion.button>
                  ) : (
                    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleFinish} className="btn-gold">
                      Finalizar
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
