import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { mockStudents, mockStats } from '../../data/mockData';
import { cn } from '../../lib/utils';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import StatCard from '../../components/rediseno/StatCard';
import Pastilla from '../../components/rediseno/Pastilla';
import Boton from '../../components/rediseno/Boton';
import EstadoVacio from '../../components/rediseno/EstadoVacio';

const statCards = [
  { icon: Users,       label: 'Total alumnos',    key: 'totalStudents',  change: '+8%',  changeUp: true  },
  { icon: CheckCircle, label: 'Alumnos activos',   key: 'activeStudents', change: '+4%',  changeUp: true  },
  { icon: TrendingUp,  label: 'Progreso promedio', key: 'avgProgress',    change: '+12%', changeUp: true, suffix: '%' },
  { icon: TrendingUp,  label: 'Calificación media',key: 'avgScore',       change: '+5%',  changeUp: true, suffix: '%' },
];

/* ── Pago → tono de Pastilla ───────────────────────────── */
const TONO_POR_PAGO = {
  aprobado:  'positivo',
  pendiente: 'advertencia',
  rechazado: 'peligro',
};

const ETIQUETA_POR_PAGO = {
  aprobado:  'Aprobado',
  pendiente: 'Pendiente',
  rechazado: 'Rechazado',
};

function BadgePago({ status }) {
  const tono = TONO_POR_PAGO[status] || 'advertencia';
  const etiqueta = ETIQUETA_POR_PAGO[status] || 'Pendiente';
  return <Pastilla tono={tono}>{etiqueta}</Pastilla>;
}

/* ── Score → tono (verde/amarillo/rojo) ─────────────────── */
function tonoScore(score) {
  if (score >= 80) return 'positivo';
  if (score >= 60) return 'advertencia';
  return 'peligro';
}

function textScore(score) {
  if (score >= 80) return 'text-exito';
  if (score >= 60) return 'text-advertencia';
  return 'text-peligro';
}

/* ── Avatar circular con iniciales ──────────────────────── */
function Avatar({ nombre, chico }) {
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 flex items-center justify-center',
        'bg-gradient-to-br from-space-light to-space-navy border border-white/10',
        'font-bold text-white/70',
        chico ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs',
      )}
    >
      {iniciales}
    </div>
  );
}

/* ── Barra de progreso ──────────────────────────────────── */
function BarraProgreso({ valor, ancho = 'full' }) {
  return (
    <div className={cn('h-1 rounded-full bg-white/10 overflow-hidden', ancho === 'full' ? 'flex-1' : 'w-20')}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold-muted to-gold-bright"
        style={{ width: `${valor}%` }}
      />
    </div>
  );
}

/* ── Shared student table ───────────────────────────────── */
function StudentTable({ students }) {
  const { isMobile } = useBreakpoint();

  if (students.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin resultados"
        descripcion="Ajusta los filtros o la búsqueda para ver alumnos."
      />
    );
  }

  /* ── Mobile: card-per-row layout ── */
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2.5">
        <AnimatePresence>
          {students.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-2.5 rounded-xl p-3.5 bg-white/5 border border-white/10"
            >
              {/* Top row: avatar + name + email */}
              <div className="flex items-center gap-2.5">
                <Avatar nombre={student.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/85 whitespace-nowrap overflow-hidden text-ellipsis m-0">
                    {student.name}
                  </p>
                  <p className="text-xs text-white/30 whitespace-nowrap overflow-hidden text-ellipsis m-0">
                    {student.email}
                  </p>
                </div>
              </div>

              {/* Middle row: module label */}
              <p className="text-xs text-white/45 m-0">{student.subject}</p>

              {/* Stats row: progress bar + score badge + payment badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-[100px]">
                  <BarraProgreso valor={student.progress} />
                  <span className="text-xs text-white/45 min-w-[30px] text-right">
                    {student.progress}%
                  </span>
                </div>
                <Pastilla tono={tonoScore(student.avgScore)}>
                  {student.avgScore}%
                </Pastilla>
                <BadgePago status={student.paymentStatus} />
              </div>

              {/* Action buttons — tamaño md (44px) para táctil en móvil */}
              <div className="flex gap-2">
                <Boton variant="secundario" className="flex-1">Ver</Boton>
                {student.paymentStatus === 'pendiente' && (
                  <Boton variant="primario" className="flex-1">Aprobar</Boton>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Desktop: original table ── */
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            {['Alumno', 'Módulo', 'Progreso', 'Quizzes', 'Promedio', 'Pago', ''].map(h => (
              <th
                key={h}
                className="px-3 pb-3 text-left text-xs font-semibold text-white/30 tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {students.map((student, i) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-white/5 cursor-default hover:bg-white/5"
              >
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar nombre={student.name} chico />
                    <div>
                      <p className="text-sm font-medium text-white/85 m-0">{student.name}</p>
                      <p className="text-xs text-white/30 m-0">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-xs text-white/55">{student.subject}</td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <BarraProgreso valor={student.progress} ancho="fijo" />
                    <span className="text-xs text-white/50 min-w-[28px]">{student.progress}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-sm text-white/55">{student.quizzes}</td>
                <td className="py-3.5 px-3">
                  <span className={cn('text-sm font-semibold', textScore(student.avgScore))}>
                    {student.avgScore}%
                  </span>
                </td>
                <td className="py-3.5 px-3"><BadgePago status={student.paymentStatus} /></td>
                <td className="py-3.5 px-3">
                  <div className="flex gap-1.5">
                    <Boton size="sm" variant="secundario">Ver</Boton>
                    {student.paymentStatus === 'pendiente' && (
                      <Boton size="sm" variant="secundario">Aprobar</Boton>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

/* ── Table card wrapper ─────────────────────────────────── */
function TableCard({ title, controls, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-gold-bright/30 transition-colors duration-300 p-6 z-10"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(245,200,66,0.07)_0%,transparent_65%)]" />
      <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-gold-bright/35 to-transparent" />
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="section-divider relative flex-1">
          <h3>{title}</h3>
        </div>
        {controls}
      </div>
      {children}
    </motion.div>
  );
}

/* ── Shared page shell ──────────────────────────────────── */
function PageShell({ children }) {
  return (
    <div
      className="scrollbar-hide p-4 md:p-8 flex flex-col gap-7 overflow-y-auto relative"
      style={{ maxHeight: 'calc(100vh - 4rem)' }}
    >
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none bg-dot-grid bg-dot-32 opacity-100"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
          zIndex: 0,
        }}
      />
      {children}
    </div>
  );
}

/* ── Overview (Dashboard) ───────────────────────────────── */
function OverviewView({ onNavigate }) {
  const data = mockStats.overview;
  const recent = mockStudents.slice(0, 4);

  return (
    <PageShell>
      {/* KPI cards */}
      <div className="relative z-10 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatCard
              icono={s.icon}
              cifra={`${data[s.key]}${s.suffix || ''}`}
              etiqueta={s.label}
              tono="dorado"
              cambio={s.change}
              cambioUp={s.changeUp}
              degradado
            />
          </motion.div>
        ))}
      </div>

      {/* Recent students preview */}
      <TableCard
        title="Actividad reciente"
        controls={
          <button
            type="button"
            onClick={() => onNavigate?.('students')}
            className="inline-flex items-center gap-1 bg-transparent border-none text-gold-bright text-xs font-semibold tracking-widest uppercase cursor-pointer hover:text-gold-glow transition-colors"
          >
            Ver todos <ChevronRight size={13} />
          </button>
        }
      >
        <StudentTable students={recent} />
      </TableCard>
    </PageShell>
  );
}

/* ── Students (full list) ───────────────────────────────── */
function StudentsView() {
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');

  const filtered = mockStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <PageShell>
      <TableCard
        title="Alumnos"
        controls={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar alumno"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-52 py-2 pl-9 pr-3.5 rounded-lg text-sm text-white bg-space-navy/50 border border-white/10 outline-none focus:border-gold-bright/50 transition-colors"
              />
            </div>
            <div className="flex gap-1.5">
              {[['all','Todos'],['aprobado','Aprobados'],['pendiente','Pendientes']].map(([val, lbl]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setFilter(val)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-150',
                    filterStatus === val
                      ? 'bg-gold-bright/10 text-gold-bright border border-gold-bright/25'
                      : 'bg-white/5 text-white/40 border border-white/10',
                  )}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <StudentTable students={filtered} />
      </TableCard>
    </PageShell>
  );
}

export default function AdminDashboard({ view = 'overview', onNavigate }) {
  if (view === 'students') return <StudentsView />;
  return <OverviewView onNavigate={onNavigate} />;
}
