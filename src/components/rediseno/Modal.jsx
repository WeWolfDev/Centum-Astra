import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Modal base del rediseño: overlay + contenedor con role="dialog".
// Se encarga de:
//   - Portal a document.body
//   - Escape para cerrar
//   - Focus inicial en el primer elemento enfocable (o en initialFocusRef si se pasa)
//   - Focus trap simple con Tab / Shift+Tab
//   - Retorno de foco al elemento que lo disparó al cerrarse
//   - Bloqueo del scroll del body
//   - Click en el scrim cierra (configurable con cerrarAlClickScrim)
//
// Para diálogos de confirmación usar <DialogoConfirmacion /> que ya envuelve esto.

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ANCHOS = {
  sm: 'max-w-[440px]',
  md: 'max-w-[540px]',
  lg: 'max-w-[720px]',
};

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  describedBy,
  ancho = 'md',
  cerrarAlClickScrim = true,
  initialFocusRef,
  children,
}) {
  const contenedorRef = useRef(null);
  const triggerRef = useRef(null);
  const tituloId = useId();

  // Guardar el elemento con foco al abrir para restaurarlo al cerrar.
  useEffect(() => {
    if (!abierto) return undefined;
    triggerRef.current = document.activeElement;
    return () => {
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
      }
    };
  }, [abierto]);

  // Bloquear scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  // Foco inicial y teclado (Escape + focus trap).
  useEffect(() => {
    if (!abierto) return undefined;

    // Foco inicial al abrir.
    const t = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const container = contenedorRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) focusables[0].focus();
    }, 0);

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
        return;
      }
      if (e.key !== 'Tab') return;
      const container = contenedorRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto, onCerrar, initialFocusRef]);

  if (!abierto) return null;

  const anchoClass = ANCHOS[ancho] || ANCHOS.md;

  return createPortal(
    <>
      <div
        onClick={cerrarAlClickScrim ? onCerrar : undefined}
        role="presentation"
        className="fixed inset-0 z-[199] bg-space-void/80"
      />
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          ref={contenedorRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titulo ? tituloId : undefined}
          aria-describedby={describedBy}
          className={
            `pointer-events-auto w-full ${anchoClass} max-h-[90vh] overflow-y-auto ` +
            'bg-space-deep border border-white/10 rounded-[18px] p-6 ' +
            'flex flex-col gap-5 text-white/90 font-body'
          }
        >
          {titulo && (
            <header className="flex items-center justify-between gap-4">
              <h2
                id={tituloId}
                className="m-0 font-display font-bold text-[22px] leading-tight tracking-tight text-white"
              >
                {titulo}
              </h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className={
                  'flex-none w-9 h-9 rounded-[10px] border border-white/10 ' +
                  'bg-white/[0.04] text-white/70 cursor-pointer ' +
                  'inline-flex items-center justify-center ' +
                  'hover:bg-white/10 hover:text-white transition-colors ' +
                  'focus-visible:outline-none focus-visible:ring-2 ' +
                  'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
                  'focus-visible:ring-offset-space-void'
                }
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>
          )}
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
