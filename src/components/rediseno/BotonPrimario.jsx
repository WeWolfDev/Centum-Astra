// Botón primario dorado plano. Mínimo 44 px de alto (accesibilidad).
export default function BotonPrimario({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`btn-gold-flat ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
