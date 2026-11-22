// Resultado de un intento terminado (#36). Las cifras son las que guardó el
// servidor al calificar; las respuestas correctas y las explicaciones solo
// llegan con attempt_review, que las niega mientras el intento sigue abierto.
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { formatoReloj, loadQuestions, reviewAttempt, tienePuntaje } from '../../lib/evaluacionesService';
import { SIMULADOR_RANGO_CENEVAL } from '../../config/rediseno';
import Boton from '../../components/rediseno/Boton';
import EstadoVacio from '../../components/rediseno/EstadoVacio';

const NOTA_ESTIMACION = 'Estimación. No es resultado oficial del Ceneval.';

const MOTIVOS = {
  tiempo: 'Se terminó el tiempo. Se calificó con las respuestas que alcanzaron a guardarse.',
  entregado: 'Entregaste tu evaluación.',
};

function Cifra({ etiqueta, valor }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <dt className="text-sm text-white/60">{etiqueta}</dt>
      <dd className="m-0 font-display text-3xl font-bold text-white">{valor}</dd>
    </div>
  );
}

function marcaDeOpcion(opcion, fila) {
  const correcta = fila.correct.includes(opcion.id);
  const elegida = fila.selected.includes(opcion.id);
  if (correcta) return { Icono: CheckCircle2, clase: 'border-exito/40 bg-exito/10 text-exito', nota: elegida ? 'Tu respuesta, correcta' : 'Respuesta correcta' };
  if (elegida) return { Icono: XCircle, clase: 'border-white/20 bg-white/10 text-white', nota: 'Tu respuesta' };
  return { Icono: Circle, clase: 'border-white/10 text-white/80', nota: '' };
}

function Revision({ preguntas, filas }) {
  const porPregunta = new Map(filas.map(f => [f.questionId, f]));
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {preguntas.map((p, i) => {
        const fila = porPregunta.get(p.id);
        if (!fila) return null;
        return (
          <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="m-0 text-base font-semibold text-white">{i + 1}. {p.prompt}</h3>
              <span className={`text-sm font-semibold ${fila.isCorrect ? 'text-exito' : 'text-white/70'}`}>
                {fila.isCorrect ? 'Correcta' : fila.selected.length ? 'Incorrecta' : 'Sin contestar'}
              </span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {p.options.map(o => {
                const { Icono, clase, nota } = marcaDeOpcion(o, fila);
                return (
                  <li key={o.id} className={`flex items-center gap-3 rounded-xl border px-4 py-2 text-sm ${clase}`}>
                    <Icono size={18} aria-hidden="true" className="shrink-0" />
                    <span className="flex-1 text-white/90">{o.body}</span>
                    {nota && <span className="text-xs font-semibold">{nota}</span>}
                  </li>
                );
              })}
            </ul>
            {fila.explanation && <p className="m-0 text-sm leading-relaxed text-white/80">{fila.explanation}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export default function ResultadoIntento({ evaluacion, intento, motivo, onVolver }) {
  const [estado, setEstado] = useState({ cargando: true, error: '', preguntas: [], filas: [] });

  const cargar = useCallback(async () => {
    setEstado(e => ({ ...e, cargando: true, error: '' }));
    try {
      const [preguntas, filas] = await Promise.all([loadQuestions(evaluacion.id), reviewAttempt(intento.id)]);
      setEstado({ cargando: false, error: '', preguntas, filas });
    } catch (e) {
      setEstado({ cargando: false, error: e.message, preguntas: [], filas: [] });
    }
  }, [evaluacion.id, intento.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const conPuntaje = tienePuntaje(evaluacion.kind) && intento.score != null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-2xl font-bold text-white">Resultado: {evaluacion.title}</h1>
        {MOTIVOS[motivo] && <p role="status" className="m-0 text-sm text-white/80">{MOTIVOS[motivo]}</p>}
        {!motivo && intento.status === 'expired' && <p className="m-0 text-sm text-white/80">{MOTIVOS.tiempo}</p>}
      </header>

      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        <Cifra etiqueta="Aciertos" valor={`${intento.correctCount} / ${intento.totalQuestions}`} />
        <Cifra etiqueta="Porcentaje" valor={`${intento.percent?.toLocaleString('es-MX')} %`} />
        {conPuntaje
          ? <Cifra etiqueta="Puntaje estimado" valor={intento.score.toLocaleString('es-MX')} />
          : <Cifra etiqueta="Duración" valor={formatoReloj(intento.durationSeconds ?? 0)} />}
      </dl>
      {conPuntaje && (
        <p className="m-0 text-xs text-white/60">
          {NOTA_ESTIMACION} Puntaje en escala {SIMULADOR_RANGO_CENEVAL.min}–{SIMULADOR_RANGO_CENEVAL.max}.
        </p>
      )}

      <section aria-labelledby="revision" className="flex flex-col gap-3">
        <h2 id="revision" className="m-0 font-display text-xl font-bold text-white">Tus respuestas</h2>
        {estado.cargando && <p role="status" className="m-0 text-sm text-white/60">Cargando respuestas…</p>}
        {estado.error && (
          <EstadoVacio
            titulo="No se pudieron cargar tus respuestas"
            descripcion={estado.error}
            accion={<Boton variant="secundario" onClick={cargar}>Reintentar</Boton>}
          />
        )}
        {!estado.cargando && !estado.error && <Revision preguntas={estado.preguntas} filas={estado.filas} />}
      </section>

      <Boton variant="secundario" onClick={onVolver} className="self-start">Volver a simuladores y quizzes</Boton>
    </div>
  );
}
