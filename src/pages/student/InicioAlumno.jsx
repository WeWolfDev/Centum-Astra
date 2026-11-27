// Inicio del alumno con Supabase (#37): solo resultados reales de sus
// evaluaciones (#31, docs/ESTADISTICAS.md). Sin intentos dice "Sin resultados",
// nunca 0 %. La gráfica de evolución del puntaje queda para el modo demo.
import { BarChart3, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useCarga from '../../hooks/useCarga';
import { listMaterialCourses } from '../../lib/materialService';
import { getStudentStats, listStudentModuleQuizStats, listStudentResults } from '../../lib/statsService';
import { TIPOS_EVALUACION } from '../../lib/evaluacionesService';
import Boton from '../../components/rediseno/Boton';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import StatCard from '../../components/rediseno/StatCard';
import TarjetasAreas from './TarjetasAreas';

const ULTIMAS_CALIFICACIONES = 5;
const AREAS_A_REPASAR = 3;

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const porcentaje = valor => `${Math.round(valor)} %`;
const puntos = valor => Math.round(valor).toLocaleString('es-MX');
const fecha = iso => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' });

async function cargarResultados() {
  const [promedios, calificaciones, porModulo] = await Promise.all([
    getStudentStats(),
    listStudentResults(),
    listStudentModuleQuizStats(),
  ]);
  return { promedios, calificaciones, porModulo };
}

export default function InicioAlumno({ setActiveSection }) {
  const { user } = useAuth();
  const resultados = useCarga(cargarResultados);
  const material = useCarga(listMaterialCourses);
  const modulos = [...new Map((material.datos ?? []).flatMap(c => c.modules).map(m => [m.id, m])).values()];
  const nombreCorto = user?.name?.split(' ')[0] ?? 'Alumno';

  return (
    <div className="scrollbar-hide bg-fondo-app p-4 md:p-10 flex flex-col gap-9 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 font-display font-bold text-3xl md:text-4xl tracking-tight text-white">Hola, {nombreCorto}</h1>
        <Boton variant="secundario" onClick={() => setActiveSection('modules')}>Ir a mis módulos</Boton>
      </header>

      <EstadoCarga cargando={resultados.cargando} error={resultados.error} onReintentar={resultados.recargar} />
      {resultados.datos && (
        <>
          <Promedios promedios={resultados.datos.promedios} />
          <AreasARepasar
            porModulo={resultados.datos.porModulo}
            modulos={modulos}
            onAbrirModulo={id => setActiveSection('modules', id)}
          />
          <UltimasCalificaciones
            calificaciones={resultados.datos.calificaciones}
            onIrAEvaluaciones={() => setActiveSection('exam')}
          />
        </>
      )}

      <section aria-labelledby="inicio-material">
        <h2 id="inicio-material" className="m-0 mb-4 font-display font-bold text-xl text-white tracking-tight">Tu material</h2>
        <EstadoCarga cargando={material.cargando} error={material.error} onReintentar={material.recargar} />
        {!material.cargando && !material.error && modulos.length === 0 && (
          <p className="m-0 text-sm text-white/60">Tu grupo todavía no tiene áreas habilitadas.</p>
        )}
        {modulos.length > 0 && <TarjetasAreas modulos={modulos} onAbrirModulo={id => setActiveSection('modules', id)} />}
      </section>
    </div>
  );
}

// Quizzes en % y simuladores y cuestionarios en puntos: nunca se mezclan (decisión 1.10).
function Promedios({ promedios }) {
  const { quizAvgPercent, quizCount, examAvgScore, examCount, examScoreLabel } = promedios;
  return (
    <section aria-labelledby="inicio-resultados" className="flex flex-col gap-4">
      <h2 id="inicio-resultados" className="m-0 font-display font-bold text-xl text-white tracking-tight">Tus resultados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icono={BarChart3}
          cifra={quizAvgPercent === null ? 'Sin resultados' : porcentaje(quizAvgPercent)}
          etiqueta={quizCount ? `Promedio de quizzes · ${plural(quizCount, 'quiz', 'quizzes')}` : 'Todavía no terminas ningún quiz'}
          tono="info"
        />
        <StatCard
          icono={Target}
          cifra={examAvgScore === null ? 'Sin resultados' : puntos(examAvgScore)}
          etiqueta={examCount
            ? `${examScoreLabel} promedio · ${plural(examCount, 'simulador o cuestionario', 'simuladores o cuestionarios')}`
            : 'Todavía no terminas ningún simulador o cuestionario'}
          tono="dorado"
        />
      </div>
      <p className="m-0 text-xs text-white/60">
        Cuenta tu mejor intento de cada evaluación. El {examScoreLabel.toLowerCase()} no es un resultado oficial del EXANI-II.
      </p>
    </section>
  );
}

// Las áreas con menor promedio en quizzes primero. Solo las que el alumno tiene habilitadas.
function AreasARepasar({ porModulo, modulos, onAbrirModulo }) {
  const titulos = new Map(modulos.map(m => [m.id, m.title]));
  const areas = porModulo
    .filter(a => a.quizCount > 0 && a.quizAvgPercent !== null && titulos.has(a.moduleId))
    .sort((a, b) => a.quizAvgPercent - b.quizAvgPercent)
    .slice(0, AREAS_A_REPASAR);
  if (areas.length === 0) return null;

  return (
    <section aria-labelledby="inicio-repasar" className="flex flex-col gap-3">
      <h2 id="inicio-repasar" className="m-0 font-display font-bold text-xl text-white tracking-tight">Áreas a repasar</h2>
      <p className="m-0 text-sm text-white/70">Empieza por las de menor promedio en tus quizzes.</p>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {areas.map(a => {
          const titulo = titulos.get(a.moduleId);
          return (
            <li key={a.moduleId} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <span className="flex-1 min-w-[160px] text-sm font-semibold text-white">{titulo}</span>
              <span className="text-sm text-white/70">{porcentaje(a.quizAvgPercent)} en {plural(a.quizCount, 'quiz', 'quizzes')}</span>
              <Boton size="sm" variant="secundario" onClick={() => onAbrirModulo(a.moduleId)} aria-label={`Repasar ${titulo}`}>
                Repasar
              </Boton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function resumen({ correctCount, totalQuestions, percent, score }) {
  const partes = [`${correctCount} de ${totalQuestions} aciertos`, porcentaje(percent)];
  if (score !== null) partes.push(`${puntos(score)} puntos`);
  return partes.join(' · ');
}

function UltimasCalificaciones({ calificaciones, onIrAEvaluaciones }) {
  const ultimas = [...calificaciones]
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    .slice(0, ULTIMAS_CALIFICACIONES);

  return (
    <section aria-labelledby="inicio-calificaciones" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="inicio-calificaciones" className="m-0 font-display font-bold text-xl text-white tracking-tight">Tus últimas calificaciones</h2>
        {ultimas.length > 0 && (
          <Boton size="sm" variant="ghost" onClick={onIrAEvaluaciones}>Ver simuladores y quizzes</Boton>
        )}
      </div>
      {ultimas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no terminas ninguna evaluación."
          descripcion="Tus calificaciones aparecerán aquí."
          accion={<Boton onClick={onIrAEvaluaciones}>Iniciar simulador o quiz</Boton>}
        />
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {ultimas.map(c => (
            <li key={c.evaluationId} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <h3 className="m-0 flex-1 min-w-[160px] text-sm font-semibold text-white">{c.title}</h3>
              <Pastilla tono={c.kind === 'simulador' ? 'tipo-simulador' : 'tipo-quiz'}>{TIPOS_EVALUACION[c.kind]}</Pastilla>
              <span className="text-sm text-white/80">{resumen(c)}</span>
              <span className="text-xs text-white/60">{fecha(c.finishedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
