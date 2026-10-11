import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { CheckCircle2, GraduationCap } from 'lucide-react';
import { mockStats } from '../../data/mockData';
import StatCard from '../../components/rediseno/StatCard';
import {
  COLORES_GRAFICA,
  GRID_STROKE,
  AXIS_TICK,
  CURSOR_FILL,
  TOOLTIP_BORDER,
} from '../../config/graficas';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-space-navy rounded-lg px-3 py-2.5 border"
        style={{ borderColor: TOOLTIP_BORDER }}
      >
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
  { label: 'Tasa de aprobación', val: '78%', Icon: CheckCircle2,  tono: 'exito'   },
  { label: 'Alumnos evaluados',  val: '312', Icon: GraduationCap, tono: 'violeta' },
];

export default function Statistics() {
  return (
    <div
      className="scrollbar-hide p-8 flex flex-col gap-7 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Summary — 2 key KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {statItems.map(({ label, val, Icon, tono }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatCard icono={Icon} cifra={val} etiqueta={label} tono={tono} />
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
        <div className="section-divider relative mb-1"><h3>Rendimiento por Materia</h3></div>
        <p className="text-white/30 text-xs mb-5">
          Identifica qué área necesita refuerzo urgente
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockStats.subjectPerformance} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="subject" tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: CURSOR_FILL }} />
            <Bar dataKey="avg" name="Promedio" fill={COLORES_GRAFICA.dorado} radius={[8, 8, 0, 0]} />
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
        <div className="section-divider relative mb-1"><h3>Evolución Semanal</h3></div>
        <p className="text-white/30 text-xs mb-5">
          Detecta tendencias y ajusta el plan de estudio
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={mockStats.progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: AXIS_TICK }} />
            <Line
              type="monotone"
              dataKey="promedio"
              name="Promedio"
              stroke={COLORES_GRAFICA.dorado}
              strokeWidth={2.5}
              dot={{ fill: COLORES_GRAFICA.dorado, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="maxScore"
              name="Máximo"
              stroke={COLORES_GRAFICA.info}
              strokeWidth={2}
              dot={{ fill: COLORES_GRAFICA.info, r: 3 }}
              strokeDasharray="5 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
