// Administración de cuentas con datos reales de Supabase (#33).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, GraduationCap, Layers, Search, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { filterUsers, listGroups, listUsers, runAdminAction, setUserGroups } from '../../lib/usersService';
import { cn } from '../../lib/utils';
import { Aviso } from '../../components/rediseno/Aviso';
import Boton from '../../components/rediseno/Boton';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Input from '../../components/rediseno/Input';
import Modal from '../../components/rediseno/Modal';
import Pastilla from '../../components/rediseno/Pastilla';
import StatCard from '../../components/rediseno/StatCard';

const ROLES = [
  { valor: 'student', etiqueta: 'Alumno', tono: 'rol-alumno', plural: 'Alumnos' },
  { valor: 'teacher', etiqueta: 'Profesor', tono: 'rol-maestro', plural: 'Profesores' },
  { valor: 'admin', etiqueta: 'Administrador', tono: 'rol-admin', plural: 'Administradores' },
];

const ESTADOS = {
  active: { etiqueta: 'Activa', tono: 'positivo' },
  suspended: { etiqueta: 'Suspendida', tono: 'advertencia' },
  deleted: { etiqueta: 'Eliminada', tono: 'peligro' },
};

const ACCIONES_ESTADO = {
  suspend: {
    titulo: 'Suspender cuenta',
    descripcion: 'La persona perderá el acceso de inmediato. Su historial se conserva.',
    boton: 'Suspender',
    variante: 'danger',
    exito: 'Cuenta suspendida.',
    conMotivo: true,
  },
  delete: {
    titulo: 'Eliminar cuenta',
    descripcion: 'La cuenta quedará marcada como eliminada y perderá el acceso. Su historial se conserva.',
    boton: 'Eliminar',
    variante: 'danger',
    exito: 'Cuenta eliminada.',
    conMotivo: true,
  },
  reactivate: {
    titulo: 'Reactivar cuenta',
    descripcion: 'La persona podrá volver a iniciar sesión.',
    boton: 'Reactivar',
    variante: 'primario',
    exito: 'Cuenta reactivada.',
    conMotivo: false,
  },
};

const CLASE_SELECT =
  'w-full rounded-[10px] bg-space-navy/50 border border-white/10 px-4 py-3 text-sm text-white font-body ' +
  'outline-none focus:border-gold-bright/40';

function rolDe(valor) {
  return ROLES.find(r => r.valor === valor) ?? ROLES[0];
}

function useDirectorio() {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setError('');
    try {
      const [cuentas, listaGrupos] = await Promise.all([listUsers(), listGroups()]);
      setUsuarios(cuentas);
      setGrupos(listaGrupos);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { usuarios, grupos, cargando, error, recargar };
}

function Pagina({ children }) {
  return (
    <div className="scrollbar-hide p-4 md:p-8 flex flex-col gap-7 overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      {children}
    </div>
  );
}

function Tarjeta({ titulo, controles, children }) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="m-0 font-display text-lg font-bold text-white">{titulo}</h3>
        {controles}
      </div>
      {children}
    </section>
  );
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

function FilaUsuario({ usuario, children }) {
  const rol = rolDe(usuario.role);
  const estado = ESTADOS[usuario.status] ?? ESTADOS.active;
  return (
    <li className="flex items-center gap-x-4 gap-y-2 flex-wrap py-3 border-t border-white/5 first:border-t-0">
      <div className="min-w-[200px] flex-1">
        <p className="m-0 text-sm font-medium text-white/90">{usuario.name}</p>
        <p className="m-0 text-xs text-white/60 break-all">{usuario.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Pastilla tono={rol.tono}>{rol.etiqueta}</Pastilla>
        <Pastilla tono={estado.tono}>{estado.etiqueta}</Pastilla>
        <span className="text-xs text-white/60">
          {usuario.groups.length > 0 ? usuario.groups.map(g => g.name).join(', ') : 'Sin grupo'}
        </span>
      </div>
      {children}
    </li>
  );
}

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

function ModalCuenta({ usuario, esPropia, guardando, error, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(usuario?.name ?? '');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState(usuario?.role ?? 'student');

  function enviar(e) {
    e.preventDefault();
    onGuardar({ fullName: nombre, email, role: rol });
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={usuario ? 'Editar cuenta' : 'Nueva cuenta'}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Input id="cuenta-nombre" label="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required />
        {!usuario && (
          <Input id="cuenta-email" label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        )}
        <div>
          <label htmlFor="cuenta-rol" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Rol</label>
          <select id="cuenta-rol" className={CLASE_SELECT} value={rol} disabled={esPropia} onChange={e => setRol(e.target.value)}>
            {ROLES.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
          </select>
        </div>
        {!usuario && (
          <p className="m-0 text-xs text-white/60">
            La persona recibirá un correo con un código para activar su cuenta y elegir su contraseña.
          </p>
        )}
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={usuario ? 'Guardar' : 'Enviar invitación'} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

function ModalEstado({ accion, usuario, guardando, error, onConfirmar, onCerrar }) {
  const config = ACCIONES_ESTADO[accion];
  const [motivo, setMotivo] = useState('');

  function enviar(e) {
    e.preventDefault();
    onConfirmar(config.conMotivo ? { reason: motivo } : {});
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={config.titulo} ancho="sm">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <p className="m-0 text-sm text-white/80 leading-relaxed">
          <strong className="text-white">{usuario.name}</strong>. {config.descripcion}
        </p>
        {config.conMotivo && (
          <Input id="estado-motivo" label="Motivo" value={motivo} onChange={e => setMotivo(e.target.value)} required />
        )}
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar={config.boton} variante={config.variante} guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

function ModalGrupos({ usuario, grupos, guardando, error, onGuardar, onCerrar }) {
  const [elegidos, setElegidos] = useState(usuario.groups.map(g => g.id));
  const esAlumno = usuario.role === 'student';

  function alternar(id) {
    setElegidos(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]));
  }

  function enviar(e) {
    e.preventDefault();
    onGuardar(elegidos);
  }

  const etiquetaGrupo = g => (g.course ? `${g.name} · ${g.course}` : g.name);

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Grupos de ${usuario.name}`}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {grupos.length === 0 && <p className="m-0 text-sm text-white/70">Aún no hay grupos activos.</p>}
        {grupos.length > 0 && esAlumno && (
          <div>
            <label htmlFor="grupo-alumno" className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide">Grupo</label>
            <select
              id="grupo-alumno"
              className={CLASE_SELECT}
              value={elegidos[0] ?? ''}
              onChange={e => setElegidos(e.target.value ? [e.target.value] : [])}
            >
              <option value="">Sin grupo</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{etiquetaGrupo(g)}</option>)}
            </select>
          </div>
        )}
        {grupos.length > 0 && !esAlumno && (
          <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
            <legend className="mb-1.5 text-xs font-medium text-white/70 tracking-wide">Grupos asignados</legend>
            {grupos.map(g => (
              <label key={g.id} className="flex items-center gap-2.5 text-sm text-white/85 cursor-pointer">
                <input type="checkbox" checked={elegidos.includes(g.id)} onChange={() => alternar(g.id)} />
                {etiquetaGrupo(g)}
              </label>
            ))}
          </fieldset>
        )}
        <ErrorDialogo mensaje={error} />
        <PieDialogo textoConfirmar="Guardar" guardando={guardando} onCancelar={onCerrar} />
      </form>
    </Modal>
  );
}

function AccionesFila({ usuario, esPropia, onAbrir }) {
  if (usuario.status === 'deleted') return null;
  return (
    <div className="flex gap-1.5 flex-wrap">
      <Boton size="sm" variant="secundario" onClick={() => onAbrir('cuenta', usuario)}>Editar</Boton>
      {usuario.role !== 'admin' && (
        <Boton size="sm" variant="secundario" onClick={() => onAbrir('grupos', usuario)}>Grupos</Boton>
      )}
      {!esPropia && usuario.status === 'active' && (
        <Boton size="sm" variant="secundario" onClick={() => onAbrir('suspend', usuario)}>Suspender</Boton>
      )}
      {!esPropia && usuario.status === 'suspended' && (
        <Boton size="sm" variant="secundario" onClick={() => onAbrir('reactivate', usuario)}>Reactivar</Boton>
      )}
      {!esPropia && (
        <Boton size="sm" variant="secundario" onClick={() => onAbrir('delete', usuario)}>Eliminar</Boton>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { usuarios, grupos, cargando, error, recargar } = useDirectorio();
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('all');
  const [dialogo, setDialogo] = useState(null);
  const [errorDialogo, setErrorDialogo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  const visibles = useMemo(() => filterUsers(usuarios, { search: busqueda, role: rol }), [usuarios, busqueda, rol]);

  function abrir(tipo, usuario = null) {
    setErrorDialogo('');
    setAviso('');
    setDialogo({ tipo, usuario });
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

  function guardarCuenta({ fullName, email, role }) {
    const usuario = dialogo.usuario;
    if (usuario) {
      ejecutar(() => runAdminAction('update', { userId: usuario.id, fullName, role }), 'Cuenta actualizada.');
    } else {
      ejecutar(() => runAdminAction('invite', { email, fullName, role }), 'Invitación enviada.');
    }
  }

  function confirmarEstado(datos) {
    const { tipo, usuario } = dialogo;
    ejecutar(() => runAdminAction(tipo, { userId: usuario.id, ...datos }), ACCIONES_ESTADO[tipo].exito);
  }

  function guardarGrupos(ids) {
    ejecutar(() => setUserGroups(dialogo.usuario, ids), 'Grupos actualizados.');
  }

  const propsDialogo = { guardando, error: errorDialogo, onCerrar: cerrar };

  return (
    <Pagina>
      {aviso && <Aviso tipo="exito" mensaje={aviso} onCerrar={() => setAviso('')} />}
      <Tarjeta
        titulo="Usuarios"
        controles={<Boton size="sm" variant="primario" onClick={() => abrir('cuenta')}><UserPlus size={14} aria-hidden="true" /> Nueva cuenta</Boton>}
      >
        <div className="flex items-center gap-2.5 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="search"
              aria-label="Buscar por nombre o correo"
              placeholder="Buscar por nombre o correo"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full py-2 pl-9 pr-3.5 rounded-lg text-sm text-white bg-space-navy/50 border border-white/10 outline-none focus:border-gold-bright/50"
            />
          </div>
          <div role="group" aria-label="Filtrar por rol" className="flex gap-1.5 flex-wrap">
            {[{ valor: 'all', plural: 'Todos' }, ...ROLES].map(r => (
              <button
                key={r.valor}
                type="button"
                aria-pressed={rol === r.valor}
                onClick={() => setRol(r.valor)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border',
                  rol === r.valor ? 'bg-gold-bright/10 text-gold-bright border-gold-bright/25' : 'bg-white/5 text-white/70 border-white/10',
                )}
              >
                {r.plural}
              </button>
            ))}
          </div>
        </div>

        <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
        {!cargando && !error && visibles.length === 0 && (
          <EstadoVacio titulo="Sin resultados" descripcion="No hay cuentas que coincidan con la búsqueda." />
        )}
        {!cargando && !error && visibles.length > 0 && (
          <ul className="list-none m-0 p-0">
            {visibles.map(u => (
              <FilaUsuario key={u.id} usuario={u}>
                <AccionesFila usuario={u} esPropia={u.id === user?.id} onAbrir={abrir} />
              </FilaUsuario>
            ))}
          </ul>
        )}
      </Tarjeta>

      {dialogo?.tipo === 'cuenta' && (
        <ModalCuenta usuario={dialogo.usuario} esPropia={dialogo.usuario?.id === user?.id} onGuardar={guardarCuenta} {...propsDialogo} />
      )}
      {dialogo?.tipo === 'grupos' && (
        <ModalGrupos usuario={dialogo.usuario} grupos={grupos} onGuardar={guardarGrupos} {...propsDialogo} />
      )}
      {dialogo && ACCIONES_ESTADO[dialogo.tipo] && (
        <ModalEstado accion={dialogo.tipo} usuario={dialogo.usuario} onConfirmar={confirmarEstado} {...propsDialogo} />
      )}
    </Pagina>
  );
}

export function AdminOverview({ onNavigate }) {
  const { usuarios, grupos, cargando, error, recargar } = useDirectorio();

  const alumnos = usuarios.filter(u => u.role === 'student' && u.status !== 'deleted');
  const tarjetas = [
    { icono: Users, cifra: alumnos.length, etiqueta: 'Total alumnos' },
    { icono: Users, cifra: alumnos.filter(u => u.status === 'active').length, etiqueta: 'Alumnos activos' },
    { icono: GraduationCap, cifra: usuarios.filter(u => u.role === 'teacher' && u.status === 'active').length, etiqueta: 'Profesores activos' },
    { icono: Layers, cifra: grupos.length, etiqueta: 'Grupos activos' },
  ];
  const recientes = [...usuarios].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4);

  return (
    <Pagina>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
            {tarjetas.map(t => (
              <StatCard key={t.etiqueta} icono={t.icono} cifra={`${t.cifra}`} etiqueta={t.etiqueta} tono="dorado" degradado />
            ))}
          </div>
          <Tarjeta
            titulo="Cuentas recientes"
            controles={(
              <button
                type="button"
                onClick={() => onNavigate?.('students')}
                className="inline-flex items-center gap-1 bg-transparent border-none text-gold-bright text-xs font-semibold tracking-widest uppercase cursor-pointer"
              >
                Ver todos <ChevronRight size={13} aria-hidden="true" />
              </button>
            )}
          >
            {recientes.length === 0 ? (
              <EstadoVacio titulo="Sin cuentas" descripcion="Todavía no hay cuentas registradas." />
            ) : (
              <ul className="list-none m-0 p-0">
                {recientes.map(u => <FilaUsuario key={u.id} usuario={u} />)}
              </ul>
            )}
          </Tarjeta>
        </>
      )}
    </Pagina>
  );
}
