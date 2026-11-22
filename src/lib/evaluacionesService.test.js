import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { filtros: [], rpc: [] };
  const respuestas = { tablas: {}, rpc: {} };
  const cadena = respuesta => {
    const chain = {
      eq: (c, v) => { calls.filtros.push([c, v]); return chain; },
      order: () => chain,
      then: (ok, ko) => Promise.resolve(respuesta()).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: () => cadena(() => respuestas.tablas[tabla] ?? { data: [], error: null }),
  }));
  const rpc = vi.fn((nombre, args) => {
    calls.rpc.push([nombre, args]);
    return Promise.resolve(respuestas.rpc[nombre] ?? { data: null, error: null });
  });
  return { calls, respuestas, from, rpc };
});

vi.mock('./supabaseClient', () => ({ supabase: { from: fake.from, rpc: fake.rpc } }));

import {
  listMyEvaluations,
  loadAnswers,
  loadQuestions,
  reviewAttempt,
  saveAnswer,
  startAttempt,
  submitAttempt,
  tienePuntaje,
  vencido,
} from './evaluacionesService';

const intentoFila = (extra = {}) => ({
  id: 'a1',
  evaluation_id: 'e1',
  status: 'in_progress',
  started_at: '2026-11-22T10:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
  finished_at: null,
  total_questions: null,
  correct_count: null,
  percent: null,
  score: null,
  duration_seconds: null,
  is_best: false,
  ...extra,
});

beforeEach(() => {
  fake.calls.filtros = [];
  fake.calls.rpc = [];
  fake.respuestas.tablas = {};
  fake.respuestas.rpc = {};
});

describe('vencido y tienePuntaje', () => {
  test('un intento en curso vence cuando llega su hora; sin hora límite nunca', () => {
    const ahora = Date.parse('2026-11-22T10:30:00Z');
    expect(vencido({ status: 'in_progress', expires_at: '2026-11-22T10:30:00Z' }, ahora)).toBe(true);
    expect(vencido({ status: 'in_progress', expires_at: '2026-11-22T10:31:00Z' }, ahora)).toBe(false);
    expect(vencido({ status: 'in_progress', expires_at: null }, ahora)).toBe(false);
    expect(vencido({ status: 'submitted', expires_at: '2026-11-22T10:00:00Z' }, ahora)).toBe(false);
  });

  test('solo simulador y cuestionario dan puntaje', () => {
    expect(tienePuntaje('simulador')).toBe(true);
    expect(tienePuntaje('cuestionario')).toBe(true);
    expect(tienePuntaje('quiz')).toBe(false);
  });
});

describe('listMyEvaluations', () => {
  test('junta cada evaluación con su intento en curso y sus resultados', async () => {
    fake.respuestas.tablas.evaluations = {
      data: [
        { id: 'e1', kind: 'simulador', title: 'Simulador 1', description: null, time_limit_minutes: 90, module_id: null, questions: [{ count: 3 }] },
        { id: 'e2', kind: 'quiz', title: 'Quiz', description: 'Fracciones', time_limit_minutes: null, module_id: 'm1', questions: [{ count: 5 }] },
      ],
      error: null,
    };
    fake.respuestas.tablas.attempts = {
      data: [
        intentoFila(),
        intentoFila({ id: 'a0', status: 'submitted', finished_at: '2026-11-21T10:00:00Z', total_questions: 3, correct_count: 2, percent: '66.67', score: 1100, duration_seconds: 600, is_best: true }),
      ],
      error: null,
    };

    const lista = await listMyEvaluations('alumno');

    expect(fake.calls.filtros).toContainEqual(['status', 'published']);
    expect(fake.calls.filtros).toContainEqual(['student_id', 'alumno']);
    expect(lista[0]).toMatchObject({ id: 'e1', questionCount: 3, timeLimitMinutes: 90, enCurso: { id: 'a1' } });
    expect(lista[0].terminados).toEqual([expect.objectContaining({ id: 'a0', percent: 66.67, score: 1100, isBest: true })]);
    expect(lista[1]).toMatchObject({ id: 'e2', description: 'Fracciones', enCurso: null, terminados: [] });
    expect(fake.calls.rpc).toEqual([]);
  });

  test('cierra en el servidor un intento vencido para mostrarlo terminado', async () => {
    fake.respuestas.tablas.evaluations = {
      data: [{ id: 'e1', kind: 'simulador', title: 'S', time_limit_minutes: 1, questions: [{ count: 1 }] }],
      error: null,
    };
    fake.respuestas.tablas.attempts = { data: [intentoFila({ expires_at: '2020-01-01T00:00:00Z' })], error: null };
    fake.respuestas.rpc.submit_attempt = {
      data: intentoFila({ status: 'expired', finished_at: '2020-01-01T00:00:00Z', total_questions: 1, correct_count: 0, percent: 0, score: 700, duration_seconds: 60 }),
      error: null,
    };

    const [evaluacion] = await listMyEvaluations('alumno');

    expect(fake.calls.rpc).toEqual([['submit_attempt', { p_attempt_id: 'a1' }]]);
    expect(evaluacion.enCurso).toBeNull();
    expect(evaluacion.terminados[0]).toMatchObject({ status: 'expired', score: 700 });
  });

  test('si no puede cerrarlo, lo deja como estaba', async () => {
    fake.respuestas.tablas.evaluations = { data: [{ id: 'e1', kind: 'simulador', title: 'S', questions: [] }], error: null };
    fake.respuestas.tablas.attempts = { data: [intentoFila({ expires_at: '2020-01-01T00:00:00Z' })], error: null };
    fake.respuestas.rpc.submit_attempt = { data: null, error: { message: 'offline' } };

    const [evaluacion] = await listMyEvaluations('alumno');

    expect(evaluacion.enCurso).toMatchObject({ id: 'a1', status: 'in_progress' });
    expect(evaluacion.questionCount).toBe(0);
  });

  test('omite un intento vencido que el servidor ya no conserva', async () => {
    fake.respuestas.tablas.evaluations = { data: [{ id: 'e1', kind: 'simulador', title: 'S', questions: [] }], error: null };
    fake.respuestas.tablas.attempts = {
      data: [intentoFila({ expires_at: '2020-01-01T00:00:00Z' }), intentoFila({ id: 'a2', expires_at: '2020-01-01T00:00:00Z' })],
      error: null,
    };
    fake.rpc
      .mockResolvedValueOnce({ data: { id: null, status: null }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '42501' } });

    const [evaluacion] = await listMyEvaluations('alumno');

    expect(evaluacion.enCurso).toBeNull();
    expect(evaluacion.terminados).toEqual([]);
  });

  test('un error de lectura se muestra como mensaje claro', async () => {
    fake.respuestas.tablas.attempts = { data: null, error: { message: 'boom' } };
    await expect(listMyEvaluations('alumno')).rejects.toThrow('No pudimos cargar tus evaluaciones');
  });
});

describe('preguntas y respuestas guardadas', () => {
  test('ordena las opciones y no pide las respuestas correctas', async () => {
    fake.respuestas.tablas.questions = {
      data: [{
        id: 'q1', position: 0, prompt: '¿2+2?', media_kind: null, media_url: null,
        question_options: [{ id: 'o2', position: 1, body: '5' }, { id: 'o1', position: 0, body: '4' }],
      }],
      error: null,
    };

    const [pregunta] = await loadQuestions('e1');

    expect(fake.calls.filtros).toEqual([['evaluation_id', 'e1']]);
    expect(pregunta.options.map(o => o.id)).toEqual(['o1', 'o2']);
    expect(pregunta).not.toHaveProperty('correct');
  });

  test('las respuestas guardadas quedan por pregunta', async () => {
    fake.respuestas.tablas.attempt_answers = {
      data: [{ question_id: 'q1', selected_option_ids: ['o1'] }, { question_id: 'q2', selected_option_ids: null }],
      error: null,
    };
    expect(await loadAnswers('a1')).toEqual({ q1: ['o1'], q2: [] });
  });

  test('errores de lectura de preguntas y respuestas', async () => {
    fake.respuestas.tablas.questions = { data: null, error: { message: 'x' } };
    fake.respuestas.tablas.attempt_answers = { data: null, error: { message: 'x' } };
    await expect(loadQuestions('e1')).rejects.toThrow('No pudimos cargar');
    await expect(loadAnswers('a1')).rejects.toThrow('No pudimos cargar');
  });
});

describe('operaciones del intento', () => {
  test('inicia, guarda y entrega con las funciones del servidor', async () => {
    fake.respuestas.rpc.start_attempt = { data: intentoFila(), error: null };
    fake.respuestas.rpc.save_answer = { data: intentoFila(), error: null };
    fake.respuestas.rpc.submit_attempt = {
      data: intentoFila({ status: 'submitted', total_questions: 2, correct_count: 1, percent: '50.00', score: 1000 }),
      error: null,
    };

    expect(await startAttempt('e1')).toMatchObject({ id: 'a1', expiresAt: '2099-01-01T00:00:00Z' });
    await saveAnswer('a1', 'q1', ['o1']);
    expect(await submitAttempt('a1')).toMatchObject({ status: 'submitted', percent: 50, score: 1000 });
    expect(fake.calls.rpc).toEqual([
      ['start_attempt', { p_evaluation_id: 'e1' }],
      ['save_answer', { p_attempt_id: 'a1', p_question_id: 'q1', p_option_ids: ['o1'] }],
      ['submit_attempt', { p_attempt_id: 'a1' }],
    ]);
  });

  test('traduce los errores del servidor', async () => {
    fake.respuestas.rpc.start_attempt = { data: null, error: { code: '42501' } };
    fake.respuestas.rpc.save_answer = { data: null, error: { code: 'CA022' } };
    fake.respuestas.rpc.submit_attempt = { data: null, error: { code: 'CA023' } };
    fake.respuestas.rpc.attempt_review = { data: null, error: { message: 'Failed to fetch' } };

    await expect(startAttempt('e1')).rejects.toThrow('ya no está disponible');
    await expect(saveAnswer('a1', 'q1', [])).rejects.toThrow('no es válida');
    await expect(submitAttempt('a1')).rejects.toThrow('ya terminó');
    await expect(reviewAttempt('a1')).rejects.toThrow('Revisa tu conexión');
  });

  test('la revisión trae respuestas correctas y explicación', async () => {
    fake.respuestas.rpc.attempt_review = {
      data: [{ question_id: 'q1', selected_option_ids: null, correct_option_ids: ['o1'], is_correct: null, explanation: null }],
      error: null,
    };
    expect(await reviewAttempt('a1')).toEqual([
      { questionId: 'q1', selected: [], correct: ['o1'], isCorrect: false, explanation: '' },
    ]);
  });
});
