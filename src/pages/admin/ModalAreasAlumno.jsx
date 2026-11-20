// El administrador le da a un alumno otras áreas completas, además de las de su grupo (#61).
import { useEffect, useState } from 'react';
import { loadStudentAreas } from '../../lib/areasExtraService';
import Boton from '../../components/rediseno/Boton';
import Modal from '../../components/rediseno/Modal';
import EstadoGrupos from './EstadoGrupos';

const CARGANDO = { estado: 'cargando', modulos: [], delGrupo: [], actuales: [], error: '' };

function Mensaje({ children }) {
  return <p className="m-0 text-sm text-white/70">{children}</p>;
}

function ListaAreas({ modulos, delGrupo, elegidos, onAlternar }) {
  return (
    <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
      <legend className="mb-1.5 text-xs font-medium text-white/70 tracking-wide">Áreas del curso</legend>
      {modulos.map(m => {
        const porGrupo = delGrupo.includes(m.id);
        return (
          <label key={m.id} className="flex items-center gap-2.5 text-sm text-white/85 cursor-pointer">
            <input
              type="checkbox"
              checked={porGrupo || elegidos.includes(m.id)}
              disabled={porGrupo}
              onChange={() => onAlternar(m.id)}
            />
            {m.title}
            {porGrupo && <span className="text-xs text-white/60">· incluida en su grupo</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

export default function ModalAreasAlumno({ usuario, grupos, cargandoGrupos = false, errorGrupos = '', guardando, error, onGuardar, onCerrar }) {
  const grupoId = usuario.groups[0]?.id;
  const grupo = grupos.find(g => g.id === grupoId);
  const [datos, setDatos] = useState(CARGANDO);
  const [elegidos, setElegidos] = useState([]);

  useEffect(() => {
    if (!grupo) return undefined;
    let vigente = true;
    loadStudentAreas(usuario.id, grupo)
      .then(({ modules, fromGroup, extra }) => {
        if (!vigente) return;
        setDatos({ estado: 'listo', modulos: modules, delGrupo: fromGroup, actuales: extra, error: '' });
        setElegidos(extra);
      })
      .catch(e => {
        if (vigente) setDatos({ ...CARGANDO, estado: 'error', error: e.message });
      });
    return () => { vigente = false; };
  }, [usuario.id, grupo]);

  function alternar(id) {
    setElegidos(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]));
  }

  function enviar(e) {
    e.preventDefault();
    onGuardar(datos.actuales, elegidos);
  }

  const listo = Boolean(grupo) && datos.estado === 'listo';
  const hayExtras = listo && datos.modulos.some(m => !datos.delGrupo.includes(m.id));
  const esperandoGrupos = Boolean(grupoId) && !grupo && (cargandoGrupos || errorGrupos);

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Áreas de ${usuario.name}`}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Mensaje>Un área extra le da acceso a todas las clases y materiales de ese módulo. Sigue en su mismo grupo.</Mensaje>
        {!grupoId && <Mensaje>Asigna primero un grupo: las áreas se eligen entre los módulos de su curso.</Mensaje>}
        {esperandoGrupos && <EstadoGrupos cargando={cargandoGrupos} error={errorGrupos} />}
        {grupoId && !grupo && !esperandoGrupos && <Mensaje>Su grupo ya no está activo. Asígnale un grupo activo primero.</Mensaje>}
        {grupo && datos.estado === 'cargando' && <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>}
        {datos.estado === 'error' && <p role="alert" className="m-0 text-xs text-peligro">{datos.error}</p>}
        {listo && datos.modulos.length === 0 && <Mensaje>Este curso aún no tiene módulos.</Mensaje>}
        {listo && datos.modulos.length > 0 && !hayExtras && <Mensaje>Su grupo ya incluye todas las áreas del curso.</Mensaje>}
        {hayExtras && <ListaAreas modulos={datos.modulos} delGrupo={datos.delGrupo} elegidos={elegidos} onAlternar={alternar} />}
        {error && <p role="alert" className="m-0 text-xs text-peligro">{error}</p>}
        <footer className="flex gap-2.5 flex-wrap justify-end">
          <Boton variant="secundario" type="button" onClick={onCerrar}>Cancelar</Boton>
          {hayExtras && <Boton variant="primario" type="submit" isLoading={guardando}>Guardar</Boton>}
        </footer>
      </form>
    </Modal>
  );
}
