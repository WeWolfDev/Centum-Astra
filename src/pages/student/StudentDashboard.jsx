import { useMemo, useState } from 'react';
import { ArrowUp, ArrowRight, ArrowDown, Flag, Play } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { mockModules } from '../../data/mockData';
import {
  SIMULADOR_RANGO_CENEVAL,
  META_OCULTA_POR_DEFECTO,
  aciertosACeneval,
} from '../../config/rediseno';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import IconSubject from '../../components/rediseno/IconSubject';

// Mapea el icono del mock al nombre que entiende IconSubject.
// TODO(rediseno): mover a config/rediseno.js si otra pantalla lo necesita.
const SUBJECT_ICON_BY_MODULE_ID = {
  1: 'math',
  2: 'reading',
  3: 'writing',
  4: 'premed',
  5: 'health',
};

// Historial Ceneval del alumno. HANDOFF: lo primero que ve es cuánto subió desde
// su primer simulador. En el mock no existe una tabla de simuladores completados
// por alumno; derivamos un historial razonable del único dato disponible
// (`mockStudents.avgScore` → puntaje Ceneval actual) y un supuesto de que su
// primer simulador fue 117 puntos abajo del actual.
// TODO(rediseno): sustituir por tabla real StudentSimulatorScore (id, fecha,
// aciertos, ceneval) cuando exista.
function buildHistorialCeneval(currentCeneval) {
  const { min, max } = SIMULADOR_RANGO_CENEVAL;
  const subida = 117; // TODO(rediseno): calcular con (ceneval actual - primer simulador real)
  const primero = Math.max(min, Math.min(max, currentCeneval - subida));
  const n = 6; // TODO(rediseno): usar el número real de simuladores completados
  const puntos = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = primero + subida * t;
    const ruido = 18 * Math.sin(i * 2.1) * Math.sin(Math.PI * t);
    const v = Math.round(Math.max(min, Math.min(max, base + ruido)));
    puntos.push({ idx: i + 1, label: i === 0 ? 'Primero' : `#${i + 1}`, ceneval: v });
  }
  // Fuerza que el último coincida con el actual (sin ruido).
  puntos[puntos.length - 1].ceneval = currentCeneval;
  puntos[0].ceneval = primero;
  return puntos;
}

export default function StudentDashboard({ setActiveSection }) {
  const { user } = useAuth();
  const [metaVisible, setMetaVisible] = useState(!META_OCULTA_POR_DEFECTO);

  // Datos del alumno. mockUsers tiene `progress` (0–100) pero no un puntaje
  // Ceneval directo. Lo derivamos con la conversión supuesta del HANDOFF.
  // TODO(rediseno): leer el puntaje Ceneval real del último simulador cuando
  // exista la tabla StudentSimulatorScore.
  const aciertosActuales = Math.round((user.progress / 100) * 138);
  const puntajeActual = aciertosACeneval(aciertosActuales);

  // Meta del alumno. HANDOFF: oculta por defecto. Hoy no hay fuente de la meta.
  // TODO(rediseno): tomar la meta del alumno de su carrera objetivo o de un
  // input del propio alumno (ver pregunta pendiente en HANDOFF).
  const metaCeneval = 1240;

  const historial = useMemo(() => buildHistorialCeneval(puntajeActual), [puntajeActual]);
  const primero = historial[0].ceneval;
  const ultimo = historial[historial.length - 1].ceneval;
  const delta = ultimo - primero;
  const subio = delta >= 0;

  const nombreCorto = user?.name?.split(' ')[0] ?? 'Alumno';

  return (
    <div
      className="scrollbar-hide bg-fondo-app"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 4rem)',
      }}
    >
      <HeaderSaludo nombre={nombreCorto} onContinuar={() => setActiveSection('modules')} />

      <PuntajeHero
        puntaje={puntajeActual}
        aciertos={aciertosActuales}
        primero={primero}
        ultimo={ultimo}
        delta={delta}
        subio={subio}
        metaVisible={metaVisible}
        onToggleMeta={() => setMetaVisible((v) => !v)}
        metaCeneval={metaCeneval}
      />

      <EvolucionBlock
        historial={historial}
        primero={primero}
        ultimo={ultimo}
        delta={delta}
        subio={subio}
        metaCeneval={metaCeneval}
        metaVisible={metaVisible}
        onIniciar={() => setActiveSection('exam')}
      />

      <TuMaterial
        onAbrirModulo={(id) => setActiveSection('modules', id)}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function HeaderSaludo({ nombre, onContinuar }) {
  return (
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px 24px',
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
        Hola, {nombre}
      </h1>
      <button
        type="button"
        onClick={onContinuar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minHeight: 56,
          padding: '6px 20px 6px 8px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.13)',
          background: 'transparent',
          color: '#e2e8f0',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 999,
            background: '#f5c842',
            flexShrink: 0,
          }}
        >
          <Play size={18} fill="#030a1a" color="#030a1a" strokeWidth={0} aria-hidden="true" />
        </span>
        <span>
          <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Continuar clase
          </span>
          {/* TODO(rediseno): la "última clase vista" no existe en el mock. */}
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
            Geometría analítica
          </span>
        </span>
      </button>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function PuntajeHero({
  puntaje,
  aciertos,
  primero,
  ultimo,
  delta,
  subio,
  metaVisible,
  onToggleMeta,
  metaCeneval,
}) {
  const { min, max } = SIMULADOR_RANGO_CENEVAL;
  const absDelta = Math.abs(delta);
  const faltante = metaCeneval - ultimo;

  // Para la barra: posición en 0–1 de primero y último, y de la meta.
  const pos = (v) => Math.max(0, Math.min(1, (v - min) / (max - min)));
  const posPrimero = pos(primero);
  const posUltimo = pos(ultimo);
  const posMeta = pos(metaCeneval);
  const rangeStart = Math.min(posPrimero, posUltimo);
  const rangeEnd = Math.max(posPrimero, posUltimo);

  return (
    <section
      aria-label="Puntaje estimado EXANI-II"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '24px 56px',
      }}
    >
      <div style={{ flex: '0 1 auto', minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          Puntaje estimado EXANI-II
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(56px, 12vw, 112px)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#f5c842',
          }}
        >
          {puntaje.toLocaleString('es-MX')}
        </div>
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 20px',
            fontSize: 15,
          }}
        >
          <span style={{ color: '#e2e8f0' }}>
            <strong style={{ fontWeight: 600, color: '#ffffff' }}>{aciertos}</strong> / 138 aciertos
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              // HANDOFF: baja de puntaje en gris, no en rojo.
              color: subio ? '#f5c842' : '#cbd5e1',
            }}
          >
            {subio ? (
              <ArrowUp size={14} strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <ArrowDown size={14} strokeWidth={2.6} aria-hidden="true" />
            )}
            {absDelta} puntos
          </span>
        </div>
      </div>

      <div style={{ flex: '1 1 420px', minWidth: 0, maxWidth: 660 }}>
        <BarraEscalaCeneval
          min={min}
          max={max}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          posPrimero={posPrimero}
          posUltimo={posUltimo}
          posMeta={posMeta}
          primero={primero}
          ultimo={ultimo}
          metaCeneval={metaCeneval}
          metaVisible={metaVisible}
        />
        <div style={{ marginTop: 8, fontSize: 16, color: '#e2e8f0' }}>
          Has subido{' '}
          <strong
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.02em',
              color: subio ? '#f5c842' : '#cbd5e1',
            }}
          >
            {absDelta} puntos
          </strong>{' '}
          desde tu primer simulador
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px 16px',
          }}
        >
          <BotonSecundario
            onClick={onToggleMeta}
            aria-pressed={metaVisible}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '8px 16px',
              border: '1px solid rgba(147,197,253,0.45)',
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
          </BotonSecundario>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Estimación. No es resultado oficial del Ceneval.
          </span>
          {metaVisible && (
            <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
              Meta {metaCeneval.toLocaleString('es-MX')}
              {faltante > 0 ? ` · diferencia ${faltante} pts` : ' · meta alcanzada'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function BarraEscalaCeneval({
  min,
  max,
  rangeStart,
  rangeEnd,
  posPrimero,
  posUltimo,
  posMeta,
  primero,
  ultimo,
  metaCeneval,
  metaVisible,
}) {
  const W = 600;
  const H = 126;
  const padL = 20;
  const padR = 20;
  const barW = W - padL - padR;
  const toX = (p) => padL + p * barW;

  const metaX = toX(posMeta);
  const metaAnchor = metaX < 90 ? 'start' : metaX > W - 90 ? 'end' : 'middle';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Escala del índice Ceneval de ${min} a ${max}: empezaste en ${primero} y hoy vas en ${ultimo}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <text x={padL} y={34} fontSize={13} fill="#ffffff" fillOpacity={0.6}>
        {min}
      </text>
      <text x={W - padR} y={34} textAnchor="end" fontSize={13} fill="#ffffff" fillOpacity={0.6}>
        {max}
      </text>

      <rect
        x={padL}
        y={56}
        width={barW}
        height={14}
        rx={7}
        fill="#ffffff"
        fillOpacity={0.09}
      />
      <rect
        x={padL}
        y={56}
        width={barW * rangeEnd}
        height={14}
        rx={7}
        fill="#f5c842"
        fillOpacity={0.32}
      />
      <rect
        x={toX(rangeStart)}
        y={56}
        width={barW * (rangeEnd - rangeStart)}
        height={14}
        rx={7}
        fill="#f5c842"
      />

      {metaVisible && (
        <g>
          <line
            x1={metaX}
            x2={metaX}
            y1={44}
            y2={102}
            stroke="#93c5fd"
            strokeWidth={2.5}
            strokeDasharray="5 4"
          />
          <text
            x={metaX}
            y={120}
            textAnchor={metaAnchor}
            fontSize={14}
            fontWeight={600}
            fill="#93c5fd"
          >
            Meta · {metaCeneval.toLocaleString('es-MX')}
          </text>
        </g>
      )}

      <circle
        cx={toX(posPrimero)}
        cy={63}
        r={8}
        fill="#030a1a"
        stroke="#f5c842"
        strokeWidth={3}
      />
      <text x={toX(posPrimero)} y={96} textAnchor="middle" fontSize={13} fill="#cbd5e1">
        Inicio · {primero.toLocaleString('es-MX')}
      </text>

      <circle
        cx={toX(posUltimo)}
        cy={63}
        r={12}
        fill="#f5c842"
        stroke="#030a1a"
        strokeWidth={4}
      />
      <text
        x={toX(posUltimo)}
        y={34}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="#ffffff"
      >
        Hoy · {ultimo.toLocaleString('es-MX')}
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function EvolucionBlock({
  historial,
  primero,
  ultimo,
  delta,
  subio,
  metaCeneval,
  metaVisible,
  onIniciar,
}) {
  const absDelta = Math.abs(delta);

  return (
    <section
      aria-label="Evolución del simulador EXANI-II"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
      }}
    >
      <div
        style={{
          flex: '1 1 100%',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: 28,
          borderRadius: 18,
          background: '#0c1d45',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
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
              background: 'rgba(245,200,66,0.14)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f5c842"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3" />
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
              Simulador EXANI-II
            </h2>
            <div style={{ fontSize: 14, color: '#cbd5e1' }}>
              138 preguntas · da puntaje Ceneval
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '16px 28px',
          }}
        >
          <div style={{ flex: '0 0 auto' }}>
            <div
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              {historial.length}
            </div>
            <div style={{ fontSize: 14, color: '#cbd5e1' }}>completos</div>
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 0, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historial}
                margin={{ top: 16, right: 16, bottom: 4, left: 0 }}
              >
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5c842" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#f5c842" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[SIMULADOR_RANGO_CENEVAL.min, SIMULADOR_RANGO_CENEVAL.max]}
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    background: '#030a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 13,
                  }}
                  cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  formatter={(v) => [`${Number(v).toLocaleString('es-MX')} pts`, 'Ceneval']}
                />
                {metaVisible && (
                  <ReferenceLine
                    y={metaCeneval}
                    stroke="#93c5fd"
                    strokeDasharray="5 4"
                    label={{
                      value: `Meta ${metaCeneval}`,
                      position: 'insideTopRight',
                      fill: '#93c5fd',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="ceneval"
                  stroke="#f5c842"
                  strokeWidth={2.5}
                  fill="url(#goldFill)"
                  dot={{ r: 4, fill: '#0c1d45', stroke: '#f5c842', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f5c842', stroke: '#030a1a', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px 14px',
            fontSize: 15,
            color: '#cbd5e1',
          }}
        >
          <span>
            Primero <strong style={{ fontWeight: 700, color: '#ffffff' }}>{primero.toLocaleString('es-MX')}</strong>
          </span>
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          <span>
            Último <strong style={{ fontWeight: 700, color: '#ffffff' }}>{ultimo.toLocaleString('es-MX')}</strong>
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 'auto',
              fontWeight: 600,
              color: subio ? '#f5c842' : '#cbd5e1',
            }}
          >
            {subio ? (
              <ArrowUp size={14} strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <ArrowDown size={14} strokeWidth={2.6} aria-hidden="true" />
            )}
            {absDelta} puntos
          </span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <BotonPrimario onClick={onIniciar}>Iniciar simulador o quiz</BotonPrimario>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function TuMaterial({ onAbrirModulo }) {
  return (
    <section aria-label="Tu material">
      <h2
        style={{
          margin: '0 0 16px',
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: 20,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#ffffff',
        }}
      >
        Tu material
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {mockModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onAbrirModulo(mod.id)}
            style={{
              flex: '1 1 170px',
              minWidth: 0,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minHeight: 132,
              padding: 18,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            aria-label={`Abrir módulo ${mod.title}`}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(245,200,66,0.14)',
                }}
              >
                <IconSubject
                  name={SUBJECT_ICON_BY_MODULE_ID[mod.id] ?? 'math'}
                  size={26}
                  color="#f5c842"
                />
              </span>
              <ArrowRight size={20} strokeWidth={2} color="#cbd5e1" aria-hidden="true" />
            </span>
            <span
              style={{
                marginTop: 'auto',
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {mod.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
