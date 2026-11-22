// Diálogos de Material conectado (#34, #85): tema, clase y enlace nuevo.
import { useState } from 'react';
import { TIPOS_ENLACE } from '../../lib/materialService';
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
      <Boton variant="secundario" type="button" onClick={onCancelar}>Cancelar</Boton>
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

export function ModalEnlace({ clase, guardando, error, onGuardar, onCerrar }) {
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [tipo, setTipo] = useState(TIPOS_ENLACE[0].valor);

  function enviar(e) {
    e.preventDefault();
    onGuardar({ title: titulo, url, kind: tipo });
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Agregar enlace a ${clase.title}`}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="enlace-tipo" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Tipo</label>
          <select id="enlace-tipo" className={CLASE_SELECT} value={tipo} onChange={e => setTipo(e.target.value)}>
            {TIPOS_ENLACE.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>
        </div>
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
          Se publica de inmediato para los alumnos con acceso a esta área. Si es de Drive, compártelo
          para que cualquiera con el enlace pueda verlo.
        </p>
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar="Publicar" guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}
