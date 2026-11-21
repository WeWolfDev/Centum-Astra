// Mis alumnos con datos reales: RLS limita la lista a los grupos del profesor (#33).
// Puntajes y evolución se agregan cuando existan intentos reales (#30, #31).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { PAGE_SIZE, listMyStudents } from '../../lib/usersService';
import Boton from '../../components/rediseno/Boton';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Paginacion from '../../components/rediseno/Paginacion';
import Pastilla from '../../components/rediseno/Pastilla';

const SEARCH_DELAY_MS = 300;

export default function TeacherRoster() {
  const [alumnos, setAlumnos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const busquedaServidor = useDebounce(busqueda, SEARCH_DELAY_MS);

  // Solo la consulta más reciente actualiza la lista (ver useCuentas en AdminUsers).
  const ultimaConsulta = useRef(0);

  const cargar = useCallback(async () => {
    const consulta = ++ultimaConsulta.current;
    setError('');
    setCargando(true);
    try {
      const resultado = await listMyStudents({ search: busquedaServidor, page: pagina });
      if (consulta !== ultimaConsulta.current) return;
      if (resultado.outOfRange) setPagina(0);
      setAlumnos(resultado.users);
      setTotal(resultado.total);
    } catch (e) {
      if (consulta === ultimaConsulta.current) setError(e.message);
    } finally {
      if (consulta === ultimaConsulta.current) setCargando(false);
    }
  }, [busquedaServidor, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarBusqueda(texto) {
    setBusqueda(texto);
    setPagina(0);
  }

  return (
    <div className="scrollbar-hide bg-fondo-app p-4 md:p-10 flex flex-col gap-7 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="m-0 font-display font-bold text-3xl tracking-tight text-white">Mis alumnos</h1>
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          <input
            type="search"
            aria-label="Buscar alumno"
            placeholder="Buscar alumno"
            value={busqueda}
            onChange={e => cambiarBusqueda(e.target.value)}
            className="w-full py-2.5 pl-9 pr-3.5 rounded-full text-sm text-white bg-space-navy/50 border border-white/20 outline-none focus:border-gold-bright/50"
          />
        </div>
      </header>

      {cargando && <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>}
      {!cargando && error && (
        <EstadoVacio
          titulo="No se pudo cargar"
          descripcion={error}
          accion={<Boton variant="secundario" onClick={cargar}>Reintentar</Boton>}
        />
      )}
      {!cargando && !error && alumnos.length === 0 && !busquedaServidor.trim() && (
        <EstadoVacio titulo="Sin alumnos" descripcion="Todavía no tienes alumnos en tus grupos." />
      )}
      {!cargando && !error && alumnos.length === 0 && busquedaServidor.trim() && (
        <EstadoVacio titulo="Sin resultados" descripcion="Ningún alumno coincide con la búsqueda." />
      )}
      {!cargando && !error && alumnos.length > 0 && (
        <ul className="list-none m-0 p-0">
          {alumnos.map(a => (
            <li key={a.id} className="flex items-center justify-between gap-3 flex-wrap py-3 border-t border-white/10">
              <div>
                <p className="m-0 text-[15px] font-semibold text-white">{a.name}</p>
                <p className="m-0 text-xs text-white/60 break-all">{a.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {a.status === 'suspended' && <Pastilla tono="advertencia">Suspendida</Pastilla>}
                <span className="text-sm text-white/70">{a.groups.map(g => g.name).join(', ')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Paginacion page={pagina} pageSize={PAGE_SIZE} total={total} disabled={cargando} onCambiar={setPagina} />
    </div>
  );
}
