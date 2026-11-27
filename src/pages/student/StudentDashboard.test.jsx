// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listMaterialCourses: vi.fn(),
  getStudentStats: vi.fn(),
  listStudentResults: vi.fn(),
  listStudentModuleQuizStats: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al1', role: 'student', name: 'Ana López' } }) }));
vi.mock('../../lib/materialService', async () => {
  const real = await vi.importActual('../../lib/materialService');
  return { ...real, listMaterialCourses: fake.listMaterialCourses };
});
vi.mock('../../lib/statsService', () => ({
  getStudentStats: fake.getStudentStats,
  listStudentResults: fake.listStudentResults,
  listStudentModuleQuizStats: fake.listStudentModuleQuizStats,
}));

const { default: StudentDashboard } = await import('./StudentDashboard');

const SIN_RESULTADOS = { quizAvgPercent: null, quizCount: 0, examAvgScore: null, examCount: 0, examScoreLabel: 'Puntaje estimado' };

const RESULTADOS = [
  { evaluationId: 'e1', title: 'Quiz de fracciones', kind: 'quiz', moduleId: 'm1', percent: 60, score: null, correctCount: 6, totalQuestions: 10, finishedAt: '2026-11-10T18:00:00Z' },
  { evaluationId: 'e2', title: 'Simulador EXANI 1', kind: 'simulador', moduleId: null, percent: 75, score: 1080, correctCount: 96, totalQuestions: 128, finishedAt: '2026-11-20T18:00:00Z' },
  { evaluationId: 'e3', title: 'Quiz de lectura', kind: 'quiz', moduleId: 'm2', percent: 90, score: null, correctCount: 9, totalQuestions: 10, finishedAt: '2026-11-15T18:00:00Z' },
];

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listMaterialCourses.mockResolvedValue([
    { id: 'c1', name: 'Curso 2027', modules: [{ id: 'm1', title: 'Pensamiento matemático' }, { id: 'm2', title: 'Comprensión lectora' }] },
  ]);
  fake.getStudentStats.mockResolvedValue(SIN_RESULTADOS);
  fake.listStudentResults.mockResolvedValue([]);
  fake.listStudentModuleQuizStats.mockResolvedValue([]);
});

function conResultados() {
  fake.getStudentStats.mockResolvedValue({ quizAvgPercent: 74.6, quizCount: 2, examAvgScore: 1080, examCount: 1, examScoreLabel: 'Puntaje estimado' });
  fake.listStudentResults.mockResolvedValue(RESULTADOS);
  fake.listStudentModuleQuizStats.mockResolvedValue([
    { moduleId: 'm2', quizAvgPercent: 90, quizCount: 1 },
    { moduleId: 'm1', quizAvgPercent: 60, quizCount: 1 },
  ]);
}

afterEach(cleanup);

describe('Tu material en Inicio', () => {
  test('con Supabase, las tarjetas son las áreas reales y abren la elegida', async () => {
    const setActiveSection = vi.fn();
    render(<StudentDashboard setActiveSection={setActiveSection} />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Abrir módulo Comprensión lectora' }));
    expect(setActiveSection).toHaveBeenCalledWith('modules', 'm2');
    expect(screen.queryByRole('button', { name: /Abrir módulo Premedicina/ })).not.toBeInTheDocument();
  });

  test('si no se pueden cargar las áreas, lo dice y permite reintentar', async () => {
    fake.listMaterialCourses.mockRejectedValueOnce(new Error('No pudimos cargar el material. Intenta de nuevo.'));
    render(<StudentDashboard setActiveSection={vi.fn()} />);
    expect(await screen.findByText('No pudimos cargar el material. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Abrir módulo Pensamiento matemático' })).toBeInTheDocument();
  });
});

describe('Inicio con datos reales', () => {
  test('muestra los dos promedios por separado y no el puntaje de ejemplo', async () => {
    conResultados();
    render(<StudentDashboard setActiveSection={vi.fn()} />);
    const resultados = within(await screen.findByRole('region', { name: 'Tus resultados' }));
    expect(await resultados.findByText('75 %')).toBeInTheDocument();
    expect(resultados.getByText('Promedio de quizzes · 2 quizzes')).toBeInTheDocument();
    expect(resultados.getByText('1,080')).toBeInTheDocument();
    expect(resultados.getByText('Puntaje estimado promedio · 1 simulador o cuestionario')).toBeInTheDocument();
    expect(resultados.getByText(/no es un resultado oficial del EXANI-II/)).toBeInTheDocument();
    expect(screen.queryByText(/todavía no salen de tus simuladores/)).not.toBeInTheDocument();
    expect(screen.queryByText('Geometría analítica')).not.toBeInTheDocument();
  });

  test('sin intentos dice que no hay resultados, no 0 %', async () => {
    const setActiveSection = vi.fn();
    render(<StudentDashboard setActiveSection={setActiveSection} />);
    const resultados = within(await screen.findByRole('region', { name: 'Tus resultados' }));
    expect(await resultados.findAllByText('Sin resultados')).toHaveLength(2);
    expect(screen.queryByText(/0 %/)).not.toBeInTheDocument();
    expect(screen.getByText('Todavía no terminas ninguna evaluación.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Áreas a repasar' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Iniciar simulador o quiz' }));
    expect(setActiveSection).toHaveBeenCalledWith('exam');
  });

  test('las áreas a repasar van de menor a mayor promedio y abren su módulo', async () => {
    conResultados();
    const setActiveSection = vi.fn();
    render(<StudentDashboard setActiveSection={setActiveSection} />);
    const areas = within(await screen.findByRole('region', { name: 'Áreas a repasar' }));
    const filas = areas.getAllByRole('listitem');
    expect(filas[0]).toHaveTextContent('Pensamiento matemático');
    expect(filas[0]).toHaveTextContent('60 % en 1 quiz');
    expect(filas[1]).toHaveTextContent('Comprensión lectora');
    await userEvent.setup().click(areas.getByRole('button', { name: 'Repasar Pensamiento matemático' }));
    expect(setActiveSection).toHaveBeenCalledWith('modules', 'm1');
  });

  test('las últimas calificaciones van de la más reciente a la más antigua, con puntaje solo si lo tienen', async () => {
    conResultados();
    render(<StudentDashboard setActiveSection={vi.fn()} />);
    const ultimas = within(await screen.findByRole('region', { name: 'Tus últimas calificaciones' }));
    const filas = ultimas.getAllByRole('listitem');
    expect(filas.map(f => within(f).getByRole('heading').textContent)).toEqual(['Simulador EXANI 1', 'Quiz de lectura', 'Quiz de fracciones']);
    expect(filas[0]).toHaveTextContent('96 de 128 aciertos · 75 % · 1,080 puntos');
    expect(filas[0]).toHaveTextContent('Simulador');
    expect(filas[1]).toHaveTextContent('9 de 10 aciertos · 90 %');
    expect(filas[1]).not.toHaveTextContent('puntos');
  });

  test('si las estadísticas fallan, lo dice y permite reintentar; el material sigue', async () => {
    fake.getStudentStats.mockRejectedValueOnce(new Error('No pudimos cargar las estadísticas. Intenta de nuevo.'));
    render(<StudentDashboard setActiveSection={vi.fn()} />);
    expect(await screen.findByText('No pudimos cargar las estadísticas. Intenta de nuevo.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Abrir módulo Pensamiento matemático' })).toBeInTheDocument();
    conResultados();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('75 %')).toBeInTheDocument();
  });
});
