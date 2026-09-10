import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { CheckCircle2, GraduationCap } from 'lucide-react';
import { mockStats } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0c1d45', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px' }}>
        <p className="text-white/60 text-xs mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const statItems = [
  { label: 'Tasa de aprobación', val: '78%', Icon: CheckCircle2,  color: '#34d399' },
  { label: 'Alumnos evaluados',  val: '312', Icon: GraduationCap, color: '#c084fc' },
];

export default function Statistics() {
  return (
    <div className="scrollbar-hide" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto', maxHeight: 'calc(100vh - 4rem)' }}>
      {/* Summary — 2 key KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {statItems.map(({ label, val, Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/25 transition-colors duration-300"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${color}14 0%, transparent 65%)` }}
            />
            <div
              className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `linear-gradient(to right, transparent, ${color}45, transparent)` }}
            />
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-[14px] relative"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon size={16} strokeWidth={1.7} style={{ color }} />
            </div>
            <p className="relative font-syne text-[28px] font-bold leading-none tracking-tight mb-1" style={{ color }}>
              {val}
            </p>
            <p className="relative text-[11px] font-medium tracking-[0.04em] text-white/30 uppercase">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Rendimiento por materia */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/20 transition-colors duration-300 p-6"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.05)_0%,transparent_65%)]" />
        <div className="section-divider relative" style={{ marginBottom: 4 }}><h3>Rendimiento por Materia</h3></div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12.5, marginBottom: 20 }}>
          Identifica qué área necesita refuerzo urgente
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockStats.subjectPerformance} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="avg" name="Promedio" fill="#f5c842" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Evolución semanal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-yellow-500/20 transition-colors duration-300 p-6"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.05)_0%,transparent_65%)]" />
        <div className="section-divider relative" style={{ marginBottom: 4 }}><h3>Evolución Semanal</h3></div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12.5, marginBottom: 20 }}>
          Detecta tendencias y ajusta el plan de estudio
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={mockStats.progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
            <Line type="monotone" dataKey="promedio" name="Promedio" stroke="#f5c842" strokeWidth={2.5} dot={{ fill: '#f5c842', r: 4 }} />
            <Line type="monotone" dataKey="maxScore" name="Máximo" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
