import { useCallback, useEffect, useState } from 'react';

// Carga datos con `cargar` (estable, con useCallback) y expone cargando, error,
// datos y recargar. El error es el mensaje que ya preparó el servicio.
export default function useCarga(cargar) {
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });

  const recargar = useCallback(async () => {
    setEstado(e => ({ ...e, cargando: true, error: '' }));
    try {
      setEstado({ cargando: false, error: '', datos: await cargar() });
    } catch (e) {
      setEstado({ cargando: false, error: e.message, datos: null });
    }
  }, [cargar]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { ...estado, recargar };
}
