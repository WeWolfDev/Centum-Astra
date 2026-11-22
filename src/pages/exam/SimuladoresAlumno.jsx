// Simuladores y quizzes del alumno con Supabase (#36): lista lo publicado para
// él, inicia o retoma intentos y muestra los resultados que guarda el servidor.
import { useCallback, useEffect, useId, useState } from 'react';
import { Clock, ListChecks } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listMyEvaluations, startAttempt, TIPOS_EVALUACION, tienePuntaje } from '../../lib/evaluacionesService';
import Boton from '../../components/rediseno/Boton';
import DialogoConfirmacion from '../../components/rediseno/DialogoConfirmacion';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import { Aviso } from '../../components/rediseno/Aviso';
import IntentoEvaluacion from './IntentoEvaluacion';
import ResultadoIntento from './ResultadoIntento';

const CONTENEDOR = 'scrollbar-hide bg-fondo-app flex flex-col gap-8 font-body text-white/80';
const ESTILO_CONTENEDOR = {
  padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
  maxHeight: 'calc(100vh - 4rem)',
  overflowY: 'auto',
};

function resumenResultado(intento, kind) {
  const aciertos = `${intento.correctCount} de ${intento.totalQuestions}`;
  return tienePuntaje(kind) && intento.score != null
    ? `${aciertos} · ${intento.score.toLocaleString('es-MX')} puntos`
    : `${aciertos} aciertos`;
}

function TarjetaEvaluacion({ evaluacion, ocupado, onIniciar, onVerResultado }) {
  const { kind, title, description, questionCount, timeLimitMinutes, enCurso, terminados } = evaluacion;
  const mejor = terminados.find(i => i.isBest) ?? null;
  const ultimo = terminados[0] ?? null;
  const accion = enCurso ? 'Continuar' : terminados.length ? 'Volver a intentar' : 'Iniciar';

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[180px]">
          <h3 className="m-0 text-base font-semibold text-white">{title}</h3>
          {description && <p className="m-0 mt-1 text-sm text-white/70">{description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <Pastilla tono={kind === 'simulador' ? 'tipo-simulador' : 'tipo-quiz'}>{TIPOS_EVALUACION[kind]}</Pastilla>
            <span className="inline-flex items-center gap-1">
              <ListChecks size={14} aria-hidden="true" /> {questionCount} pregunta{questionCount === 1 ? '' : 's'}
            </span>
            {timeLimitMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock size={14} aria-hidden="true" /> {timeLimitMinutes} min
              </span>
            )}
          </div>
        </div>
        <Boton
          variant={enCurso ? 'primario' : 'secundario'}
          disabled={ocupado}
          onClick={() => onIniciar(evaluacion)}
          aria-label={`${accion}: ${title}`}
        >
          {accion}
        </Boton>
      </div>
      {(mejor || ultimo) && (
        <dl className="m-0 grid gap-1 text-sm text-white/80 sm:grid-cols-2">
          {ultimo && (
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-white/60">Último:</dt>
              <dd className="m-0">{resumenResultado(ultimo, kind)}</dd>
              <button
                type="button"
                onClick={() => onVerResultado(evaluacion, ultimo)}
                aria-label={`Ver respuestas de ${title}`}
                className="min-h-[32px] text-sm font-semibold text-gold-bright underline-offset-2 hover:underline"
              >
                Ver respuestas
              </button>
            </div>
          )}
          {mejor && mejor.id !== ultimo?.id && (
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-white/60">Mejor:</dt>
              <dd className="m-0">{resumenResultado(mejor, kind)}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

function Seccion({ titulo, evaluaciones, ...props }) {
  const id = useId();
  if (!evaluaciones.length) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="m-0 font-display text-xl font-bold text-white">{titulo}</h2>
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {evaluaciones.map(e => <TarjetaEvaluacion key={e.id} evaluacion={e} {...props} />)}
      </ul>
    </section>
  );
}

function ListaEvaluaciones({ onAbrirIntento, onVerResultado }) {
  const { user } = useAuth();
  const [estado, setEstado] = useState({ cargando: true, error: '', evaluaciones: [] });
  const [confirmar, setConfirmar] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setEstado(e => ({ ...e, cargando: true, error: '' }));
    try {
      setEstado({ cargando: false, error: '', evaluaciones: await listMyEvaluations(user.id) });
    } catch (e) {
      setEstado({ cargando: false, error: e.message, evaluaciones: [] });
    }
  }, [user.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function iniciar(evaluacion) {
    setConfirmar(null);
    setError('');
    setIniciando(true);
    try {
      onAbrirIntento(evaluacion, await startAttempt(evaluacion.id));
    } catch (e) {
      setError(e.message);
      setIniciando(false);
    }
  }

  // Un simulador nuevo avisa que el reloj no se detiene; retomar no pregunta.
  function pedirInicio(evaluacion) {
    if (evaluacion.enCurso || !evaluacion.timeLimitMinutes) void iniciar(evaluacion);
    else setConfirmar(evaluacion);
  }

  const { cargando, evaluaciones } = estado;
  const simuladores = evaluaciones.filter(e => e.kind === 'simulador');
  const otras = evaluaciones.filter(e => e.kind !== 'simulador');
  const propsTarjeta = { ocupado: iniciando, onIniciar: pedirInicio, onVerResultado };

  return (
    <>
      {error && <Aviso tipo="error" mensaje={error} onCerrar={() => setError('')} />}
      {cargando && <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>}
      {estado.error && (
        <EstadoVacio
          titulo="No se pudo cargar"
          descripcion={estado.error}
          accion={<Boton variant="secundario" onClick={cargar}>Reintentar</Boton>}
        />
      )}
      {!cargando && !estado.error && evaluaciones.length === 0 && (
        <EstadoVacio
          titulo="Sin evaluaciones por ahora"
          descripcion="Cuando tus profesores publiquen simuladores, cuestionarios o quizzes de tus áreas, aparecerán aquí."
        />
      )}
      <Seccion titulo="Simuladores" evaluaciones={simuladores} {...propsTarjeta} />
      <Seccion titulo="Cuestionarios y quizzes" evaluaciones={otras} {...propsTarjeta} />
      <DialogoConfirmacion
        abierto={Boolean(confirmar)}
        titulo={`Iniciar ${confirmar?.title ?? ''}`}
        mensaje={`Tienes ${confirmar?.timeLimitMinutes} minutos. El reloj no se detiene aunque cierres la página o pierdas la conexión; si vuelves a tiempo, continúas donde ibas.`}
        textoConfirmar="Iniciar ahora"
        onConfirmar={() => iniciar(confirmar)}
        onCancelar={() => setConfirmar(null)}
      />
    </>
  );
}

export default function SimuladoresAlumno() {
  const [vista, setVista] = useState({ tipo: 'lista' });
  const volver = useCallback(() => setVista({ tipo: 'lista' }), []);

  let contenido;
  if (vista.tipo === 'intento') {
    contenido = (
      <IntentoEvaluacion
        evaluacion={vista.evaluacion}
        intento={vista.intento}
        onTerminado={(intento, motivo) => setVista({ tipo: 'resultado', evaluacion: vista.evaluacion, intento, motivo })}
        onSalir={volver}
      />
    );
  } else if (vista.tipo === 'resultado') {
    contenido = (
      <ResultadoIntento evaluacion={vista.evaluacion} intento={vista.intento} motivo={vista.motivo} onVolver={volver} />
    );
  } else {
    contenido = (
      <ListaEvaluaciones
        onAbrirIntento={(evaluacion, intento) => setVista({ tipo: 'intento', evaluacion, intento })}
        onVerResultado={(evaluacion, intento) => setVista({ tipo: 'resultado', evaluacion, intento, motivo: null })}
      />
    );
  }

  return (
    <div className={CONTENEDOR} style={ESTILO_CONTENEDOR}>
      {vista.tipo === 'lista' && (
        <h1 className="m-0 font-display font-bold text-white" style={{ fontSize: 'clamp(28px, 5vw, 36px)', letterSpacing: '-0.03em' }}>
          Simuladores y quizzes
        </h1>
      )}
      {contenido}
    </div>
  );
}
