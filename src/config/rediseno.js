// Supuestos del HANDOFF — pendientes de confirmar con el cliente.
// Mantener esta tabla como fuente única; no fijar los valores en los componentes.

// Escala del puntaje estimado de simuladores y cuestionarios (decisión 1.10).
// No es un resultado oficial del EXANI-II.
export const ESCALA_PUNTAJE = { min: 700, max: 1300 };

// Tiempo límite del simulador en minutos (supuesto).
export const SIMULADOR_TIEMPO_LIMITE_MIN = 40;

// Si los simuladores con preguntas extra deben contar para el puntaje (supuesto).
export const SIMULADOR_EXTRAS_CUENTAN = false;

// Puntaje estimado: 700 + (aciertos / total de preguntas) × 600 (decisión 1.10).
// El total es el de cada evaluación (#52): sin total no hay puntaje.
export function puntajeEstimado(aciertos, total) {
  const { min, max } = ESCALA_PUNTAJE;
  if (!(total > 0)) return null;
  const ratio = Math.max(0, Math.min(1, aciertos / total));
  return Math.round(min + ratio * (max - min));
}

// Criterio "requiere atención" en la vista del maestro (supuesto):
// cuando el alumno baja respecto al simulador anterior.
export const ATENCION_POR_BAJA = true;

// Mostrar la meta oculta por defecto. HANDOFF: "El progreso va antes que la meta".
export const META_OCULTA_POR_DEFECTO = true;

// Permisos de descarga de PDFs por rol. HANDOFF: el alumno nunca descarga.
export function puedeDescargarPdf(role) {
  return role === 'teacher' || role === 'admin';
}
