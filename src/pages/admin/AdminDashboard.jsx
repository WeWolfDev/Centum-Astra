import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { mockStudents, mockStats } from '../../data/mockData';
import { cn } from '../../lib/utils';

const statCards = [
  { icon: Users,       label: 'Total alumnos',    key: 'totalStudents',  change: '+8%',  changeUp: true  },
  { icon: CheckCircle, label: 'Alumnos activos',   key: 'activeStudents', change: '+4%',  changeUp: true  },
  { icon: TrendingUp,  label: 'Progreso promedio', key: 'avgProgress',    change: '+12%', changeUp: true, suffix: '%' },
  { icon: TrendingUp,  label: 'Calificación media',key: 'avgScore',       change: '+5%',  changeUp: true, suffix: '%' },
];

function StatCard({ Icon, label, value, change, changeUp, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/30 transition-colors duration-300 p-[20px_22px]"
    >
      {/* Radial hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]" />
      {/* Top shimmer */}
      <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/35 to-transparent" />

      <div className="relative flex items-start justify-between mb-[14px]">
        {/* Icon badge */}
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-yellow-500/10 border border-yellow-500/15">
          <Icon size={16} strokeWidth={1.7} className="text-gold-bright" />
        </div>
        {/* Change badge */}
        <span className={cn(
          'text-[11px] font-semibold rounded-full px-2 py-0.5 border',
          changeUp
            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
            : 'bg-red-400/10 text-red-400 border-red-400/20',
        )}>
          {change}
        </span>
      </div>

      <p className="relative font-syne text-[28px] font-bold leading-none tracking-tight mb-1 bg-gradient-to-br from-yellow-200 via-gold-bright to-amber-500/80 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="relative text-[11px] font-medium tracking-[0.04em] text-white/30 uppercase">
        {label}
      </p>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const map = {
    aprobado: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)', label: 'Aprobado' },
    pendiente: { bg: 'rgba(245,200,66,0.1)', color: '#f5c842', border: 'rgba(245,200,66,0.2)', label: 'Pendiente' },
    rechazado: { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)', label: 'Rechazado' },
  };
  const s = map[status] || map.pendiente;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

export default function AdminDashboard() {
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');

  const filtered = mockStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const data = mockStats.overview;

  return (
    <div
      className="scrollbar-hide resp-padding relative"
      style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto', maxHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Dot-grid texture */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none bg-dot-grid bg-dot-32 opacity-100"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
          zIndex: 0,
        }}
      />

      {/* Stat cards */}
      <div className="resp-grid-4 relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, zIndex: 1 }}>
        {statCards.map((s, i) => (
          <StatCard
            key={s.key}
            Icon={s.icon}
            label={s.label}
            value={`${data[s.key]}${s.suffix || ''}`}
            change={s.change}
            changeUp={s.changeUp}
            index={i}
          />
        ))}
      </div>

      {/* Student table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/30 transition-colors duration-300 p-6"
        style={{ zIndex: 1 }}
      >
        {/* Radial hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]" />
        {/* Top shimmer */}
        <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/35 to-transparent" />

        {/* Table header controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div className="section-divider relative" style={{ flex: 1 }}>
            <h3>Alumnos</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar alumno"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'rgba(12,29,69,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 9, padding: '8px 14px 8px 34px', color: 'white',
                  fontSize: 13, outline: 'none', width: 200,
                }}
              />
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all','Todos'],['aprobado','Aprobados'],['pendiente','Pendientes']].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={cn(
                    'px-[13px] py-[7px] rounded-lg text-xs font-medium cursor-pointer transition-colors duration-[120ms]',
                    filterStatus === val
                      ? 'bg-yellow-500/[0.12] text-gold-bright border border-yellow-500/25'
                      : 'bg-white/[0.04] text-white/40 border border-white/[0.08]',
                  )}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }} className="relative">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Alumno', 'Módulo', 'Progreso', 'Quizzes', 'Promedio', 'Pago', ''].map(h => (
                  <th key={h} style={{ padding: '0 12px 12px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.01em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #1e3a6e 0%, #0c1d45 100%)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                        }}>
                          {student.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>{student.name}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11.5 }}>{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td style={{ padding: '14px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 12.5 }}>{student.subject}</td>

                    {/* Progress */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${student.progress}%`, borderRadius: 99, background: 'linear-gradient(90deg, #b8880f, #f5c842)' }} />
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, minWidth: 28 }}>{student.progress}%</span>
                      </div>
                    </td>

                    {/* Quizzes */}
                    <td style={{ padding: '14px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{student.quizzes}</td>

                    {/* Score */}
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: student.avgScore >= 80 ? '#34d399' : student.avgScore >= 60 ? '#f5c842' : '#f87171',
                      }}>
                        {student.avgScore}%
                      </span>
                    </td>

                    {/* Payment */}
                    <td style={{ padding: '14px 12px' }}>
                      <StatusBadge status={student.paymentStatus} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{
                          padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          background: 'rgba(96,165,250,0.1)', color: '#93c5fd',
                          border: '1px solid rgba(96,165,250,0.2)',
                        }}>Ver</button>
                        {student.paymentStatus === 'pendiente' && (
                          <button style={{
                            padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                            border: '1px solid rgba(52,211,153,0.2)',
                          }}>Aprobar</button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>◎</p>
              <p style={{ fontSize: 14 }}>Sin resultados</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
