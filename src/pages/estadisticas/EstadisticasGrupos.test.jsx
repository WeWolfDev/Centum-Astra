// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({ listGroupStats: vi.fn(), listGroupStudentStats: vi.fn() }));
vi.mock('../../lib/statsService', () => fake);

const { default: EstadisticasGrupos } = await import('./EstadisticasGrupos');

const PROMEDIOS_VACIOS = { quizAvgPercent: null, quizCount: 0, examAvgScore: null, examCount: 0, examScoreLabel: 'Puntaje estimado' };
const GRUPOS = [
  { groupId: 'g1', groupName: 'Grupo A', generation: '2027', studentCount: 12, quizAvgPercent: 74.6, quizCount: 3, examAvgScore: 1080.4, examCount: 1, examScoreLabel: 'Puntaje estimado' },
  { groupId: 'g2', groupName: 'Grupo B', generation: '2027', studentCount: 1, ...PROMEDIOS_VACIOS },
];
const ALUMNOS = [
  { studentId: 'a1', fullName: 'Ana López', lastFinishedAt: '2026-11-20T18:00:00Z', quizAvgPercent: 90, quizCount: 2, examAvgScore: 1100, examCount: 1, examScoreLabel: 'Puntaje estimado' },
  { studentId: 'a2', fullName: 'Beto Pérez', lastFinishedAt: null, ...PROMEDIOS_VACIOS },
];

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listGroupStats.mockResolvedValue(GRUPOS);
  fake.listGroupStudentStats.mockResolvedValue(ALUMNOS);
});
afterEach(cleanup);

describe('EstadisticasGrupos', () => {
  test('muestra cada grupo con sus dos promedios por separado, y "sin resultados" en vez de 0', async () => {
    render(<EstadisticasGrupos />);
    const filas = await screen.findAllByRole('listitem');
    expect(filas[0]).toHaveTextContent('Grupo A');
    expect(filas[0]).toHaveTextContent('Generación 2027 · 12 alumnos');
    expect(filas[0]).toHaveTextContent('Quizzes: 75 % (3 quizzes)');
    expect(filas[0]).toHaveTextContent('Simuladores y cuestionarios: 1,080 puntos (1)');
    expect(filas[1]).toHaveTextContent('1 alumno');
    expect(filas[1]).toHaveTextContent('Quizzes: sin resultados');
    expect(filas[1]).toHaveTextContent('Simuladores y cuestionarios: sin resultados');
    expect(screen.queryByText(/0 %/)).not.toBeInTheDocument();
    expect(fake.listGroupStats).toHaveBeenCalledWith(undefined);
  });

  test('despliega los alumnos de un grupo con el mismo periodo', async () => {
    const rango = { from: '2026-11-01', to: '2026-12-01' };
    render(<EstadisticasGrupos rango={rango} />);
    const usuario = userEvent.setup();
    const boton = await screen.findByRole('button', { name: 'Ver alumnos de Grupo A' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await usuario.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    const tabla = await screen.findByRole('table', { name: 'Alumnos de Grupo A' });
    const filas = within(tabla).getAllByRole('row');
    expect(filas[1]).toHaveTextContent('Ana López');
    expect(filas[1]).toHaveTextContent('90 %');
    expect(filas[1]).toHaveTextContent('1,100');
    expect(filas[2]).toHaveTextContent('Beto Pérez');
    expect(filas[2]).toHaveTextContent('Sin entregas');
    expect(fake.listGroupStats).toHaveBeenCalledWith(rango);
    expect(fake.listGroupStudentStats).toHaveBeenCalledWith('g1', rango);
    await usuario.click(boton);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('si los alumnos no cargan, lo dice dentro del grupo y permite reintentar', async () => {
    fake.listGroupStudentStats.mockRejectedValueOnce(new Error('No pudimos cargar las estadísticas. Intenta de nuevo.'));
    render(<EstadisticasGrupos />);
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Ver alumnos de Grupo A' }));
    expect(await screen.findByText('No pudimos cargar las estadísticas. Intenta de nuevo.')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table', { name: 'Alumnos de Grupo A' })).toBeInTheDocument();
  });

  test('sin grupos lo dice; si fallan, permite reintentar', async () => {
    fake.listGroupStats.mockRejectedValueOnce(new Error('No pudimos cargar las estadísticas. Intenta de nuevo.')).mockResolvedValue([]);
    render(<EstadisticasGrupos vacio="Todavía no tienes grupos asignados." />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Todavía no tienes grupos asignados.')).toBeInTheDocument();
  });
});
