import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { aplicarTema, guardarTema, modoClaroHabilitado, temaInicial } from '../lib/tema';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, habilitado = modoClaroHabilitado }) {
  const [tema, setTema] = useState(() => temaInicial(habilitado));
  // Las páginas públicas siempre van en oscuro (DESIGN.md › modes).
  const [oscuroForzado, setOscuroForzado] = useState(false);

  useLayoutEffect(() => {
    aplicarTema(oscuroForzado ? 'dark' : tema);
  }, [tema, oscuroForzado]);

  // Solo se guarda una elección explícita; si no, se sigue al sistema.
  const alternar = useCallback(() => {
    setTema(actual => {
      const siguiente = actual === 'light' ? 'dark' : 'light';
      guardarTema(siguiente);
      return siguiente;
    });
  }, []);

  const value = useMemo(
    () => ({ tema, alternar, habilitado, setOscuroForzado }),
    [tema, alternar, habilitado],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Mantiene el modo oscuro mientras el componente que lo llama esté montado. */
export function useModoOscuroForzado() {
  const contexto = useContext(ThemeContext);
  const setOscuroForzado = contexto?.setOscuroForzado;

  // useLayoutEffect para que la landing no se pinte un instante en claro.
  useLayoutEffect(() => {
    if (!setOscuroForzado) return undefined;
    setOscuroForzado(true);
    return () => setOscuroForzado(false);
  }, [setOscuroForzado]);
}
