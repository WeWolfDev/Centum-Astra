// Etiqueta tipo pill. Variantes de tono:
//   neutral | positivo | negativo | advertencia | peligro
//   rol-alumno | rol-maestro | rol-admin
//   materia-math | materia-reading | materia-writing | materia-premed | materia-health
//   tipo-simulador | tipo-quiz   (tipo de evaluación — gold-bright / info)
const TONOS = {
  neutral:       { bg: 'rgb(var(--c-ink) / 0.05)',  color: 'rgb(var(--c-ink) / 0.8)',  border: 'rgb(var(--c-ink) / 0.13)' },
  positivo:      { bg: 'rgb(var(--c-exito) / 0.1)',    color: 'rgb(var(--c-exito))',  border: 'rgb(var(--c-exito) / 0.3)'  },
  negativo:      { bg: 'rgb(var(--c-ink) / 0.05)',  color: 'rgb(var(--c-ink) / 0.8)',  border: 'rgb(var(--c-ink) / 0.18)' }, // HANDOFF: baja en gris, no en rojo
  advertencia:   { bg: 'rgb(var(--c-advertencia) / 0.1)',    color: 'rgb(var(--c-advertencia))',  border: 'rgb(var(--c-advertencia) / 0.3)'  },
  peligro:       { bg: 'rgb(var(--c-peligro) / 0.1)',   color: 'rgb(var(--c-peligro))',  border: 'rgb(var(--c-peligro) / 0.3)' },
  'rol-admin':   { bg: 'rgb(var(--c-gold-bright) / 0.1)',    color: 'rgb(var(--c-gold-fill))',  border: 'rgb(var(--c-gold-bright) / 0.3)'  },
  'rol-maestro': { bg: 'rgb(var(--c-info) / 0.1)',   color: 'rgb(var(--c-info))',  border: 'rgb(var(--c-info) / 0.3)' },
  'rol-alumno':  { bg: 'rgba(94,234,212,0.1)',    color: '#5eead4',  border: 'rgba(94,234,212,0.3)'  },
  'materia-math':    { bg: 'rgb(var(--c-info) / 0.1)', color: 'rgb(var(--c-info))', border: 'rgb(var(--c-info) / 0.3)' },
  'materia-reading': { bg: 'rgba(216,180,254,0.1)', color: '#d8b4fe', border: 'rgba(216,180,254,0.3)' },
  'materia-writing': { bg: 'rgba(110,231,183,0.1)', color: '#6ee7b7', border: 'rgba(110,231,183,0.3)' },
  'materia-premed':  { bg: 'rgba(94,234,212,0.1)',  color: '#5eead4', border: 'rgba(94,234,212,0.3)'  },
  'materia-health':  { bg: 'rgba(103,232,249,0.1)', color: '#67e8f9', border: 'rgba(103,232,249,0.3)' },
  // tipo-* identifica el tipo de evaluación en listados mixtos.
  // Mismo patrón hex+opacidades que usamos para advertencia / peligro:
  //   tipo-simulador → token gold-bright (rgb(var(--c-gold-bright)) = rgb 245,200,66)
  //   tipo-quiz      → token info        (rgb(var(--c-info)) = rgb 147,197,253)
  'tipo-simulador': { bg: 'rgb(var(--c-gold-bright) / 0.1)',  color: 'rgb(var(--c-gold-fill))',  border: 'rgb(var(--c-gold-bright) / 0.3)'  },
  'tipo-quiz':      { bg: 'rgb(var(--c-info) / 0.1)', color: 'rgb(var(--c-info))',  border: 'rgb(var(--c-info) / 0.3)' },
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
