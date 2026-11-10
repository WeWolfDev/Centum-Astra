// Diálogos para crear, editar y archivar cursos, grupos y módulos (#50).
import { useState } from 'react';
import { HORARIOS_SUGERIDOS } from '../../lib/catalogoService';
import Boton from '../../components/rediseno/Boton';
import Input from '../../components/rediseno/Input';
import Modal from '../../components/rediseno/Modal';

const CLASE_TEXTAREA =
  'w-full min-h-[84px] rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-3 text-sm text-white ' +
  'font-body outline-none focus:border-gold-bright/40 resize-y';

function ErrorDialogo({ mensaje }) {
  if (!mensaje) return null;
  return <p role="alert" className="m-0 text-xs text-peligro">{mensaje}</p>;
}

function PieDialogo({ textoConfirmar, variante = 'primario', guardando, onCancelar }) {
  return (
    <footer className="flex gap-2.5 flex-wrap justify-end">
      <Boton variant="secundario" type="button" onClick={onCancelar}>Cancelar</Boton>
      <Boton variant={variante} type="submit" isLoading={guardando}>{textoConfirmar}</Boton>
    </footer>
  );
}

function Descripcion({ id, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">
        Descripción <span className="text-white/60">(opcional)</span>
      </label>
      <textarea id={id} className={CLASE_TEXTAREA} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function Formulario({ titulo, onCerrar, onEnviar, children }) {
  return (
    <Modal abierto onCerrar={onCerrar} titulo={titulo}>
      <form
        onSubmit={e => { e.preventDefault(); onEnviar(); }}
        className="flex flex-col gap-4"
      >
        {children}
      </form>
    </Modal>
  );
}

export function ModalCurso({ curso, guardando, error, onGuardar, onCerrar }) {
  const [name, setName] = useState(curso?.name ?? '');
  const [description, setDescription] = useState(curso?.description ?? '');
  const [startsOn, setStartsOn] = useState(curso?.startsOn ?? '');
  const [endsOn, setEndsOn] = useState(curso?.endsOn ?? '');

  return (
    <Formulario
      titulo={curso ? 'Editar curso' : 'Nuevo curso'}
      onCerrar={onCerrar}
      onEnviar={() => onGuardar({ name, description, startsOn, endsOn })}
    >
      <Input id="curso-nombre" label="Nombre del curso" value={name} onChange={e => setName(e.target.value)} required />
      <Descripcion id="curso-descripcion" value={description} onChange={setDescription} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input id="curso-inicio" type="date" label="Inicio" value={startsOn} onChange={e => setStartsOn(e.target.value)} />
        <Input id="curso-fin" type="date" label="Fin" value={endsOn} onChange={e => setEndsOn(e.target.value)} />
      </div>
      <p className="m-0 text-xs text-white/60">Las fechas aplican a todos los alumnos del curso.</p>
      <ErrorDialogo mensaje={error} />
      <PieDialogo textoConfirmar={curso ? 'Guardar' : 'Crear curso'} guardando={guardando} onCancelar={onCerrar} />
    </Formulario>
  );
}

export function ModalGrupo({ grupo, guardando, error, onGuardar, onCerrar }) {
  const [name, setName] = useState(grupo?.name ?? '');
  const [code, setCode] = useState(grupo?.code ?? '');
  const [schedule, setSchedule] = useState(grupo?.schedule ?? '');

  return (
    <Formulario
      titulo={grupo ? 'Editar grupo' : 'Nuevo grupo'}
      onCerrar={onCerrar}
      onEnviar={() => onGuardar({ name, code, schedule })}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
        <Input id="grupo-nombre" label="Nombre del grupo" value={name} onChange={e => setName(e.target.value)} required />
        <Input id="grupo-codigo" label="Código" value={code} onChange={e => setCode(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Input id="grupo-horario" label="Horario" value={schedule} onChange={e => setSchedule(e.target.value)} required />
        <div className="flex flex-wrap gap-2" aria-label="Horarios sugeridos">
          {HORARIOS_SUGERIDOS.map(h => (
            <Boton key={h} size="sm" variant="secundario" type="button" aria-pressed={schedule === h} onClick={() => setSchedule(h)}>
              {h}
            </Boton>
          ))}
        </div>
      </div>
      <ErrorDialogo mensaje={error} />
      <PieDialogo textoConfirmar={grupo ? 'Guardar' : 'Crear grupo'} guardando={guardando} onCancelar={onCerrar} />
    </Formulario>
  );
}

export function ModalModulo({ modulo, guardando, error, onGuardar, onCerrar }) {
  const [title, setTitle] = useState(modulo?.title ?? '');
  const [description, setDescription] = useState(modulo?.description ?? '');

  return (
    <Formulario
      titulo={modulo ? 'Editar módulo' : 'Nuevo módulo'}
      onCerrar={onCerrar}
      onEnviar={() => onGuardar({ title, description })}
    >
      <Input id="modulo-titulo" label="Título del módulo" value={title} onChange={e => setTitle(e.target.value)} required />
      <Descripcion id="modulo-descripcion" value={description} onChange={setDescription} />
      {!modulo && <p className="m-0 text-xs text-white/60">Se agrega al final de los módulos del curso.</p>}
      <ErrorDialogo mensaje={error} />
      <PieDialogo textoConfirmar={modulo ? 'Guardar' : 'Crear módulo'} guardando={guardando} onCancelar={onCerrar} />
    </Formulario>
  );
}

const AVISO_ARCHIVAR = {
  courses: 'dejará de aparecer en el catálogo. Sus grupos, módulos y alumnos se conservan.',
  groups: 'dejará de aparecer al asignar cuentas y módulos. Sus alumnos se conservan.',
  modules: 'dejará de aparecer para los alumnos. Su material se conserva.',
};

export function ModalArchivar({ tabla, nombre, guardando, error, onConfirmar, onCerrar }) {
  return (
    <Modal abierto onCerrar={onCerrar} titulo="Archivar" ancho="sm">
      <form onSubmit={e => { e.preventDefault(); onConfirmar(); }} className="flex flex-col gap-4">
        <p className="m-0 text-sm text-white/80 leading-relaxed">
          <strong className="text-white">{nombre}</strong> {AVISO_ARCHIVAR[tabla]} Puedes reactivarlo cuando quieras.
        </p>
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar="Archivar" variante="danger" guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}
