import { mockSimuladorPreguntas, mockStudents } from './mockData';
import { puntajeEstimado } from '../config/rediseno';

// Aciertos por debajo del último en cada simulador de ejemplo; el tercero baja a
// propósito para mostrar una caída en gris.
const ACIERTOS_ANTES_DEL_ULTIMO = [27, 19, 22, 11, 8, 0];
const FECHAS = ['20 jul', '3 ago', '17 ago', '31 ago', '14 sep', '28 sep'];

/**
 * Historial de simuladores del modo demo. Inicio y Simuladores leen este mismo
 * historial para no mostrar puntajes distintos de la misma alumna. Termina en el
 * promedio del alumno llevado al simulador de ejemplo.
 */
export function historialSimuladorEjemplo(email) {
  const alumno = mockStudents.find(s => s.email === email) ?? mockStudents[0];
  const total = mockSimuladorPreguntas;
  const ultimo = Math.round((alumno.avgScore / 100) * total);
  return ACIERTOS_ANTES_DEL_ULTIMO.map((antes, i) => {
    const aciertos = Math.max(0, ultimo - antes);
    return { n: i + 1, fecha: FECHAS[i], aciertos, total, puntaje: puntajeEstimado(aciertos, total) };
  });
}
