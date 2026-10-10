// Material (maestro/admin). Implementa `mockups/Maestro-Material.dc.html`.
// HANDOFF:
//  - Maestro/admin SÍ pueden descargar, subir y eliminar.
//  - El alumno ve lo mismo pero sin acciones de gestión (otro flujo).
//  - Mantener consistencia visual con `Modulos.jsx` del alumno (clases colapsables).
import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus, Upload, Eye } from 'lucide-react';
import { mockModules, mockSessionsByModule, mockVideos } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useMaterial } from '../../context/MaterialContext';
import { puedeDescargarPdf } from '../../config/rediseno';
import IconSubject from '../../components/rediseno/IconSubject';
import PdfCard from '../../components/rediseno/PdfCard';
import VideoCard from '../../components/rediseno/VideoCard';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import ModalRecurso from '../../components/rediseno/ModalRecurso';
import ModalClase from '../../components/rediseno/ModalClase';

const SUBJECT_BY_ICON = {
  Sigma: 'math',
  Book: 'reading',
  PenTool: 'writing',
  Stethoscope: 'premed',
  HeartPulse: 'health',
};

// TODO(rediseno): tabla real que vincule video→clase.
function videosParaSesion(sesionIndex, totalSesiones, videosDeModulo) {
  if (!videosDeModulo.length || totalSesiones === 0) return [];
  const videosPorSesion = Math.ceil(videosDeModulo.length / totalSesiones);
  const start = sesionIndex * videosPorSesion;
  return videosDeModulo.slice(start, start + videosPorSesion);
}

function ClaseCard({
  session,
  index,
  canDownload,
  pdfsExtra,
  videos,
  videosExtra,
  onEditar,
  onSubirRecurso,
  onVerPdf,
  onDescargarPdf,
  onEliminarPdfExtra,
  onVerVideo,
  onEliminarVideo,
  onEliminarVideoExtra,
}) {
  const [expanded, setExpanded] = useState(false);
  const pdfBase = (session.resources || []).filter(r => r.type === 'pdf');
  const pdfResources = [...pdfBase, ...pdfsExtra];
  const videosTodos = [...videos, ...videosExtra];
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
        borderRadius: 16,
        background: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header de la clase (clickeable para expandir/contraer) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 20px',
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          aria-controls={`clase-${session.id}-material`}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 0,
            minHeight: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flex: '0 0 44px',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: '#0c1d45',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: '#ffffff',
            }}
          >
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.3,
                color: '#ffffff',
              }}
            >
              {session.label}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              {resumen}
            </p>
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
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar clase ${index + 1}`}
          style={{
            flex: '0 0 44px',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
            borderRadius: 10,
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
        >
          <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <div
          id={`clase-${session.id}-material`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '0 20px 18px',
          }}
        >
          {totalRecursos === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Esta clase todavía no tiene material.
            </p>
          )}
          {pdfBase.map((r, i) => (
            <PdfCard
              key={`${session.id}-pdfbase-${i}`}
              nombre={r.name}
              tamano={r.size}
              onVer={() => onVerPdf(r)}
              canDownload={canDownload}
              onDescargar={canDownload ? () => onDescargarPdf(r) : undefined}
            />
          ))}
          {pdfsExtra.map(r => (
            <PdfCard
              key={`${session.id}-pdfex-${r.id}`}
              nombre={r.name}
              tamano={r.size}
              onVer={() => onVerPdf(r)}
              canDownload={canDownload}
              onDescargar={canDownload ? () => onDescargarPdf(r) : undefined}
              onEliminar={canDownload ? () => onEliminarPdfExtra(r) : undefined}
            />
          ))}
          {videos.map(v => (
            <VideoCard
              key={`${session.id}-videobase-${v.id}`}
              titulo={v.title}
              duracion={v.duration}
              instructor={v.instructor}
              onVer={() => onVerVideo(v)}
              canManage={canDownload}
              onEliminar={canDownload ? () => onEliminarVideo(v) : undefined}
            />
          ))}
          {videosExtra.map(v => (
            <VideoCard
              key={`${session.id}-videoex-${v.id}`}
              titulo={v.title}
              duracion={v.duration}
              instructor={v.instructor}
              onVer={() => onVerVideo(v)}
              canManage={canDownload}
              onEliminar={canDownload ? () => onEliminarVideoExtra(v) : undefined}
            />
          ))}
          {canDownload && (
            <BotonSecundario
              type="button"
              onClick={() => onSubirRecurso(session)}
              aria-label={`Subir recurso a ${session.label}`}
              style={{ alignSelf: 'flex-start' }}
            >
              <Upload size={16} strokeWidth={1.9} /> Subir recurso
            </BotonSecundario>
          )}
        </div>
      )}
    </section>
  );
}

export default function Material({ defaultModuleId = null }) {
  const { user } = useAuth();
  const canDownload = puedeDescargarPdf(user?.role);
  const {
    clasesExtraPorModulo,
    pdfsExtraPorSesion,
    videosExtraPorSesion,
    agregarClase,
    agregarPdf,
    agregarVideo,
    eliminarPdf,
    eliminarVideo,
  } = useMaterial();

  const [selectedId, setSelectedId] = useState(() => {
    if (defaultModuleId && mockModules.some(m => m.id === defaultModuleId)) {
      return defaultModuleId;
    }
    return mockModules[0]?.id ?? null;
  });
  const [modalRecursoAbierto, setModalRecursoAbierto] = useState(false);
  const [modalClaseAbierto, setModalClaseAbierto] = useState(false);
  const [sesionActivaId, setSesionActivaId] = useState(null);

  const selected = mockModules.find(m => m.id === selectedId) || mockModules[0];
  const sessions = useMemo(() => {
    const base = (mockSessionsByModule[selected?.id] || []).filter(s => s.visible !== false);
    const extras = clasesExtraPorModulo[selected?.id] || [];
    return [...base, ...extras];
  }, [selected?.id, clasesExtraPorModulo]);
  const videosDeModulo = useMemo(
    () => mockVideos.filter(v => v.subject === selected?.title),
    [selected?.title],
  );
  const subjectKey = SUBJECT_BY_ICON[selected?.icon];

  const sesionActiva = sessions.find(s => s.id === sesionActivaId) || null;

  function handleAbrirSubir(session) {
    setSesionActivaId(session.id);
    setModalRecursoAbierto(true);
  }

  function handleGuardarRecurso({ tipo, data, enVideoteca }) {
    if (!sesionActivaId) return;
    if (tipo === 'pdf') {
      agregarPdf(sesionActivaId, data);
    } else {
      agregarVideo(sesionActivaId, data, { enVideoteca, subject: selected?.title });
    }
  }

  function handleGuardarClase(label) {
    if (!selected) return;
    agregarClase(selected.id, label);
  }

  // Visor PDF/video queda como TODO(rediseno): sin backend.
  function noOp() {
    // Pendiente: visor embebido y edición.
  }

  return (
    <div
      className="scrollbar-hide bg-fondo-app"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        color: '#cbd5e1',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px 24px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' }}>
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
            Material
          </h1>
          {selected && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 999,
                border: '1.5px solid #f5c842',
                background: 'rgba(245,200,66,0.1)',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {subjectKey ? (
                <IconSubject name={subjectKey} size={20} strokeWidth={1.7} color="#f5c842" />
              ) : null}
              {selected.title}
            </span>
          )}
        </div>
        <BotonPrimario
          onClick={() => setModalClaseAbierto(true)}
          aria-label="Agregar nueva clase"
        >
          <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
          Nueva clase
        </BotonPrimario>
      </header>

      {/* Selector de materias (consistente con Modulos del alumno) */}
      <div aria-label="Materias" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {mockModules.map(mod => {
          const active = mod.id === selected?.id;
          const key = SUBJECT_BY_ICON[mod.icon];
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedId(mod.id)}
              aria-current={active ? 'true' : undefined}
              style={{
                flex: '1 1 150px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '14px 10px',
                borderRadius: 14,
                border: active ? '1.5px solid #f5c842' : '1.5px solid rgba(255,255,255,0.13)',
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
              {key ? (
                <IconSubject
                  name={key}
                  size={26}
                  strokeWidth={1.6}
                  color={active ? '#f5c842' : 'currentColor'}
                />
              ) : null}
              <span>{mod.title}</span>
            </button>
          );
        })}
      </div>

      {/* Recordatorio */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          fontSize: 14,
          color: '#e2e8f0',
        }}
      >
        <Eye size={16} strokeWidth={1.8} color="#f5c842" aria-hidden="true" />
        Tus alumnos lo ven en solo lectura, sin descarga.
      </div>

      {/* Lista de clases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.length > 0 ? (
          sessions.map((session, i) => (
            <ClaseCard
              key={session.id}
              session={session}
              index={i}
              canDownload={canDownload}
              pdfsExtra={pdfsExtraPorSesion[session.id] || []}
              videos={videosParaSesion(i, sessions.length, videosDeModulo)}
              videosExtra={videosExtraPorSesion[session.id] || []}
              onEditar={noOp}
              onSubirRecurso={handleAbrirSubir}
              onVerPdf={noOp}
              onDescargarPdf={noOp}
              onEliminarPdfExtra={(r) => eliminarPdf(session.id, r.id)}
              onVerVideo={noOp}
              onEliminarVideo={noOp}
              onEliminarVideoExtra={(v) => eliminarVideo(session.id, v.id)}
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

      <ModalRecurso
        abierto={modalRecursoAbierto}
        onCerrar={() => setModalRecursoAbierto(false)}
        onSubmit={handleGuardarRecurso}
        nombreClase={sesionActiva?.label}
        nombreMateria={selected?.title}
      />
      <ModalClase
        abierto={modalClaseAbierto}
        onCerrar={() => setModalClaseAbierto(false)}
        onSubmit={handleGuardarClase}
        nombreMateria={selected?.title}
      />
    </div>
  );
}
