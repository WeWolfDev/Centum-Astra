// Etiqueta tipo pill. Variantes de tono:
//   neutral | positivo | negativo
//   rol-alumno | rol-maestro | rol-admin
//   materia-math | materia-reading | materia-writing | materia-premed | materia-health
const TONOS = {
  neutral:       { bg: 'rgba(255,255,255,0.05)',  color: '#cbd5e1',  border: 'rgba(255,255,255,0.13)' },
  positivo:      { bg: 'rgba(52,211,153,0.1)',    color: '#34d399',  border: 'rgba(52,211,153,0.3)'  },
  negativo:      { bg: 'rgba(255,255,255,0.05)',  color: '#cbd5e1',  border: 'rgba(255,255,255,0.18)' }, // HANDOFF: baja en gris, no en rojo
  'rol-admin':   { bg: 'rgba(245,200,66,0.1)',    color: '#f5c842',  border: 'rgba(245,200,66,0.3)'  },
  'rol-maestro': { bg: 'rgba(147,197,253,0.1)',   color: '#93c5fd',  border: 'rgba(147,197,253,0.3)' },
  'rol-alumno':  { bg: 'rgba(94,234,212,0.1)',    color: '#5eead4',  border: 'rgba(94,234,212,0.3)'  },
  'materia-math':    { bg: 'rgba(147,197,253,0.1)', color: '#93c5fd', border: 'rgba(147,197,253,0.3)' },
  'materia-reading': { bg: 'rgba(216,180,254,0.1)', color: '#d8b4fe', border: 'rgba(216,180,254,0.3)' },
  'materia-writing': { bg: 'rgba(110,231,183,0.1)', color: '#6ee7b7', border: 'rgba(110,231,183,0.3)' },
  'materia-premed':  { bg: 'rgba(94,234,212,0.1)',  color: '#5eead4', border: 'rgba(94,234,212,0.3)'  },
  'materia-health':  { bg: 'rgba(103,232,249,0.1)', color: '#67e8f9', border: 'rgba(103,232,249,0.3)' },
};

export default function Pastilla({ tono = 'neutral', children, className }) {
  const s = TONOS[tono] || TONOS.neutral;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  );
}
