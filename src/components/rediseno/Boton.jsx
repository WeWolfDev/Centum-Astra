import { Loader2 } from 'lucide-react';

// Botón unificado del rediseño.
// Variantes:
//   primario   — dorado plano, acción principal (btn-gold-flat definida en index.css)
//   secundario — relleno sutil, acciones no destructivas (btn-flat-secundario)
//   ghost      — sin fondo ni borde, para toolbar y acciones terciarias
//   danger     — fondo peligro con texto space-void (contraste 7:1, WCAG AA)
//
// Tamaños:
//   md — default, 44px de alto, para acciones principales y UI de pantalla completa
//   sm — 32px de alto (floor 24px por accesibilidad táctil mínima). Pensado para
//        celdas de tabla densas en escritorio. En móvil usar md.
//
// isLoading: muestra spinner, pone aria-busy="true" y bloquea clics repetidos.
// disabled: idem en términos de interacción; se combina con isLoading.
// Mantener min-height 44px en md y 24px (floor) en sm por accesibilidad táctil.

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-space-void';

const BASE_INLINE =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 ' +
  'font-body text-sm font-semibold rounded-[10px] transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const BASE_INLINE_SM =
  'inline-flex items-center justify-center gap-1.5 h-8 min-h-6 px-3 ' +
  'font-body text-xs font-semibold rounded-lg transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANT_CLASSES_MD = {
  primario:   'btn-gold-flat',
  secundario: 'btn-flat-secundario',
  ghost:
    `${BASE_INLINE} text-white/80 bg-transparent border border-transparent ` +
    'hover:bg-white/5 hover:text-white',
  danger:
    `${BASE_INLINE} text-space-void bg-peligro border-none ` +
    'shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-peligro/80',
};

const VARIANT_CLASSES_SM = {
  primario:
    `${BASE_INLINE_SM} text-space-void bg-gold-bright hover:bg-gold-glow`,
  secundario:
    `${BASE_INLINE_SM} text-white/90 bg-white/5 border border-white/10 ` +
    'hover:bg-white/10 hover:border-white/20',
  ghost:
    `${BASE_INLINE_SM} text-white/80 bg-transparent border border-transparent ` +
    'hover:bg-white/5 hover:text-white',
  danger:
    `${BASE_INLINE_SM} text-space-void bg-peligro hover:bg-peligro/80`,
};

const VARIANTS_BY_SIZE = {
  md: VARIANT_CLASSES_MD,
  sm: VARIANT_CLASSES_SM,
};

export default function Boton({
  children,
  variant = 'primario',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ref,
  ...rest
}) {
  const bySize = VARIANTS_BY_SIZE[size] || VARIANTS_BY_SIZE.md;
  const variantClass = bySize[variant] || bySize.primario;
  const effectivelyDisabled = disabled || isLoading;
  const iconSize = size === 'sm' ? 14 : 16;

  function handleClick(event) {
    if (effectivelyDisabled) return;
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={effectivelyDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      className={`${variantClass} ${FOCUS_RING} ${className}`.trim()}
      {...rest}
    >
      {isLoading && (
        <Loader2
          size={iconSize}
          strokeWidth={2}
          aria-hidden="true"
          className="animate-spin"
        />
      )}
      {children}
    </button>
  );
}
