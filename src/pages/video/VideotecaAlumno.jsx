// Videoteca con los videos de Drive del curso (#29). El catálogo solo trae lo
// que la RLS deja ver; el enlace se pide al abrir y la apertura queda
// registrada. Drive no informa vistas ni duración, así que no se muestran.
import { useCallback, useMemo, useState } from 'react';
import { Flag, Info, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { areaDeModulo } from '../../config/areas';
import { listVideoCatalog, MOTIVOS_REPORTE, openVideo, reportVideo } from '../../lib/videoService';
import { Aviso } from '../../components/rediseno/Aviso';
import AvisoEnlaceArchivo from '../../components/rediseno/AvisoEnlaceArchivo';
import Boton from '../../components/rediseno/Boton';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import IconSubject from '../../components/rediseno/IconSubject';
import Modal from '../../components/rediseno/Modal';
import Pastilla from '../../components/rediseno/Pastilla';
import useAbrirArchivo from '../../hooks/useAbrirArchivo';
import useCarga from '../../hooks/useCarga';

const TINTA = 'rgb(var(--c-ink))';
const TINTA_SUAVE = 'rgb(var(--c-ink) / 0.6)';

function normalizar(texto) {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function ModalReporte({ video, guardando, error, onEnviar, onCerrar }) {
  const [motivo, setMotivo] = useState(MOTIVOS_REPORTE[0].valor);
  const [nota, setNota] = useState('');

  function enviar(e) {
    e.preventDefault();
    onEnviar({ reason: motivo, note: nota });
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Reportar "${video.title}"`} ancho="sm">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1.5 text-xs font-medium" style={{ color: TINTA_SUAVE }}>¿Qué pasa con el video?</legend>
          {MOTIVOS_REPORTE.map(m => (
            <label key={m.valor} className="flex min-h-[44px] items-center gap-3 text-sm" style={{ color: TINTA }}>
              <input type="radio" name="motivo" value={m.valor} checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} />
              {m.etiqueta}
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="reporte-nota" className="mb-1.5 block text-xs font-medium" style={{ color: TINTA_SUAVE }}>
            Comentario (opcional)
          </label>
          <textarea
            id="reporte-nota"
            value={nota}
            maxLength={500}
            rows={3}
            onChange={e => setNota(e.target.value)}
            className="w-full rounded-[10px] px-4 py-3 text-sm outline-none"
            style={{ background: 'rgb(var(--c-ink) / 0.05)', border: '1px solid rgb(var(--c-ink) / calc(0.13 * var(--borde-k)))', color: TINTA }}
          />
        </div>
        {error && <p role="alert" className="m-0 text-xs text-peligro">{error}</p>}
        <footer className="flex flex-wrap justify-end gap-2.5">
          <Boton variant="secundario" type="button" onClick={onCerrar} disabled={guardando}>Cancelar</Boton>
          <Boton variant="primario" type="submit" isLoading={guardando}>Enviar reporte</Boton>
        </footer>
      </form>
    </Modal>
  );
}

function TarjetaVideo({ video, onVer, onReportar }) {
  const area = areaDeModulo({ id: video.moduleId, title: video.moduleTitle });
  return (
    <article className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={() => onVer(video)}
        aria-label={`Ver ${video.title} (se abre en Drive, en otra pestaña)`}
        className="relative block w-full cursor-pointer overflow-hidden rounded-2xl border-0 p-0"
        style={{ aspectRatio: '16 / 9', background: 'rgb(var(--c-navy))', boxShadow: 'var(--sombra-superficie)' }}
      >
        {area && (
          <IconSubject
            name={area.icono}
            strokeWidth={0.7}
            color="rgb(var(--c-ink) / 0.16)"
            style={{ position: 'absolute', right: '4%', top: '8%', height: '84%', width: 'auto' }}
          />
        )}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ background: 'rgb(var(--c-gold-fill))' }}
        >
          <svg width="22" height="22" viewBox="0 0 16 16"><path d="M5 2.5v11l9-5.5z" fill="rgb(var(--c-on-gold))" /></svg>
        </span>
      </button>
      <h2 className="m-0 mt-3 font-display text-[17px] font-semibold leading-snug" style={{ color: TINTA }}>{video.title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px]" style={{ color: TINTA_SUAVE }}>
        <Pastilla tono="neutral">{video.moduleTitle}</Pastilla>
        <span>{video.sessionTitle}</span>
      </div>
      <div className="mt-2">
        <Boton size="sm" variant="ghost" onClick={() => onReportar(video)} aria-label={`Reportar problema con ${video.title}`}>
          <Flag size={14} aria-hidden="true" /> Reportar problema
        </Boton>
      </div>
    </article>
  );
}

export default function VideotecaAlumno() {
  const { user } = useAuth();
  const { cargando, error, datos, recargar } = useCarga(listVideoCatalog);
  const [materia, setMateria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorReporte, setErrorReporte] = useState('');
  const video = useAbrirArchivo({ obtenerUrl: openVideo, onError: mensaje => setAviso({ tipo: 'error', mensaje }) });

  const videos = useMemo(() => datos ?? [], [datos]);
  const materias = useMemo(
    () => [...new Map(videos.map(v => [v.moduleId, { id: v.moduleId, title: v.moduleTitle }])).values()],
    [videos],
  );
  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return videos.filter(v =>
      (materia === 'todas' || v.moduleId === materia)
      && (!q || [v.title, v.sessionTitle, v.moduleTitle].some(t => normalizar(t).includes(q))),
    );
  }, [videos, materia, busqueda]);

  const cerrarReporte = useCallback(() => {
    if (!guardando) setReporte(null);
  }, [guardando]);

  function abrir(v) {
    setAviso(null);
    void video.abrir(v);
  }

  function abrirReporte(v) {
    setAviso(null);
    setErrorReporte('');
    setReporte(v);
  }

  async function enviarReporte(datosReporte) {
    setErrorReporte('');
    setGuardando(true);
    try {
      await reportVideo(reporte.id, datosReporte, user.id);
      setReporte(null);
      setAviso({ tipo: 'exito', mensaje: 'Gracias. El administrador revisará el video.' });
    } catch (e) {
      setErrorReporte(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="scrollbar-hide bg-fondo-app flex flex-col gap-7 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 4rem)', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <h1 className="m-0 font-display text-4xl font-bold tracking-tight" style={{ color: TINTA }}>Videoteca</h1>
        <label
          className="flex min-h-[48px] min-w-[220px] flex-[0_1_320px] items-center gap-2.5 rounded-full px-4"
          style={{ border: '1px solid rgb(var(--c-ink) / calc(0.2 * var(--borde-k)))', background: 'rgb(var(--c-navy) / 0.5)' }}
        >
          <Search size={20} aria-hidden="true" style={{ color: 'rgb(var(--c-ink) / 0.8)' }} />
          <input
            type="search"
            aria-label="Buscar video"
            placeholder="Buscar video o clase"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none"
            style={{ color: 'rgb(var(--c-ink) / 0.9)' }}
          />
        </label>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm" style={{ color: TINTA }}>
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-info" />
        <p className="m-0">
          Los videos se abren en Google Drive, en otra pestaña. Drive te pedirá entrar con el correo registrado en tu
          curso. Si un video no carga o te pide permiso, repórtalo.
        </p>
      </div>

      {aviso && <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} onCerrar={() => setAviso(null)} />}
      {video.enlace && <AvisoEnlaceArchivo {...video.enlace} onCerrar={video.cerrarEnlace} />}

      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && videos.length === 0 && (
        <EstadoVacio titulo="Sin videos" descripcion="Todavía no hay videos publicados en tus áreas." />
      )}

      {!cargando && !error && videos.length > 0 && (
        <>
          <div role="group" aria-label="Filtrar por materia" className="flex flex-wrap gap-2">
            {[{ id: 'todas', title: 'Todas' }, ...materias].map(m => {
              const activa = materia === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setMateria(m.id)}
                  className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    border: `1.5px solid ${activa ? 'rgb(var(--c-gold-bright))' : 'rgb(var(--c-ink) / 0.13)'}`,
                    background: activa ? 'rgb(var(--c-gold-bright) / 0.1)' : 'rgb(var(--c-ink) / 0.04)',
                    color: activa ? TINTA : 'rgb(var(--c-ink) / 0.8)',
                  }}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
          <p className="m-0 text-sm" style={{ color: 'rgb(var(--c-ink) / 0.8)' }}>
            {filtrados.length} {filtrados.length === 1 ? 'video' : 'videos'}
          </p>
          <div className="grid gap-x-6 gap-y-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtrados.map(v => <TarjetaVideo key={v.id} video={v} onVer={abrir} onReportar={abrirReporte} />)}
          </div>
          {filtrados.length === 0 && (
            <p className="m-0 py-12 text-center text-[15px]" style={{ color: TINTA_SUAVE }}>No se encontraron videos con esos filtros.</p>
          )}
        </>
      )}

      {reporte && (
        <ModalReporte
          video={reporte}
          guardando={guardando}
          error={errorReporte}
          onEnviar={datosReporte => { void enviarReporte(datosReporte); }}
          onCerrar={cerrarReporte}
        />
      )}
    </div>
  );
}
