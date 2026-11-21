import { FlaskConical } from 'lucide-react';

// Marca una pantalla que todavía muestra datos de ejemplo (mockData) para que
// nadie los tome por datos reales (#37). Se quita cuando la pantalla se conecta
// a Supabase. El texto lo dice todo: no depende del color.
export default function AvisoDatosEjemplo({ children }) {
  return (
    <div
      role="note"
      className={
        'flex items-start gap-3 px-4 py-3 rounded-xl font-body text-sm ' +
        'border border-advertencia/40 bg-advertencia/10 text-white/80'
      }
    >
      <FlaskConical size={18} strokeWidth={1.8} aria-hidden="true" className="flex-none mt-0.5 text-advertencia" />
      <p className="m-0">
        <strong className="font-semibold text-white">Datos de ejemplo.</strong>{' '}
        {children ?? 'Esta sección todavía no está conectada; lo que ves aquí no es información real.'}
      </p>
    </div>
  );
}
