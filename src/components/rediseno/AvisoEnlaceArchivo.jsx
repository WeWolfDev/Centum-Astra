import { ExternalLink } from 'lucide-react';
import Boton from './Boton';

// El navegador bloqueó la pestaña nueva: un clic del usuario sí la abre.
// La URL firmada dura 5 minutos (materialService).
export default function AvisoEnlaceArchivo({ titulo, url, onCerrar }) {
  return (
    <div role="status" className="flex items-center gap-3 flex-wrap rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm">
      <p className="m-0 flex-1 min-w-[200px]" style={{ color: 'rgb(var(--c-ink) / 0.8)' }}>
        Tu navegador bloqueó la pestaña nueva. El enlace vence en 5 minutos.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCerrar}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gold-bright"
      >
        Abrir {titulo} <ExternalLink size={13} aria-hidden="true" />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
      <Boton size="sm" variant="ghost" onClick={onCerrar}>Cerrar</Boton>
    </div>
  );
}
