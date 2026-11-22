// Simuladores, cuestionarios y quizzes con Supabase (#52), para administrador
// y profesor. El profesor no crea simuladores (RLS); el administrador sí.
import { useCallback, useState } from 'react';
import { Clock, ListChecks, Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createEvaluation, ESTADOS, listCourseEvaluations, TIPOS, TONO_ESTADO } from '../../lib/evaluacionesGestionService';
import { TIPOS_EVALUACION } from '../../lib/evaluacionesService';
import { listMaterialCourses } from '../../lib/materialService';
import Boton from '../../components/rediseno/Boton';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import Pestanas from '../../components/rediseno/Pestanas';
import useCarga from '../../hooks/useCarga';
import EditorEvaluacion from './EditorEvaluacion';
import { ModalEvaluacion } from './ModalesEvaluacion';

const CLASE_SELECT =
  'rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-2.5 text-sm text-white font-body ' +
  'outline-none focus:border-gold-bright/40';
const TIPOS_PROFESOR = TIPOS.filter(t => t !== 'simulador');

function TarjetaEvaluacion({ evaluacion, area, onAbrir }) {
  const { kind, title, status, questionCount, attemptCount, timeLimitMinutes } = evaluacion;
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5">
      <div className="flex-1 min-w-[200px]">
        <h3 className="m-0 text-base font-semibold text-white">{title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/70">
          <Pastilla tono={kind === 'simulador' ? 'tipo-simulador' : 'tipo-quiz'}>{TIPOS_EVALUACION[kind]}</Pastilla>
          <Pastilla tono={TONO_ESTADO[status]}>{ESTADOS[status]}</Pastilla>
          <span>{area}</span>
          <span className="inline-flex items-center gap-1">
            <ListChecks size={14} aria-hidden="true" /> {questionCount} pregunta{questionCount === 1 ? '' : 's'}
          </span>
          {timeLimitMinutes && (
            <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {timeLimitMinutes} min</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users size={14} aria-hidden="true" /> {attemptCount} intento{attemptCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <Boton variant="secundario" onClick={() => onAbrir(evaluacion.id)} aria-label={`Abrir ${title}`}>Abrir</Boton>
    </li>
  );
}

function ListaEvaluaciones({ evaluaciones, modulos, vacio, onAbrir }) {
  if (evaluaciones.length === 0) return <EstadoVacio titulo={vacio.titulo} descripcion={vacio.descripcion} />;
  const area = id => modulos.find(m => m.id === id)?.title ?? 'Todas las áreas';
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-3">
      {evaluaciones.map(e => (
        <TarjetaEvaluacion key={e.id} evaluacion={e} area={area(e.moduleId)} onAbrir={onAbrir} />
      ))}
    </ul>
  );
}

const VACIO_SIMULADORES = {
  titulo: 'Sin simuladores',
  descripcion: 'Un simulador con tiempo y puntaje estimado le sirve al alumno para medir su avance.',
};
const VACIO_QUIZZES = {
  titulo: 'Sin quizzes ni cuestionarios',
  descripcion: 'Arma uno corto por área para que tus alumnos repasen.',
};

function ContenidoCurso({ curso, esAdmin, pestana, onPestana, onAbrir }) {
  const { user } = useAuth();
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const cargar = useCallback(
    () => listCourseEvaluations(curso.id, { includeArchived: verArchivadas }),
    [curso.id, verArchivadas],
  );
  const { cargando, error: errorCarga, datos, recargar } = useCarga(cargar);
  const tipos = esAdmin ? TIPOS : TIPOS_PROFESOR;

  const todas = datos ?? [];
  const simuladores = todas.filter(e => e.kind === 'simulador');
  const otras = todas.filter(e => e.kind !== 'simulador');

  async function crear(evaluacion) {
    setError('');
    setGuardando(true);
    try {
      const id = await createEvaluation({ courseId: curso.id, ...evaluacion }, user.id);
      setNueva(false);
      onAbrir(id);
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  }

  const listaQuizzes = <ListaEvaluaciones evaluaciones={otras} modulos={curso.modules} vacio={VACIO_QUIZZES} onAbrir={onAbrir} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {esAdmin ? (
          <label className="inline-flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={verArchivadas} onChange={e => setVerArchivadas(e.target.checked)} className="h-4 w-4 accent-gold-bright" />
            Mostrar archivadas
          </label>
        ) : (
          <p className="m-0 text-sm text-white/70">Tus alumnos ven lo publicado de sus áreas.</p>
        )}
        <Boton
          variant="primario"
          disabled={cargando || Boolean(errorCarga)}
          onClick={() => { setError(''); setNueva(true); }}
        >
          <Plus size={16} aria-hidden="true" /> Nueva evaluación
        </Boton>
      </div>
      <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />
      {!cargando && !errorCarga && (esAdmin ? (
        <Pestanas valor={pestana} onCambio={onPestana} aria-label="Tipo de evaluación">
          <Pestanas.Lista>
            <Pestanas.Tab valor="simuladores">Simuladores ({simuladores.length})</Pestanas.Tab>
            <Pestanas.Tab valor="quizzes">Cuestionarios y quizzes ({otras.length})</Pestanas.Tab>
          </Pestanas.Lista>
          <Pestanas.Panel valor="simuladores" className="mt-4">
            <ListaEvaluaciones evaluaciones={simuladores} modulos={curso.modules} vacio={VACIO_SIMULADORES} onAbrir={onAbrir} />
          </Pestanas.Panel>
          <Pestanas.Panel valor="quizzes" className="mt-4">{listaQuizzes}</Pestanas.Panel>
        </Pestanas>
      ) : listaQuizzes)}
      {nueva && (
        <ModalEvaluacion
          tipos={tipos}
          tipoInicial={pestana === 'simuladores' ? 'simulador' : 'quiz'}
          modulos={curso.modules}
          guardando={guardando}
          error={error}
          onGuardar={crear}
          onCerrar={() => setNueva(false)}
        />
      )}
    </div>
  );
}

export default function EvaluacionesCurso() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';
  const { cargando, error, datos: cursos, recargar } = useCarga(listMaterialCourses);
  const [cursoId, setCursoId] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [pestana, setPestana] = useState(esAdmin ? 'simuladores' : 'quizzes');
  const curso = cursos?.find(c => c.id === cursoId) ?? cursos?.[0];
  const titulo = esAdmin ? 'Simuladores y quizzes' : 'Quizzes y cuestionarios';

  return (
    <div className="scrollbar-hide bg-fondo-app p-4 md:p-10 flex flex-col gap-7 overflow-y-auto font-body text-white/80" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 font-display font-bold text-3xl md:text-4xl tracking-tight text-white">{titulo}</h1>
          <p className="m-0 mt-1.5 text-sm text-white/70">
            {esAdmin
              ? 'Arma simuladores con tiempo y puntaje estimado, y quizzes o cuestionarios por área.'
              : 'Arma quizzes y cuestionarios por área para que tus alumnos repasen.'}
          </p>
        </div>
        {!abierta && cursos?.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="evaluaciones-curso" className="text-xs font-medium text-white/70">Curso</label>
            <select id="evaluaciones-curso" className={CLASE_SELECT} value={curso?.id ?? ''} onChange={e => setCursoId(e.target.value)}>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </header>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && !curso && (
        <EstadoVacio titulo="Sin cursos" descripcion="Todavía no tienes cursos activos asignados." />
      )}
      {curso && abierta && (
        <EditorEvaluacion
          evaluacionId={abierta}
          modulos={curso.modules}
          tipos={esAdmin ? TIPOS : TIPOS_PROFESOR}
          onVolver={() => setAbierta(null)}
        />
      )}
      {curso && !abierta && (
        <ContenidoCurso key={curso.id} curso={curso} esAdmin={esAdmin} pestana={pestana} onPestana={setPestana} onAbrir={setAbierta} />
      )}
    </div>
  );
}
