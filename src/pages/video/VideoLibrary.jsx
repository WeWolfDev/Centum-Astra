import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { mockVideos } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const SUBJECTS = ['Pensamiento Matemático', 'Comprensión Lectora', 'Redacción Indirecta', 'Pre-medicina', 'Ciencias de la Salud'];

const subjectColors = {
  'Pensamiento Matemático': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Comprensión Lectora': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Redacción Indirecta': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Pre-medicina': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Ciencias de la Salud': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const thumbColors = {
  'PM': 'from-blue-600 to-blue-800',
  'CL': 'from-purple-600 to-purple-800',
  'RI': 'from-emerald-600 to-emerald-800',
  'CS': 'from-cyan-600 to-cyan-800',
};

const subjectThumb = {
  'Pensamiento Matemático': 'PM',
  'Comprensión Lectora': 'CL',
  'Redacción Indirecta': 'RI',
  'Pre-medicina': 'CS',
  'Ciencias de la Salud': 'CS',
};

function UploadVideoModal({ onClose, onUpload }) {
  const { user } = useAuth();
  const [title, setTitle]       = useState('');
  const [subject, setSubject]   = useState(SUBJECTS[0]);
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
      instructor: user.name,
      duration: duration || '—',
      views: '0',
      thumbnail: subjectThumb[subject] || 'PM',
    });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(3,10,26,0.82)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        style={{ width: '100%', maxWidth: 420, padding: '28px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Subir sesión</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Agrega una nueva sesión grabada</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* File picker */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '22px 16px', borderRadius: 12, cursor: 'pointer', marginBottom: 16,
          border: '2px dashed rgba(245,200,66,0.2)', background: 'rgba(245,200,66,0.02)',
        }}>
          <input type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="video/*,.mp4,.mov,.avi" />
          <Upload size={22} style={{ color: '#f5c842', opacity: 0.7 }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
            {fileName ? `🎬 ${fileName}` : 'Selecciona el archivo de video'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>MP4 · MOV · AVI</p>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 5 }}>Título de la sesión *</p>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Clase 5 — Álgebra lineal"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 5 }}>Materia</p>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none' }}
              >
                {SUBJECTS.map(s => <option key={s} value={s} style={{ background: '#0c1d45' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginBottom: 5 }}>Duración</p>
              <input
                type="text" value={duration} onChange={e => setDuration(e.target.value)}
                placeholder="45:00"
                style={{ width: 80, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!title.trim()}
            className="btn-gold" style={{ flex: 1, opacity: title.trim() ? 1 : 0.4 }}
          >
            Publicar sesión
          </motion.button>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
}

function VideoCard({ video, onClick, isActive }) {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
      onClick={() => onClick(video)}
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-2xl',
        'bg-white/5 backdrop-blur-xl border transition-colors duration-300',
        isActive ? 'border-yellow-500/50' : 'border-white/10 hover:border-yellow-500/30',
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(245,200,66,0.07)_0%,transparent_65%)] z-10" />
      <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/35 to-transparent z-10" />
      {/* Thumbnail */}
      <div className={`relative z-[1] h-40 bg-gradient-to-br ${thumbColors[video.thumbnail] || 'from-slate-600 to-slate-800'} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
        >
          <span className="text-2xl ml-1">▶</span>
        </motion.div>
        <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-md">
          {video.duration}
        </span>
      </div>

      <div className="relative z-[1]" style={{ padding: '16px 18px' }}>
        <span className={`badge border ${subjectColors[video.subject] || 'bg-white/10 text-white/50'} text-[10px]`} style={{ marginBottom: 8, display: 'inline-block' }}>
          {video.subject}
        </span>
        <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13.5, fontWeight: 700, lineHeight: 1.45, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.38)' }}>
          <span>{video.instructor}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {video.views}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function VideoModal({ video, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl p-6"
      >
        <div className={`h-72 rounded-xl bg-gradient-to-br ${thumbColors[video.thumbnail] || 'from-slate-600 to-slate-800'} flex items-center justify-center mb-5`}>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 mx-auto mb-3">
              <span className="text-4xl ml-1">▶</span>
            </div>
            <p className="text-white/70 text-sm">[Vista previa · Conectar a Zoom/Drive]</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{video.title}</h2>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className={`badge border ${subjectColors[video.subject] || ''}`}>{video.subject}</span>
          <span className="text-white/40 text-sm">{video.instructor}</span>
          <span className="text-white/40 text-sm">⏱ {video.duration}</span>
          <span className="text-white/40 text-sm">👁 {video.views} vistas</span>
        </div>

        <div className="flex gap-3">
          <button className="btn-gold text-sm flex-1">Reproducir</button>
          <button onClick={onClose} className="btn-ghost text-sm">Cerrar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VideoLibrary() {
  const { user } = useAuth();
  const isStaff = user.role === 'admin' || user.role === 'teacher';

  const [videos, setVideos]         = useState(mockVideos);
  const [activeVideo, setActiveVideo] = useState(null);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const subjects = ['all', ...new Set(videos.map(v => v.subject))];

  const filtered = videos.filter(v => {
    const matchFilter = filter === 'all' || v.subject === filter;
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.instructor.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function handleUpload(video) {
    setVideos(prev => [video, ...prev]);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto scrollbar-hide max-h-[calc(100vh-4rem)]">
      {showUpload && (
        <UploadVideoModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="section-divider" style={{ marginBottom: 6 }}>
              <h3>Videoteca de Sesiones</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12.5 }}>
              <span className="font-syne text-[18px] font-bold leading-none tracking-tight bg-gradient-to-br from-yellow-200 via-[#f5c842] to-amber-500/80 bg-clip-text text-transparent">{videos.length}</span>
              <span style={{ marginLeft: 6 }}>sesiones grabadas · {new Set(videos.map(v => v.subject)).size} materias</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Buscar sesión..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/40 w-48 sm:w-56"
            />
            {isStaff && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUpload(true)}
                className="btn-gold flex items-center gap-[7px]"
              >
                <Upload size={14} strokeWidth={2} />
                Subir sesión
              </motion.button>
            )}
          </div>
        </div>

        {/* Subject filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border
                ${filter === s
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                }`}
            >
              {s === 'all' ? 'Todas las materias' : s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter + search}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <VideoCard
                video={video}
                onClick={setActiveVideo}
                isActive={activeVideo?.id === video.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p className="text-5xl mb-3">🎬</p>
          <p>No se encontraron videos</p>
        </div>
      )}

      <AnimatePresence>
        {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>
    </div>
  );
}
