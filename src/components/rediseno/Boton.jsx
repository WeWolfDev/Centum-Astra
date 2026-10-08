import { Loader2 } from 'lucide-react';

// Botón unificado del rediseño.
// Variantes:
//   primario   — dorado plano, acción principal (btn-gold-flat definida en index.css)
//   secundario — relleno sutil, acciones no destructivas (btn-flat-secundario)
//   ghost      — sin fondo ni borde, para toolbar y acciones terciarias
//   danger     — fondo peligro con texto space-void (contraste 7:1, WCAG AA)
//
// isLoading: muestra spinner, pone aria-busy="true" y bloquea clics repetidos.
// disabled: idem en términos de interacción; se combina con isLoading.
// Mantener min-height 44px por accesibilidad táctil.

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-space-void';

const BASE_INLINE =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 ' +
  'font-body text-sm font-semibold rounded-[10px] transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANT_CLASSES = {
  primario:   'btn-gold-flat',
  secundario: 'btn-flat-secundario',
  ghost:
    `${BASE_INLINE} text-white/80 bg-transparent border border-transparent ` +
    'hover:bg-white/5 hover:text-white',
  danger:
    `${BASE_INLINE} text-space-void bg-peligro border-none ` +
    'shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-peligro/80',
};

export default function Boton({
  children,
  variant = 'primario',
  type = 'button',
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ref,
  ...rest
}) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primario;
  const effectivelyDisabled = disabled || isLoading;

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
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className="animate-spin"
        />
      )}
      {children}
    </button>
  );
}
