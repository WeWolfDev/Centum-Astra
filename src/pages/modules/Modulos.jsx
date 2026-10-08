// Módulos del alumno (rediseño). Implementa `mockups/Alumno-Modulos.dc.html`.
// Reglas del HANDOFF:
//  - El alumno NO descarga PDFs: PdfCard con canDownload={false}.
//  - No hay porcentaje de avance por módulo. Sí hay estado por clase.
//  - Quizzes por tema con aciertos/total (nunca puntaje Ceneval).
import { useMemo, useState } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { mockModules, mockSessionsByModule, mockVideos } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useMaterial } from '../../context/MaterialContext';
import { puedeDescargarPdf } from '../../config/rediseno';
import IconSubject from '../../components/rediseno/IconSubject';
import Pastilla from '../../components/rediseno/Pastilla';
import PdfCard from '../../components/rediseno/PdfCard';
import VideoCard from '../../components/rediseno/VideoCard';
import QuizBlock from '../../components/rediseno/QuizBlock';

// Los iconos de mockModules están en nombres Lucide (Sigma, Book, PenTool, Stethoscope, HeartPulse).
// IconSubject usa la taxonomía del HANDOFF: 'math' | 'reading' | 'writing' | 'premed' | 'health'.
// Mapeo local, aislado al rediseño.
// TODO(rediseno): considerar que mockModules exponga directamente el nombre normalizado.
const SUBJECT_BY_ICON = {
  Sigma: 'math',
  Book: 'reading',
  PenTool: 'writing',
  Stethoscope: 'premed',
  HeartPulse: 'health',
};

// TODO(rediseno): tomar el maestro real por módulo. Mientras tanto, texto neutro.
const TEACHER_BY_MODULE_ID = {
  1: 'Mtra. Sofía Ramírez',
  2: 'Prof. Carlos Mendoza',
  3: 'Mtra. Patricia Luna',
  4: 'Dr. Ramón Solís',
  5: 'Dr. Ramón Solís',
};

// TODO(rediseno): estado real de ClassStatus por alumno-clase.
// Mientras tanto: primeras clases Vista, la del medio En curso, el resto Pendiente,
// usando el `progress` del módulo como señal gruesa.
function deriveClassStatuses(sessions, progress) {
  const n = sessions.length;
  if (n === 0) return [];
  // Avance (0..1) traducido a cuántas clases están "vistas".
  const ratio = Math.max(0, Math.min(1, (progress || 0) / 100));
  // Al menos una En curso si no está todo vista y no está todo pendiente.
  const vistas = Math.min(n, Math.floor(ratio * n));
  const statuses = new Array(n).fill('pendiente');
  for (let i = 0; i < vistas; i += 1) statuses[i] = 'vista';
  if (vistas < n && vistas >= 0) statuses[Math.min(vistas, n - 1)] = 'en-curso';
  // Si el módulo está en 0% deja la primera En curso para que haya algo accionable.
  if (vistas === 0 && statuses[0] === 'pendiente') statuses[0] = 'en-curso';
  return statuses;
}

// TODO(rediseno): tabla real que vincule video→clase (hoy repartimos los videos
// del módulo entre sus clases según índice).
function videosParaSesion(sesionIndex, totalSesiones, videosDeModulo) {
  if (!videosDeModulo.length || totalSesiones === 0) return [];
  const videosPorSesion = Math.ceil(videosDeModulo.length / totalSesiones);
  const start = sesionIndex * videosPorSesion;
  return videosDeModulo.slice(start, start + videosPorSesion);
}

// TODO(rediseno): tabla real de QuizResult por tema/alumno.
// Pseudoaleatorio determinista a partir del id de la sesión para que no cambie entre renders.
function deriveQuizScore(sessionId, status) {
  if (status === 'pendiente') return null;
  const seed = String(sessionId)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const total = 30;
  // Vista: aciertos 24..29. En curso: 20..26.
  const base = status === 'vista' ? 24 : 20;
  const span = status === 'vista' ? 6 : 7;
  const aciertos = base + (seed % span);
  return { aciertos, total };
}

const STATUS_LABEL = {
  vista: 'Vista',
  'en-curso': 'En curso',
  pendiente: 'Pendiente',
};

function StatusIndicator({ status, index }) {
  if (status === 'vista') {
    return (
      <span
        aria-hidden="true"
        style={{
          flex: '0 0 48px',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: 'rgba(52,211,153,0.16)',
          color: '#34d399',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (status === 'en-curso') {
    return (
      <span
        aria-hidden="true"
        style={{
          flex: '0 0 48px',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: '#f5c842',
          color: '#030a1a',
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        flex: '0 0 48px',
        width: 48,
        height: 48,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        border: '1.5px solid rgba(255,255,255,0.3)',
        color: '#cbd5e1',
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontWeight: 700,
        fontSize: 20,
      }}
    >
      {index + 1}
    </span>
  );
}

function statusPastillaTono(status) {
  if (status === 'vista') return 'positivo';
  if (status === 'en-curso') return 'rol-admin'; // dorado
  return 'neutral';
}

function ClassRow({ session, index, status, canDownload, videos, pdfsExtra, videosExtra, onVerPdf, onVerVideo, onEntrarQuiz }) {
  const [expanded, setExpanded] = useState(false);
  const pdfBase = (session.resources || []).filter(r => r.type === 'pdf');
  const pdfResources = [...pdfBase, ...pdfsExtra];
  const videosTodos = [...videos, ...videosExtra];
  const quiz = deriveQuizScore(session.id, status);
  const borderColor = status === 'en-curso' ? 'rgba(245,200,66,0.55)' : 'transparent';

  const nPdfs = pdfResources.length;
  const nVideos = videosTodos.length;
  const totalRecursos = nPdfs + nVideos;
  const resumen = totalRecursos === 0
    ? 'Sin material'
    : [
        nPdfs > 0 ? `${nPdfs} PDF${nPdfs === 1 ? '' : 's'}` : null,
        nVideos > 0 ? `${nVideos} video${nVideos === 1 ? '' : 's'}` : null,
      ].filter(Boolean).join(' · ');

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        background: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls={`clase-${session.id}-contenido`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px 20px',
          padding: '18px 20px',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left',
          fontFamily: 'inherit',
          minHeight: 44,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 280px', minWidth: 0 }}>
          <StatusIndicator status={status} index={index} />
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.3,
                color: '#ffffff',
              }}
            >
              {session.label}
            </h3>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 10px' }}>
              <Pastilla tono={statusPastillaTono(status)}>
                {STATUS_LABEL[status]}
              </Pastilla>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {resumen}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          size={20}
          strokeWidth={1.9}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: 'rgba(255,255,255,0.6)',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {expanded && (
        <div
          id={`clase-${session.id}-contenido`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '0 20px 18px',
          }}
        >
          {totalRecursos === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Sin material publicado en esta clase.
            </p>
          )}
          {pdfResources.map((r, i) => (
            <PdfCard
              key={`${session.id}-pdf-${r.id ?? i}`}
              nombre={r.name}
              tamano={r.size}
              onVer={() => onVerPdf(r)}
              canDownload={canDownload}
            />
          ))}
          {videosTodos.map(v => (
            <VideoCard
              key={`${session.id}-video-${v.id}`}
              titulo={v.title}
              duracion={v.duration}
              instructor={v.instructor}
              onVer={() => onVerVideo(v)}
            />
          ))}
          <QuizBlock
            tema={quiz ? `Quiz ${quiz.aciertos}/${quiz.total}` : 'Quiz del tema'}
            aciertos={quiz?.aciertos}
            total={quiz?.total}
            onEntrar={() => onEntrarQuiz(session, quiz)}
          />
        </div>
      )}
    </section>
  );
}

export default function Modulos({ defaultModuleId = null }) {
  const { user } = useAuth();
  const canDownload = puedeDescargarPdf(user?.role);
  const { clasesExtraPorModulo, pdfsExtraPorSesion, videosExtraPorSesion } = useMaterial();

  const [selectedId, setSelectedId] = useState(() => {
    if (defaultModuleId && mockModules.some(m => m.id === defaultModuleId)) {
      return defaultModuleId;
    }
    return mockModules[0]?.id ?? null;
  });

  const selected = mockModules.find(m => m.id === selectedId) || mockModules[0];
  const sessions = useMemo(() => {
    const base = (mockSessionsByModule[selected?.id] || []).filter(s => s.visible !== false);
    const extras = clasesExtraPorModulo[selected?.id] || [];
    return [...base, ...extras];
  }, [selected?.id, clasesExtraPorModulo]);
  const statuses = useMemo(
    () => deriveClassStatuses(sessions, selected?.progress),
    [sessions, selected?.progress],
  );
  const videosDeModulo = useMemo(
    () => mockVideos.filter(v => v.subject === selected?.title),
    [selected?.title],
  );

  const teacher = TEACHER_BY_MODULE_ID[selected?.id];

  // TODO(rediseno): abrir visor PDF embebido (sin descarga) desde Modulos.
  function handleVerPdf(_resource) {
    // Visor pendiente. Intencionalmente sin descarga para el alumno.
  }

  // TODO(rediseno): abrir player de video embebido.
  function handleVerVideo(_video) {
    // Reproductor pendiente.
  }

  // TODO(rediseno): entrada al quiz por tema (aciertos/total). Lo cablea alumno-simuladores.
  function handleEntrarQuiz(_session, _quiz) {
    // Entrada pendiente.
  }

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
        minHeight: '100%',
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
        Módulos
      </h1>

      {/* Selector de materias */}
      <div
        aria-label="Materias"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
      >
        {mockModules.map(mod => {
          const active = mod.id === selected?.id;
          const subjectKey = SUBJECT_BY_ICON[mod.icon];
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedId(mod.id)}
              aria-current={active ? 'true' : undefined}
              style={{
                flex: '1 1 150px',
                minWidth: 0,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '16px 10px',
                borderRadius: 14,
                border: active
                  ? '1.5px solid #f5c842'
                  : '1.5px solid rgba(255,255,255,0.13)',
                background: active ? 'rgba(245,200,66,0.1)' : 'transparent',
                color: active ? '#ffffff' : '#cbd5e1',
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.25,
                textAlign: 'center',
                cursor: 'pointer',
                minHeight: 44,
                transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
              }}
            >
              {subjectKey ? (
                <IconSubject
                  name={subjectKey}
                  size={30}
                  strokeWidth={1.6}
                  color={active ? '#f5c842' : 'currentColor'}
                />
              ) : null}
              <span>{mod.title}</span>
            </button>
          );
        })}
      </div>

      {/* Encabezado del módulo seleccionado */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px 24px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 26,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              {selected.title}
            </h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px 20px',
              fontSize: 14,
            }}
          >
            {teacher && (
              <span style={{ color: '#e2e8f0' }}>Material de {teacher}</span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                fontSize: 13,
              }}
            >
              <Lock size={14} strokeWidth={1.9} color="#f5c842" aria-hidden="true" />
              Solo lectura · sin descarga · exclusivo de Centum Astra
            </span>
          </div>
        </div>
      )}

      {/* Lista de clases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.length > 0 ? (
          sessions.map((session, i) => (
            <ClassRow
              key={session.id}
              session={session}
              index={i}
              status={statuses[i]}
              canDownload={canDownload}
              videos={videosParaSesion(i, sessions.length, videosDeModulo)}
              pdfsExtra={pdfsExtraPorSesion[session.id] || []}
              videosExtra={videosExtraPorSesion[session.id] || []}
              onVerPdf={handleVerPdf}
              onVerVideo={handleVerVideo}
              onEntrarQuiz={handleEntrarQuiz}
            />
          ))
        ) : (
          <p
            style={{
              margin: 0,
              padding: '32px 0',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
            }}
          >
            Este módulo aún no tiene clases publicadas.
          </p>
        )}
      </div>
    </div>
  );
}
