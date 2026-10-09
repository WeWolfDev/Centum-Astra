// Componente para estados vacíos: cuando una lista, resultado de filtro, o
// sección aún no tiene contenido. Semánticamente usa role="status" para que
// lectores de pantalla anuncien el cambio cuando aparece por filtro.
//
// Props:
//   icono        — ReactNode (típicamente <IconSubject /> o un icono de lucide-react)
//   titulo       — string (requerido)
//   descripcion  — string | ReactNode (opcional)
//   accion       — ReactNode (típicamente un <Boton />)
export default function EstadoVacio({ icono, titulo, descripcion, accion }) {
  return (
    <div
      role="status"
      className={
        'flex flex-col items-center justify-center text-center ' +
        'gap-3 px-6 py-10 rounded-2xl ' +
        'bg-white/[0.03] border border-white/10 font-body'
      }
    >
      {icono && (
        <div
          aria-hidden="true"
          className={
            'flex items-center justify-center w-14 h-14 rounded-full ' +
            'bg-white/5 border border-white/10 text-white/70'
          }
        >
          {icono}
        </div>
      )}
      <h3 className="m-0 font-display font-bold text-lg text-white tracking-tight">
        {titulo}
      </h3>
      {descripcion && (
        <p className="m-0 text-sm text-white/70 max-w-md leading-relaxed">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  );
}
