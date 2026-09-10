import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { mockModules } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Target, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ── Constellation progress ring ───────────────────────── */
function ProgressHero({ value }) {
  const SIZE   = 200;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const R      = 82;
  const STROKE = 8;
  const circ   = 2 * Math.PI * R;
  const filled = circ * (value / 100);
  const gap    = circ - filled;

  // Tick marks at 25%, 50%, 75%
  const ticks = [25, 50, 75, 100].map(pct => {
    const angle = (pct / 100) * 360 - 90;
    const rad   = (angle * Math.PI) / 180;
    const x1 = CX + (R - 6) * Math.cos(rad);
    const y1 = CY + (R - 6) * Math.sin(rad);
    const x2 = CX + (R + 6) * Math.cos(rad);
    const y2 = CY + (R + 6) * Math.sin(rad);
    return { x1, y1, x2, y2, pct };
  });

  // Module completion dots around the ring
  const dots = mockModules.map((mod, i) => {
    const angle = (mod.progress / 100) * 360 * 0.5 + i * 72 - 90;
    const rad   = (angle * Math.PI) / 180;
    return {
      x: CX + (R + 22) * Math.cos(rad),
      y: CY + (R + 22) * Math.sin(rad),
      filled: mod.progress > 0,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="ring-hero"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8880f" />
            <stop offset="50%" stopColor="#f5c842" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer constellation dots */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.filled ? 3 : 1.5}
            fill={dot.filled ? '#f5c842' : 'rgba(255,255,255,0.2)'}
            opacity={dot.filled ? 0.9 : 0.4}
            filter={dot.filled ? 'url(#glow)' : undefined}
          />
        ))}

        {/* Track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={STROKE}
        />

        {/* Filled arc */}
        <motion.circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="url(#ringGold)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: gap }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${CX} ${CY})`}
          filter="url(#glow)"
        />

        {/* Tick marks */}
        {ticks.map(t => (
          <line
            key={t.pct}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={value >= t.pct ? 'rgba(245,200,66,0.5)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Center text */}
        <text
          x={CX} y={CY - 10}
          textAnchor="middle"
          fill="white"
          fontSize="36"
          fontWeight="700"
          fontFamily="Orbitron, sans-serif"
        >
          {value}
        </text>
        <text
          x={CX} y={CY + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="11"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          de 100 puntos
        </text>
      </svg>
    </div>
  );
}

/* ── Module card — space vs clinical treatment ──────────── */
const SPACE_COLORS = {
  blue:    { bar: 'linear-gradient(90deg,#1d4ed8,#60a5fa)' },
  purple:  { bar: 'linear-gradient(90deg,#7e22ce,#c084fc)' },
  emerald: { bar: 'linear-gradient(90deg,#065f46,#34d399)' },
};
const CLINICAL_STYLE = {
  bar: 'linear-gradient(90deg, #0d9488, #1de9b6, #b2f5e8)',
};

const MODULE_BG = {
  1: 'math.jpg',
  2: 'spanish.jpg',
  3: 'spanish.jpg',
  4: 'fernandozhiminaicela-face-mask-5042631_1920.jpg',
  5: 'fernandozhiminaicela-face-mask-5042631_1920.jpg',
};

function ModuleCard({ module, index, onNavigate }) {
  const isMedical = module.type === 'specific';
  const c = isMedical ? CLINICAL_STYLE : (SPACE_COLORS[module.color] || SPACE_COLORS.blue);
  const bgImage = MODULE_BG[module.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => onNavigate('modules', module.id)}
      className={cn(
        'group relative overflow-hidden rounded-2xl p-[18px] cursor-pointer',
        isMedical
          ? 'bg-[linear-gradient(145deg,rgba(4,30,27,0.7)_0%,rgba(2,14,12,0.5)_100%)] border border-teal-400/20 hover:border-teal-400/45 hover:shadow-card-teal'
          : 'bg-[linear-gradient(145deg,rgba(22,40,80,0.5)_0%,rgba(12,29,69,0.35)_100%)] border border-white/10 hover:border-yellow-500/30 hover:shadow-card-gold',
        'backdrop-blur-[12px] transition-colors duration-300',
      )}
    >
      {/* Radial hover glow */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        isMedical
          ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(29,233,182,0.09)_0%,transparent_65%)]'
          : 'bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]',
      )} />

      {/* Top shimmer line */}
      <div className={cn(
        'absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent to-transparent',
        isMedical ? 'via-teal-400/45' : 'via-yellow-500/35',
      )} />

      {/* Subject texture — all modules */}
      {bgImage && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${import.meta.env.BASE_URL}${bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center 35%',
          opacity: 0.06, borderRadius: 14,
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon + badge header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: isMedical ? 'rgba(29,233,182,0.1)' : 'rgba(245,200,66,0.08)',
            border: `1px solid ${isMedical ? 'rgba(29,233,182,0.2)' : 'rgba(245,200,66,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, lineHeight: 1,
          }}>
            {module.icon}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4,
            background: isMedical ? 'rgba(29,233,182,0.1)' : 'rgba(255,255,255,0.05)',
            color: isMedical ? '#5eead4' : 'rgba(255,255,255,0.38)',
            border: `1px solid ${isMedical ? 'rgba(29,233,182,0.18)' : 'rgba(255,255,255,0.07)'}`,
          }}>
            {module.type === 'transversal' ? 'Transversal' : 'Específico'}
          </span>
        </div>

        <p
          className="relative font-syne text-[13px] font-bold leading-snug tracking-[-0.01em] mb-1"
          style={{ color: isMedical ? '#e0faf6' : 'rgba(255,255,255,0.92)' }}
        >
          {module.title}
        </p>
        <p style={{ color: isMedical ? 'rgba(29,233,182,0.6)' : 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 14, letterSpacing: '0.01em' }}>
          {module.resources} recursos · {module.topics} temas
        </p>

        <div style={{ width: '100%', height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', borderRadius: 99, background: c.bar, width: `${module.progress}%`, transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>Progreso</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: isMedical ? 'rgba(29,233,182,0.7)' : 'rgba(255,255,255,0.45)' }}>{module.progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: '#0c1d45', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: 13,
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const RECENT_SCORES = [
  { name: 'Quiz 1', score: 75 },
  { name: 'Quiz 2', score: 82 },
  { name: 'Quiz 3', score: 68 },
  { name: 'Quiz 4', score: 90 },
  { name: 'Quiz 5', score: 85 },
];

const STATS = [
  { Icon: Target,   label: 'Quizzes',   val: '12/20' },
  { Icon: Flame,    label: 'Racha',      val: '5 días' },
  { Icon: BookOpen, label: 'Promedio',   val: '82%' },
];

export default function StudentDashboard({ setActiveSection }) {
  const { user } = useAuth();

  return (
    <div className="scrollbar-hide resp-padding" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 4rem)', position: 'relative' }}>

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative overflow-hidden rounded-2xl p-7 flex items-center justify-between flex-wrap gap-4 bg-white/5 backdrop-blur-xl border border-yellow-500/20 hover:border-yellow-500/35 transition-colors duration-300"
        style={{ zIndex: 1 }}
      >
        {/* Astronaut photo — hidden on mobile */}
        <div className="resp-hide-mobile" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, overflow: 'hidden', pointerEvents: 'none' }}>
          <img
            src={`${import.meta.env.BASE_URL}poldychromos-astronaut-6947813_1920.jpg`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', opacity: 0.32, display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(20,18,5,1) 0%, rgba(20,18,5,0.4) 50%, transparent 100%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-syne text-[22px] font-bold text-white mb-1.5 tracking-[-0.02em]"
          >
            Welcome, <span className="bg-gradient-to-br from-yellow-200 via-[#f5c842] to-amber-500/80 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
          </motion.h2>
          <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13.5 }}>
            Estás a <span style={{ color: '#f5c842', fontWeight: 700 }}>{100 - user.progress} puntos</span> de completar tu preparación.
          </p>
        </div>
        <button
          onClick={() => setActiveSection('exam')}
          className="btn-fill"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <span>Iniciar simulacro</span>
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-7 py-5 flex items-stretch flex-wrap"
        style={{ zIndex: 1 }}
      >
        {STATS.map(({ Icon, label, val }, i) => (
          <div key={label} className="flex items-stretch">
            {i > 0 && (
              <div className="w-px bg-white/[0.06] self-stretch mx-7" />
            )}
            <div style={{ flex: 1 }}>
              <p className="font-syne text-[32px] font-bold leading-none tracking-tight mb-1.5 bg-gradient-to-br from-yellow-200 via-[#f5c842] to-amber-500/80 bg-clip-text text-transparent">
                {val}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Icon size={11} strokeWidth={1.6} style={{ color: 'rgba(255,255,255,0.35)' }} />
                <p className="text-[11px] font-medium tracking-[0.04em] text-white/30 uppercase">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Progress ring + chart */}
      <div className="resp-grid-ring" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, zIndex: 1 }}>

        {/* Ring card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4"
        >
          <div className="section-divider" style={{ width: '100%', marginBottom: 0 }}>
            <h3>Progreso</h3>
          </div>
          <ProgressHero value={user.progress} />
        </motion.div>

        {/* Bar chart card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="section-divider" style={{ marginBottom: 16 }}>
            <h3>Resultados recientes</h3>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={RECENT_SCORES} barSize={28}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="score" fill="#f5c842" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Modules grid */}
      <div style={{ zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-divider" style={{ flex: 1, marginBottom: 0, marginRight: 16 }}>
            <h3>Mis módulos</h3>
          </div>
          <motion.button
            onClick={() => setActiveSection('modules')}
            whileHover={{ color: '#fde68a' }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f5c842', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            Ver todos <ChevronRight size={13} />
          </motion.button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
          {mockModules.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} onNavigate={setActiveSection} />
          ))}
        </div>
      </div>
    </div>
  );
}
