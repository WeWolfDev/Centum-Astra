// Supuestos del HANDOFF — pendientes de confirmar con el cliente.
// Mantener esta tabla como fuente única; no fijar los valores en los componentes.

// Total de preguntas del simulador EXANI-II (supuesto).
export const SIMULADOR_TOTAL_PREGUNTAS = 138;

// Reparto de las 138 preguntas por área, en el orden del HANDOFF (supuesto).
export const SIMULADOR_REPARTO = [30, 30, 30, 24, 24];

// Rango del índice Ceneval (supuesto estándar EXANI-II).
export const SIMULADOR_RANGO_CENEVAL = { min: 700, max: 1300 };

// Tiempo límite del simulador en minutos (supuesto).
export const SIMULADOR_TIEMPO_LIMITE_MIN = 40;

// Si los simuladores con preguntas extra deben contar para el puntaje (supuesto).
export const SIMULADOR_EXTRAS_CUENTAN = false;

// Conversión aciertos → índice Ceneval (lineal, supuesto):
// 0 aciertos ≈ 700, SIMULADOR_TOTAL_PREGUNTAS ≈ 1300.
export function aciertosACeneval(aciertos, total = SIMULADOR_TOTAL_PREGUNTAS) {
  const { min, max } = SIMULADOR_RANGO_CENEVAL;
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
