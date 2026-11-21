// Mientras no hay grupos, distingue entre cargando, error y lista vacía.
export default function EstadoGrupos({ cargando, error }) {
  if (cargando) return <p role="status" className="m-0 text-sm text-white/60">Cargando…</p>;
  if (error) return <p role="alert" className="m-0 text-sm text-peligro">{error}</p>;
  return <p className="m-0 text-sm text-white/70">Aún no hay grupos activos.</p>;
}
