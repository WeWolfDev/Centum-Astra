// Estadísticas del administrador (#31): resumen de todos los alumnos y promedios
// por grupo. Solo el administrador elige el periodo (decisión 1.10); sin
// periodo cuenta todo el curso. El servidor recibe [desde, hasta), así que la
// fecha final que elige el administrador se pasa como el día siguiente.
import { useCallback, useState } from 'react';
import { BarChart3, Target, Users } from 'lucide-react';
import useCarga from '../../hooks/useCarga';
import { getStatsOverview } from '../../lib/statsService';
import Boton from '../../components/rediseno/Boton';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import Input from '../../components/rediseno/Input';
import StatCard from '../../components/rediseno/StatCard';
import EstadisticasGrupos from '../estadisticas/EstadisticasGrupos';
import { dia, plural, porcentaje, puntos } from '../estadisticas/formato';

function diaSiguiente(texto) {
  const siguiente = new Date(`${texto}T12:00:00Z`);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  return siguiente.toISOString().slice(0, 10);
}

function problemaDePeriodo(desde, hasta) {
  if (!desde || !hasta) return 'Elige la fecha de inicio y la de fin.';
  if (desde > hasta) return 'La fecha de inicio debe ser anterior o igual a la de fin.';
  return '';
}

export default function EstadisticasAdmin() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [problema, setProblema] = useState('');
  // `periodo` guarda lo que eligió el administrador; `rango` es lo que recibe el servidor.
  const [periodo, setPeriodo] = useState(null);
  const rango = periodo ? periodo.rango : undefined;

  function aplicar(e) {
    e.preventDefault();
    const motivo = problemaDePeriodo(desde, hasta);
    setProblema(motivo);
    if (!motivo) setPeriodo({ desde, hasta, rango: { from: desde, to: diaSiguiente(hasta) } });
  }

  function todoElCurso() {
    setDesde('');
    setHasta('');
    setProblema('');
    setPeriodo(null);
  }

  return (
    <section aria-labelledby="admin-estadisticas" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="admin-estadisticas" className="m-0 font-display font-bold text-xl text-white tracking-tight">Estadísticas</h2>
        <p className="m-0 text-sm text-white/70">
          {periodo ? `Del ${dia(periodo.desde)} al ${dia(periodo.hasta)}` : 'Todo el curso'}. Cuenta el mejor intento de cada alumno en cada evaluación.
        </p>
      </div>

      <form onSubmit={aplicar} className="flex flex-wrap items-end gap-3" aria-label="Periodo de las estadísticas">
        <div className="w-[170px]">
          <Input id="estadisticas-desde" label="Desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div className="w-[170px]">
          <Input id="estadisticas-hasta" label="Hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <Boton type="submit" variant="secundario">Aplicar periodo</Boton>
        {periodo && <Boton variant="ghost" onClick={todoElCurso}>Todo el curso</Boton>}
        {problema && <p role="alert" className="m-0 w-full text-xs text-peligro">{problema}</p>}
      </form>

      <Resumen rango={rango} />
      <h3 className="m-0 font-display font-bold text-lg text-white">Por grupo</h3>
      <EstadisticasGrupos rango={rango} />
    </section>
  );
}

// Quizzes en % y simuladores y cuestionarios en puntos: nunca se mezclan.
function Resumen({ rango }) {
  const cargar = useCallback(() => getStatsOverview(rango), [rango]);
  const { cargando, error, datos, recargar } = useCarga(cargar);
  if (cargando || error || !datos) return <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />;

  const { studentsWithResults, quizAvgPercent, quizCount, examAvgScore, examCount, examScoreLabel } = datos;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icono={Users} cifra={`${studentsWithResults}`} etiqueta="Alumnos con resultados" tono="blanco" />
        <StatCard
          icono={BarChart3}
          cifra={quizAvgPercent === null ? 'Sin resultados' : porcentaje(quizAvgPercent)}
          etiqueta={`Promedio de quizzes · ${plural(quizCount, 'resultado', 'resultados')}`}
          tono="info"
        />
        <StatCard
          icono={Target}
          cifra={examAvgScore === null ? 'Sin resultados' : puntos(examAvgScore)}
          etiqueta={`${examScoreLabel} promedio · ${plural(examCount, 'resultado', 'resultados')}`}
          tono="dorado"
        />
      </div>
      <p className="m-0 text-xs text-white/60">El {examScoreLabel.toLowerCase()} no es un resultado oficial de Ceneval.</p>
    </div>
  );
}
