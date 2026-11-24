// Diálogos de Material conectado (#34, #85, #81): tema, clase, enlace y archivo.
import { useState } from 'react';
import { problemaDeArchivo, TIPOS_ENLACE } from '../../lib/materialService';
import Boton from '../../components/rediseno/Boton';
import Input from '../../components/rediseno/Input';
import Modal from '../../components/rediseno/Modal';

const CLASE_SELECT =
  'w-full rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-3 text-sm text-white font-body ' +
  'outline-none focus:border-gold-bright/40';

function ErrorDialogo({ mensaje }) {
  if (!mensaje) return null;
  return <p role="alert" className="m-0 text-xs text-peligro">{mensaje}</p>;
}

function PieDialogo({ textoConfirmar, guardando, onCancelar }) {
  return (
    <footer className="flex gap-2.5 flex-wrap justify-end">
      <Boton variant="secundario" type="button" onClick={onCancelar} disabled={guardando}>Cancelar</Boton>
      <Boton variant="primario" type="submit" isLoading={guardando}>{textoConfirmar}</Boton>
    </footer>
  );
}

/** Crea un tema o renombra el que llega en `tema`. */
export function ModalNombreTema({ tema = null, nombreModulo, guardando, error, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(tema?.title ?? '');

  function enviar(e) {
    e.preventDefault();
    onGuardar(nombre);
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={tema ? 'Renombrar tema' : `Nuevo tema de ${nombreModulo}`} ancho="sm">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Input id="tema-nombre" label="Nombre del tema" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={tema ? 'Guardar' : 'Crear tema'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

/**
 * Crea una clase dentro de un tema o renombra la que llega en `clase`. Sin
 * temas en el módulo, la base la deja en el tema General.
 */
export function ModalNombreClase({ clase = null, nombreModulo, temas = [], guardando, error, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(clase?.title ?? '');
  const [temaId, setTemaId] = useState(temas[0]?.id ?? '');

  function enviar(e) {
    e.preventDefault();
    onGuardar(nombre, temaId || null);
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={clase ? 'Renombrar clase' : `Nueva clase de ${nombreModulo}`} ancho="sm">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {!clase && temas.length > 0 && (
          <div>
            <label htmlFor="clase-tema" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Tema</label>
            <select id="clase-tema" className={CLASE_SELECT} value={temaId} onChange={e => setTemaId(e.target.value)}>
              {temas.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        )}
        <Input id="clase-nombre" label="Nombre de la clase" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={clase ? 'Guardar' : 'Crear clase'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

/** Agrega un enlace a `clase` o corrige el título y la URL de `material`; el tipo no cambia. */
export function ModalEnlace({ clase = null, material = null, guardando, error, onGuardar, onCerrar }) {
  const [titulo, setTitulo] = useState(material?.title ?? '');
  const [url, setUrl] = useState(material?.url ?? '');
  const [tipo, setTipo] = useState(TIPOS_ENLACE[0].valor);

  function enviar(e) {
    e.preventDefault();
    onGuardar(material ? { title: titulo, url } : { title: titulo, url, kind: tipo });
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={material ? `Editar ${material.title}` : `Agregar enlace a ${clase.title}`}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {!material && (
          <div>
            <label htmlFor="enlace-tipo" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Tipo</label>
            <select id="enlace-tipo" className={CLASE_SELECT} value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS_ENLACE.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
            </select>
          </div>
        )}
        <Input id="enlace-titulo" label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        <Input
          id="enlace-url"
          label="Enlace"
          type="url"
          placeholder="https://drive.google.com/…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <p className="m-0 text-xs text-white/60">
          {material
            ? 'El cambio se publica de inmediato. Se conservan las aperturas y los reportes del enlace.'
            : 'Se publica de inmediato para los alumnos con acceso a esta área. Si es de Drive, compártelo para que cualquiera con el enlace pueda verlo.'}
        </p>
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={material ? 'Guardar' : 'Publicar'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

const TEXTOS_ARCHIVO = {
  subir: { confirmar: 'Subir y publicar', ocupado: 'Subiendo…' },
  reemplazar: { confirmar: 'Reemplazar', ocupado: 'Reemplazando…' },
  reintentar: { confirmar: 'Subir y publicar', ocupado: 'Subiendo…' },
};

/**
 * Sube un archivo nuevo (`clase`) o reemplaza o termina el de `material`.
 * Revisa tamaño, ejecutables y extensión antes de enviar; la base vuelve a
 * revisarlos al subir y al confirmar.
 */
export function ModalArchivo({ modo, clase = null, material = null, guardando, error, onGuardar, onCerrar }) {
  const [titulo, setTitulo] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [problema, setProblema] = useState('');
  const rutaAnterior = modo === 'subir' ? undefined : material.storagePath;
  const textos = TEXTOS_ARCHIVO[modo];
  const nombreAnterior = material?.fileName ?? material?.storagePath?.split('/').pop();
  const titulos = {
    subir: `Subir archivo a ${clase?.title}`,
    reemplazar: `Reemplazar ${material?.title}`,
    reintentar: `Terminar la carga de ${material?.title}`,
  };

  function elegir(e) {
    const elegido = e.target.files?.[0] ?? null;
    setArchivo(elegido);
    setProblema(elegido ? problemaDeArchivo(elegido, rutaAnterior) ?? '' : '');
  }

  function enviar(e) {
    e.preventDefault();
    const motivo = problemaDeArchivo(archivo, rutaAnterior);
    if (motivo) {
      setProblema(motivo);
      return;
    }
    onGuardar(modo === 'subir' ? { title: titulo, file: archivo } : archivo);
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={titulos[modo]}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {modo === 'subir' && (
          <Input id="archivo-titulo" label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        )}
        <div>
          <label htmlFor="archivo-elegir" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Archivo</label>
          <input
            id="archivo-elegir"
            type="file"
            onChange={elegir}
            aria-describedby="archivo-ayuda"
            className="block w-full text-sm text-white/80 file:mr-3 file:rounded-[10px] file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </div>
        <p id="archivo-ayuda" className="m-0 text-xs text-white/60">
          {modo === 'subir' && 'Hasta 50 MB. Se aceptan documentos, imágenes y comprimidos; no se aceptan programas ejecutables. Se publica en cuanto termina de subirse.'}
          {modo === 'reemplazar' && `Debe ser del mismo formato (${nombreAnterior}). El archivo anterior se borra y los alumnos que ya lo abrieron verán un aviso.`}
          {modo === 'reintentar' && `La carga anterior no terminó. Elige de nuevo el archivo (${nombreAnterior}); se publica en cuanto termina de subirse.`}
        </p>
        {guardando && <p role="status" className="m-0 text-xs text-white/70">{textos.ocupado}</p>}
        <ErrorDialogo mensaje={problema || error} />
        <PieDialogo textoConfirmar={textos.confirmar} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}
