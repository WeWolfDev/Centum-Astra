// Un intento en curso (#36). Cada respuesta se guarda en el servidor al
// elegirla, así que recargar o reconectarse retoma donde iba. El reloj cuenta
// hacia la hora de cierre que fijó el servidor; al llegar a cero se entrega y
// el servidor lo cierra como vencido aunque el alumno ya no tenga conexión.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock, ExternalLink, WifiOff } from 'lucide-react';
import { formatoReloj, loadAnswers, loadQuestions, saveAnswer, submitAttempt } from '../../lib/evaluacionesService';
import { enlaceSeguro } from '../../lib/materialService';
import Boton from '../../components/rediseno/Boton';
import DialogoConfirmacion from '../../components/rediseno/DialogoConfirmacion';
import EstadoVacio from '../../components/rediseno/EstadoVacio';

const SEGUNDO = 1000;
const AVISOS_MINUTOS = [5, 1];

// Cuenta hacia la hora de cierre del servidor; al llegar a cero avisa una vez.
function useSegundosRestantes(expiresAt, onVencido) {
  const calcular = useCallback(
    () => (expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / SEGUNDO) : null),
    [expiresAt],
  );
  const [restantes, setRestantes] = useState(calcular);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const id = setInterval(() => {
      const ahora = calcular();
      setRestantes(ahora);
      if (ahora <= 0) onVencido();
    }, SEGUNDO);
    return () => clearInterval(id);
  }, [expiresAt, calcular, onVencido]);
  return restantes;
}

function Reloj({ restantes }) {
  if (restantes == null) return null;
  const minutos = Math.ceil(restantes / 60);
  const urgente = restantes <= 60;
  return (
    <div className="flex items-center gap-2">
      <span
        role="timer"
        aria-label={`Tiempo restante ${formatoReloj(restantes)}`}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-display text-lg font-bold tabular-nums ${
          urgente ? 'border-peligro/40 bg-peligro/10 text-peligro' : 'border-white/15 bg-white/5 text-white'
        }`}
      >
        <Clock size={18} aria-hidden="true" /> {formatoReloj(restantes)}
      </span>
      <span role="status" className="sr-only">
        {AVISOS_MINUTOS.includes(minutos) && restantes % 60 === 0 ? `Quedan ${minutos} minuto${minutos === 1 ? '' : 's'}` : ''}
      </span>
    </div>
  );
}

function Opcion({ opcion, tipo, nombre, marcada, onElegir }) {
  return (
    <label
      className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        marcada ? 'border-gold-bright/50 bg-gold-bright/10 text-white' : 'border-white/10 bg-white/5 text-white/90'
      }`}
    >
      <input type={tipo} name={nombre} checked={marcada} onChange={() => onElegir(opcion.id)} className="h-5 w-5 accent-gold-bright" />
      <span>{opcion.body}</span>
    </label>
  );
}

function Pregunta({ pregunta, numero, total, multiple, seleccion, onElegir }) {
  const enlace = pregunta.mediaKind === 'video_link' ? enlaceSeguro(pregunta.mediaUrl) : null;
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 p-0">
        <span className="block text-sm text-white/60">Pregunta {numero} de {total}</span>
        <span className="mt-1 block text-lg font-semibold text-white">{pregunta.prompt}</span>
      </legend>
      {enlace && (
        <a href={enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-gold-bright">
          Ver video de la pregunta <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      )}
      {multiple && <p className="m-0 text-sm text-white/60">Puede haber más de una respuesta correcta.</p>}
      {pregunta.options.map(o => (
        <Opcion
          key={o.id}
          opcion={o}
          tipo={multiple ? 'checkbox' : 'radio'}
          nombre={`pregunta-${pregunta.id}`}
          marcada={seleccion.includes(o.id)}
          onElegir={onElegir}
        />
      ))}
    </fieldset>
  );
}

function Navegador({ preguntas, actual, respuestas, pendientes, onIr }) {
  return (
    <nav aria-label="Preguntas" className="flex flex-wrap gap-2">
      {preguntas.map((p, i) => {
        const contestada = (respuestas[p.id] ?? []).length > 0;
        const estado = pendientes.has(p.id) ? ', sin guardar' : contestada ? ', contestada' : '';
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onIr(i)}
            aria-current={i === actual ? 'step' : undefined}
            aria-label={`Pregunta ${i + 1}${estado}`}
            className={`relative h-10 w-10 rounded-lg text-sm font-semibold ${
              i === actual ? 'border-2 border-gold-bright text-gold-bright' : 'border border-white/10 text-white/80'
            } ${contestada ? 'bg-white/10' : 'bg-transparent'} ${pendientes.has(p.id) ? 'border-dashed' : ''}`}
          >
            {i + 1}
            {contestada && (
              <Check data-marca="contestada" size={12} strokeWidth={3} aria-hidden="true" className="absolute right-0.5 top-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function useDatosIntento(evaluacionId, intentoId) {
  const [estado, setEstado] = useState({ cargando: true, error: '', preguntas: [], respuestas: {} });
  const cargar = useCallback(async () => {
    setEstado(e => ({ ...e, cargando: true, error: '' }));
    try {
      const [preguntas, respuestas] = await Promise.all([loadQuestions(evaluacionId), loadAnswers(intentoId)]);
      setEstado({ cargando: false, error: '', preguntas, respuestas });
    } catch (e) {
      setEstado(prev => ({ ...prev, cargando: false, error: e.message }));
    }
  }, [evaluacionId, intentoId]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const setRespuestas = useCallback(
    cambio => setEstado(e => ({ ...e, respuestas: cambio(e.respuestas) })),
    [],
  );
  return { ...estado, setRespuestas, recargar: cargar };
}

export default function IntentoEvaluacion({ evaluacion, intento, onTerminado, onSalir }) {
  const { cargando, error, preguntas, respuestas, setRespuestas, recargar } = useDatosIntento(evaluacion.id, intento.id);
  const [pendientes, setPendientes] = useState(() => new Set());
  const [actual, setActual] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [entrega, setEntrega] = useState({ enviando: false, error: '' });
  const terminado = useRef(false);
  const multiple = evaluacion.kind !== 'simulador';

  const terminar = useCallback(async motivo => {
    if (terminado.current) return;
    terminado.current = true;
    setEntrega({ enviando: true, error: '' });
    try {
      onTerminado(await submitAttempt(intento.id), motivo);
    } catch (e) {
      terminado.current = false;
      setEntrega({ enviando: false, error: e.message });
    }
  }, [intento.id, onTerminado]);

  const alVencer = useCallback(() => void terminar('tiempo'), [terminar]);
  const restantes = useSegundosRestantes(intento.expiresAt, alVencer);

  const guardar = useCallback(async (preguntaId, opciones) => {
    try {
      const vigente = await saveAnswer(intento.id, preguntaId, opciones);
      setPendientes(p => { const n = new Set(p); n.delete(preguntaId); return n; });
      if (vigente.status !== 'in_progress') {
        terminado.current = true;
        onTerminado(vigente, 'tiempo');
      }
    } catch {
      setPendientes(p => new Set(p).add(preguntaId));
    }
  }, [intento.id, onTerminado]);

  const reintentarPendientes = useCallback(() => {
    pendientes.forEach(id => void guardar(id, respuestas[id] ?? []));
  }, [pendientes, respuestas, guardar]);

  useEffect(() => {
    window.addEventListener('online', reintentarPendientes);
    return () => window.removeEventListener('online', reintentarPendientes);
  }, [reintentarPendientes]);

  function elegir(pregunta, opcionId) {
    const previa = respuestas[pregunta.id] ?? [];
    let nueva = [opcionId];
    if (multiple) nueva = previa.includes(opcionId) ? previa.filter(id => id !== opcionId) : [...previa, opcionId];
    setRespuestas(r => ({ ...r, [pregunta.id]: nueva }));
    void guardar(pregunta.id, nueva);
  }

  if (cargando) return <p role="status" className="m-0 text-sm text-white/60">Cargando preguntas…</p>;
  if (error) {
    return (
      <EstadoVacio
        titulo="No se pudieron cargar las preguntas"
        descripcion={`${error} Tu intento sigue abierto y el reloj continúa.`}
        accion={<Boton variant="secundario" onClick={recargar}>Reintentar</Boton>}
      />
    );
  }

  const pregunta = preguntas[actual];
  const sinContestar = preguntas.filter(p => !(respuestas[p.id] ?? []).length).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onSalir} className="min-h-[32px] text-sm text-white/70 hover:text-white">
            ← Salir{intento.expiresAt ? ' (el reloj sigue corriendo)' : ''}
          </button>
          <h1 className="m-0 mt-1 font-display text-2xl font-bold text-white">{evaluacion.title}</h1>
        </div>
        <Reloj restantes={restantes} />
      </header>

      {pendientes.size > 0 && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-advertencia/30 bg-advertencia/10 px-4 py-3 text-sm text-advertencia">
          <WifiOff size={18} aria-hidden="true" />
          <span className="flex-1">
            {pendientes.size === 1 ? 'Una respuesta no se ha guardado.' : `${pendientes.size} respuestas no se han guardado.`}{' '}
            Se guardarán al volver la conexión; solo cuentan las guardadas.
          </span>
          <Boton size="sm" variant="secundario" onClick={reintentarPendientes}>Reintentar</Boton>
        </div>
      )}
      {entrega.error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro">
          <span className="flex-1">
            {restantes != null && restantes <= 0 ? 'Se terminó el tiempo, pero no pudimos traer tu resultado. ' : ''}{entrega.error}
          </span>
          <Boton size="sm" variant="secundario" onClick={() => terminar(restantes != null && restantes <= 0 ? 'tiempo' : 'entregado')}>
            Reintentar
          </Boton>
        </div>
      )}

      <Navegador preguntas={preguntas} actual={actual} respuestas={respuestas} pendientes={pendientes} onIr={setActual} />

      {pregunta && (
        <Pregunta
          key={pregunta.id}
          pregunta={pregunta}
          numero={actual + 1}
          total={preguntas.length}
          multiple={multiple}
          seleccion={respuestas[pregunta.id] ?? []}
          onElegir={id => elegir(pregunta, id)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Boton variant="secundario" disabled={actual === 0} onClick={() => setActual(a => a - 1)}>
            <ChevronLeft size={16} aria-hidden="true" /> Anterior
          </Boton>
          <Boton variant="secundario" disabled={actual >= preguntas.length - 1} onClick={() => setActual(a => a + 1)}>
            Siguiente <ChevronRight size={16} aria-hidden="true" />
          </Boton>
        </div>
        <Boton variant="primario" isLoading={entrega.enviando} onClick={() => setConfirmar(true)}>
          Entregar
        </Boton>
      </div>

      <DialogoConfirmacion
        abierto={confirmar}
        titulo="Entregar evaluación"
        mensaje={[
          sinContestar ? `Te falta${sinContestar === 1 ? '' : 'n'} ${sinContestar} pregunta${sinContestar === 1 ? '' : 's'} por contestar.` : 'Contestaste todas las preguntas.',
          pendientes.size ? 'Hay respuestas sin guardar que no contarán.' : '',
          'Después de entregar ya no podrás cambiar tus respuestas.',
        ].filter(Boolean).join(' ')}
        textoConfirmar="Entregar"
        onConfirmar={() => { setConfirmar(false); void terminar('entregado'); }}
        onCancelar={() => setConfirmar(false)}
      />
    </div>
  );
}
