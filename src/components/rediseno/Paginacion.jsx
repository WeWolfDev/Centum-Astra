import Boton from './Boton';

// Navegación por páginas con el total que cuenta el servidor. page empieza en 0.
export default function Paginacion({ page, pageSize, total, disabled = false, onCambiar }) {
  if (total <= pageSize) return null;
  const desde = page * pageSize + 1;
  const hasta = Math.min((page + 1) * pageSize, total);
  const hayAnterior = page > 0;
  const haySiguiente = hasta < total;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 flex-wrap mt-4">
      <p role="status" className="m-0 text-xs text-white/60">Mostrando {desde}–{hasta} de {total}</p>
      <div className="flex gap-1.5">
        <Boton size="sm" variant="secundario" disabled={disabled || !hayAnterior} onClick={() => onCambiar(page - 1)}>Anterior</Boton>
        <Boton size="sm" variant="secundario" disabled={disabled || !haySiguiente} onClick={() => onCambiar(page + 1)}>Siguiente</Boton>
      </div>
    </nav>
  );
}
