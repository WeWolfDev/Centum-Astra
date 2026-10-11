// Compound component accesible para pestañas (tabs).
// Patrón WAI-ARIA Tabs: role tablist/tab/tabpanel, flechas ←→ + Home/End,
// un solo tab en el orden de tabulación (tabindex 0 / -1).
//
// Solo modo controlado:
//   <Pestanas valor={valor} onCambio={setValor} aria-label="…">
//     <Pestanas.Lista>
//       <Pestanas.Tab valor="a">A</Pestanas.Tab>
//       <Pestanas.Tab valor="b">B</Pestanas.Tab>
//     </Pestanas.Lista>
//     <Pestanas.Panel valor="a">…</Pestanas.Panel>
//     <Pestanas.Panel valor="b">…</Pestanas.Panel>
//   </Pestanas>
//
// Los paneles no activos se mantienen en el DOM con `hidden` para preservar
// estado interno y permitir queries con { hidden: true } en tests.
import { createContext, useCallback, useContext, useId, useMemo, useRef } from 'react';

const PestanasCtx = createContext(null);

function usePestanas() {
  const ctx = useContext(PestanasCtx);
  if (!ctx) throw new Error('Pestanas.* debe usarse dentro de <Pestanas>');
  return ctx;
}

export default function Pestanas({ valor, onCambio, children, 'aria-label': ariaLabel }) {
  const baseId = useId();
  const tabsRef = useRef([]);

  const registrarTab = useCallback((valor, node) => {
    if (!node) return;
    const idx = tabsRef.current.findIndex(t => t.valor === valor);
    if (idx === -1) tabsRef.current.push({ valor, node });
    else tabsRef.current[idx] = { valor, node };
  }, []);

  const enfocarPorValor = useCallback(v => {
    const entry = tabsRef.current.find(t => t.valor === v);
    entry?.node?.focus();
  }, []);

  const seleccionarYEnfocar = useCallback(
    v => {
      onCambio?.(v);
      // Los tabs destino ya están en el DOM; `.focus()` funciona
      // aunque React aún no haya actualizado tabIndex.
      enfocarPorValor(v);
    },
    [onCambio, enfocarPorValor],
  );

  const moverPor = useCallback(
    (desdeValor, delta) => {
      const valores = tabsRef.current.map(t => t.valor);
      const i = valores.indexOf(desdeValor);
      if (i === -1 || valores.length === 0) return;
      const siguiente = (i + delta + valores.length) % valores.length;
      seleccionarYEnfocar(valores[siguiente]);
    },
    [seleccionarYEnfocar],
  );

  const irAlExtremo = useCallback(
    extremo => {
      const valores = tabsRef.current.map(t => t.valor);
      if (valores.length === 0) return;
      const v = extremo === 'inicio' ? valores[0] : valores[valores.length - 1];
      seleccionarYEnfocar(v);
    },
    [seleccionarYEnfocar],
  );

  const ctx = useMemo(
    () => ({
      valor,
      ariaLabel,
      baseId,
      registrarTab,
      seleccionar: v => onCambio?.(v),
      moverPor,
      irAlExtremo,
    }),
    [valor, ariaLabel, baseId, registrarTab, onCambio, moverPor, irAlExtremo],
  );

  return <PestanasCtx.Provider value={ctx}>{children}</PestanasCtx.Provider>;
}

// `apariencia`:
//   'chip' (default) — barra pill compacta con fondo y borde (uso histórico).
//   'personalizada' — solo role=tablist + aria-label; el consumidor controla
//                     el layout vía `className`.
function Lista({ children, className = '', apariencia = 'chip' }) {
  const { ariaLabel } = usePestanas();
  const base =
    apariencia === 'personalizada'
      ? ''
      : 'inline-flex items-center gap-1 p-1 rounded-xl ' +
        'bg-white/[0.03] border border-white/10 ';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${base}${className}`.trim()}
    >
      {children}
    </div>
  );
}

function tabIdFor(baseId, valor) {
  return `${baseId}-tab-${valor}`;
}
function panelIdFor(baseId, valor) {
  return `${baseId}-panel-${valor}`;
}

// `apariencia`:
//   'chip' (default) — píldora horizontal con fondo activo (uso histórico).
//   'personalizada' — solo semántica WAI-ARIA + anillo dorado de foco; el
//                     consumidor decide el markup visual vía `className` y
//                     `children`. `data-activa` queda expuesto para estilar
//                     por estado con `data-[activa=true]:…` si hiciera falta.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-gold-bright focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-space-void';

function Tab({ valor, children, className = '', apariencia = 'chip' }) {
  const {
    valor: activo,
    baseId,
    registrarTab,
    seleccionar,
    moverPor,
    irAlExtremo,
  } = usePestanas();
  const activa = activo === valor;

  function handleKey(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        moverPor(valor, +1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moverPor(valor, -1);
        break;
      case 'Home':
        e.preventDefault();
        irAlExtremo('inicio');
        break;
      case 'End':
        e.preventDefault();
        irAlExtremo('fin');
        break;
      default:
        break;
    }
  }

  const chrome =
    apariencia === 'personalizada'
      ? `${FOCUS_RING}`
      : 'inline-flex items-center justify-center min-h-11 px-4 py-2 ' +
        'rounded-lg font-body text-sm font-semibold transition-colors ' +
        FOCUS_RING + ' ' +
        (activa
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:text-white hover:bg-white/5');

  return (
    <button
      ref={node => registrarTab(valor, node)}
      type="button"
      role="tab"
      id={tabIdFor(baseId, valor)}
      aria-selected={activa}
      aria-controls={panelIdFor(baseId, valor)}
      tabIndex={activa ? 0 : -1}
      data-activa={activa}
      onClick={() => seleccionar(valor)}
      onKeyDown={handleKey}
      className={`${chrome} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

function Panel({ valor, children, className = '' }) {
  const { valor: activo, baseId } = usePestanas();
  const activa = activo === valor;
  return (
    <div
      role="tabpanel"
      id={panelIdFor(baseId, valor)}
      aria-labelledby={tabIdFor(baseId, valor)}
      hidden={!activa}
      tabIndex={0}
      className={className}
    >
      {activa ? children : null}
    </div>
  );
}

Pestanas.Lista = Lista;
Pestanas.Tab = Tab;
Pestanas.Panel = Panel;
