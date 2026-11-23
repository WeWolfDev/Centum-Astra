// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({ getStatsOverview: vi.fn(), listGroupStats: vi.fn(), listGroupStudentStats: vi.fn() }));
vi.mock('../../lib/statsService', () => fake);

const { default: EstadisticasAdmin } = await import('./EstadisticasAdmin');

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.getStatsOverview.mockResolvedValue({
    studentsWithResults: 8, quizAvgPercent: 70.2, quizCount: 20, examAvgScore: 1012, examCount: 6, examScoreLabel: 'Puntaje estimado',
  });
  fake.listGroupStats.mockResolvedValue([]);
});
afterEach(cleanup);

describe('EstadisticasAdmin', () => {
  test('resume todo el curso con los dos promedios por separado', async () => {
    render(<EstadisticasAdmin />);
    const resumen = within(await screen.findByRole('region', { name: 'Estadísticas' }));
    expect(await resumen.findByText('8')).toBeInTheDocument();
    expect(resumen.getByText('Alumnos con resultados')).toBeInTheDocument();
    expect(resumen.getByText('70 %')).toBeInTheDocument();
    expect(resumen.getByText('Promedio de quizzes · 20 resultados')).toBeInTheDocument();
    expect(resumen.getByText('1,012')).toBeInTheDocument();
    expect(resumen.getByText('Puntaje estimado promedio · 6 resultados')).toBeInTheDocument();
    expect(fake.getStatsOverview).toHaveBeenCalledWith(undefined);
    expect(fake.listGroupStats).toHaveBeenCalledWith(undefined);
  });

  test('sin resultados no muestra 0 %', async () => {
    fake.getStatsOverview.mockResolvedValue({
      studentsWithResults: 0, quizAvgPercent: null, quizCount: 0, examAvgScore: null, examCount: 0, examScoreLabel: 'Puntaje estimado',
    });
    render(<EstadisticasAdmin />);
    expect(await screen.findAllByText('Sin resultados')).toHaveLength(2);
    expect(screen.queryByText(/0 %/)).not.toBeInTheDocument();
  });

  test('aplica el periodo con la fecha final incluida y vuelve a todo el curso', async () => {
    render(<EstadisticasAdmin />);
    const usuario = userEvent.setup();
    await screen.findByText('Alumnos con resultados');
    await usuario.type(screen.getByLabelText('Desde'), '2026-11-01');
    await usuario.type(screen.getByLabelText('Hasta'), '2026-11-30');
    await usuario.click(screen.getByRole('button', { name: 'Aplicar periodo' }));
    const rango = { from: '2026-11-01', to: '2026-12-01' };
    await waitFor(() => expect(fake.getStatsOverview).toHaveBeenLastCalledWith(rango));
    expect(fake.listGroupStats).toHaveBeenLastCalledWith(rango);
    expect(screen.getByText(/^Del 1 nov 2026 al 30 nov 2026\./)).toHaveTextContent(
      'si en el periodo solo cae el último intento de un alumno, cuenta ese aunque no sea su mejor',
    );
    await usuario.click(screen.getByRole('button', { name: 'Todo el curso' }));
    await waitFor(() => expect(fake.getStatsOverview).toHaveBeenLastCalledWith(undefined));
    expect(screen.getByLabelText('Desde')).toHaveValue('');
  });

  test('rechaza un periodo al revés o incompleto sin consultar', async () => {
    render(<EstadisticasAdmin />);
    const usuario = userEvent.setup();
    await screen.findByText('Alumnos con resultados');
    await usuario.type(screen.getByLabelText('Desde'), '2026-11-30');
    await usuario.click(screen.getByRole('button', { name: 'Aplicar periodo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Elige la fecha de inicio y la de fin.');
    await usuario.type(screen.getByLabelText('Hasta'), '2026-11-01');
    await usuario.click(screen.getByRole('button', { name: 'Aplicar periodo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha de inicio debe ser anterior o igual a la de fin.');
    expect(fake.getStatsOverview).toHaveBeenCalledTimes(1);
  });

  test('si el resumen falla, lo dice y permite reintentar', async () => {
    fake.getStatsOverview.mockRejectedValueOnce(new Error('No pudimos cargar las estadísticas. Intenta de nuevo.'));
    render(<EstadisticasAdmin />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Alumnos con resultados')).toBeInTheDocument();
  });
});
