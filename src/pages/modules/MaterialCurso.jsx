// Material con datos reales de Supabase (#34), para maestro y administrador.
// Los archivos (PDF, Word) llegan con Storage (#28); por ahora, enlaces.
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ExternalLink, Link2, Pencil, Play, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  addLink,
  archiveSession,
  createSession,
  enlaceSeguro,
  listMaterialCourses,
  listModuleSessions,
  renameSession,
  retireMaterial,
} from '../../lib/materialService';
import { Aviso } from '../../components/rediseno/Aviso';
import Boton from '../../components/rediseno/Boton';
import DialogoConfirmacion from '../../components/rediseno/DialogoConfirmacion';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pestanas from '../../components/rediseno/Pestanas';
import SelectorAreas from '../../components/rediseno/SelectorAreas';
import { ModalEnlace, ModalNombreClase } from './ModalesMaterial';

const CLASE_SELECT =
  'rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-2.5 text-sm text-white font-body ' +
  'outline-none focus:border-gold-bright/40';

function useCarga(cargar) {
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });

  const recargar = useCallback(async () => {
    setEstado(e => ({ ...e, cargando: true, error: '' }));
    try {
      setEstado({ cargando: false, error: '', datos: await cargar() });
    } catch (e) {
      setEstado({ cargando: false, error: e.message, datos: null });
    }
  }, [cargar]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { ...estado, recargar };
}

function EstadoCarga({ cargando, error, onReintentar }) {
  if (cargando) return <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>;
  if (!error) return null;
  return (
    <EstadoVacio
      titulo="No se pudo cargar"
      descripcion={error}
      accion={<Boton variant="secundario" onClick={onReintentar}>Reintentar</Boton>}
    />
  );
}

function FilaMaterial({ material, esAdmin, onRetirar }) {
  const enlace = enlaceSeguro(material.url);
  const Icono = material.kind === 'video_link' ? Play : Link2;
  return (
    <li className="flex items-center gap-3 flex-wrap rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <Icono size={18} aria-hidden="true" className="text-gold-bright shrink-0" />
      <span className="flex-1 min-w-[160px] text-sm text-white/90">{material.title}</span>
      {enlace && (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-gold-bright"
        >
          Abrir <ExternalLink size={13} aria-hidden="true" />
          <span className="sr-only">{material.title} (se abre en otra pestaña)</span>
        </a>
      )}
      {esAdmin && (
        <Boton size="sm" variant="secundario" onClick={() => onRetirar(material)}>Retirar</Boton>
      )}
    </li>
  );
}

function TarjetaClase({ clase, numero, esAdmin, onAbrir }) {
  const [abierta, setAbierta] = useState(false);
  const total = clase.materials.length;
  const resumen = total === 0 ? 'Sin material' : `${total} recurso${total === 1 ? '' : 's'}`;
  const panelId = `clase-${clase.id}-material`;

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 px-4 py-3 md:px-5">
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={panelId}
          onClick={() => setAbierta(a => !a)}
          className="flex flex-1 min-w-0 min-h-[44px] items-center gap-3 bg-transparent border-0 p-0 text-left cursor-pointer text-inherit"
        >
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-space-navy border border-white/10 font-display font-bold text-white">
            {numero}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-white">{clase.title}</span>
            <span className="block text-xs text-white/60">{resumen}</span>
          </span>
          <ChevronDown size={20} aria-hidden="true" className={abierta ? 'rotate-180 text-white/60' : 'text-white/60'} />
        </button>
        <button
          type="button"
          aria-label={`Renombrar ${clase.title}`}
          onClick={() => onAbrir('renombrar', clase)}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-transparent border-0 text-white/80 cursor-pointer"
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
      </div>
      {abierta && (
        <div id={panelId} className="flex flex-col gap-2 px-4 pb-4 md:px-5">
          {total === 0 && <p className="m-0 text-sm text-white/60">Esta clase todavía no tiene material.</p>}
          {total > 0 && (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {clase.materials.map(m => (
                <FilaMaterial key={m.id} material={m} esAdmin={esAdmin} onRetirar={mat => onAbrir('retirar', clase, mat)} />
              ))}
            </ul>
          )}
          <div className="flex gap-2 flex-wrap">
            <Boton size="sm" variant="secundario" onClick={() => onAbrir('enlace', clase)}>
              <Plus size={14} aria-hidden="true" /> Agregar enlace
            </Boton>
            {esAdmin && (
              <Boton size="sm" variant="secundario" onClick={() => onAbrir('archivar', clase)}>Retirar clase</Boton>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function confirmacionDe(dialogo) {
  if (dialogo?.tipo === 'retirar') {
    return {
      titulo: 'Retirar material',
      mensaje: `Los alumnos dejarán de ver "${dialogo.material.title}".`,
      accion: () => retireMaterial(dialogo.material.id),
      exito: 'Material retirado.',
    };
  }
  if (dialogo?.tipo === 'archivar') {
    return {
      titulo: 'Retirar clase',
      mensaje: `Los alumnos dejarán de ver "${dialogo.clase.title}" y todo su material.`,
      accion: () => archiveSession(dialogo.clase.id),
      exito: 'Clase retirada.',
    };
  }
  return null;
}

function PanelModulo({ modulo }) {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';
  const cargar = useCallback(() => listModuleSessions(modulo.id), [modulo.id]);
  const { cargando, error, datos, recargar } = useCarga(cargar);
  const [dialogo, setDialogo] = useState(null);
  const [errorDialogo, setErrorDialogo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  function abrir(tipo, clase = null, material = null) {
    setErrorDialogo('');
    setAviso(null);
    setDialogo({ tipo, clase, material });
  }

  const cerrar = useCallback(() => setDialogo(null), []);

  async function ejecutar(accion, exito) {
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

  const confirmacion = confirmacionDe(dialogo);

  async function confirmar() {
    const { accion, exito } = confirmacion;
    setDialogo(null);
    try {
      await accion();
      setAviso({ tipo: 'exito', mensaje: exito });
      await recargar();
    } catch (e) {
      setAviso({ tipo: 'error', mensaje: e.message });
    }
  }

  const clases = datos?.sessions ?? [];
  const propsDialogo = { guardando, error: errorDialogo, onCerrar: cerrar };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="m-0 text-sm text-white/70">Tus alumnos ven el material publicado en solo lectura.</p>
        <Boton size="sm" variant="primario" disabled={cargando || Boolean(error)} onClick={() => abrir('nueva')}>
          <Plus size={14} aria-hidden="true" /> Nueva clase
        </Boton>
      </div>
      {aviso && <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} onCerrar={() => setAviso(null)} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && clases.length === 0 && (
        <EstadoVacio titulo="Sin clases" descripcion={`${modulo.title} todavía no tiene clases. Crea la primera.`} />
      )}
      {!cargando && !error && clases.map((clase, i) => (
        <TarjetaClase key={clase.id} clase={clase} numero={i + 1} esAdmin={esAdmin} onAbrir={abrir} />
      ))}

      {dialogo?.tipo === 'nueva' && (
        <ModalNombreClase
          nombreModulo={modulo.title}
          onGuardar={nombre => ejecutar(() => createSession(modulo.id, nombre, datos.nextPosition), 'Clase creada.')}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'renombrar' && (
        <ModalNombreClase
          clase={dialogo.clase}
          onGuardar={nombre => ejecutar(() => renameSession(dialogo.clase.id, nombre), 'Clase renombrada.')}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'enlace' && (
        <ModalEnlace
          clase={dialogo.clase}
          onGuardar={enlace => ejecutar(() => addLink(dialogo.clase.id, enlace, user.id), 'Enlace publicado.')}
          {...propsDialogo}
        />
      )}
      <DialogoConfirmacion
        abierto={Boolean(confirmacion)}
        tono="danger"
        titulo={confirmacion?.titulo ?? ''}
        mensaje={confirmacion?.mensaje ?? ''}
        textoConfirmar="Retirar"
        onConfirmar={confirmar}
        onCancelar={cerrar}
      />
    </div>
  );
}

function ContenidoCurso({ curso }) {
  const [moduloId, setModuloId] = useState(curso.modules[0]?.id ?? null);

  if (curso.modules.length === 0) {
    return <EstadoVacio titulo="Sin áreas" descripcion="Este curso todavía no tiene módulos. Créalos en Cursos." />;
  }

  return (
    <Pestanas valor={moduloId} onCambio={setModuloId} aria-label="Áreas">
      <div className="flex flex-col gap-7">
        <SelectorAreas modulos={curso.modules} />
        {curso.modules.map(m => (
          <Pestanas.Panel key={m.id} valor={m.id}>
            {m.id === moduloId && <PanelModulo modulo={m} />}
          </Pestanas.Panel>
        ))}
      </div>
    </Pestanas>
  );
}

export default function MaterialCurso() {
  const { cargando, error, datos: cursos, recargar } = useCarga(listMaterialCourses);
  const [cursoId, setCursoId] = useState('');
  const curso = cursos?.find(c => c.id === cursoId) ?? cursos?.[0];

  return (
    <div className="scrollbar-hide bg-fondo-app p-4 md:p-10 flex flex-col gap-7 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="m-0 font-display font-bold text-3xl md:text-4xl tracking-tight text-white">Material</h1>
        {cursos?.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="material-curso" className="text-xs font-medium text-white/70">Curso</label>
            <select id="material-curso" className={CLASE_SELECT} value={curso?.id ?? ''} onChange={e => setCursoId(e.target.value)}>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </header>
      <p className="m-0 text-xs text-white/60">
        Por ahora el material se comparte con enlaces (videos o documentos en Drive). Subir archivos estará disponible pronto.
      </p>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && !curso && (
        <EstadoVacio titulo="Sin cursos" descripcion="Todavía no tienes cursos activos asignados." />
      )}
      {curso && <ContenidoCurso key={curso.id} curso={curso} />}
    </div>
  );
}
