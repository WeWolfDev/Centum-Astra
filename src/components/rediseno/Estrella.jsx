// La estrella significa una sola cosa: un quiz o simulador terminado (#57).
// No se usa como adorno en ningún otro lugar. Es pixel art, como un premio de
// videojuego: "o" es el contorno, "X" el dorado y "+" el brillo. `llena={false}`
// la dibuja apagada.
const DIBUJO = [
  '......o......',
  '.....oXo.....',
  '.....oXo.....',
  '....oX+Xo....',
  'ooooX+XXXoooo',
  'oXXX+XXXXXXXo',
  '.oXXXXXXXXXo.',
  '..oXXXXXXXo..',
  '..oXXXXXXXo..',
  '.oXXXXoXXXXo.',
  '.oXXXo.oXXXo.',
  'oXXo.....oXXo',
  'ooo.......ooo',
];

const COLORES = {
  o: 'rgb(122 86 10)',
  X: 'rgb(var(--c-gold-fill))',
  '+': 'rgb(255 247 214)',
};

const PIXELES = DIBUJO.flatMap((fila, y) =>
  [...fila].map((celda, x) => ({ x, y, celda })).filter(p => p.celda !== '.'),
);

export default function Estrella({ size = 20, llena = true, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 13 13"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {PIXELES.map(({ x, y, celda }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={llena ? COLORES[celda] : 'rgb(var(--c-ink) / 0.18)'}
        />
      ))}
    </svg>
  );
}
