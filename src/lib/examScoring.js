// Lógica pura de puntuación del simulador EXANI-II.
// Sin React, sin estado, sin side effects: solo (questions, answers) -> número.

import { aciertosACeneval } from '../config/rediseno';

// Cuenta cuántas respuestas del map `answers` coinciden con la opción correcta
// de `questions[i]`. Comparación estricta (===), por lo que null/undefined no
// cuentan aunque `correct` sea 0.
export function contarAciertos(questions, answers) {
  return questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
    0,
  );
}

// Devuelve { aciertos, puntaje } usando la escala Ceneval configurada.
// `total` es el denominador oficial del simulador (puede diferir de
// questions.length si en el futuro se agregan preguntas extra que no cuentan).
export function calcularResultadoSimulador(questions, answers, total) {
  const aciertos = contarAciertos(questions, answers);
  const puntaje = aciertosACeneval(aciertos, total);
  return { aciertos, puntaje };
}

// Punto único de entrada que despacha por `tipo` de la evaluación.
// - simulador → delega en calcularResultadoSimulador (puntaje Ceneval).
// - quiz      → solo aciertos sobre total; nunca expone `puntaje`.
export function calcularResultado(evaluacion, respuestas) {
  const { tipo, preguntas } = evaluacion || {};
  if (tipo === 'simulador') {
    const total = evaluacion.total ?? preguntas.length;
    const { aciertos, puntaje } = calcularResultadoSimulador(preguntas, respuestas, total);
    return { tipo, aciertos, puntaje };
  }
  if (tipo === 'quiz') {
    const aciertos = contarAciertos(preguntas, respuestas);
    return { tipo, aciertos, total: preguntas.length };
  }
  throw new Error(`calcularResultado: tipo inválido "${tipo}"`);
}

// Fuente de verdad para la gráfica principal del alumno:
// solo entran los resultados de simulador que ya tengan puntaje numérico.
// Un quiz, aunque llevara un `puntaje` por error, queda fuera.
export function resultadosParaGrafica(resultados) {
  return resultados.filter(
    r => r && r.tipo === 'simulador' && typeof r.puntaje === 'number',
  );
}
