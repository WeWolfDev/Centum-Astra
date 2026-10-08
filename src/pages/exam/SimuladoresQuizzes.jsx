import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Flag } from 'lucide-react';

import SimuladorBlock from '../../components/rediseno/SimuladorBlock';
import QuizBlock from '../../components/rediseno/QuizBlock';
import { useMaterial } from '../../context/MaterialContext';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import IconSubject from '../../components/rediseno/IconSubject';
import { aciertosACeneval, SIMULADOR_TOTAL_PREGUNTAS, META_OCULTA_POR_DEFECTO, SIMULADOR_RANGO_CENEVAL } from '../../config/rediseno';
import { mockStudents, mockModules } from '../../data/mockData';

// Nota del HANDOFF: "Estimación. No es resultado oficial del Ceneval."
const NOTA_ESTIMACION = 'Estimación. No es resultado oficial del Ceneval.';

// Mapeo título de módulo → nombre de icono por materia.
const SUBJECT_ICON = {
  'Pensamiento Matemático': 'math',
  'Comprensión Lectora': 'reading',
  'Redacción Indirecta': 'writing',
  'Pre-medicina': 'premed',
  'Ciencias de la Salud': 'health',
};

// TODO(rediseno): tabla real de StudentSimulatorScore. Mientras tanto, derivamos
// un histórico de simuladores a partir del alumno mock (Ana García López) con una
// serie plausible de aciertos → puntaje Ceneval vía aciertosACeneval().
// Los aciertos se eligen de modo que el último simulador coincida aproximadamente
// con el avgScore del alumno proyectado sobre las 138 preguntas.
function buildSimuladoresHistoricos(student) {
  const total = SIMULADOR_TOTAL_PREGUNTAS;
  const avg = typeof student?.avgScore === 'number' ? student.avgScore : 60;
  // El avgScore está en escala 0–100. Lo convertimos a aciertos sobre 138.
  const ultimo = Math.round((avg / 100) * total);
  // Serie creciente que termina en `ultimo` (progreso del alumno).
  const serie = [
    { n: 1, fecha: '20 jul', aciertos: Math.max(0, ultimo - 27) },
    { n: 2, fecha: '3 ago',  aciertos: Math.max(0, ultimo - 19) },
    { n: 3, fecha: '17 ago', aciertos: Math.max(0, ultimo - 22) }, // baja intencional (gris, no rojo)
    { n: 4, fecha: '31 ago', aciertos: Math.max(0, ultimo - 11) },
    { n: 5, fecha: '14 sep', aciertos: Math.max(0, ultimo - 8)  },
    { n: 6, fecha: '28 sep', aciertos: ultimo                    },
  ];
  return serie.map((s, i) => {
    const puntaje = aciertosACeneval(s.aciertos, total);
    const prev = i > 0 ? aciertosACeneval(serie[i - 1].aciertos, total) : null;
    const delta = prev == null ? null : puntaje - prev;
    return { ...s, total, puntaje, delta };
  });
}

// TODO(rediseno): tabla real de StudentQuizResult. Mientras tanto, derivamos
// quizzes recientes a partir de los subtopics de los módulos del alumno.
function buildQuizzesRecientes() {
  // Tomar un subtopic representativo de los primeros módulos.
  const temas = [
    { tema: 'Coherencia y cohesión',  moduloId: 3, aciertos: 27, total: 30 },
    { tema: 'Biología celular',       moduloId: 4, aciertos: 26, total: 30 },
    { tema: 'Geometría analítica',    moduloId: 1, aciertos: 25, total: 30 },
  ];
  return temas.map(t => ({
    ...t,
    modulo: mockModules.find(m => m.id === t.moduloId)?.title ?? '',
  }));
}

// TODO(rediseno): tabla real de StudentQuizProgress por materia.
// Mientras tanto, derivamos "quizzes hechos / totales" por módulo con el campo
// progress del módulo (progress → hechos sobre un total pequeño).
function buildMateriasConProgreso() {
  return mockModules.map(m => {
    const total = 4;
    const hechos = Math.min(total, Math.round((m.progress / 100) * total));
    return {
      id: m.id,
      titulo: m.title,
      iconName: SUBJECT_ICON[m.title] ?? 'math',
      hechos,
      total,
    };
  });
}

export default function SimuladoresQuizzes({ customQuizzes, onAddQuiz, onDeleteQuiz }) { // eslint-disable-line no-unused-vars
  const { quizzesMaestro } = useMaterial();
  const [metaVisible, setMetaVisible] = useState(!META_OCULTA_POR_DEFECTO);
  // TODO(rediseno): meta real del alumno (viene de su carrera objetivo o la elige él).
  const [metaCeneval] = useState(1240);

  // TODO(rediseno): el alumno en sesión debe venir de AuthContext. Para el mock,
  // tomamos el primero (Ana García López) como está en el mockup.
  const student = mockStudents[0];

  const simuladores = useMemo(() => buildSimuladoresHistoricos(student), [student]);
  const quizzesRecientes = useMemo(() => buildQuizzesRecientes(), []);
  const materias = useMemo(() => buildMateriasConProgreso(), []);

  const primero = simuladores[0];
  const ultimo = simuladores[simuladores.length - 1];
  const subida = ultimo && primero ? ultimo.puntaje - primero.puntaje : 0;
  const subidaPositiva = subida > 0;

  function handleIniciar() {
    // TODO(rediseno): conectar el flujo "Iniciar" con ExamSimulator.
    // El en-curso vive en src/pages/exam/ExamSimulator.jsx (lo implementa otro subagente).
    alert('TODO(rediseno): conectar el flujo "Iniciar" con ExamSimulator.');
  }

  // ----- Gráfica (SVG) -----
  const chartW = 560;
  const chartH = 196;
  const puntajes = simuladores.map(s => s.puntaje);
  const xs = simuladores.map((_, i) => 40 + i * ((chartW - 80) / (simuladores.length - 1)));
  const ref = metaVisible ? [...puntajes, metaCeneval] : puntajes;
  const lo = Math.min(...ref) - 25;
  const hi = Math.max(...ref) + 25;
  const Y = v => Math.round((158 - ((v - lo) / (hi - lo)) * 118) * 10) / 10;

  const linePoints = puntajes.map((v, i) => `${xs[i]} ${Y(v)}`);
  const lineD = `M${linePoints.join(' L')}`;
  const areaD = `${lineD} L${xs[xs.length - 1]} 170 L${xs[0]} 170 Z`;
  const my = Y(metaCeneval);
  const myLabel = my < 22 ? my + 16 : my - 7;

  return (
    <div
      className="scrollbar-hide"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(12,29,69,0.85), rgba(12,29,69,0) 70%)',
        color: '#cbd5e1',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#ffffff',
        }}
      >
        Simuladores y quizzes
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24 }}>
        {/* ----- SIMULADOR EXANI-II (bloque azul sólido via SimuladorBlock) ----- */}
        <div style={{ flex: '1.55 1 460px', minWidth: 0 }}>
        <SimuladorBlock
          titulo="Simulador EXANI-II"
          subtitulo={`${SIMULADOR_TOTAL_PREGUNTAS} preguntas · da puntaje Ceneval`}
        >
          {/* CTA en el borde superior del cuerpo, como el mockup */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <BotonPrimario onClick={handleIniciar} aria-label="Iniciar nuevo simulador">
              Iniciar nuevo simulador
            </BotonPrimario>
          </div>

          {/* Gráfica de evolución */}
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            role="img"
            aria-label={`Puntaje de tus ${simuladores.length} simuladores`}
            style={{ display: 'block', width: '100%', height: 'auto', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <path d={areaD} fill="#f5c842" fillOpacity="0.12" />
            {metaVisible && (
              <g>
                <line x1="12" x2={chartW - 12} y1={my} y2={my} stroke="#93c5fd" strokeWidth="2" strokeDasharray="6 5" />
                <text x="12" y={myLabel} fontSize="13" fontWeight="600" fill="#93c5fd">
                  Meta · {metaCeneval.toLocaleString('es-MX')}
                </text>
              </g>
            )}
            <path d={lineD} fill="none" stroke="#f5c842" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {simuladores.map((s, i) => {
              const isLast = i === simuladores.length - 1;
              const y = Y(s.puntaje);
              return (
                <g key={s.n}>
                  <circle
                    cx={xs[i]}
                    cy={y}
                    r={isLast ? 7 : 5}
                    fill={isLast ? '#f5c842' : '#0c1d45'}
                    stroke="#f5c842"
                    strokeWidth="2.5"
                  />
                  <text
                    x={xs[i]}
                    y={y - 13}
                    textAnchor="middle"
                    fontSize={isLast ? 15 : 13}
                    fontWeight={isLast ? 700 : 600}
                    fill={isLast ? '#ffffff' : '#e2e8f0'}
                  >
                    {s.puntaje.toLocaleString('es-MX')}
                  </text>
                  <text x={xs[i]} y={190} textAnchor="middle" fontSize="13" fill="#cbd5e1">
                    {s.n}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* "Has subido N puntos" + Ver mi meta */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px 16px',
            }}
          >
            <div style={{ fontSize: 16, color: '#e2e8f0' }}>
              Has subido{' '}
              <strong
                style={{
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  color: subidaPositiva ? '#34d399' : '#cbd5e1',
                }}
              >
                {Math.abs(subida)} puntos
              </strong>{' '}
              desde el primero
            </div>
            <button
              type="button"
              onClick={() => setMetaVisible(v => !v)}
              aria-pressed={metaVisible}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                padding: '8px 16px',
                border: '1px solid rgba(147,197,253,0.5)',
                borderRadius: 999,
                background: metaVisible ? 'rgba(147,197,253,0.14)' : 'transparent',
                color: '#93c5fd',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Flag size={16} strokeWidth={1.8} aria-hidden="true" />
              {metaVisible ? 'Ocultar mi meta' : 'Ver mi meta'}
            </button>
          </div>

          {/* Nota de estimación */}
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {NOTA_ESTIMACION} Puntaje en escala {SIMULADOR_RANGO_CENEVAL.min}–{SIMULADOR_RANGO_CENEVAL.max}.
          </p>

          {/* Historial de simuladores */}
          <div>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              Tus simuladores
            </h3>
            <div role="list">
              {[...simuladores].reverse().map((s, idx, arr) => {
                const esInicio = idx === arr.length - 1;
                const hasDelta = typeof s.delta === 'number' && !esInicio;
                const sube = hasDelta && s.delta > 0;
                return (
                  <a
                    key={s.n}
                    href="#"
                    role="listitem"
                    onClick={e => e.preventDefault()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      minHeight: 52,
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      color: '#e2e8f0',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        flex: '0 0 34px',
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 999,
                        background: 'rgba(245,200,66,0.14)',
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#f5c842',
                      }}
                    >
                      {s.n}
                    </span>
                    <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 14, color: '#cbd5e1' }}>
                      {s.fecha}
                    </span>
                    <span style={{ flex: '0 0 auto', fontSize: 14, whiteSpace: 'nowrap' }}>
                      {s.aciertos} / {s.total}
                    </span>
                    <span
                      style={{
                        flex: '0 0 64px',
                        textAlign: 'right',
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontWeight: 700,
                        fontSize: 20,
                        color: '#ffffff',
                      }}
                    >
                      {s.puntaje.toLocaleString('es-MX')}
                    </span>
                    {esInicio ? (
                      <span style={{ flex: '0 0 64px', textAlign: 'right', fontSize: 13, color: '#cbd5e1' }}>
                        Inicio
                      </span>
                    ) : hasDelta ? (
                      <span
                        style={{
                          flex: '0 0 64px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 4,
                          fontSize: 14,
                          fontWeight: 600,
                          // Baja en gris, no en rojo (HANDOFF).
                          color: sube ? '#34d399' : '#cbd5e1',
                        }}
                      >
                        {sube ? (
                          <ArrowUp size={13} strokeWidth={2.8} />
                        ) : (
                          <ArrowDown size={13} strokeWidth={2.8} />
                        )}
                        {Math.abs(s.delta)}
                      </span>
                    ) : (
                      <span style={{ flex: '0 0 64px' }} />
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </SimuladorBlock>
        </div>

        {/* ----- QUIZZES (bloque de contorno) ----- */}
        <section
          aria-label="Quizzes por tema"
          style={{
            flex: '1 1 320px',
            minWidth: 0,
            boxSizing: 'border-box',
            padding: 28,
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.13)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(147,197,253,0.14)',
                flexShrink: 0,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7l2 2 3-4M4 16l2 2 3-4M13 7h7M13 16h7" />
              </svg>
            </span>
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
                Quizzes por tema
              </h2>
              <div style={{ fontSize: 14, color: '#cbd5e1' }}>Solo cuentan aciertos</div>
            </div>
          </div>

          {/* Materias */}
          <div>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              Elige una materia
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materias.map(m => (
                <a
                  key={m.id}
                  href="#"
                  onClick={e => e.preventDefault()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 56,
                    padding: '0 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    textDecoration: 'none',
                  }}
                >
                  <IconSubject name={m.iconName} size={22} color="#93c5fd" />
                  <span
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.25,
                    }}
                  >
                    {m.titulo}
                  </span>
                  <span
                    role="img"
                    aria-label={`${m.hechos} de ${m.total} quizzes hechos`}
                    style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}
                  >
                    {Array.from({ length: m.total }).map((_, i) => {
                      const done = i < m.hechos;
                      return (
                        <span
                          key={i}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            background: done ? '#93c5fd' : 'transparent',
                            boxSizing: 'border-box',
                            border: done ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                          }}
                        />
                      );
                    })}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Últimos resultados */}
          <div>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              Últimos resultados
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quizzesRecientes.map(q => (
                <QuizBlock
                  key={q.tema}
                  tema={q.tema}
                  aciertos={q.aciertos}
                  total={q.total}
                >
                  <div
                    style={{
                      marginTop: 10,
                      height: 6,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((q.aciertos / q.total) * 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: '#93c5fd',
                      }}
                    />
                  </div>
                </QuizBlock>
              ))}
            </div>
          </div>

          {quizzesMaestro.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Quizzes de tus profesores
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quizzesMaestro.map(q => {
                  const materia = mockModules.find(m => m.id === q.moduleId);
                  return (
                    <QuizBlock
                      key={q.id}
                      tema={q.tema}
                      aciertos={null}
                      total={q.preguntas.length}
                    >
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                        {materia?.title ?? 'Materia'} · {q.preguntas.length} pregunta{q.preguntas.length === 1 ? '' : 's'}
                      </p>
                    </QuizBlock>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
