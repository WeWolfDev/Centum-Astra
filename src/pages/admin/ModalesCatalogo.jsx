// Diálogos para crear, editar y archivar cursos, grupos y módulos (#50).
import { useEffect, useRef, useState } from 'react';
import { HORARIOS_SUGERIDOS, TIPOS_IMAGEN_MODULO, validarImagenModulo } from '../../lib/catalogoService';
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
  const [generation, setGeneration] = useState(grupo?.generation ?? '');

  return (
    <Formulario
      titulo={grupo ? 'Editar grupo' : 'Nuevo grupo'}
      onCerrar={onCerrar}
      onEnviar={() => onGuardar({ name, code, schedule, generation })}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
        <Input id="grupo-nombre" label="Nombre del grupo" value={name} onChange={e => setName(e.target.value)} required />
        <Input id="grupo-codigo" label="Código" value={code} onChange={e => setCode(e.target.value)} required />
      </div>
      <Input
        id="grupo-generacion"
        label="Generación (opcional)"
        placeholder="Por ejemplo, 2027"
        maxLength={60}
        value={generation}
        onChange={e => setGeneration(e.target.value)}
      />
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

// Imagen opcional del módulo; sin ella, la tarjeta usa la del área.
// La URL de la vista previa se crea al elegir el archivo, no al renderizar: así
// StrictMode no crea URLs de más. Se libera al cambiarla y al cerrar el diálogo.
function ImagenModulo({ actual, quitar, onElegir, onQuitar }) {
  const [aviso, setAviso] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const ultima = useRef(null);
  useEffect(() => () => { if (ultima.current) URL.revokeObjectURL(ultima.current); }, []);

  function mostrar(url) {
    if (ultima.current) URL.revokeObjectURL(ultima.current);
    ultima.current = url;
    setVistaPrevia(url);
  }

  const imagen = vistaPrevia ?? (quitar ? null : actual);

  function elegir(e) {
    const elegido = e.target.files?.[0];
    e.target.value = '';
    if (!elegido) return;
    try {
      validarImagenModulo(elegido);
      setAviso(null);
      mostrar(URL.createObjectURL(elegido));
      onElegir(elegido);
    } catch (err) {
      setAviso(err.message);
    }
  }

  return (
    <div>
      <span className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">
        Imagen <span className="text-white/60">(opcional)</span>
      </span>
      {imagen ? (
        <img src={imagen} alt="Vista previa de la imagen del módulo" className="mb-2 h-28 w-full rounded-[10px] object-cover" />
      ) : (
        <p className="m-0 mb-2 text-xs text-white/60">Sin imagen propia: se usa la del área.</p>
      )}
      <div className="flex gap-2.5 flex-wrap">
        <label className="btn-ghost inline-flex cursor-pointer items-center rounded-[10px] px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-gold-bright">
          {imagen ? 'Cambiar imagen' : 'Elegir imagen'}
          <input type="file" accept={TIPOS_IMAGEN_MODULO.join(',')} onChange={elegir} className="sr-only" />
        </label>
        {imagen && <Boton variant="secundario" size="sm" type="button" onClick={() => { mostrar(null); onQuitar(); }}>Quitar imagen</Boton>}
      </div>
      <p className="m-0 mt-1.5 text-xs text-white/60">JPG, PNG o WebP, hasta 5 MB.</p>
      {aviso && <p role="alert" className="m-0 mt-1.5 text-xs text-peligro">{aviso}</p>}
    </div>
  );
}

export function ModalModulo({ modulo, guardando, error, onGuardar, onCerrar }) {
  const [title, setTitle] = useState(modulo?.title ?? '');
  const [description, setDescription] = useState(modulo?.description ?? '');
  const [imagen, setImagen] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);

  return (
    <Formulario
      titulo={modulo ? 'Editar módulo' : 'Nuevo módulo'}
      onCerrar={onCerrar}
      onEnviar={() => onGuardar({ title, description, imagen, quitarImagen: quitarImagen && !imagen })}
    >
      <Input id="modulo-titulo" label="Título del módulo" value={title} onChange={e => setTitle(e.target.value)} required />
      <Descripcion id="modulo-descripcion" value={description} onChange={setDescription} />
      <ImagenModulo
        actual={modulo?.imageUrl ?? null}
        quitar={quitarImagen}
        onElegir={archivo => { setImagen(archivo); setQuitarImagen(false); }}
        onQuitar={() => { setImagen(null); setQuitarImagen(true); }}
      />
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
