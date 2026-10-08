// Simulador EXANI-II en curso.
// Fuente visual: mockups/Alumno-Simulador.dc.html
// Reglas de negocio: mockups/HANDOFF.md + src/config/rediseno.js
//
// Este archivo ANTES mezclaba listado + builder + en-curso + reporte estilo quiz.
// El listado ahora vive en src/pages/exam/SimuladoresQuizzes.jsx y el builder
// fue retirado (los quizzes se gestionan por módulo, no aquí). Lo que queda es
// solo el flujo "simulador en curso" con su pantalla de resultado.
//
// Props: se preservan `customQuizzes`, `onAddQuiz`, `onDeleteQuiz` para no
// romper la firma de App.jsx aunque hoy esta pantalla no los use.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { mockExamQuestions } from '../../data/mockData';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import Pastilla from '../../components/rediseno/Pastilla';
import {
  SIMULADOR_TOTAL_PREGUNTAS,
  SIMULADOR_REPARTO,
  SIMULADOR_TIEMPO_LIMITE_MIN,
} from '../../config/rediseno';
import { calcularResultadoSimulador } from '../../lib/examScoring';

/* ── Áreas EXANI-II (orden del HANDOFF) ─────────────── */
// Icon paths vienen de mockups/Alumno-Simulador.dc.html.
const AREAS = [
  { name: 'Pensamiento Matemático', icon: 'M18 6V4H6l6 8-6 8h12v-2' },
  { name: 'Comprensión Lectora',   icon: 'M12 7C10 5.5 7 5 4 5.5v12c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-12C17 5 14 5.5 12 7zM12 7v12' },
  { name: 'Redacción Indirecta',   icon: 'M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3' },
  { name: 'Pre-medicina',          icon: 'M2 12h5l2-6 4 12 2-6h7' },
  { name: 'Ciencias de la Salud',  icon: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z' },
];

// Índices donde empieza cada área, derivados del reparto.
function startIndexes(reparto) {
  const starts = [];
  let acc = 0;
  for (const n of reparto) { starts.push(acc); acc += n; }
  return starts;
}
const AREA_STARTS = startIndexes(SIMULADOR_REPARTO);

// Devuelve el índice de área al que pertenece una pregunta (0..N-1).
function areaOf(index) {
  for (let k = SIMULADOR_REPARTO.length - 1; k >= 0; k--) {
    if (index >= AREA_STARTS[k]) return k;
  }
  return 0;
}

/* ── Banco de preguntas ───────────────────────────────
 * TODO(rediseno): banco real de 138 preguntas.
 * Mientras tanto, ciclamos sobre mockExamQuestions preservando el reparto por
 * área. Cada pregunta recibe un id estable `sim-<índice>` y su `subject`
 * concuerda con el área que le toca en el reparto, de modo que la UI y el
 * puntaje son consistentes.
 */
function buildQuestionBank() {
  const bank = [];
  for (let i = 0; i < SIMULADOR_TOTAL_PREGUNTAS; i++) {
    const subject = AREAS[areaOf(i)].name;
    // Elige una pregunta del mock del mismo subject si existe; si no, cualquiera.
    const pool = mockExamQuestions.filter((q) => q.subject === subject);
    const src = pool.length > 0
      ? pool[i % pool.length]
      : mockExamQuestions[i % mockExamQuestions.length];
    bank.push({
      id: `sim-${i}`,
      subject,
      question: src.question,
      options: src.options,
      correct: src.correct,
    });
  }
  return bank;
}

/* ── Formato de tiempo ─────────────────────────────── */
function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds | 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

/* ── Pantalla de resultado (puntaje Ceneval) ───────── */
function ResultadoSimulador({ aciertos, total, puntaje, onReiniciar }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Simulador EXANI-II · Resultado
          </p>
          <p
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(64px, 10vw, 92px)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#f5c842',
              margin: 0,
            }}
          >
            {puntaje}
          </p>
          <p style={{ color: '#cbd5e1', fontSize: 15, marginTop: 10 }}>
            Puntaje estimado en escala Ceneval (700–1300)
          </p>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              marginTop: 6,
              fontStyle: 'italic',
            }}
          >
            Estimación. No es resultado oficial del Ceneval.
          </p>
        </div>

        <div
          style={{
            background: '#0c1d45',
            borderRadius: 16,
            padding: '22px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Aciertos
            </p>
            <p
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: 32,
                color: '#ffffff',
                margin: 0,
              }}
            >
              {aciertos}
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 20 }}>
                {' '}/ {total}
              </span>
            </p>
          </div>
          <Pastilla tono="neutral">Simulador completo</Pastilla>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <BotonPrimario onClick={onReiniciar}>Hacer otro simulador</BotonPrimario>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ──────────────────────────── */
// eslint-disable-next-line no-unused-vars
export default function ExamSimulator({ customQuizzes = [], onAddQuiz, onDeleteQuiz }) {
  const { isMobile } = useBreakpoint();

  // Banco (memo). TODO(rediseno): banco real de 138 preguntas.
  const questions = useMemo(buildQuestionBank, []);

  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});     // { [index]: optionIndex }
  const [flags, setFlags]       = useState({});     // { [index]: true }
  const [timeLeft, setTimeLeft] = useState(SIMULADOR_TIEMPO_LIMITE_MIN * 60);
  const [finished, setFinished] = useState(false);

  const handleFinish = useCallback(() => setFinished(true), []);

  // Temporizador.
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [finished, handleFinish]);

  // Reinicio tras terminar.
  function reiniciar() {
    setCurrent(0);
    setAnswers({});
    setFlags({});
    setTimeLeft(SIMULADOR_TIEMPO_LIMITE_MIN * 60);
    setFinished(false);
  }

  // Resultado: se cuenta solo contra el total configurado.
  // SIMULADOR_EXTRAS_CUENTAN está en config: hoy no hay extras porque el banco
  // tiene exactamente SIMULADOR_TOTAL_PREGUNTAS. Si en el futuro se añaden,
  // esta cuenta sigue respetando la regla porque solo recorre `questions`.
  if (finished) {
    const { aciertos, puntaje } = calcularResultadoSimulador(
      questions,
      answers,
      SIMULADOR_TOTAL_PREGUNTAS,
    );
    return (
      <ResultadoSimulador
        aciertos={aciertos}
        total={SIMULADOR_TOTAL_PREGUNTAS}
        puntaje={puntaje}
        onReiniciar={reiniciar}
      />
    );
  }

  // Estado derivado para la pregunta activa.
  const q = questions[current];
  const areaIdx = areaOf(current);
  const area = AREAS[areaIdx];
  const selected = answers[current];
  const flagged = !!flags[current];
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / SIMULADOR_TOTAL_PREGUNTAS) * 100;

  function pick(optionIndex) {
    setAnswers((prev) => ({ ...prev, [current]: optionIndex }));
  }

  function goTo(i) {
    const clamped = Math.max(0, Math.min(SIMULADOR_TOTAL_PREGUNTAS - 1, i));
    setCurrent(clamped);
  }

  function toggleFlag() {
    setFlags((prev) => {
      const next = { ...prev };
      if (next[current]) delete next[current];
      else next[current] = true;
      return next;
    });
  }

  // Celdas del grid de navegación del área actual.
  const areaStart = AREA_STARTS[areaIdx];
  const areaSize = SIMULADOR_REPARTO[areaIdx];
  const cells = [];
  for (let i = areaStart; i < areaStart + areaSize; i++) {
    cells.push(i);
  }

  // Conteos por área para la lista lateral.
  const areaStats = AREAS.map((_, k) => {
    const start = AREA_STARTS[k];
    const size = SIMULADOR_REPARTO[k];
    let done = 0;
    for (let i = start; i < start + size; i++) {
      if (answers[i] != null) done++;
    }
    return { done, size, pct: Math.round((done / size) * 100) };
  });

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Encabezado ────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px 24px',
          padding: isMobile ? '14px 18px' : '14px 40px',
          background: '#04091f',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: isMobile ? 15 : 17,
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            Simulador EXANI-II
          </div>
          <Pastilla tono="neutral">
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#f5c842"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
              style={{ marginRight: 2 }}
            >
              <path d={area.icon} />
            </svg>
            {area.name}
          </Pastilla>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="#cbd5e1"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2M9 2h6" />
            </svg>
            <span
              aria-label="Tiempo restante"
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: isMobile ? 22 : 26,
                lineHeight: 1,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <div style={{ fontSize: 14, color: '#e2e8f0' }}>
            <strong
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: '#ffffff',
              }}
            >
              {answeredCount}
            </strong>
            {' '}/ {SIMULADOR_TOTAL_PREGUNTAS} respondidas
          </div>

          <BotonSecundario
            onClick={handleFinish}
            aria-label="Guardar y continuar después"
            style={{ padding: '10px 16px', fontSize: 13 }}
          >
            Guardar y continuar después
          </BotonSecundario>
          <BotonPrimario
            onClick={handleFinish}
            aria-label="Terminar simulador"
          >
            Terminar simulador
          </BotonPrimario>
        </div>
      </header>

      {/* Barra de progreso basada en respuestas / total */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SIMULADOR_TOTAL_PREGUNTAS}
        aria-valuenow={answeredCount}
        aria-label="Avance del simulador"
        style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: '#f5c842',
            transition: 'width 0.25s ease',
          }}
        />
      </div>

      {/* ── Cuerpo ───────────────────────────────── */}
      <main
        style={{
          flexGrow: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: isMobile ? 28 : '40px 56px',
          width: '100%',
          maxWidth: 1240,
          margin: '0 auto',
          padding: isMobile ? '28px 18px' : '44px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Pregunta + opciones */}
        <section
          style={{
            flex: '2.2 1 480px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#ffffff',
              }}
            >
              Pregunta {current + 1}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              de {SIMULADOR_TOTAL_PREGUNTAS}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: isMobile ? 22 : 26,
              fontWeight: 500,
              lineHeight: 1.4,
              color: '#ffffff',
            }}
          >
            {q.question}
          </h1>

          <div
            role="radiogroup"
            aria-label="Opciones de respuesta"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {q.options.map((opt, i) => {
              const on = selected === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: 62,
                    padding: '10px 18px',
                    border: `1.5px solid ${on ? '#f5c842' : 'rgba(255,255,255,0.16)'}`,
                    borderRadius: 14,
                    background: on ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.04)',
                    color: '#ffffff',
                    fontSize: isMobile ? 16 : 18,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: on ? '#f5c842' : 'rgba(255,255,255,0.1)',
                      color: on ? '#030a1a' : '#ffffff',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 6,
            }}
          >
            <BotonSecundario
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-label="Pregunta anterior"
            >
              Anterior
            </BotonSecundario>

            <button
              type="button"
              onClick={toggleFlag}
              aria-pressed={flagged}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                padding: '10px 18px',
                border: 0,
                borderRadius: 12,
                background: flagged ? 'rgba(147,197,253,0.18)' : 'transparent',
                color: '#93c5fd',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 21V4M5 4h12l-2.5 4L17 12H5" />
              </svg>
              {flagged ? 'Marcada' : 'Marcar'}
            </button>

            <BotonPrimario
              onClick={() => goTo(current + 1)}
              disabled={current === SIMULADOR_TOTAL_PREGUNTAS - 1}
              aria-label="Siguiente pregunta"
            >
              Siguiente
            </BotonPrimario>
          </div>
        </section>

        {/* Navegación lateral por área y celdas */}
        <aside
          aria-label="Navegación de preguntas"
          style={{
            flex: '1 1 300px',
            minWidth: 0,
            maxWidth: isMobile ? '100%' : 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AREAS.map((a, k) => {
              const on = k === areaIdx;
              const stats = areaStats[k];
              return (
                <button
                  key={a.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    // Al elegir un área: ir a la primera sin responder, o a la primera del bloque.
                    const start = AREA_STARTS[k];
                    const size = SIMULADOR_REPARTO[k];
                    let target = start;
                    for (let i = start; i < start + size; i++) {
                      if (answers[i] == null) { target = i; break; }
                    }
                    goTo(target);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: 56,
                    padding: '10px 12px',
                    border: `1.5px solid ${on ? '#f5c842' : 'transparent'}`,
                    borderRadius: 12,
                    background: on ? 'rgba(245,200,66,0.1)' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg
                      width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke={on ? '#f5c842' : '#cbd5e1'}
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    >
                      <path d={a.icon} />
                    </svg>
                    <span
                      style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: '#cbd5e1',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stats.done} / {stats.size}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 8,
                      height: 4,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: `${stats.pct}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: '#f5c842',
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
            }}
          >
            {cells.map((i) => {
              const cur = i === current;
              const has = answers[i] != null;
              const isFlag = !!flags[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={
                    'Pregunta ' + (i + 1) +
                    (has ? ', respondida' : ', sin responder') +
                    (isFlag ? ', marcada' : '')
                  }
                  style={{
                    position: 'relative',
                    minHeight: 44,
                    padding: 0,
                    border: `1.5px solid ${cur ? '#f5c842' : has ? 'transparent' : 'rgba(255,255,255,0.22)'}`,
                    borderRadius: 10,
                    background: has ? 'rgba(255,255,255,0.16)' : 'transparent',
                    color: cur ? '#f5c842' : has ? '#ffffff' : '#cbd5e1',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {i + 1}
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: '#93c5fd',
                      opacity: isFlag ? 1 : 0,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 14, height: 14, borderRadius: 4,
                  background: 'rgba(255,255,255,0.22)',
                }}
              />
              Respondida
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 14, height: 14, borderRadius: 4,
                  boxSizing: 'border-box',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }}
              />
              Sin responder
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: 999,
                  background: '#93c5fd',
                }}
              />
              Marcada
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
}
