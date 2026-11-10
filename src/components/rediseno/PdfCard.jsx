import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import BotonSecundario from './BotonSecundario';

// Tarjeta para un PDF del material de módulos.
// HANDOFF: el alumno NO descarga. Si canDownload es false, no renderiza el botón de descarga.
// onEliminar: solo se muestra si viene definido (p.ej. recursos subidos por el maestro).
export default function PdfCard({
  nombre,
  tamano,
  onVer,
  canDownload = false,
  onDescargar,
  onEliminar,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'rgb(var(--c-ink) / 0.05)',
        border: '1px solid rgb(var(--c-ink) / calc(0.08 * var(--borde-k)))',
        borderRadius: 12,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgb(var(--c-gold-bright) / 0.1)',
          color: 'rgb(var(--c-gold-bright))',
          flexShrink: 0,
        }}
      >
        <FileText size={20} strokeWidth={1.7} aria-hidden="true" />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'rgb(var(--c-ink) / 0.9)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nombre}
        </p>
        {tamano && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgb(var(--c-ink) / 0.6)' }}>
            PDF · {tamano}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {onVer && (
          <BotonSecundario onClick={onVer} aria-label={`Ver ${nombre}`}>
            <Eye size={15} strokeWidth={1.7} aria-hidden="true" />
            Ver
          </BotonSecundario>
        )}
        {canDownload && onDescargar && (
          <BotonSecundario onClick={onDescargar} aria-label={`Descargar ${nombre}`}>
            <Download size={15} strokeWidth={1.7} aria-hidden="true" />
            Descargar
          </BotonSecundario>
        )}
        {onEliminar && (
          <BotonSecundario onClick={onEliminar} aria-label={`Eliminar ${nombre}`}>
            <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
            Eliminar
          </BotonSecundario>
        )}
      </div>
    </div>
  );
}
