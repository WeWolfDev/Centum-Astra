// El administrador elige qué módulos ve cada grupo (#49).
import { useEffect, useState } from 'react';
import { loadGroupModules } from '../../lib/groupModulesService';
import Boton from '../../components/rediseno/Boton';
import Modal from '../../components/rediseno/Modal';
import EstadoGrupos from './EstadoGrupos';

const CARGANDO = { estado: 'cargando', modulos: [], actuales: [], error: '' };

export default function ModalModulosGrupo({ grupos, cargandoGrupos = false, errorGrupos = '', claseSelect, guardando, error, onGuardar, onCerrar }) {
  const [grupoId, setGrupoId] = useState('');
  const [datos, setDatos] = useState(CARGANDO);
  const [elegidos, setElegidos] = useState([]);
  // Si los grupos llegan con el diálogo abierto, se toma el primero en cuanto aparece.
  const grupo = grupos.find(g => g.id === grupoId) ?? grupos[0];

  useEffect(() => {
    if (!grupo) return undefined;
    let vigente = true;
    loadGroupModules(grupo)
      .then(({ modules, enabled }) => {
        if (!vigente) return;
        setDatos({ estado: 'listo', modulos: modules, actuales: enabled, error: '' });
        setElegidos(enabled);
      })
      .catch(e => {
        if (vigente) setDatos({ ...CARGANDO, estado: 'error', error: e.message });
      });
    return () => { vigente = false; };
  }, [grupo]);

  function cambiarGrupo(id) {
    setDatos(CARGANDO);
    setGrupoId(id);
  }

  function alternar(id) {
    setElegidos(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]));
  }

  function enviar(e) {
    e.preventDefault();
    onGuardar(grupo, datos.actuales, elegidos);
  }

  const puedeGuardar = datos.estado === 'listo' && datos.modulos.length > 0;

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Módulos por grupo">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {grupos.length === 0 && <EstadoGrupos cargando={cargandoGrupos} error={errorGrupos} />}
        {grupos.length > 0 && (
          <div>
            <label htmlFor="modulos-grupo" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Grupo</label>
            <select id="modulos-grupo" className={claseSelect} value={grupo?.id ?? ''} onChange={e => cambiarGrupo(e.target.value)}>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.course ? `${g.name} · ${g.course}` : g.name}</option>)}
            </select>
          </div>
        )}
        {grupos.length > 0 && datos.estado === 'cargando' && <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>}
        {datos.estado === 'error' && <p role="alert" className="m-0 text-xs text-peligro">{datos.error}</p>}
        {datos.estado === 'listo' && datos.modulos.length === 0 && (
          <p className="m-0 text-sm text-white/70">Este curso aún no tiene módulos.</p>
        )}
        {puedeGuardar && (
          <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
            <legend className="mb-1.5 text-xs font-medium text-white/70 tracking-wide">Módulos habilitados</legend>
            {datos.modulos.map(m => (
              <label key={m.id} className="flex items-center gap-2.5 text-sm text-white/85 cursor-pointer">
                <input type="checkbox" checked={elegidos.includes(m.id)} onChange={() => alternar(m.id)} />
                {m.title}
              </label>
            ))}
          </fieldset>
        )}
        {error && <p role="alert" className="m-0 text-xs text-peligro">{error}</p>}
        <footer className="flex gap-2.5 flex-wrap justify-end">
          <Boton variant="secundario" type="button" onClick={onCerrar}>Cancelar</Boton>
          {puedeGuardar && <Boton variant="primario" type="submit" isLoading={guardando}>Guardar</Boton>}
        </footer>
      </form>
    </Modal>
  );
}
