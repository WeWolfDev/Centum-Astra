import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Input unificado del rediseño.
// - Label asociado por htmlFor/id (se autogenera id si no se pasa).
// - error: string opcional; cuando existe, aplica aria-invalid="true" y
//   aria-describedby apuntando a `${id}-error`. Si el consumidor pasa su propio
//   aria-describedby, se concatena.
// - type="password" muestra toggle con aria-label y aria-pressed.
// - Placeholder tokenizado con contraste suficiente sobre fondos oscuros.

const BASE_INPUT =
  'w-full rounded-[10px] bg-space-navy/50 border border-white/10 ' +
  'px-4 py-3 text-sm text-white font-body outline-none transition-colors ' +
  'placeholder:text-white/55 ' +
  'focus:bg-space-mid/60 focus:border-gold-bright/40';

const BASE_INPUT_INVALID =
  'border-peligro/50 focus:border-peligro/70';

export default function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  label,
  error,
  required = false,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPass ? 'text' : 'password') : type;
  const hasError = Boolean(error);

  const describedBy = [hasError ? errorId : null, ariaDescribedBy || null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`w-full ${className}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-xs font-medium text-white/70 tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`${BASE_INPUT} ${isPassword ? 'pr-11' : ''} ${
            hasError ? BASE_INPUT_INVALID : ''
          }`.trim()}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPass}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/55 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-space-void rounded"
          >
            {showPass ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        )}
        <motion.div
          aria-hidden="true"
          animate={{ width: focused ? '100%' : '0%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 h-0.5 rounded-bl-[10px] bg-gradient-to-r from-gold-muted to-gold-bright pointer-events-none"
        />
      </div>
      {hasError && (
        <p id={errorId} className="mt-1.5 text-xs text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}
