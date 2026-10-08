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
