import { useCallback, useState } from 'react';
import { fechaLocal, registrarEstrella } from '../lib/estrellas';

// Estrellas del modo demo (sin Supabase): viven en este navegador. Con la base,
// el servidor las calcula (#57) y este hook se reemplaza.
const CLAVE = 'centum:estrellas-demo';

// Días hacia atrás con estrellas de ejemplo: una racha de 3 días que llega a
// ayer, para que el alumno la mantenga al terminar su primer quiz de hoy.
const HISTORIAL_EJEMPLO = [[1, 2], [2, 1], [3, 2], [6, 1], [8, 3], [9, 1]];

function historialEjemplo(hoy) {
  return HISTORIAL_EJEMPLO.flatMap(([diasAtras, cuantas]) => {
    const fecha = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasAtras));
    return Array.from({ length: cuantas }, (_, i) => ({ evaluacionId: `ejemplo-${diasAtras}-${i}`, fecha }));
  });
}

function leer() {
  try {
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE));
    if (Array.isArray(guardado)) return guardado;
  } catch {
    // Sin almacenamiento disponible: se usa el ejemplo y no se guarda.
  }
  return historialEjemplo(new Date());
}

function guardar(registros) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(registros));
  } catch {
    // Igual que arriba: la estrella se muestra aunque no se guarde.
  }
}

export default function useEstrellasDemo() {
  const [registros, setRegistros] = useState(leer);

  const terminar = useCallback(evaluacionId => {
    const resultado = registrarEstrella(leer(), evaluacionId, new Date());
    guardar(resultado.registros);
    setRegistros(resultado.registros);
    return { gano: resultado.gano, total: resultado.registros.length };
  }, []);

  return { registros, terminar };
}
