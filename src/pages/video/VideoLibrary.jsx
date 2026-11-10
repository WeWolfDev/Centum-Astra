import { useMemo, useState } from 'react';
import { Upload, X, Search } from 'lucide-react';
import { mockVideos } from '../../data/mockData';
import { useMaterial } from '../../context/MaterialContext';
import { useAuth } from '../../context/AuthContext';
import Pastilla from '../../components/rediseno/Pastilla';
import IconSubject from '../../components/rediseno/IconSubject';

// Catálogo de materias en el orden del mockup Alumno-Videoteca.dc.html
const SUBJECTS = [
  { id: 'Pensamiento Matemático', icon: 'math',    tono: 'materia-math',    color: 'rgb(var(--c-info))' },
  { id: 'Comprensión Lectora',    icon: 'reading', tono: 'materia-reading', color: 'rgb(var(--c-materia-morado))' },
  { id: 'Redacción Indirecta',    icon: 'writing', tono: 'materia-writing', color: 'rgb(var(--c-materia-verde))' },
  { id: 'Pre-medicina',           icon: 'premed',  tono: 'materia-premed',  color: 'rgb(var(--c-materia-turquesa))' },
  { id: 'Ciencias de la Salud',   icon: 'health',  tono: 'materia-health',  color: 'rgb(var(--c-materia-cian))' },
];

const SUBJECT_BY_ID = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));

// Icono de rejilla ("Todas") del mockup.
const ALL_ICON = 'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z';

function UploadVideoModal({ onClose, onUpload }) {
  const { user } = useAuth();
  const [title, setTitle]       = useState('');
  const [subject, setSubject]   = useState(SUBJECTS[0].id);
  const [duration, setDuration] = useState('');
  const [fileName, setFileName] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onUpload({
      id: Date.now(),
      title: title.trim(),
      subject,
      instructor: user?.name || '—',
      duration: duration || '—',
      views: '0',
      thumbnail: 'PM',
      date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subir sesión"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgb(var(--c-void) / 0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgb(var(--c-navy))',
          border: '1px solid rgb(var(--c-ink) / 0.08)',
          borderRadius: 16,
          padding: '28px 24px',
          color: 'rgb(var(--c-ink) / 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 20,
              color: 'rgb(var(--c-ink))',
              lineHeight: 1.2,
            }}>Subir sesión</h3>
            <p style={{ margin: '4px 0 0', color: 'rgb(var(--c-ink) / 0.6)', fontSize: 13 }}>
              Agrega una nueva sesión grabada
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 10,
              background: 'rgb(var(--c-ink) / 0.05)',
              border: '1px solid rgb(var(--c-ink) / 0.1)',
              color: 'rgb(var(--c-ink) / 0.8)', cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '22px 16px', borderRadius: 12, cursor: 'pointer', marginBottom: 16,
          border: '1.5px dashed rgb(var(--c-gold-bright) / 0.35)',
          background: 'rgb(var(--c-ink) / 0.03)',
          minHeight: 110,
        }}>
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept="video/*,.mp4,.mov,.avi"
            aria-label="Archivo de video"
          />
          <Upload size={22} aria-hidden="true" style={{ color: 'rgb(var(--c-gold-bright))' }} />
          <p style={{ margin: 0, color: 'rgb(var(--c-ink) / 0.9)', fontSize: 13, textAlign: 'center' }}>
            {fileName || 'Selecciona el archivo de video'}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--c-ink) / 0.6)', fontSize: 11 }}>MP4 · MOV · AVI</p>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', color: 'rgb(var(--c-ink) / 0.6)', fontSize: 12, marginBottom: 6 }}>Título de la sesión *</span>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Clase 5 — Álgebra lineal"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgb(var(--c-ink) / 0.05)',
                border: '1px solid rgb(var(--c-ink) / 0.13)',
                borderRadius: 10, padding: '12px 14px',
                color: 'rgb(var(--c-ink))', fontSize: 14, outline: 'none',
                minHeight: 44,
              }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <label>
              <span style={{ display: 'block', color: 'rgb(var(--c-ink) / 0.6)', fontSize: 12, marginBottom: 6 }}>Materia</span>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgb(var(--c-ink) / 0.05)',
                  border: '1px solid rgb(var(--c-ink) / 0.13)',
                  borderRadius: 10, padding: '12px 14px',
                  color: 'rgb(var(--c-ink))', fontSize: 14, outline: 'none',
                  minHeight: 44,
                }}
              >
                {SUBJECTS.map(s => (
                  <option key={s.id} value={s.id} style={{ background: 'rgb(var(--c-navy))' }}>{s.id}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ display: 'block', color: 'rgb(var(--c-ink) / 0.6)', fontSize: 12, marginBottom: 6 }}>Duración</span>
              <input
                type="text" value={duration} onChange={e => setDuration(e.target.value)}
                placeholder="45:00"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgb(var(--c-ink) / 0.05)',
                  border: '1px solid rgb(var(--c-ink) / 0.13)',
                  borderRadius: 10, padding: '12px 14px',
                  color: 'rgb(var(--c-ink))', fontSize: 14, outline: 'none',
                  minHeight: 44,
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="btn-gold"
            style={{ flex: 1, minHeight: 44, opacity: title.trim() ? 1 : 0.5 }}
          >
            Publicar sesión
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ minHeight: 44 }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  const meta = SUBJECT_BY_ID[video.subject];
  return (
    <button
      type="button"
      onClick={() => onClick(video)}
      aria-label={`Reproducir ${video.title}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        color: 'rgb(var(--c-ink) / 0.8)',
        cursor: 'pointer',
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 16,
          background: 'rgb(var(--c-navy))',
          overflow: 'hidden',
        }}
      >
        {meta && (
          <IconSubject
            name={meta.icon}
            size={undefined}
            strokeWidth={0.7}
            color="rgb(var(--c-ink) / 0.16)"
            style={{
              position: 'absolute',
              right: '4%',
              top: '8%',
              height: '84%',
              width: 'auto',
            }}
          />
        )}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 60, height: 60,
            marginLeft: -30, marginTop: -30,
            borderRadius: 999,
            background: 'rgb(var(--c-gold-fill))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 2.5v11l9-5.5z" fill="rgb(var(--c-on-gold))" />
          </svg>
        </span>
        <span
          style={{
            position: 'absolute',
            right: 12, bottom: 12,
            padding: '3px 9px',
            borderRadius: 6,
            background: 'rgb(var(--c-void) / 0.85)',
            color: 'rgb(var(--c-ink))',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {video.duration}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize: 17, fontWeight: 600, lineHeight: 1.3,
          color: 'rgb(var(--c-ink))',
        }}
      >
        {video.title}
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', gap: '6px 10px',
          fontSize: 13,
          color: 'rgb(var(--c-ink) / 0.6)',
        }}
      >
        {meta ? (
          <Pastilla tono={meta.tono}>{video.subject}</Pastilla>
        ) : (
          <Pastilla tono="neutral">{video.subject}</Pastilla>
        )}
        <span>{video.instructor}</span>
      </div>
    </button>
  );
}

export default function VideoLibrary() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'teacher';
  const { videosDeVideoteca } = useMaterial();

  const [videosLocales, setVideosLocales] = useState(mockVideos);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [showUpload, setShowUpload] = useState(false);

  // Combina los videos del mock base + los subidos por el maestro + los locales (modal legacy).
  const videos = useMemo(
    () => [...videosDeVideoteca, ...videosLocales],
    [videosDeVideoteca, videosLocales],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter(v => {
      const matchFilter = filter === 'all' || v.subject === filter;
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        (v.instructor || '').toLowerCase().includes(q)
      );
    });
  }, [videos, filter, search]);

  function handleUpload(video) {
    setVideosLocales(prev => [video, ...prev]);
  }

  function handleOpenVideo(/* video */) {
    // TODO(rediseno): player real. Por ahora no abrimos modal/placeholder visible.
  }

  const conteo = `${filtered.length} ${filtered.length === 1 ? 'sesión grabada' : 'sesiones grabadas'}`;

  return (
    <div
      className="scrollbar-hide bg-fondo-app"
      style={{
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {showUpload && (
        <UploadVideoModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}

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
        <h1
          style={{
            margin: 0,
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'rgb(var(--c-ink))',
          }}
        >
          Videoteca
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: '0 1 320px',
              minWidth: 220,
              boxSizing: 'border-box',
              minHeight: 48,
              padding: '0 16px',
              border: '1px solid rgb(var(--c-ink) / 0.2)',
              borderRadius: 999,
              background: 'rgb(var(--c-navy) / 0.5)',
            }}
          >
            <Search size={20} strokeWidth={1.8} aria-hidden="true" style={{ color: 'rgb(var(--c-ink) / 0.8)', flexShrink: 0 }} />
            <input
              type="search"
              aria-label="Buscar sesión"
              placeholder="Buscar tema o profesor"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                height: 44,
                border: 0,
                background: 'transparent',
                color: 'rgb(var(--c-ink) / 0.9)',
                font: 'inherit',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {isStaff && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="btn-gold"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44 }}
            >
              <Upload size={16} strokeWidth={2} aria-hidden="true" />
              Subir sesión
            </button>
          )}
        </div>
      </header>

      {/* Chips de materia */}
      <div
        role="group"
        aria-label="Filtrar por materia"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {[{ id: 'all', label: 'Todas', iconPath: ALL_ICON }, ...SUBJECTS.map(s => ({
          id: s.id, label: s.id, iconPath: null, icon: s.icon,
        }))].map(c => {
          const on = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              aria-pressed={on}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 48,
                padding: '8px 16px',
                borderRadius: 999,
                border: `1.5px solid ${on ? 'rgb(var(--c-gold-bright))' : 'rgb(var(--c-ink) / 0.13)'}`,
                background: on ? 'rgb(var(--c-gold-bright) / 0.1)' : 'rgb(var(--c-ink) / 0.04)',
                color: on ? 'rgb(var(--c-ink))' : 'rgb(var(--c-ink) / 0.8)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {c.iconPath ? (
                <svg
                  width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke={on ? 'rgb(var(--c-gold-bright))' : 'rgb(var(--c-ink) / 0.8)'}
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={c.iconPath} />
                </svg>
              ) : (
                <IconSubject
                  name={c.icon}
                  size={20}
                  color={on ? 'rgb(var(--c-gold-bright))' : 'rgb(var(--c-ink) / 0.8)'}
                />
              )}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Conteo */}
      <div style={{ fontSize: 14, color: 'rgb(var(--c-ink) / 0.8)' }}>{conteo}</div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '28px 24px',
        }}
      >
        {filtered.map(video => (
          <VideoCard key={video.id} video={video} onClick={handleOpenVideo} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'rgb(var(--c-ink) / 0.6)',
            fontSize: 15,
          }}
        >
          No se encontraron sesiones con esos filtros.
        </div>
      )}
    </div>
  );
}
