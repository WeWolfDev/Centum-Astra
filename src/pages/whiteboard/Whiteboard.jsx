import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { mockModules } from '../../data/mockData';

const COLORS = ['#ffffff', '#fbbf24', '#60a5fa', '#34d399', '#f87171', '#c084fc', '#fb923c'];
const TOOLS = [
  { id: 'pen',    icon: '✏️', label: 'Pluma' },
  { id: 'eraser', icon: '◻️', label: 'Borrador' },
  { id: 'line',   icon: '╱',  label: 'Línea' },
  { id: 'rect',   icon: '□',  label: 'Rectángulo' },
  { id: 'circle', icon: '○',  label: 'Círculo' },
];

function ExportModal({ onClose, onExport }) {
  const [moduleId, setModuleId] = useState(1);
  const [done, setDone]         = useState(false);

  function handleExport() {
    onExport(moduleId);
    setDone(true);
    setTimeout(onClose, 2200);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(3,10,26,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        style={{ width: '100%', maxWidth: 380, padding: '28px 24px' }}
      >
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>✓</div>
            <p style={{ color: '#34d399', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Descarga completada</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              La pizarra se descargó como PNG en tu equipo.
            </p>
          </motion.div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Enviar pizarra a módulo</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              Selecciona el módulo al que deseas enviar esta sesión. La pizarra se guardará como recurso de apoyo visual.
            </p>
            <select
              value={moduleId}
              onChange={e => setModuleId(parseInt(e.target.value))}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '10px 14px', color: 'white', fontSize: 13,
                marginBottom: 22, outline: 'none',
              }}
            >
              {mockModules.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#0c1d45' }}>
                  {m.icon} {m.title}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                className="btn-gold"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <Send size={14} /> Enviar
              </motion.button>
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function Whiteboard({ onExportToModule }) {
  const canvasRef   = useRef(null);
  const [drawing,   setDrawing]   = useState(false);
  const [tool,      setTool]      = useState('pen');
  const [color,     setColor]     = useState('#ffffff');
  const [size,      setSize]      = useState(3);
  const [startPos,  setStartPos]  = useState(null);
  const [showExport,setShowExport]= useState(false);
  const snapshotRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#0a1a4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: (touch ? touch.clientX : e.clientX) - rect.left,
      y: (touch ? touch.clientY : e.clientY) - rect.top,
    };
  };

  const startDraw = useCallback((e) => {
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    const ctx = canvasRef.current.getContext('2d');
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    }
  }, [tool]);

  const draw = useCallback((e) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineWidth = tool === 'eraser' ? size * 5 : size;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#0a1a4a' : color;
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (startPos) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.lineWidth = size; ctx.strokeStyle = color; ctx.fillStyle = color + '20';
      if (tool === 'line') {
        ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
      } else if (tool === 'rect') {
        ctx.beginPath(); ctx.rect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
        ctx.fill(); ctx.stroke();
      } else if (tool === 'circle') {
        const r = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
        ctx.beginPath(); ctx.arc(startPos.x, startPos.y, r, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
      }
    }
  }, [drawing, tool, color, size, startPos]);

  const endDraw = useCallback(() => { setDrawing(false); setStartPos(null); }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a1a4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  function downloadCanvas() {
    const link = document.createElement('a');
    link.download = 'centum-pizarra.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  function handleExport(moduleId) {
    downloadCanvas();
    if (onExportToModule) {
      const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      onExportToModule(moduleId, {
        name: `Pizarra — Sesión ${date}`,
        ext: 'PNG',
        size: '—',
        type: 'pdf',
      });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} onExport={handleExport} />
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex-wrap"
      >
        {/* Tools */}
        <div className="flex gap-1.5">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-all border
                ${tool === t.id
                  ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-white/10" />

        {/* Colors */}
        <div className="flex gap-1.5 items-center">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all border-2
                ${color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-white/10" />

        {/* Size */}
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">Tamaño</span>
          <input
            type="range" min="1" max="20" value={size}
            onChange={e => setSize(parseInt(e.target.value))}
            className="w-24 accent-amber-400 cursor-pointer"
          />
          <span className="text-white/60 text-xs w-4">{size}</span>
        </div>

        <div className="ml-auto flex gap-2">
          <motion.button
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowExport(true)}
            className="btn-gold text-xs py-2 px-3"
            style={{ gap: 5, display: 'flex', alignItems: 'center' }}
          >
            <Send size={12} /> Enviar a módulo
          </motion.button>
          <button onClick={clearCanvas} className="btn-ghost text-xs py-2 px-3">🗑 Limpiar</button>
          <button onClick={downloadCanvas} className="btn-ghost text-xs py-2 px-3">↓ Guardar</button>
        </div>
      </motion.div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none">
          Herramienta: {TOOLS.find(t => t.id === tool)?.label} · Color: <span style={{ color }}>{color}</span>
        </div>
      </div>
    </div>
  );
}
