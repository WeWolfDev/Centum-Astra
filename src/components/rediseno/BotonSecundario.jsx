// Botón secundario (relleno sutil). Mínimo 44 px de alto (accesibilidad).
export default function BotonSecundario({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  style,
  'aria-label': ariaLabel,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 44,
        padding: '12px 20px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: 14,
        fontWeight: 600,
        color: '#e2e8f0',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s ease, border-color 0.15s ease',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
