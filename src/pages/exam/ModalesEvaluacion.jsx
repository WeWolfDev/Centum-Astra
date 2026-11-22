// Diálogos de evaluaciones conectadas (#52): datos de la evaluación y pregunta
// con sus opciones, respuesta correcta y explicación.
import { useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TIPOS_EVALUACION } from '../../lib/evaluacionesService';
import Boton from '../../components/rediseno/Boton';
import Input from '../../components/rediseno/Input';
import Modal from '../../components/rediseno/Modal';

const CLASE_CAMPO =
  'w-full rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-3 text-sm text-white font-body ' +
  'outline-none focus:border-gold-bright/40 disabled:opacity-60';
const CLASE_LABEL = 'block mb-1.5 text-xs font-medium text-white/70 tracking-wide';
const MIN_OPCIONES = 2;
const MAX_OPCIONES = 6;
const OPCIONES_INICIALES = 4;

const letra = indice => String.fromCharCode(65 + indice);

function ErrorDialogo({ mensaje }) {
  if (!mensaje) return null;
  return <p role="alert" className="m-0 text-xs text-peligro">{mensaje}</p>;
}

function PieDialogo({ textoConfirmar, guardando, onCancelar }) {
  return (
    <footer className="flex gap-2.5 flex-wrap justify-end">
      <Boton variant="secundario" type="button" onClick={onCancelar}>Cancelar</Boton>
      <Boton variant="primario" type="submit" isLoading={guardando}>{textoConfirmar}</Boton>
    </footer>
  );
}

/**
 * Crea o edita los datos de una evaluación. El tipo solo cambia en borrador
 * (la base lo impide después) y el simulador puede abarcar todas las áreas.
 */
export function ModalEvaluacion({ evaluacion = null, tipos, tipoInicial, modulos, guardando, error, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState(() => ({
    kind: evaluacion?.kind ?? tipoInicial,
    title: evaluacion?.title ?? '',
    description: evaluacion?.description ?? '',
    moduleId: evaluacion?.moduleId ?? (tipoInicial === 'simulador' ? '' : modulos[0]?.id ?? ''),
    timeLimitMinutes: evaluacion?.timeLimitMinutes ?? (tipoInicial === 'simulador' ? 90 : ''),
  }));
  const esSimulador = datos.kind === 'simulador';
  const tipoBloqueado = Boolean(evaluacion) && evaluacion.status !== 'draft';

  const cambiar = campo => e => setDatos(d => ({ ...d, [campo]: e.target.value }));

  function cambiarTipo(e) {
    const kind = e.target.value;
    setDatos(d => ({
      ...d,
      kind,
      moduleId: kind !== 'simulador' && !d.moduleId ? modulos[0]?.id ?? '' : d.moduleId,
      timeLimitMinutes: kind === 'simulador' && !d.timeLimitMinutes ? 90 : d.timeLimitMinutes,
    }));
  }

  function enviar(e) {
    e.preventDefault();
    onGuardar(datos);
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={evaluacion ? 'Editar datos' : 'Nueva evaluación'}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="evaluacion-tipo" className={CLASE_LABEL}>Tipo</label>
          <select id="evaluacion-tipo" className={CLASE_CAMPO} value={datos.kind} onChange={cambiarTipo} disabled={tipoBloqueado}>
            {tipos.map(t => <option key={t} value={t}>{TIPOS_EVALUACION[t]}</option>)}
          </select>
          {tipoBloqueado && <p className="m-0 mt-1.5 text-xs text-white/60">El tipo ya no cambia después de publicar.</p>}
        </div>
        <Input id="evaluacion-titulo" label="Título" value={datos.title} onChange={cambiar('title')} required />
        <div>
          <label htmlFor="evaluacion-area" className={CLASE_LABEL}>Área</label>
          <select id="evaluacion-area" className={CLASE_CAMPO} value={datos.moduleId ?? ''} onChange={cambiar('moduleId')}>
            {esSimulador && <option value="">Todas las áreas del curso</option>}
            {modulos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        {esSimulador && (
          <Input
            id="evaluacion-minutos"
            label="Duración (minutos)"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={datos.timeLimitMinutes}
            onChange={cambiar('timeLimitMinutes')}
            required
          />
        )}
        <div>
          <label htmlFor="evaluacion-descripcion" className={CLASE_LABEL}>Descripción (opcional)</label>
          <textarea id="evaluacion-descripcion" rows={3} className={CLASE_CAMPO} value={datos.description} onChange={cambiar('description')} />
        </div>
        <p className="m-0 text-xs text-white/60">
          Se guarda como borrador. Los alumnos la verán hasta que la publiques.
        </p>
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={evaluacion ? 'Guardar' : 'Crear borrador'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

function opcionesIniciales(pregunta) {
  if (!pregunta) {
    return Array.from({ length: OPCIONES_INICIALES }, (_, i) => ({ clave: i, body: '', correcta: false }));
  }
  return pregunta.options.map((o, i) => ({ clave: i, body: o.body, correcta: pregunta.correctOptionIds.includes(o.id) }));
}

function FilaOpcion({ opcion, indice, unica, grupo, puedeQuitar, onTexto, onCorrecta, onQuitar }) {
  const id = `${grupo}-opcion-${opcion.clave}`;
  return (
    <li className="flex items-center gap-2">
      <input
        id={`${id}-correcta`}
        type={unica ? 'radio' : 'checkbox'}
        name={`${grupo}-correcta`}
        checked={opcion.correcta}
        onChange={e => onCorrecta(e.target.checked)}
        aria-label={`Opción ${letra(indice)} es correcta`}
        className="h-5 w-5 shrink-0 accent-gold-bright cursor-pointer"
      />
      <label htmlFor={id} className="sr-only">Opción {letra(indice)}</label>
      <span aria-hidden="true" className="w-5 shrink-0 text-center text-sm font-semibold text-white/70">{letra(indice)}</span>
      <input id={id} className={CLASE_CAMPO} value={opcion.body} onChange={e => onTexto(e.target.value)} />
      {puedeQuitar && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar opción ${letra(indice)}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-transparent border border-white/10 text-white/70 cursor-pointer hover:bg-white/5"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

/**
 * Crea o edita una pregunta. En simulador hay una sola respuesta correcta
 * (radio); en quiz y cuestionario puede haber varias (checkbox).
 */
export function ModalPregunta({ pregunta = null, numero, kind, guardando, error, onGuardar, onCerrar }) {
  const grupo = useId();
  const siguienteClave = useRef(OPCIONES_INICIALES + (pregunta?.options.length ?? 0));
  const [prompt, setPrompt] = useState(pregunta?.prompt ?? '');
  const [explicacion, setExplicacion] = useState(pregunta?.explanation ?? '');
  const [opciones, setOpciones] = useState(() => opcionesIniciales(pregunta));
  const unica = kind === 'simulador';

  const actualizar = (clave, cambios) =>
    setOpciones(os => os.map(o => (o.clave === clave ? { ...o, ...cambios } : o)));

  function marcar(clave, marcada) {
    if (unica) setOpciones(os => os.map(o => ({ ...o, correcta: o.clave === clave })));
    else actualizar(clave, { correcta: marcada });
  }

  function agregar() {
    const clave = siguienteClave.current;
    siguienteClave.current += 1;
    setOpciones(os => [...os, { clave, body: '', correcta: false }]);
  }

  function enviar(e) {
    e.preventDefault();
    onGuardar({
      prompt,
      explanation: explicacion,
      options: opciones.map(o => o.body),
      correctas: opciones.flatMap((o, i) => (o.correcta ? [i] : [])),
    });
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={pregunta ? `Editar pregunta ${numero}` : `Pregunta ${numero}`} ancho="lg">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor={`${grupo}-enunciado`} className={CLASE_LABEL}>Enunciado</label>
          <textarea
            id={`${grupo}-enunciado`}
            rows={3}
            required
            className={CLASE_CAMPO}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>
        <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
          <legend className={CLASE_LABEL}>Opciones</legend>
          <p className="m-0 text-xs text-white/60">
            {unica ? 'Marca la única respuesta correcta.' : 'Marca una o más respuestas correctas.'} Las opciones vacías no se guardan.
          </p>
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {opciones.map((o, i) => (
              <FilaOpcion
                key={o.clave}
                opcion={o}
                indice={i}
                unica={unica}
                grupo={grupo}
                puedeQuitar={opciones.length > MIN_OPCIONES}
                onTexto={body => actualizar(o.clave, { body })}
                onCorrecta={marcada => marcar(o.clave, marcada)}
                onQuitar={() => setOpciones(os => os.filter(x => x.clave !== o.clave))}
              />
            ))}
          </ul>
          {opciones.length < MAX_OPCIONES && (
            <Boton size="sm" variant="ghost" className="self-start" onClick={agregar}>
              <Plus size={14} aria-hidden="true" /> Agregar opción
            </Boton>
          )}
        </fieldset>
        <div>
          <label htmlFor={`${grupo}-explicacion`} className={CLASE_LABEL}>Explicación (opcional)</label>
          <textarea
            id={`${grupo}-explicacion`}
            rows={2}
            className={CLASE_CAMPO}
            value={explicacion}
            onChange={e => setExplicacion(e.target.value)}
          />
          <p className="m-0 mt-1.5 text-xs text-white/60">El alumno la ve al terminar su intento.</p>
        </div>
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={pregunta ? 'Guardar' : 'Agregar pregunta'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}
