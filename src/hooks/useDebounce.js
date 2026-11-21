import { useEffect, useState } from 'react';

// Retrasa un valor para no consultar al servidor en cada tecla.
export function useDebounce(valor, retrasoMs) {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setRetrasado(valor), retrasoMs);
    return () => clearTimeout(id);
  }, [valor, retrasoMs]);

  return retrasado;
}
