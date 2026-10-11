import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

// Sistema de avisos (toasts) accesible.
//
// Semántica:
//   tipo="info" | "exito"      → role="status" + aria-live="polite"
//   tipo="advertencia" | "error" → role="alert" (asertivo, interrumpe al lector)
//
// Uso:
//   1. Envolver el árbol en <AvisoProvider />
//   2. Disparar con el hook useAviso():
//        const { mostrar } = useAviso();
//        mostrar({ tipo: 'exito', titulo: 'Guardado', mensaje: '...', duracion: 4000 });
//
// NO está registrado en App.jsx todavía. Para activarlo en producción, importar
// AvisoProvider y envolver <App /> en src/main.jsx (fuera del alcance de este tramo).

const TIPO_ICON = {
  info:         Info,
  exito:        CheckCircle2,
  advertencia:  AlertTriangle,
  error:        AlertCircle,
};

// Clases por tipo. Usan solo tokens: info, exito, advertencia, peligro.
const TIPO_CLASS = {
  info:         'border-info/30     bg-info/10     text-info',
  exito:        'border-exito/30    bg-exito/10    text-exito',
  advertencia:  'border-advertencia/30 bg-advertencia/10 text-advertencia',
  error:        'border-peligro/30  bg-peligro/10  text-peligro',
};

function esUrgente(tipo) {
  return tipo === 'advertencia' || tipo === 'error';
}

// Un solo aviso (toast). Exportado por si se quiere renderizar manualmente.
export function Aviso({ tipo = 'info', titulo, mensaje, onCerrar }) {
  const Icon = TIPO_ICON[tipo] || Info;
  const tipoClass = TIPO_CLASS[tipo] || TIPO_CLASS.info;
  const urgente = esUrgente(tipo);

  return (
    <div
      role={urgente ? 'alert' : 'status'}
      aria-live={urgente ? undefined : 'polite'}
      className={
        `flex items-start gap-3 w-full max-w-[380px] p-3.5 rounded-xl ` +
        `border bg-space-deep font-body text-sm ${tipoClass}`
      }
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" className="flex-none mt-0.5" />
      <div className="flex-1 min-w-0">
        {titulo && <p className="m-0 font-semibold text-white">{titulo}</p>}
        {mensaje && (
          <p className={`m-0 text-white/80 ${titulo ? 'mt-0.5' : ''}`}>{mensaje}</p>
        )}
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className={
            'flex-none w-7 h-7 rounded-md border border-white/10 bg-white/[0.04] ' +
            'text-white/70 inline-flex items-center justify-center cursor-pointer ' +
            'hover:bg-white/10 hover:text-white transition-colors ' +
            'focus-visible:outline-none focus-visible:ring-2 ' +
            'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
            'focus-visible:ring-offset-space-void'
          }
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const AvisoContext = createContext(null);

export function AvisoProvider({ children, duracionDefault = 4000 }) {
  const [avisos, setAvisos] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const cerrar = useCallback((id) => {
    setAvisos((xs) => xs.filter((a) => a.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const mostrar = useCallback(
    ({ tipo = 'info', titulo, mensaje, duracion } = {}) => {
      idRef.current += 1;
      const id = idRef.current;
      setAvisos((xs) => [...xs, { id, tipo, titulo, mensaje }]);
      const d = typeof duracion === 'number' ? duracion : duracionDefault;
      if (d > 0) {
        const timer = setTimeout(() => cerrar(id), d);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [cerrar, duracionDefault],
  );

  // Limpiar timers al desmontar el provider.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = { mostrar, cerrar };

  return (
    <AvisoContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[300] top-4 right-4 flex flex-col gap-2 pointer-events-none"
            data-testid="aviso-container"
          >
            {avisos.map((a) => (
              <div key={a.id} className="pointer-events-auto">
                <Aviso
                  tipo={a.tipo}
                  titulo={a.titulo}
                  mensaje={a.mensaje}
                  onCerrar={() => cerrar(a.id)}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </AvisoContext.Provider>
  );
}

export function useAviso() {
  const ctx = useContext(AvisoContext);
  if (!ctx) {
    throw new Error('useAviso debe usarse dentro de <AvisoProvider />');
  }
  return ctx;
}
