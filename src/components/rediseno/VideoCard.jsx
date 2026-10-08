import { Play, Eye, Trash2 } from 'lucide-react';
import BotonSecundario from './BotonSecundario';

// Tarjeta para un video del material de módulos.
// Diseñada con la MISMA estructura que PdfCard para que ambas se vean parejas
// cuando están en la misma lista. Si canManage es true, se muestra Eliminar
// (equivalente al permiso de descarga en PdfCard: teacher/admin).
export default function VideoCard({
  titulo,
  duracion,
  instructor,
  onVer,
  canManage = false,
  onEliminar,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
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
          background: 'rgba(147,197,253,0.14)',
          color: '#93c5fd',
          flexShrink: 0,
        }}
      >
        <Play size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#e2e8f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {titulo}
        </p>
        {(duracion || instructor) && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Video
            {duracion ? ` · ${duracion}` : ''}
            {instructor ? ` · ${instructor}` : ''}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {onVer && (
          <BotonSecundario onClick={onVer} aria-label={`Ver video ${titulo}`}>
            <Eye size={15} strokeWidth={1.7} aria-hidden="true" />
            Ver
          </BotonSecundario>
        )}
        {canManage && onEliminar && (
          <BotonSecundario onClick={onEliminar} aria-label={`Eliminar ${titulo}`}>
            <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
            Eliminar
          </BotonSecundario>
        )}
      </div>
    </div>
  );
}
