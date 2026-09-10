import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, BarChart2, Presentation, Lock,
  Upload, X, Plus, Eye, EyeOff, ChevronDown, ChevronRight, Play,
} from 'lucide-react';
import { mockModules, mockSessionsByModule, mockVideos } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { cn } from '../../lib/utils';

const typeIcon  = { pdf: FileText, xlsx: BarChart2, ppt: Presentation };
const typeColor = {
  pdf:  { bg: 'rgba(96,165,250,0.1)',  color: '#93c5fd', border: 'rgba(96,165,250,0.2)'  },
  xlsx: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  ppt:  { bg: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: 'rgba(248,113,113,0.2)' },
};

/* ── Upload modal ──────────────────────────────────────── */
function UploadModal({ moduleTitle, isMedical, onClose, onUpload }) {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    const sizeMB = file.size / (1024 * 1024);
    setFileSize(sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`);
    const ext = file.name.split('.').pop().toLowerCase();
    if (['xls', 'xlsx'].includes(ext)) setFileType('xlsx');
    else if (['ppt', 'pptx'].includes(ext)) setFileType('ppt');
    else setFileType('pdf');
  }

  const extLabel = { pdf: 'PDF', xlsx: 'Excel', ppt: 'PPT' };

  function handleSubmit() {
    if (!fileName.trim()) return;
    onUpload({ name: fileName, ext: extLabel[fileType], size: fileSize || '—', type: fileType });
    onClose();
  }

  const accent = isMedical
    ? { border: 'rgba(29,233,182,0.2)', color: '#1de9b6', active: 'rgba(29,233,182,0.1)', activeBorder: 'rgba(29,233,182,0.25)', activeText: '#5eead4' }
    : { border: 'rgba(245,200,66,0.2)', color: '#f5c842', active: 'rgba(245,200,66,0.1)', activeBorder: 'rgba(245,200,66,0.25)', activeText: '#f5c842' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(3,10,26,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        style={{ width: '100%', maxWidth: 440, padding: '32px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 3 }}>Subir material</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5 }}>{moduleTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '28px 20px', borderRadius: 12, cursor: 'pointer',
          border: `2px dashed ${accent.border}`, background: 'rgba(255,255,255,0.02)', marginBottom: 18,
        }}>
          <input type="file" style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.ppt,.pptx,.xls,.xlsx" />
          <Upload size={24} style={{ color: accent.color, opacity: 0.7 }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
            {fileName ? `📄 ${fileName}` : 'Haz clic para seleccionar un archivo'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>PDF · Excel · PowerPoint</p>
        </label>

        <div style={{ marginBottom: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 6 }}>Nombre del recurso</p>
          <input
            type="text" value={fileName} onChange={e => setFileName(e.target.value)}
            placeholder="Nombre del archivo..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['pdf', 'xlsx', 'ppt'].map(t => {
            const labels = { pdf: 'PDF', xlsx: 'Excel', ppt: 'PowerPoint' };
            const active = fileType === t;
            return (
              <button key={t} onClick={() => setFileType(t)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: active ? accent.active : 'rgba(255,255,255,0.04)',
                color: active ? accent.activeText : 'rgba(255,255,255,0.4)',
                border: `1px solid ${active ? accent.activeBorder : 'rgba(255,255,255,0.08)'}`,
                transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
              }}>{labels[t]}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={handleSubmit} disabled={!fileName.trim()}
            className="btn-gold" style={{ flex: 1, opacity: !fileName.trim() ? 0.4 : 1 }}
          >
            Publicar
          </motion.button>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Resource row ──────────────────────────────────────── */
function ResourceRow({ resource, isMedical, index, canDownload }) {
  const Icon  = typeIcon[resource.type] || FileText;
  const color = typeColor[resource.type] || typeColor.pdf;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 4, transition: { duration: 0.15 } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '11px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isMedical ? 'rgba(29,233,182,0.15)' : 'rgba(255,255,255,0.1)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: color.bg, border: `1px solid ${color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} strokeWidth={1.7} style={{ color: color.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: isMedical ? '#e0faf6' : 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resource.name}
        </p>
        <p style={{ color: isMedical ? 'rgba(29,233,182,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 }}>
          {resource.ext} · {resource.size}
        </p>
      </div>
      {canDownload ? (
        <button
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: isMedical ? 'rgba(29,233,182,0.08)' : 'rgba(255,255,255,0.05)',
            color: isMedical ? '#1de9b6' : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'color 0.12s ease', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = isMedical ? '#1de9b6' : 'rgba(255,255,255,0.3)'}
        >
          <Download size={13} strokeWidth={1.7} />
        </button>
      ) : (
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          title="Material exclusivo de sesión"
        >
          <Lock size={11} strokeWidth={1.7} style={{ color: 'rgba(255,255,255,0.18)' }} />
        </div>
      )}
    </motion.div>
  );
}

/* ── Video row (inside session) ────────────────────────── */
const thumbGradients = {
  PM: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  CL: 'linear-gradient(135deg, #581c87, #a855f7)',
  RI: 'linear-gradient(135deg, #064e3b, #10b981)',
  CS: 'linear-gradient(135deg, #134e4a, #14b8a6)',
};

function VideoRow({ video, index }) {
  const grad = thumbGradients[video.thumbnail] || thumbGradients.PM;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 10,
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={13} fill="rgba(255,255,255,0.9)" strokeWidth={0} style={{ color: 'white' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.title}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 1 }}>
          {video.duration} · {video.instructor}
        </p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(99,102,241,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
        REC
      </span>
    </motion.div>
  );
}

/* ── Session card ──────────────────────────────────────── */
function SessionCard({ session, isMedical, isStaff, canDownload, onToggleVisibility, onUpload }) {
  const [open, setOpen] = useState(true);
  const accentColor = isMedical ? '#5eead4' : '#f5c842';
  const accentBg    = isMedical ? 'rgba(29,233,182,0.08)' : 'rgba(245,200,66,0.08)';
  const accentBorder= isMedical ? 'rgba(29,233,182,0.22)' : 'rgba(245,200,66,0.22)';

  const isHidden = !session.visible;

  if (isHidden && !isStaff) return null;

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', marginBottom: 10,
      border: `1px solid ${isHidden ? 'rgba(255,255,255,0.06)' : accentBorder}`,
      background: isHidden ? 'rgba(255,255,255,0.01)' : accentBg,
      opacity: isHidden ? 0.55 : 1,
      transition: 'opacity 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: accentColor, flexShrink: 0, transition: 'transform 0.18s ease', display: 'flex' }}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span style={{ flex: 1, color: isHidden ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)', fontSize: 13.5, fontWeight: 600 }}>
          {session.label}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, flexShrink: 0 }}>
          {session.resources.length} {session.resources.length === 1 ? 'recurso' : 'recursos'}
        </span>
        {isStaff && (
          <button
            onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
            title={session.visible ? 'Ocultar a alumnos' : 'Revelar a alumnos'}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: session.visible ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
              color: session.visible ? '#34d399' : 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              marginLeft: 4,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {session.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        )}
        {isStaff && (
          <button
            onClick={e => { e.stopPropagation(); onUpload(); }}
            title="Subir archivo a esta clase"
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = accentColor}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <Plus size={13} />
          </button>
        )}
      </button>

      {/* Resources */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Resources */}
              {session.resources.length > 0 ? session.resources.map((r, i) => (
                <ResourceRow key={r.name + i} resource={r} isMedical={isMedical} index={i} canDownload={canDownload} />
              )) : (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12.5, padding: '4px 0' }}>
                  Sin archivos en esta clase aún.
                </p>
              )}

              {/* Session videos */}
              {(session.videoIds || []).length > 0 && (() => {
                const sessionVideos = (session.videoIds || [])
                  .map(id => mockVideos.find(v => v.id === id))
                  .filter(Boolean);
                if (sessionVideos.length === 0) return null;
                return (
                  <div style={{ marginTop: session.resources.length > 0 ? 8 : 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
                      Grabación de clase
                    </p>
                    {sessionVideos.map((v, i) => (
                      <VideoRow key={v.id} video={v} index={i} />
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── New section modal ─────────────────────────────────── */
function NewSectionModal({ isMedical, onClose, onCreate }) {
  const [label, setLabel] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(3,10,26,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        style={{ width: '100%', maxWidth: 420, padding: '28px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>Nueva sección de clase</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 6 }}>Nombre de la clase</p>
        <input
          autoFocus
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Ej. Clase extra: Repaso de ecuaciones"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none', marginBottom: 20,
          }}
          onKeyDown={e => { if (e.key === 'Enter' && label.trim()) { onCreate(label.trim()); onClose(); } }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => { if (label.trim()) { onCreate(label.trim()); onClose(); } }}
            disabled={!label.trim()}
            className="btn-gold"
            style={{ flex: 1, opacity: label.trim() ? 1 : 0.4 }}
          >
            Crear sección
          </motion.button>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main FileManager ──────────────────────────────────── */
export default function FileManager({ defaultModuleId }) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const isStaff = user.role === 'admin' || user.role === 'teacher';

  const [selectedModule, setSelectedModule] = useState(
    () => (defaultModuleId ? mockModules.find(m => m.id === defaultModuleId) : null) ?? mockModules[0],
  );

  const [sessionsMap, setSessionsMap] = useState(() => {
    const initial = {};
    mockModules.forEach(m => { initial[m.id] = (mockSessionsByModule[m.id] || []).map(s => ({ ...s })); });
    return initial;
  });

  const [uploadTarget, setUploadTarget] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);

  const isMedical = selectedModule.type === 'specific';
  const sessions  = sessionsMap[selectedModule.id] || [];

  function toggleVisibility(sessionId) {
    setSessionsMap(prev => ({
      ...prev,
      [selectedModule.id]: prev[selectedModule.id].map(s =>
        s.id === sessionId ? { ...s, visible: !s.visible } : s,
      ),
    }));
  }

  function addResourceToSession(sessionId, resource) {
    setSessionsMap(prev => ({
      ...prev,
      [selectedModule.id]: prev[selectedModule.id].map(s =>
        s.id === sessionId ? { ...s, resources: [...s.resources, resource] } : s,
      ),
    }));
  }

  function addExtraSection(label) {
    const newSession = {
      id: `${selectedModule.id}-extra-${Date.now()}`,
      label,
      visible: true,
      videoIds: [],
      resources: [],
    };
    setSessionsMap(prev => ({
      ...prev,
      [selectedModule.id]: [...(prev[selectedModule.id] || []), newSession],
    }));
  }

  const moduleSidebarStyle = (mod) => {
    const active = selectedModule.id === mod.id;
    const isMed  = mod.type === 'specific';
    if (active && isMed)  return { bg: 'rgba(29,233,182,0.08)',  border: 'rgba(29,233,182,0.22)',  color: '#5eead4' };
    if (active && !isMed) return { bg: 'rgba(245,200,66,0.08)', border: 'rgba(245,200,66,0.22)', color: '#f5c842' };
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' };
  };

  const visibleCount = sessions.filter(s => s.visible).length;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxHeight: 'calc(100vh - 4rem)', overflow: 'hidden' }}>

      {/* Upload modal */}
      {uploadTarget && (
        <UploadModal
          moduleTitle={`${selectedModule.title} — ${uploadTarget.label}`}
          isMedical={isMedical}
          onClose={() => setUploadTarget(null)}
          onUpload={(resource) => { addResourceToSession(uploadTarget.id, resource); setUploadTarget(null); }}
        />
      )}

      {/* New section modal */}
      {showNewSection && (
        <NewSectionModal
          isMedical={isMedical}
          onClose={() => setShowNewSection(false)}
          onCreate={addExtraSection}
        />
      )}

      {/* ── Module selector ── */}
      {isMobile ? (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          overflowX: 'auto', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.01)',
        }} className="scrollbar-hide">
          {mockModules.map(mod => {
            const active = selectedModule.id === mod.id;
            const isMed  = mod.type === 'specific';
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, fontSize: 12.5, fontWeight: 500,
                  background: active ? (isMed ? 'rgba(29,233,182,0.12)' : 'rgba(245,200,66,0.12)') : 'rgba(255,255,255,0.04)',
                  color: active ? (isMed ? '#5eead4' : '#f5c842') : 'rgba(255,255,255,0.45)',
                  border: `1px solid ${active ? (isMed ? 'rgba(29,233,182,0.28)' : 'rgba(245,200,66,0.28)') : 'rgba(255,255,255,0.08)'}`,
                  transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
                }}
              >
                <span style={{ fontSize: 15 }}>{mod.icon}</span>
                {mod.title}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{
          width: 224, flexShrink: 0, padding: '20px 12px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto', background: 'rgba(255,255,255,0.01)',
        }} className="scrollbar-hide">
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, padding: '0 8px', marginBottom: 12, letterSpacing: '0.02em' }}>
            Módulos
          </p>
          {mockModules.map(mod => {
            const s = moduleSidebarStyle(mod);
            const modSessions = sessionsMap[mod.id] || [];
            const totalResources = modSessions.reduce((acc, sess) => acc + sess.resources.length, 0);
            return (
              <motion.button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                whileHover={{ x: 3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  background: s.bg, border: `1px solid ${s.border}`, color: s.color,
                  marginBottom: 4, transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{mod.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</p>
                  <p style={{ fontSize: 10.5, opacity: 0.55, marginTop: 1 }}>{totalResources} archivos · {modSessions.length} clases</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 28 }} className="scrollbar-hide">

        {/* Module header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedModule.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border transition-colors duration-300',
              isMedical ? 'border-teal-400/20 hover:border-teal-400/35' : 'border-yellow-500/20 hover:border-yellow-500/35',
            )}
            style={{ padding: isMobile ? '16px' : '22px 24px', marginBottom: 20 }}
          >
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
              isMedical
                ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(29,233,182,0.07)_0%,transparent_65%)]'
                : 'bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]',
            )} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: isMedical ? 'rgba(29,233,182,0.12)' : 'rgba(245,200,66,0.12)',
                  border: `1px solid ${isMedical ? 'rgba(29,233,182,0.2)' : 'rgba(245,200,66,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>
                  {selectedModule.icon}
                </div>
                <div>
                  <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 3, fontFamily: 'Syne, sans-serif' }}>{selectedModule.title}</h2>
                  <p style={{ color: isMedical ? 'rgba(29,233,182,0.5)' : 'rgba(245,200,66,0.5)', fontSize: 12.5 }}>
                    {sessions.length} clases · {sessions.reduce((a, s) => a + s.resources.length, 0)} recursos
                    {isStaff && sessions.length > 0 && ` · ${visibleCount} visibles`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ width: 100, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, width: `${selectedModule.progress}%`,
                    background: isMedical ? 'linear-gradient(90deg, #0d9488, #1de9b6)' : 'linear-gradient(90deg, #b8880f, #f5c842)',
                  }} />
                </div>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{selectedModule.progress}%</span>

                {isStaff && (
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowNewSection(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 13px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <Plus size={12} /> Clase extra
                  </motion.button>
                )}
              </div>
            </div>

            {!isStaff && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <Lock size={12} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>
                  Los archivos son material exclusivo de sesión. La descarga está disponible solo para profesores y administradores.
                </p>
              </div>
            )}

            {isStaff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', width: 'fit-content' }}>
                <Eye size={11} style={{ color: '#34d399' }} />
                <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: 11 }}>
                  Usa <span style={{ color: '#34d399', fontWeight: 600 }}>el ojo</span> en cada clase para revelarla u ocultarla a los alumnos progresivamente.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sessions list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedModule.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {sessions.length > 0 ? sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isMedical={isMedical}
                isStaff={isStaff}
                canDownload={isStaff}
                onToggleVisibility={() => toggleVisibility(session.id)}
                onUpload={() => setUploadTarget(session)}
              />
            )) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>◎</p>
                <p style={{ fontSize: 14 }}>
                  {isStaff ? 'Sin clases aún. Crea la primera sección.' : 'Contenido próximamente.'}
                </p>
                {isStaff && (
                  <motion.button
                    whileHover={{ y: -1 }} onClick={() => setShowNewSection(true)}
                    style={{
                      marginTop: 12, padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
                      background: 'rgba(245,200,66,0.08)', color: '#f5c842',
                      border: '1px solid rgba(245,200,66,0.2)', fontSize: 13,
                    }}
                  >
                    + Crear primera clase
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
