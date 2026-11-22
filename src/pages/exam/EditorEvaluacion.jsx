// Editor de una evaluación (#52): datos, preguntas con su respuesta correcta,
// publicar y archivar. La base valida lo mismo al guardar (CA020, CA021, CA024).
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  addQuestion,
  archiveEvaluation,
  deleteEvaluation,
  deleteQuestion,
  ESTADOS,
  loadEvaluation,
  TONO_ESTADO,
  publishEvaluation,
  puedeEditar,
  updateEvaluation,
  updateQuestion,
} from '../../lib/evaluacionesGestionService';
import { TIPOS_EVALUACION } from '../../lib/evaluacionesService';
import { Aviso } from '../../components/rediseno/Aviso';
import Boton from '../../components/rediseno/Boton';
import DialogoConfirmacion from '../../components/rediseno/DialogoConfirmacion';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import useCarga from '../../hooks/useCarga';
import { ModalEvaluacion, ModalPregunta } from './ModalesEvaluacion';

const letra = indice => String.fromCharCode(65 + indice);

function TarjetaPregunta({ pregunta, numero, editable, onEditar, onBorrar }) {
  const correctas = new Set(pregunta.correctOptionIds);
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="m-0 flex-1 min-w-[180px] text-base font-semibold text-white">
          <span className="text-white/60">{numero}. </span>{pregunta.prompt}
        </h3>
        {editable && (
          <div className="flex gap-1">
            <Boton size="sm" variant="ghost" onClick={onEditar} aria-label={`Editar pregunta ${numero}`}>
              <Pencil size={14} aria-hidden="true" /> Editar
            </Boton>
            <Boton size="sm" variant="ghost" onClick={onBorrar} aria-label={`Borrar pregunta ${numero}`}>
              <Trash2 size={14} aria-hidden="true" /> Borrar
            </Boton>
          </div>
        )}
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {pregunta.options.map((o, i) => {
          const correcta = correctas.has(o.id);
          return (
            <li
              key={o.id}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${correcta ? 'bg-exito/10 border border-exito/30 text-white' : 'border border-white/10 text-white/80'}`}
            >
              <span aria-hidden="true" className="font-semibold text-white/60">{letra(i)}</span>
              <span className="flex-1 min-w-0 break-words">{o.body}</span>
              {correcta && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-exito">
                  <CheckCircle2 size={14} aria-hidden="true" /> Correcta
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {pregunta.explanation && (
        <p className="m-0 text-sm text-white/70"><span className="font-semibold text-white/80">Explicación: </span>{pregunta.explanation}</p>
      )}
    </li>
  );
}

function confirmacionDe(dialogo, evaluacion) {
  if (dialogo?.tipo === 'publicar') {
    return {
      titulo: 'Publicar evaluación',
      mensaje: `Los alumnos con acceso verán "${evaluacion.title}" y podrán resolverla. Cuando alguien la intente, sus preguntas ya no se podrán cambiar.`,
      accion: () => publishEvaluation(evaluacion.id),
      exito: 'Evaluación publicada.',
      textoConfirmar: 'Publicar',
      tono: 'neutral',
    };
  }
  if (dialogo?.tipo === 'archivar') {
    return {
      titulo: 'Archivar evaluación',
      mensaje: `Los alumnos dejarán de ver "${evaluacion.title}". Sus resultados se conservan.`,
      accion: () => archiveEvaluation(evaluacion.id),
      exito: 'Evaluación archivada.',
      textoConfirmar: 'Archivar',
      tono: 'danger',
    };
  }
  if (dialogo?.tipo === 'eliminar') {
    return {
      titulo: 'Eliminar borrador',
      mensaje: `"${evaluacion.title}" y sus preguntas se borrarán.`,
      accion: () => deleteEvaluation(evaluacion.id),
      exito: null,
      textoConfirmar: 'Eliminar',
      tono: 'danger',
    };
  }
  if (dialogo?.tipo === 'borrarPregunta') {
    return {
      titulo: `Borrar pregunta ${dialogo.numero}`,
      mensaje: `"${dialogo.pregunta.prompt}" y sus opciones se borrarán.`,
      accion: () => deleteQuestion(dialogo.pregunta.id),
      exito: 'Pregunta borrada.',
      textoConfirmar: 'Borrar',
      tono: 'danger',
    };
  }
  return null;
}

export default function EditorEvaluacion({ evaluacionId, modulos, tipos, onVolver }) {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';
  const titulo = useRef(null);
  const cargar = useCallback(() => loadEvaluation(evaluacionId), [evaluacionId]);
  const { cargando, error, datos: evaluacion, recargar } = useCarga(cargar);
  const [dialogo, setDialogo] = useState(null);
  const [errorDialogo, setErrorDialogo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  // Al abrir el editor, el foco va a su título para que el lector lo anuncie.
  const cargado = Boolean(evaluacion);
  useEffect(() => {
    if (cargado) titulo.current?.focus();
  }, [cargado]);

  const abrir = useCallback((tipo, extra = {}) => {
    setErrorDialogo('');
    setAviso(null);
    setDialogo({ tipo, ...extra });
  }, []);
  const cerrar = useCallback(() => setDialogo(null), []);

  async function guardar(accion, exito) {
    setErrorDialogo('');
    setGuardando(true);
    try {
      await accion();
      setDialogo(null);
      setAviso({ tipo: 'exito', mensaje: exito });
      await recargar();
    } catch (e) {
      setErrorDialogo(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const confirmacion = evaluacion ? confirmacionDe(dialogo, evaluacion) : null;

  async function confirmar() {
    const { accion, exito } = confirmacion;
    setDialogo(null);
    try {
      await accion();
      if (!exito) {
        onVolver();
        return;
      }
      setAviso({ tipo: 'exito', mensaje: exito });
      await recargar();
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: e.message });
    }
  }

  const volver = (
    <Boton variant="ghost" size="sm" className="self-start" onClick={onVolver}>
      <ArrowLeft size={14} aria-hidden="true" /> Volver a la lista
    </Boton>
  );

  if (!evaluacion) {
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      </div>
    );
  }

  const editable = puedeEditar(evaluacion, user);
  const conIntentos = evaluacion.attemptCount > 0;
  const preguntasEditables = editable && !conIntentos && evaluacion.status !== 'archived';
  const area = modulos.find(m => m.id === evaluacion.moduleId)?.title ?? 'Todas las áreas';
  const propsDialogo = { guardando, error: errorDialogo, onCerrar: cerrar };

  return (
    <div className="flex flex-col gap-5">
      {volver}
      <section aria-labelledby="editor-titulo" className="flex flex-col gap-3">
        <h2 id="editor-titulo" ref={titulo} tabIndex={-1} className="m-0 font-display text-2xl font-bold text-white outline-none">
          {evaluacion.title}
        </h2>
        {evaluacion.description && <p className="m-0 text-sm text-white/70">{evaluacion.description}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
          <Pastilla tono={evaluacion.kind === 'simulador' ? 'tipo-simulador' : 'tipo-quiz'}>{TIPOS_EVALUACION[evaluacion.kind]}</Pastilla>
          <Pastilla tono={TONO_ESTADO[evaluacion.status]}>{ESTADOS[evaluacion.status]}</Pastilla>
          <span>{area}</span>
          {evaluacion.timeLimitMinutes && (
            <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {evaluacion.timeLimitMinutes} min</span>
          )}
          <span>{evaluacion.attemptCount} intento{evaluacion.attemptCount === 1 ? '' : 's'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && evaluacion.status !== 'archived' && (
            <Boton size="sm" variant="secundario" onClick={() => abrir('datos')}>
              <Pencil size={14} aria-hidden="true" /> Editar datos
            </Boton>
          )}
          {editable && evaluacion.status === 'draft' && (
            <Boton size="sm" variant="primario" onClick={() => abrir('publicar')}>Publicar</Boton>
          )}
          {esAdmin && evaluacion.status !== 'archived' && (
            <Boton size="sm" variant="secundario" onClick={() => abrir('archivar')}>Archivar</Boton>
          )}
          {editable && evaluacion.status === 'draft' && !conIntentos && (
            <Boton size="sm" variant="ghost" onClick={() => abrir('eliminar')}>
              <Trash2 size={14} aria-hidden="true" /> Eliminar borrador
            </Boton>
          )}
        </div>
        {!editable && (
          <p className="m-0 text-xs text-white/60">Solo quien la creó o un administrador puede editarla.</p>
        )}
        {editable && conIntentos && (
          <p className="m-0 text-xs text-white/60">Ya tiene intentos: sus preguntas no se pueden cambiar. Crea otra para corregirla.</p>
        )}
      </section>

      {aviso && <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} onCerrar={() => setAviso(null)} />}

      <section aria-labelledby="editor-preguntas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="editor-preguntas" className="m-0 font-display text-xl font-bold text-white">
            Preguntas <span className="text-base font-normal text-white/60">({evaluacion.questions.length})</span>
          </h2>
          {preguntasEditables && (
            <Boton size="sm" variant="primario" onClick={() => abrir('nuevaPregunta')}>
              <Plus size={14} aria-hidden="true" /> Agregar pregunta
            </Boton>
          )}
        </div>
        {evaluacion.questions.length === 0 ? (
          <EstadoVacio
            titulo="Sin preguntas"
            descripcion="Agrega al menos una pregunta con dos opciones y su respuesta correcta para poder publicarla."
          />
        ) : (
          <ol className="m-0 p-0 list-none flex flex-col gap-3">
            {evaluacion.questions.map((q, i) => (
              <TarjetaPregunta
                key={q.id}
                pregunta={q}
                numero={i + 1}
                editable={preguntasEditables}
                onEditar={() => abrir('editarPregunta', { pregunta: q, numero: i + 1 })}
                onBorrar={() => abrir('borrarPregunta', { pregunta: q, numero: i + 1 })}
              />
            ))}
          </ol>
        )}
      </section>

      {dialogo?.tipo === 'datos' && (
        <ModalEvaluacion
          evaluacion={evaluacion}
          tipos={tipos}
          modulos={modulos}
          onGuardar={datos => guardar(() => updateEvaluation(evaluacion.id, datos), 'Datos guardados.')}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'nuevaPregunta' && (
        <ModalPregunta
          numero={evaluacion.questions.length + 1}
          kind={evaluacion.kind}
          onGuardar={p => guardar(() => addQuestion(evaluacion, p), 'Pregunta agregada.')}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'editarPregunta' && (
        <ModalPregunta
          pregunta={dialogo.pregunta}
          numero={dialogo.numero}
          kind={evaluacion.kind}
          onGuardar={p => guardar(() => updateQuestion(evaluacion, dialogo.pregunta.id, p), 'Pregunta guardada.')}
          {...propsDialogo}
        />
      )}
      <DialogoConfirmacion
        abierto={Boolean(confirmacion)}
        tono={confirmacion?.tono}
        titulo={confirmacion?.titulo ?? ''}
        mensaje={confirmacion?.mensaje ?? ''}
        textoConfirmar={confirmacion?.textoConfirmar}
        onConfirmar={confirmar}
        onCancelar={cerrar}
      />
    </div>
  );
}
