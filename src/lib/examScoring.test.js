import { describe, it, expect } from 'vitest';
import { contarAciertos, calcularResultadoSimulador } from './examScoring';
import { SIMULADOR_RANGO_CENEVAL } from '../config/rediseno';

const { min: MIN, max: MAX } = SIMULADOR_RANGO_CENEVAL;

// Construye un banco mínimo donde la respuesta correcta de q[i] es (i % 4).
function bank(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ id: `q-${i}`, correct: i % 4 });
  }
  return out;
}

// Devuelve un answers map con la respuesta correcta en cada posición.
function allCorrect(questions) {
  const a = {};
  questions.forEach((q, i) => { a[i] = q.correct; });
  return a;
}

describe('contarAciertos', () => {
  it('devuelve 0 con answers vacío', () => {
    expect(contarAciertos(bank(10), {})).toBe(0);
  });

  it('devuelve 0 cuando todas las respuestas son incorrectas', () => {
    const qs = bank(5);
    const wrong = {};
    qs.forEach((q, i) => { wrong[i] = (q.correct + 1) % 4; });
    expect(contarAciertos(qs, wrong)).toBe(0);
  });

  it('devuelve questions.length cuando todas son correctas', () => {
    const qs = bank(7);
    expect(contarAciertos(qs, allCorrect(qs))).toBe(7);
  });

  it('cuenta solo las posiciones respondidas (answers disperso)', () => {
    const qs = bank(6);
    // respondemos solo 0, 2, 5; de esas, 0 y 5 correctas, 2 incorrecta
    const answers = {
      0: qs[0].correct,
      2: (qs[2].correct + 1) % 4,
      5: qs[5].correct,
    };
    expect(contarAciertos(qs, answers)).toBe(2);
  });

  it('ignora entradas de answers fuera del rango de questions', () => {
    const qs = bank(3);
    const answers = {
      0: qs[0].correct,
      1: qs[1].correct,
      99: 0, // fuera de rango
    };
    expect(contarAciertos(qs, answers)).toBe(2);
  });

  it('requiere igualdad estricta: undefined no cuenta aunque correct sea 0', () => {
    const qs = [{ id: 'q-0', correct: 0 }];
    // answers[0] no está definido -> === 0 es false
    expect(contarAciertos(qs, {})).toBe(0);
  });

  it('requiere igualdad estricta: null no cuenta como 0', () => {
    const qs = [{ id: 'q-0', correct: 0 }];
    expect(contarAciertos(qs, { 0: null })).toBe(0);
  });

  it('devuelve 0 con questions vacío', () => {
    expect(contarAciertos([], { 0: 1 })).toBe(0);
  });
});

describe('calcularResultadoSimulador', () => {
  it('devuelve { aciertos: 0, puntaje: MIN } con 0 respuestas correctas', () => {
    const qs = bank(10);
    expect(calcularResultadoSimulador(qs, {}, 10)).toEqual({
      aciertos: 0,
      puntaje: MIN,
    });
  });

  it('devuelve { aciertos: total, puntaje: MAX } cuando todas son correctas', () => {
    const qs = bank(10);
    expect(calcularResultadoSimulador(qs, allCorrect(qs), 10)).toEqual({
      aciertos: 10,
      puntaje: MAX,
    });
  });

  it('usa el total provisto para el puntaje, no questions.length', () => {
    // 5 preguntas en el banco pero el total "oficial" es 10 (p.ej. extras no cuentan)
    const qs = bank(5);
    const answers = allCorrect(qs);
    const r = calcularResultadoSimulador(qs, answers, 10);
    // 5 aciertos sobre 10 -> ratio 0.5 -> 1000
    expect(r).toEqual({ aciertos: 5, puntaje: 1000 });
  });

  it('aciertos coincide con contarAciertos para el mismo input', () => {
    const qs = bank(8);
    const answers = {
      0: qs[0].correct,
      3: qs[3].correct,
      5: (qs[5].correct + 1) % 4, // incorrecta
      7: qs[7].correct,
    };
    const r = calcularResultadoSimulador(qs, answers, 8);
    expect(r.aciertos).toBe(contarAciertos(qs, answers));
  });
});
