// Iconos SVG line por materia. Paths tomados de los mockups del HANDOFF.
// Nombres canónicos: 'math' | 'reading' | 'writing' | 'premed' | 'health'.
// Alias (nombres Lucide usados por mockData.icon):
//   Sigma → math, Book → reading, PenTool → writing,
//   Stethoscope → premed, HeartPulse → health.
const ALIAS = {
  Sigma: 'math',
  Book: 'reading',
  PenTool: 'writing',
  Stethoscope: 'premed',
  HeartPulse: 'health',
};

const PATHS = {
  math:    'M2 12h5l2-6 4 12 2-6h7',
  reading: 'M12 7C10 5.5 7 5 4 5.5v12c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-12C17 5 14 5.5 12 7zM12 7v12',
  writing: 'M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3',
  premed:  'M4 4v4a5 5 0 0010 0V4M9 18a4 4 0 108 0v-5',
  health:  'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
};

const INNER = {
  premed: <circle cx="17" cy="13" r="2.2" />,
};

export default function IconSubject({
  name,
  size = 22,
  strokeWidth = 1.7,
  color = 'currentColor',
  className,
  ...rest
}) {
  const key = ALIAS[name] || name;
  const d = PATHS[key];
  if (!d) return null;
  const dim = size || 22;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={d} />
      {INNER[key]}
    </svg>
  );
}
