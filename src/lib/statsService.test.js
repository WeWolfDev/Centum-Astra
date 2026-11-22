import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const respuesta = { data: [], error: null };
  const rpc = vi.fn(() => Promise.resolve(respuesta));
  return { respuesta, rpc, supabase: { rpc } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  getStatsOverview, getStudentStats, listGroupStats, listStudentResults, listWeeklyStats,
} = await import('./statsService');

beforeEach(() => {
  fake.rpc.mockClear();
  fake.respuesta.data = [];
  fake.respuesta.error = null;
});

describe('statsService', () => {
  test('pide los promedios de quien llama sin periodo', async () => {
    fake.respuesta.data = [{ quiz_avg_percent: '70.00', quiz_count: 2, exam_avg_score: 1100, exam_count: 2 }];
    const stats = await getStudentStats();
    expect(fake.rpc).toHaveBeenCalledWith('student_stats', { p_student: null, p_from: null, p_to: null });
    expect(stats).toEqual({ quizAvgPercent: 70, quizCount: 2, examAvgScore: 1100, examCount: 2, examScoreLabel: 'Puntaje estimado' });
  });

  test('sin intentos los promedios quedan vacíos, no en cero', async () => {
    fake.respuesta.data = [{ quiz_avg_percent: null, quiz_count: 0, exam_avg_score: null, exam_count: 0 }];
    const stats = await getStudentStats('s1');
    expect(stats.quizAvgPercent).toBeNull();
    expect(stats.examAvgScore).toBeNull();
  });

  test('manda el periodo elegido como fechas ISO', async () => {
    await listGroupStats({ from: '2026-11-01T00:00:00-06:00', to: new Date('2026-11-08T06:00:00Z') });
    expect(fake.rpc).toHaveBeenCalledWith('group_stats', {
      p_from: '2026-11-01T06:00:00.000Z',
      p_to: '2026-11-08T06:00:00.000Z',
    });
  });

  test('una fecha sin hora es la medianoche de México, no la de UTC', async () => {
    await listGroupStats({ from: '2026-11-01', to: '2026-12-01' });
    expect(fake.rpc).toHaveBeenCalledWith('group_stats', {
      p_from: '2026-11-01T06:00:00.000Z',
      p_to: '2026-12-01T06:00:00.000Z',
    });
  });

  test('el puntaje de una calificación se etiqueta como estimado y el quiz no lleva puntaje', async () => {
    fake.respuesta.data = [
      { evaluation_id: 'e1', title: 'Simulador', kind: 'simulador', percent: '50.00', score: 1000, correct_count: 5, total_questions: 10 },
      { evaluation_id: 'e2', title: 'Quiz', kind: 'quiz', percent: '90.00', score: null, correct_count: 9, total_questions: 10 },
    ];
    const [simulador, quiz] = await listStudentResults();
    expect(simulador).toMatchObject({ percent: 50, score: 1000, scoreLabel: 'Puntaje estimado' });
    expect(quiz).toMatchObject({ percent: 90, score: null, scoreLabel: null });
  });

  test('filtra la tendencia semanal por grupo', async () => {
    await listWeeklyStats('g1');
    expect(fake.rpc).toHaveBeenCalledWith('weekly_stats', { p_group: 'g1', p_from: null, p_to: null });
  });

  test('quien no es administrador no recibe resumen general', async () => {
    expect(await getStatsOverview()).toBeNull();
  });

  test('traduce el error de la base a un mensaje para la pantalla', async () => {
    fake.respuesta.error = { code: '42501' };
    await expect(listGroupStats()).rejects.toThrow('No pudimos cargar las estadísticas');
  });
});
