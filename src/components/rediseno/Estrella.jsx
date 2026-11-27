// La estrella significa una sola cosa: un quiz o simulador terminado (#57).
// No se usa como adorno en ningún otro lugar. Rellena = ganada; vacía = día sin
// estrella. El dorado de relleno es igual en ambos modos; el contorno le da
// contraste sobre marfil.
const PUNTAS =
  'M12 1.8l3.05 6.5 7.1.85-5.25 4.85 1.4 7.02L12 17.5 5.7 21.02l1.4-7.02L1.85 9.15l7.1-.85z';

export default function Estrella({ size = 20, llena = true, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <path
        d={PUNTAS}
        fill={llena ? 'rgb(var(--c-gold-fill))' : 'none'}
        stroke={llena ? 'rgb(var(--c-gold-muted))' : 'rgb(var(--c-ink) / 0.3)'}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
