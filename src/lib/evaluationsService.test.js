import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { rpc: [], select: [] };
  const respuestas = { rpc: { data: null, error: null }, tabla: { data: [], error: null } };
  const chain = {
    eq: () => chain,
    order: () => chain,
    single: () => chain,
    then: (ok, ko) => Promise.resolve(respuestas.tabla).then(ok, ko),
  };
  const supabase = {
    from: vi.fn(() => ({
      select: columnas => {
        calls.select.push(columnas);
        return chain;
      },
    })),
    rpc: vi.fn((funcion, parametros) => {
      calls.rpc.push([funcion, parametros]);
      return Promise.resolve(respuestas.rpc);
    }),
  };
  return { calls, respuestas, supabase };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  SCORE_LABEL,
  listEvaluations,
  listMyAttempts,
  loadEvaluation,
  loadReview,
  saveAnswer,
  startAttempt,
  submitAttempt,
  toAttempt,
} = await import('./evaluationsService');

const FILA_INTENTO = {
  id: 'a1',
  evaluation_id: 'e1',
  status: 'submitted',
  started_at: '2026-11-10T10:00:00Z',
  expires_at: '2026-11-10T12:00:00Z',
  finished_at: '2026-11-10T11:00:00Z',
  total_questions: 2,
  correct_count: 1,
  percent: '50.00',
  score: 1000,
  duration_seconds: 3600,
  is_best: true,
};

beforeEach(() => {
  fake.calls.rpc.length = 0;
  fake.calls.select.length = 0;
  fake.respuestas.rpc = { data: null, error: null };
  fake.respuestas.tabla = { data: [], error: null };
});

describe('toAttempt', () => {
  test('convierte el resultado y etiqueta el puntaje como estimado', () => {
    expect(toAttempt(FILA_INTENTO)).toMatchObject({
      id: 'a1',
      finished: true,
      percent: 50,
      score: 1000,
      scoreLabel: SCORE_LABEL,
      durationSeconds: 3600,
      isBest: true,
    });
    expect(SCORE_LABEL).not.toMatch(/oficial|ceneval/i);
  });

  test('un intento en curso o un quiz no llevan puntaje', () => {
    const enCurso = toAttempt({ ...FILA_INTENTO, status: 'in_progress', percent: null, score: null });
    expect(enCurso).toMatchObject({ finished: false, percent: null, score: null, scoreLabel: null });
  });

  test('sin fila devuelve null', () => {
    expect(toAttempt(null)).toBeNull();
  });
});

describe('operaciones del intento', () => {
  test('inicia o retoma con el vencimiento del servidor', async () => {
    fake.respuestas.rpc.data = { ...FILA_INTENTO, status: 'in_progress' };
    const intento = await startAttempt('e1');
    expect(fake.calls.rpc).toEqual([['start_attempt', { p_evaluation_id: 'e1' }]]);
    expect(intento.expiresAt).toBe('2026-11-10T12:00:00Z');
  });

  test('guarda una respuesta y avisa si el servidor cerró el intento', async () => {
    fake.respuestas.rpc.data = { ...FILA_INTENTO, status: 'expired' };
    const intento = await saveAnswer('a1', 'q1', ['o1']);
    expect(fake.calls.rpc).toEqual([
      ['save_answer', { p_attempt_id: 'a1', p_question_id: 'q1', p_option_ids: ['o1'] }],
    ]);
    expect(intento.finished).toBe(true);
  });

  test('entrega el intento', async () => {
    fake.respuestas.rpc.data = FILA_INTENTO;
    await expect(submitAttempt('a1')).resolves.toMatchObject({ status: 'submitted', score: 1000 });
    expect(fake.calls.rpc[0]).toEqual(['submit_attempt', { p_attempt_id: 'a1' }]);
  });

  test('traduce los errores del servidor', async () => {
    fake.respuestas.rpc = { data: null, error: { code: 'CA023' } };
    await expect(saveAnswer('a1', 'q1', [])).rejects.toThrow('Esta evaluación ya terminó.');
    fake.respuestas.rpc = { data: null, error: { code: '42501' } };
    await expect(startAttempt('e1')).rejects.toThrow('No tienes acceso');
    fake.respuestas.rpc = { data: null, error: { code: 'XX000' } };
    await expect(submitAttempt('a1')).rejects.toThrow('No se pudo completar la acción');
  });

  test('carga la revisión del intento terminado', async () => {
    fake.respuestas.rpc.data = [
      {
        question_id: 'q1',
        question_position: 0,
        prompt: 'P1',
        selected_option_ids: ['o1'],
        correct_option_ids: ['o1'],
        is_correct: true,
        explanation: 'Porque sí',
      },
    ];
    await expect(loadReview('a1')).resolves.toEqual([
      {
        questionId: 'q1',
        position: 0,
        prompt: 'P1',
        selectedOptionIds: ['o1'],
        correctOptionIds: ['o1'],
        isCorrect: true,
        explanation: 'Porque sí',
      },
    ]);
  });
});

describe('lecturas', () => {
  test('carga la evaluación ordenada y sin respuestas correctas', async () => {
    fake.respuestas.tabla.data = {
      id: 'e1',
      kind: 'quiz',
      title: 'Quiz',
      time_limit_minutes: null,
      questions: [
        { id: 'q2', position: 1, prompt: 'P2', question_options: [] },
        {
          id: 'q1',
          position: 0,
          prompt: 'P1',
          media_kind: 'video_link',
          media_url: 'https://drive.google.com/x',
          question_options: [
            { id: 'o2', position: 1, body: 'B' },
            { id: 'o1', position: 0, body: 'A' },
          ],
        },
      ],
    };
    const evaluacion = await loadEvaluation('e1');
    expect(evaluacion.questions.map(q => q.id)).toEqual(['q1', 'q2']);
    expect(evaluacion.questions[0].options.map(o => o.body)).toEqual(['A', 'B']);
    expect(evaluacion.questions[0].mediaUrl).toBe('https://drive.google.com/x');
    expect(fake.calls.select[0]).not.toMatch(/question_keys|correct/);
  });

  test('lista evaluaciones e intentos', async () => {
    fake.respuestas.tabla.data = [{ id: 'e1', kind: 'simulador', title: 'S', time_limit_minutes: 120 }];
    await expect(listEvaluations()).resolves.toMatchObject([{ id: 'e1', timeLimitMinutes: 120, questions: [] }]);
    fake.respuestas.tabla.data = [FILA_INTENTO];
    await expect(listMyAttempts('e1')).resolves.toMatchObject([{ id: 'a1', isBest: true }]);
  });

  test('informa un error de carga', async () => {
    fake.respuestas.tabla = { data: null, error: { message: 'x' } };
    await expect(loadEvaluation('e1')).rejects.toThrow(/cargar la evaluación/);
    await expect(listEvaluations()).rejects.toThrow(/cargar la evaluación/);
    await expect(listMyAttempts('e1')).rejects.toThrow(/cargar la evaluación/);
  });
});
