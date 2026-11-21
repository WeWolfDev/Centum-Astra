// Administración de cursos, grupos y módulos (#50). Solo el administrador escribe
// (RLS) y se archiva en lugar de borrar.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarDays, Clock, Plus } from 'lucide-react';
import {
  createCourse, createGroup, createModule, listCatalog, setStatus, updateCourse, updateGroup, updateModule,
} from '../../lib/catalogoService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { Aviso } from '../../components/rediseno/Aviso';
import Boton from '../../components/rediseno/Boton';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import { ModalArchivar, ModalCurso, ModalGrupo, ModalModulo } from './ModalesCatalogo';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Las fechas llegan como AAAA-MM-DD; se formatean sin pasar por Date para no
// correrse un día por la zona horaria.
function fechaCorta(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

function rangoFechas({ startsOn, endsOn }) {
  if (!startsOn && !endsOn) return 'Sin fechas';
  if (!endsOn) return `Desde ${fechaCorta(startsOn)}`;
  if (!startsOn) return `Hasta ${fechaCorta(endsOn)}`;
  return `${fechaCorta(startsOn)} – ${fechaCorta(endsOn)}`;
}

const NOMBRE = { courses: 'curso', groups: 'grupo', modules: 'módulo' };
const EXITO_ARCHIVAR = { courses: 'Curso archivado.', groups: 'Grupo archivado.', modules: 'Módulo archivado.' };
const EXITO_REACTIVAR = { courses: 'Curso reactivado.', groups: 'Grupo reactivado.', modules: 'Módulo reactivado.' };

function useCatalogo(includeArchived) {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // Al alternar archivados rápido, solo la consulta más reciente actualiza la lista.
  const ultimaConsulta = useRef(0);

  const recargar = useCallback(async () => {
    const consulta = ++ultimaConsulta.current;
    setError('');
    try {
      const lista = await listCatalog({ includeArchived });
      if (consulta === ultimaConsulta.current) setCursos(lista);
    } catch (e) {
      if (consulta === ultimaConsulta.current) setError(e.message);
    } finally {
      if (consulta === ultimaConsulta.current) setCargando(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { cursos, cargando, error, recargar };
}

function Acciones({ tabla, item, nombre, onEditar, onEstado }) {
  const tipo = NOMBRE[tabla];
  const archivado = item.status === 'archived';
  return (
    <div className="flex gap-1.5 flex-shrink-0">
      <Boton size="sm" variant="secundario" aria-label={`Editar ${tipo} ${nombre}`} onClick={onEditar}>Editar</Boton>
      <Boton size="sm" variant="ghost" aria-label={`${archivado ? 'Reactivar' : 'Archivar'} ${tipo} ${nombre}`} onClick={onEstado}>
        {archivado ? 'Reactivar' : 'Archivar'}
      </Boton>
    </div>
  );
}

function Fila({ titulo, detalle, archivado, children }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 border-b border-white/10 last:border-b-0 flex-wrap">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-medium text-white flex items-center gap-2 flex-wrap">
          {titulo}
          {archivado && <Pastilla tono="neutral">Archivado</Pastilla>}
        </p>
        {detalle && <p className="m-0 mt-0.5 text-xs text-white/70 flex items-center gap-1.5">{detalle}</p>}
      </div>
      {children}
    </li>
  );
}

function Bloque({ titulo, accion, vacio, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-white/70">{titulo}</h4>
        {accion}
      </div>
      {children.length === 0
        ? <p className="m-0 py-2.5 text-sm text-white/60">{vacio}</p>
        : <ul className="list-none m-0 p-0">{children}</ul>}
    </div>
  );
}

function TarjetaCurso({ curso, onAbrir }) {
  return (
    <section className="tarjeta rounded-2xl p-4 md:p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="m-0 font-display text-lg font-bold text-white flex items-center gap-2 flex-wrap">
            {curso.name}
            {curso.status === 'archived' && <Pastilla tono="neutral">Archivado</Pastilla>}
          </h3>
          <p className="m-0 mt-1 text-sm text-white/70 flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" />
            <span>{rangoFechas(curso)}</span>
          </p>
          {curso.description && <p className="m-0 mt-1.5 text-sm text-white/80">{curso.description}</p>}
        </div>
        <Acciones
          tabla="courses" item={curso} nombre={curso.name}
          onEditar={() => onAbrir({ tipo: 'curso', item: curso })}
          onEstado={() => onAbrir({ tipo: 'estado', tabla: 'courses', item: curso, nombre: curso.name })}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Bloque
          titulo="Grupos"
          vacio="Sin grupos."
          accion={
            <Boton size="sm" variant="ghost" aria-label={`Agregar grupo a ${curso.name}`}
              onClick={() => onAbrir({ tipo: 'grupo', curso })}>
              <Plus size={14} aria-hidden="true" /> Grupo
            </Boton>
          }
        >
          {curso.groups.map(g => (
            <Fila
              key={g.id}
              titulo={<>{g.name} <span className="text-white/60 font-normal">· {g.code}</span></>}
              detalle={<><Clock size={12} aria-hidden="true" /><span>{g.schedule || 'Sin horario'}</span></>}
              archivado={g.status === 'archived'}
            >
              <Acciones
                tabla="groups" item={g} nombre={g.name}
                onEditar={() => onAbrir({ tipo: 'grupo', curso, item: g })}
                onEstado={() => onAbrir({ tipo: 'estado', tabla: 'groups', item: g, nombre: g.name })}
              />
            </Fila>
          ))}
        </Bloque>

        <Bloque
          titulo="Módulos"
          vacio="Sin módulos."
          accion={
            <Boton size="sm" variant="ghost" aria-label={`Agregar módulo a ${curso.name}`}
              onClick={() => onAbrir({ tipo: 'modulo', curso })}>
              <Plus size={14} aria-hidden="true" /> Módulo
            </Boton>
          }
        >
          {curso.modules.map((m, i) => (
            <Fila
              key={m.id}
              titulo={<><span className="text-white/60 font-normal tabular-nums">{i + 1}.</span> {m.title}</>}
              detalle={m.description}
              archivado={m.status === 'archived'}
            >
              <Acciones
                tabla="modules" item={m} nombre={m.title}
                onEditar={() => onAbrir({ tipo: 'modulo', curso, item: m })}
                onEstado={() => onAbrir({ tipo: 'estado', tabla: 'modules', item: m, nombre: m.title })}
              />
            </Fila>
          ))}
        </Bloque>
      </div>
    </section>
  );
}

function Pagina({ children }) {
  return (
    <div className="scrollbar-hide p-4 md:p-8 flex flex-col gap-6 overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      {children}
    </div>
  );
}

export default function AdminCursos() {
  if (!isSupabaseConfigured) {
    return (
      <Pagina>
        <EstadoVacio
          icono={<BookOpen size={22} aria-hidden="true" />}
          titulo="Cursos"
          descripcion="Esta sección necesita la conexión con Supabase para guardar cursos, grupos y módulos."
        />
      </Pagina>
    );
  }
  return <CatalogoConectado />;
}

export function CatalogoConectado() {
  const [verArchivados, setVerArchivados] = useState(false);
  const { cursos, cargando, error, recargar } = useCatalogo(verArchivados);
  const [dialogo, setDialogo] = useState(null);
  const [errorDialogo, setErrorDialogo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  function abrir(datos) {
    setErrorDialogo('');
    setAviso('');
    setDialogo(datos);
  }

  const cerrar = useCallback(() => setDialogo(null), []);

  async function ejecutar(accion, mensajeExito) {
    setErrorDialogo('');
    setGuardando(true);
    try {
      await accion();
      setDialogo(null);
      setAviso(mensajeExito);
      await recargar();
    } catch (e) {
      setErrorDialogo(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // Abrir el estado de un elemento archivado lo reactiva directo; archivar pide confirmación.
  function abrirAccion(datos) {
    if (datos.tipo === 'estado' && datos.item.status === 'archived') {
      setAviso('');
      void ejecutar(() => setStatus(datos.tabla, datos.item.id, 'active'), EXITO_REACTIVAR[datos.tabla]);
      return;
    }
    abrir(datos);
  }

  const item = dialogo?.item;
  const propsDialogo = { guardando, error: errorDialogo, onCerrar: cerrar };

  return (
    <Pagina>
      {aviso && <Aviso tipo="exito" mensaje={aviso} onCerrar={() => setAviso('')} />}

      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="m-0 font-display text-2xl font-bold text-white">Cursos</h2>
          <p className="m-0 mt-1 text-sm text-white/70">Cursos con sus grupos, horarios y módulos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Boton variant="secundario" aria-pressed={verArchivados} onClick={() => setVerArchivados(v => !v)}>
            {verArchivados ? 'Ocultar archivados' : 'Mostrar archivados'}
          </Boton>
          <Boton onClick={() => abrir({ tipo: 'curso' })}>
            <Plus size={16} aria-hidden="true" /> Nuevo curso
          </Boton>
        </div>
      </header>

      {cargando && <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>}
      {!cargando && error && (
        <EstadoVacio
          titulo="No se pudo cargar"
          descripcion={error}
          accion={<Boton variant="secundario" onClick={recargar}>Reintentar</Boton>}
        />
      )}
      {!cargando && !error && cursos.length === 0 && (
        <EstadoVacio
          icono={<BookOpen size={22} aria-hidden="true" />}
          titulo="Aún no hay cursos"
          descripcion="Crea el primer curso para agregarle grupos y módulos."
          accion={<Boton onClick={() => abrir({ tipo: 'curso' })}>Nuevo curso</Boton>}
        />
      )}
      {!cargando && !error && cursos.map(c => <TarjetaCurso key={c.id} curso={c} onAbrir={abrirAccion} />)}

      {dialogo?.tipo === 'curso' && (
        <ModalCurso
          curso={item}
          onGuardar={datos => void ejecutar(
            () => (item ? updateCourse(item.id, datos) : createCourse(datos)),
            item ? 'Curso actualizado.' : 'Curso creado.',
          )}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'grupo' && (
        <ModalGrupo
          grupo={item}
          onGuardar={datos => void ejecutar(
            () => (item ? updateGroup(item.id, datos) : createGroup({ courseId: dialogo.curso.id, ...datos })),
            item ? 'Grupo actualizado.' : 'Grupo creado.',
          )}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'modulo' && (
        <ModalModulo
          modulo={item}
          onGuardar={datos => void ejecutar(
            () => (item ? updateModule(item.id, datos) : createModule({ courseId: dialogo.curso.id, ...datos })),
            item ? 'Módulo actualizado.' : 'Módulo creado.',
          )}
          {...propsDialogo}
        />
      )}
      {dialogo?.tipo === 'estado' && (
        <ModalArchivar
          tabla={dialogo.tabla}
          nombre={dialogo.nombre}
          onConfirmar={() => void ejecutar(() => setStatus(dialogo.tabla, item.id, 'archived'), EXITO_ARCHIVAR[dialogo.tabla])}
          {...propsDialogo}
        />
      )}
    </Pagina>
  );
}
