// Material del alumno con datos reales de Supabase (#82). La RLS ya limita a
// lo publicado de los módulos habilitados para su grupo. Los archivos se ven en
// el navegador con una URL firmada corta y sin botón de descarga (HANDOFF);
// guardarlos desde el navegador no se puede impedir del todo.
import { useCallback, useState } from 'react';
import { ChevronDown, ExternalLink, Link2, Lock, Play } from 'lucide-react';
import {
  dismissFileNotice,
  enlaceSeguro,
  listFileNotices,
  listMaterialCourses,
  listModuleSessions,
  tamanoLegible,
} from '../../lib/materialService';
import { Aviso } from '../../components/rediseno/Aviso';
import AvisoEnlaceArchivo from '../../components/rediseno/AvisoEnlaceArchivo';
import Boton from '../../components/rediseno/Boton';
import EstadoCarga from '../../components/rediseno/EstadoCarga';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import PdfCard from '../../components/rediseno/PdfCard';
import Pestanas from '../../components/rediseno/Pestanas';
import SelectorAreas from '../../components/rediseno/SelectorAreas';
import useAbrirArchivo from '../../hooks/useAbrirArchivo';
import useCarga from '../../hooks/useCarga';

const TINTA = 'rgb(var(--c-ink))';
const TINTA_SUAVE = 'rgb(var(--c-ink) / 0.6)';

function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function formatoDe(material) {
  const nombre = material.fileName ?? material.storagePath ?? '';
  const match = /\.([^./]+)$/.exec(nombre);
  return match ? match[1].toUpperCase() : 'Archivo';
}

/** Archivos que el alumno abrió y después se reemplazaron o se retiraron. */
function AvisosDeMaterial({ avisos, onCerrar }) {
  if (!avisos?.length) return null;
  return (
    <section aria-label="Avisos de material" className="flex flex-col gap-2">
      {avisos.map(a => (
        <div
          key={a.materialId}
          className="flex items-center gap-3 flex-wrap rounded-xl border border-advertencia/30 bg-advertencia/10 px-4 py-3 text-sm"
        >
          <p className="m-0 flex-1 min-w-[200px]" style={{ color: TINTA }}>
            {a.change === 'replaced'
              ? `«${a.title}» fue reemplazado el ${fechaCorta(a.changedAt)}. Ábrelo de nuevo para ver la versión nueva.`
              : `«${a.title}» fue borrado el ${fechaCorta(a.changedAt)} y ya no está disponible.`}
          </p>
          <Boton size="sm" variant="ghost" onClick={() => { void onCerrar(a.materialId); }} aria-label={`Cerrar aviso de ${a.title}`}>
            Entendido
          </Boton>
        </div>
      ))}
    </section>
  );
}

function EnlaceCard({ material }) {
  const enlace = enlaceSeguro(material.url);
  if (!enlace) return null;
  const Icono = material.kind === 'video_link' ? Play : Link2;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 no-underline"
      style={{ background: 'rgb(var(--c-ink) / 0.05)', border: '1px solid rgb(var(--c-ink) / calc(0.08 * var(--borde-k)))' }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-bright/10 text-gold-bright">
        <Icono size={20} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0 text-sm font-semibold" style={{ color: 'rgb(var(--c-ink) / 0.9)' }}>{material.title}</span>
      <ExternalLink size={15} aria-hidden="true" style={{ color: TINTA_SUAVE }} />
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}

function ClaseAlumno({ clase, numero, onAbrirArchivo }) {
  const [abierta, setAbierta] = useState(false);
  // Un enlace que no es http(s) no se muestra, así que tampoco se cuenta.
  const visibles = clase.materials.filter(m => m.storagePath || enlaceSeguro(m.url));
  const total = visibles.length;
  const panelId = `clase-${clase.id}-contenido`;
  return (
    <section
      className="flex flex-col overflow-hidden rounded-2xl"
      style={{ border: '1.5px solid var(--contorno)', background: 'var(--superficie)', boxShadow: 'var(--sombra-superficie)' }}
    >
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={panelId}
        onClick={() => setAbierta(a => !a)}
        className="flex w-full min-h-[44px] items-center gap-4 border-0 bg-transparent px-5 py-4 text-left cursor-pointer"
        style={{ color: 'inherit', fontFamily: 'inherit' }}
      >
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold" style={{ border: '1.5px solid rgb(var(--c-ink) / 0.3)', color: TINTA }}>
          {numero}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold" style={{ color: TINTA }}>{clase.title}</span>
          <span className="block text-xs" style={{ color: TINTA_SUAVE }}>
            {total === 0 ? 'Sin material' : `${total} recurso${total === 1 ? '' : 's'}`}
          </span>
        </span>
        <ChevronDown size={20} aria-hidden="true" style={{ color: TINTA_SUAVE, transform: abierta ? 'rotate(180deg)' : 'none' }} />
      </button>
      {abierta && (
        <div id={panelId} className="flex flex-col gap-2 px-5 pb-4">
          {total === 0 && <p className="m-0 text-sm" style={{ color: TINTA_SUAVE }}>Sin material publicado en esta clase.</p>}
          {visibles.map(m => (m.storagePath ? (
            <PdfCard
              key={m.id}
              nombre={m.title}
              tamano={tamanoLegible(m.fileSize)}
              formato={formatoDe(m)}
              onVer={() => { void onAbrirArchivo(m); }}
              canDownload={false}
            />
          ) : (
            <EnlaceCard key={m.id} material={m} />
          )))}
        </div>
      )}
    </section>
  );
}

function PanelArea({ modulo, onAbrirArchivo }) {
  const cargar = useCallback(() => listModuleSessions(modulo.id), [modulo.id]);
  const { cargando, error, datos, recargar } = useCarga(cargar);
  const temas = (datos?.topics ?? []).filter(t => t.sessions.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 flex-1 font-display text-2xl font-bold" style={{ color: TINTA }}>{modulo.title}</h2>
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px]" style={{ background: 'rgb(var(--c-ink) / 0.08)', color: 'rgb(var(--c-ink) / 0.9)' }}>
          <Lock size={14} aria-hidden="true" className="text-gold-bright" />
          Solo lectura · exclusivo de Centum Astra
        </span>
      </div>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {!cargando && !error && temas.length === 0 && (
        <EstadoVacio titulo="Sin clases" descripcion={`${modulo.title} aún no tiene clases publicadas.`} />
      )}
      {!cargando && !error && temas.map(tema => (
        <section key={tema.id} aria-labelledby={`tema-${tema.id}`} className="flex flex-col gap-3">
          <h3 id={`tema-${tema.id}`} className="m-0 font-display text-lg font-bold" style={{ color: TINTA }}>{tema.title}</h3>
          {tema.sessions.map((clase, i) => (
            <ClaseAlumno key={clase.id} clase={clase} numero={i + 1} onAbrirArchivo={onAbrirArchivo} />
          ))}
        </section>
      ))}
    </div>
  );
}

export default function MaterialAlumno({ defaultModuleId = null }) {
  const cursos = useCarga(listMaterialCourses);
  const avisos = useCarga(listFileNotices);
  const [cursoId, setCursoId] = useState('');
  const [moduloId, setModuloId] = useState(defaultModuleId);
  const [error, setError] = useState('');
  // Abrir un archivo registra la apertura: si tenía aviso de reemplazo, desaparece.
  const archivo = useAbrirArchivo({ onError: setError, onAbierto: () => avisos.recargar() });

  const curso = cursos.datos?.find(c => c.id === cursoId) ?? cursos.datos?.[0];
  const modulos = curso?.modules ?? [];
  const moduloActivo = modulos.some(m => m.id === moduloId) ? moduloId : modulos[0]?.id ?? null;

  async function cerrarAviso(materialId) {
    setError('');
    try {
      await dismissFileNotice(materialId);
      await avisos.recargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div
      className="scrollbar-hide bg-fondo-app flex flex-col gap-7 overflow-y-auto"
      style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)', maxHeight: 'calc(100vh - 4rem)', minHeight: '100%', color: 'rgb(var(--c-ink) / 0.8)' }}
    >
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="m-0 font-display text-4xl font-bold tracking-tight" style={{ color: TINTA }}>Módulos</h1>
        {cursos.datos?.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="modulos-curso" className="text-xs font-medium">Curso</label>
            {/* Mismos tokens que el selector de VideoLibrary: sigue el tema claro u oscuro. */}
            <select
              id="modulos-curso"
              value={curso?.id ?? ''}
              onChange={e => setCursoId(e.target.value)}
              className="rounded-[10px] px-4 py-2.5 text-sm outline-none min-h-[44px]"
              style={{
                background: 'rgb(var(--c-ink) / 0.05)',
                border: '1px solid rgb(var(--c-ink) / calc(0.13 * var(--borde-k)))',
                color: TINTA,
              }}
            >
              {cursos.datos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </header>

      <AvisosDeMaterial avisos={avisos.datos} onCerrar={cerrarAviso} />
      {error && <Aviso tipo="error" mensaje={error} onCerrar={() => setError('')} />}
      {archivo.enlace && <AvisoEnlaceArchivo {...archivo.enlace} onCerrar={archivo.cerrarEnlace} />}

      <EstadoCarga cargando={cursos.cargando} error={cursos.error} onReintentar={cursos.recargar} />
      {!cursos.cargando && !cursos.error && !curso && (
        <EstadoVacio titulo="Sin cursos" descripcion="Todavía no estás inscrito en un curso activo." />
      )}
      {curso && modulos.length === 0 && (
        <EstadoVacio titulo="Sin áreas" descripcion="Tu grupo todavía no tiene áreas habilitadas." />
      )}
      {curso && modulos.length > 0 && (
        <Pestanas valor={moduloActivo} onCambio={setModuloId} aria-label="Materias">
          <div className="flex flex-col gap-7">
            <SelectorAreas modulos={modulos} />
            {modulos.map(m => (
              <Pestanas.Panel key={m.id} valor={m.id}>
                {m.id === moduloActivo && <PanelArea modulo={m} onAbrirArchivo={archivo.abrir} />}
              </Pestanas.Panel>
            ))}
          </div>
        </Pestanas>
      )}
    </div>
  );
}
