// Mis alumnos (maestro). Implementa `mockups/Maestro-Alumnos.dc.html`.
// HANDOFF:
//  - Puntaje mostrado = Ceneval 700–1300 del simulador. Quizzes aparte (aciertos/total).
//  - Baja de puntaje en gris, nunca en rojo. "Requiere atención" sí puede usar rojo tenue.
//  - Nunca "te faltan X puntos".
import { useMemo, useState } from 'react';
import { Search, ChevronRight, ArrowUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockStudents } from '../../data/mockData';
import {
  aciertosACeneval,
  SIMULADOR_TOTAL_PREGUNTAS,
  ATENCION_POR_BAJA,
} from '../../config/rediseno';

// TODO(rediseno): filtrar por TeacherStudent (hoy el maestro ve todos los alumnos del mock).
// TODO(rediseno): histórico real de simuladores por alumno (StudentSimulatorScore).
// Mientras tanto, derivamos una serie corta a partir de avgScore con una pequeña
// variación determinista por id del alumno.
function serieCenevalDeAlumno(student) {
  const puntajeActual = aciertosACeneval(
    Math.round((student.avgScore / 100) * SIMULADOR_TOTAL_PREGUNTAS),
  );
  const n = 6;
  const bajo = puntajeActual - 120;
  const puntos = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    // Semilla determinista para una pequeña ondulación por alumno.
    const wobble = ((student.id * 37 + i * 11) % 60) - 30;
    puntos.push(Math.round(bajo + t * 120 + wobble * 0.4));
  }
  // Garantiza que el último punto coincide con el puntaje "actual".
  puntos[n - 1] = puntajeActual;
  return puntos;
}

function Sparkline({ data, color = '#f5c842', width = 104, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 6;
  const stepX = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1].split(',').map(Number);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

function initialsOf(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';
}

function StudentRow({ student }) {
  const serie = useMemo(() => serieCenevalDeAlumno(student), [student]);
  const puntajeActual = serie[serie.length - 1];
  const puntajePrevio = serie[serie.length - 2];
  const delta = puntajeActual - puntajePrevio;
  const subio = delta > 0;
  const bajo = delta < 0;
  // Requiere atención (criterio del HANDOFF, hoy: baja respecto al anterior).
  const requiereAtencion = ATENCION_POR_BAJA && bajo;

  // Quizzes (mock): hoy derivamos del progress. Hecho = porcentaje × 20.
  const quizzesTotal = 20;
  const quizzesHechos = Math.round((student.progress / 100) * quizzesTotal);

  return (
    <a
      href="#"
      onClick={e => e.preventDefault()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1.7fr) 96px 120px 96px 96px 130px 20px',
        columnGap: 16,
        alignItems: 'center',
        minHeight: 64,
        padding: '6px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: '#e2e8f0',
        textDecoration: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span
          style={{
            flex: '0 0 40px',
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: '#0c1d45',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          {initialsOf(student.name)}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
            {student.name}
          </span>
          {requiereAtencion && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#fca5a5',
                marginTop: 2,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#f87171' }} />
              Va a la baja
            </span>
          )}
        </span>
      </span>

      <span style={{ fontSize: 15 }}>{student.quizzes ?? serie.length}</span>

      <Sparkline data={serie} />

      <span
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: 20,
          color: '#ffffff',
        }}
      >
        {puntajeActual.toLocaleString('es-MX')}
      </span>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 15,
          fontWeight: 600,
          color: subio ? '#34d399' : 'rgba(255,255,255,0.6)',
        }}
      >
        <ArrowUp
          size={13}
          strokeWidth={2.8}
          aria-hidden="true"
          style={{ transform: bajo ? 'rotate(180deg)' : 'none' }}
        />
        {Math.abs(delta)}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
          {quizzesHechos} / {quizzesTotal}
        </span>
        <span
          style={{
            flex: '1 1 auto',
            height: 6,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              display: 'block',
              width: `${(quizzesHechos / quizzesTotal) * 100}%`,
              height: '100%',
              background: '#93c5fd',
            }}
          />
        </span>
      </span>

      <ChevronRight size={18} strokeWidth={2} aria-hidden="true" color="#cbd5e1" />
    </a>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'atencion'

  // Augmentamos cada alumno con su serie + flag "requiere atención".
  const alumnos = useMemo(
    () =>
      mockStudents.map(s => {
        const serie = serieCenevalDeAlumno(s);
        const delta = serie[serie.length - 1] - serie[serie.length - 2];
        return { ...s, _serie: serie, _delta: delta, _atencion: ATENCION_POR_BAJA && delta < 0 };
      }),
    [],
  );

  const alumnosFiltrados = alumnos.filter(a => {
    if (filtro === 'atencion' && !a._atencion) return false;
    if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalAlumnos = alumnos.length;
  const nAtencion = alumnos.filter(a => a._atencion).length;
  const promedioGrupo = Math.round(
    alumnos.reduce((acc, a) => acc + a._serie[a._serie.length - 1], 0) / Math.max(1, alumnos.length),
  );
  const promedioInicial = Math.round(
    alumnos.reduce((acc, a) => acc + a._serie[0], 0) / Math.max(1, alumnos.length),
  );
  const deltaGrupo = promedioGrupo - promedioInicial;

  // Nombre del maestro (sin cargo) para TODO futuro.
  const _nombreMaestro = user?.name;

  return (
    <div
      className="scrollbar-hide"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(12,29,69,0.85), rgba(12,29,69,0) 70%)',
        color: '#cbd5e1',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 24px' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 36px)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#ffffff',
          }}
        >
          Mis alumnos
        </h1>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: '0 1 320px',
            minWidth: 0,
            minHeight: 48,
            padding: '0 16px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            background: 'rgba(12,29,69,0.5)',
          }}
        >
          <Search size={20} strokeWidth={1.8} color="#cbd5e1" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar alumno"
            placeholder="Buscar alumno"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              height: 44,
              border: 0,
              background: 'transparent',
              color: '#e2e8f0',
              font: 'inherit',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </label>
      </header>

      {/* Resumen del grupo */}
      <section
        aria-label="Resumen del grupo"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 72px' }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(44px, 7vw, 60px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            {totalAlumnos}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: '#e2e8f0' }}>
            {totalAlumnos === 1 ? 'alumno' : 'alumnos'}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(44px, 7vw, 60px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: '#f5c842',
            }}
          >
            {promedioGrupo.toLocaleString('es-MX')}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: '#e2e8f0' }}>
            promedio del grupo en el último simulador
          </div>
          <div
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: deltaGrupo >= 0 ? '#34d399' : 'rgba(255,255,255,0.6)',
            }}
          >
            <ArrowUp
              size={13}
              strokeWidth={2.8}
              aria-hidden="true"
              style={{ transform: deltaGrupo < 0 ? 'rotate(180deg)' : 'none' }}
            />
            {Math.abs(deltaGrupo)} desde el primero
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(44px, 7vw, 60px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            {nAtencion}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: '#e2e8f0' }}>
            {nAtencion === 1 ? 'requiere atención' : 'requieren atención'}
          </div>
          <div
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              color: '#fca5a5',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#f87171' }} />
            bajan o llevan semanas sin entrar
          </div>
        </div>
      </section>

      {/* Lista de alumnos */}
      <section aria-label="Lista de alumnos">
        <div
          role="group"
          aria-label="Filtrar alumnos"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
        >
          <button
            type="button"
            aria-pressed={filtro === 'todos'}
            onClick={() => setFiltro('todos')}
            style={{
              minHeight: 44,
              padding: '8px 18px',
              border: filtro === 'todos' ? '1.5px solid #f5c842' : '1.5px solid rgba(255,255,255,0.13)',
              borderRadius: 999,
              background: filtro === 'todos' ? 'rgba(245,200,66,0.1)' : 'transparent',
              color: filtro === 'todos' ? '#ffffff' : '#cbd5e1',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Todos · {totalAlumnos}
          </button>
          <button
            type="button"
            aria-pressed={filtro === 'atencion'}
            onClick={() => setFiltro('atencion')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '8px 18px',
              border: filtro === 'atencion' ? '1.5px solid #f5c842' : '1.5px solid rgba(255,255,255,0.13)',
              borderRadius: 999,
              background: filtro === 'atencion' ? 'rgba(245,200,66,0.1)' : 'transparent',
              color: filtro === 'atencion' ? '#ffffff' : '#cbd5e1',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#f87171' }} />
            Requieren atención · {nAtencion}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }} className="scrollbar-hide">
          <div style={{ minWidth: 860 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.7fr) 96px 120px 96px 96px 130px 20px',
                columnGap: 16,
                alignItems: 'center',
                padding: '0 12px 8px',
                fontSize: 12,
                fontWeight: 600,
                color: '#cbd5e1',
              }}
            >
              <span>Alumno</span>
              <span>Simuladores</span>
              <span>Evolución</span>
              <span>Último</span>
              <span>Cambio</span>
              <span>Quizzes</span>
              <span />
            </div>
            {alumnosFiltrados.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: '24px 12px',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.6)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                No hay alumnos que coincidan con el filtro.
              </p>
            ) : (
              alumnosFiltrados.map(a => <StudentRow key={a.id} student={a} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
