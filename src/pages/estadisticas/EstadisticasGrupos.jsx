// Promedios por grupo y por alumno (#31). El servidor decide qué grupos ve cada
// rol: el maestro los suyos y el administrador todos. Solo el administrador
// pasa un `rango`; el maestro ve todo el curso.
import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useCarga from '../../hooks/useCarga';
import { listGroupStats, listGroupStudentStats } from '../../lib/statsService';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import { fecha, plural, porcentaje, puntos } from './formato';

function textoQuizzes({ quizAvgPercent, quizCount }) {
  return quizAvgPercent === null ? 'sin resultados' : `${porcentaje(quizAvgPercent)} (${plural(quizCount, 'quiz', 'quizzes')})`;
}

function textoExamenes({ examAvgScore, examCount }) {
  return examAvgScore === null ? 'sin resultados' : `${puntos(examAvgScore)} puntos (${examCount})`;
}

export default function EstadisticasGrupos({ rango, vacio = 'Todavía no hay grupos.' }) {
  const cargar = useCallback(() => listGroupStats(rango), [rango]);
  const { cargando, error, datos, recargar } = useCarga(cargar);
  const [abierto, setAbierto] = useState(null);

  if (cargando || error) return <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />;
  if (datos.length === 0) return <EstadoVacio titulo="Sin grupos" descripcion={vacio} />;

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-3">
      {datos.map(g => {
        const expandido = abierto === g.groupId;
        const panelId = `grupo-${g.groupId}-alumnos`;
        return (
          <li key={g.groupId} className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 md:px-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex-1 min-w-[180px]">
                <h3 className="m-0 text-base font-semibold text-white">{g.groupName}</h3>
                <p className="m-0 text-xs text-white/60">
                  Generación {g.generation} · {plural(g.studentCount, 'alumno', 'alumnos')}
                </p>
              </div>
              <p className="m-0 text-sm text-white/80">Quizzes: {textoQuizzes(g)}</p>
              <p className="m-0 text-sm text-white/80">Simuladores y cuestionarios: {textoExamenes(g)}</p>
              <button
                type="button"
                aria-expanded={expandido}
                aria-controls={panelId}
                aria-label={`Ver alumnos de ${g.groupName}`}
                onClick={() => setAbierto(expandido ? null : g.groupId)}
                className="inline-flex min-h-[44px] items-center gap-1 bg-transparent border-0 text-sm font-semibold text-gold-bright cursor-pointer"
              >
                Alumnos <ChevronDown size={16} aria-hidden="true" className={expandido ? 'rotate-180' : ''} />
              </button>
            </div>
            {expandido && (
              <div id={panelId} className="mt-3">
                <AlumnosDelGrupo grupo={g} rango={rango} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AlumnosDelGrupo({ grupo, rango }) {
  const cargar = useCallback(() => listGroupStudentStats(grupo.groupId, rango), [grupo.groupId, rango]);
  const { cargando, error, datos, recargar } = useCarga(cargar);

  if (cargando || error) return <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />;
  if (datos.length === 0) return <p className="m-0 text-sm text-white/60">Este grupo todavía no tiene alumnos.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-white/80">
        <caption className="sr-only">Alumnos de {grupo.groupName}</caption>
        <thead className="text-xs text-white/60">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Alumno</th>
            <th scope="col" className="py-2 pr-4 font-medium">Quizzes</th>
            <th scope="col" className="py-2 pr-4 font-medium">Simuladores y cuestionarios</th>
            <th scope="col" className="py-2 font-medium">Última entrega</th>
          </tr>
        </thead>
        <tbody>
          {datos.map(a => (
            <tr key={a.studentId} className="border-t border-white/10">
              <th scope="row" className="py-2 pr-4 font-semibold text-white">{a.fullName}</th>
              <td className="py-2 pr-4">{a.quizAvgPercent === null ? 'Sin resultados' : porcentaje(a.quizAvgPercent)}</td>
              <td className="py-2 pr-4">{a.examAvgScore === null ? 'Sin resultados' : puntos(a.examAvgScore)}</td>
              <td className="py-2">{a.lastFinishedAt ? fecha(a.lastFinishedAt) : 'Sin entregas'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
