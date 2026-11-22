import Boton from './Boton';
import EstadoVacio from './EstadoVacio';

// "Cargando…" mientras llegan los datos; si fallan, el error con Reintentar.
export default function EstadoCarga({ cargando, error, onReintentar }) {
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
